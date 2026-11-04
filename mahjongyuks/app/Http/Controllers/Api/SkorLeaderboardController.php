<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\GameRound;
use App\Models\GameTable;
use App\Models\Player;
use App\Models\SesiBermain;
use App\Models\SkorPemain;
use App\Models\TablePlayer;
use App\Models\User;
use App\Models\WinRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SkorLeaderboardController extends Controller
{
    /**
     * Mendapatkan klasemen resmi atlet / leaderboard.
     * Public endpoint untuk Landing Page, Dashboard Atlet, dan Admin Desk.
     */
    public function leaderboard(Request $request): JsonResponse
    {
        $tier = $request->query('tier', 'all'); // all, beginner, intermediate, advance
        $search = $request->query('q');
        $limit = $request->query('limit');

        $players = Player::with(['user', 'skorPemains.sesiBermain'])->get();

        $leaderboard = $players->map(function ($player) {
            $user = $player->user;
            $skors = $player->skorPemains;

            $totalMatches = $skors->count();
            $totalWins = $skors->where('peringkat', 1)->count();
            $winRate = $totalMatches > 0 ? round(($totalWins / $totalMatches) * 100, 1) . '%' : '0.0%';

            // Total akumulasi skor dari skor_pemains (Poin atlet dimulai murni dari 0)
            $scoreSum = (float) $skors->sum('skor');
            $eloRating = (float) round($scoreSum, 1);

            // Dan Rank & Rank Title berdasarkan tingkat kemahiran awal & perkembangan poin
            $defaultRanks = [
                'advance' => ['title' => 'Master', 'dan' => '7-Dan'],
                'intermediate' => ['title' => 'Skilled', 'dan' => '3-Dan'],
                'beginner' => ['title' => 'Novice', 'dan' => '1-Kyu'],
            ];
            $tier = strtolower($player->tingkat_kemahiran ?? 'intermediate');
            $rankTitle = $defaultRanks[$tier]['title'] ?? 'Novice';
            $danRank = $defaultRanks[$tier]['dan'] ?? '1-Kyu';

            if ($eloRating >= 26000) {
                $rankTitle = 'Grandmaster';
                $danRank = '9-Dan';
            } elseif ($eloRating >= 23000) {
                $rankTitle = 'Master';
                $danRank = '7-Dan';
            } elseif ($eloRating >= 19000) {
                $rankTitle = 'Expert';
                $danRank = '5-Dan';
            } elseif ($eloRating >= 14000) {
                $rankTitle = 'Skilled';
                $danRank = '3-Dan';
            } elseif ($eloRating >= 10000) {
                $rankTitle = 'Adept';
                $danRank = '1-Dan';
            }

            // Initials
            $nameParts = explode(' ', trim($user->nama ?? 'Pemain'));
            $initials = strtoupper(substr($nameParts[0], 0, 1) . (isset($nameParts[1]) ? substr($nameParts[1], 0, 1) : ''));

            return [
                'player_id' => $player->id,
                'user_id' => $user->id ?? null,
                'name' => $user->nama ?? 'Pemain Tanpa Nama',
                'email' => $user->email ?? '',
                'initials' => $initials ?: 'MY',
                'club' => 'MahjongYuks Sedayu City',
                'rankTitle' => $rankTitle,
                'danRank' => $danRank,
                'tingkat_kemahiran' => $player->tingkat_kemahiran ?? 'intermediate',
                'eloRating' => $eloRating,
                'winRate' => $winRate,
                'totalMatches' => $totalMatches,
                'totalWins' => $totalWins,
                'avatarBg' => match ($player->tingkat_kemahiran) {
                    'advance' => '#183629',
                    'beginner' => '#3E5C4B',
                    default => '#2A4D3B',
                },
            ];
        });

        // Urutkan berdasarkan ELO rating tertinggi ke terendah
        $sorted = $leaderboard->sortByDesc('eloRating')->values();

        // Berikan nomor urut peringkat (rank 1, 2, 3...)
        $ranked = $sorted->map(function ($item, $index) {
            $item['rank'] = $index + 1;
            return $item;
        });

        // Filter pencarian jika ada
        if (!empty($search)) {
            $q = strtolower($search);
            $ranked = $ranked->filter(function ($p) use ($q) {
                return str_contains(strtolower($p['name']), $q) ||
                       str_contains(strtolower($p['club']), $q) ||
                       str_contains(strtolower($p['rankTitle']), $q) ||
                       str_contains(strtolower($p['danRank']), $q);
            })->values();
        }

        // Filter tingkat kemahiran jika dipilih
        if (!empty($tier) && $tier !== 'all') {
            $ranked = $ranked->filter(function ($p) use ($tier) {
                return strtolower($p['tingkat_kemahiran']) === strtolower($tier);
            })->values();
        }

        if ($limit) {
            $ranked = $ranked->take((int) $limit);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data Leaderboard resmi berhasil dimuat.',
            'data' => $ranked,
        ]);
    }

    /**
     * Daftar seluruh atlet/pemain untuk opsi pilihan admin.
     */
    public function playersList(): JsonResponse
    {
        $players = Player::with('user')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'user_id' => $p->user_id,
                'nama' => $p->user->nama ?? 'Pemain #' . $p->id,
                'email' => $p->user->email ?? '',
                'tingkat_kemahiran' => $p->tingkat_kemahiran ?? 'intermediate',
                'status' => $p->status,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $players,
        ]);
    }

    /**
     * Daftar sesi bermain / game sessions.
     */
    public function sessions(Request $request): JsonResponse
    {
        $sessions = SesiBermain::with(['event', 'pemesanan.meja.venue', 'skorPemains.player.user'])
            ->orderBy('tanggal_permainan', 'desc')
            ->orderBy('id', 'desc')
            ->limit(30)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }

    /**
     * Input & validasi skor pertandingan oleh Admin/Wasit (RF-07).
     */
    public function recordScore(Request $request): JsonResponse
    {
        $request->validate([
            'player_id' => 'required|exists:players,id',
            'skor' => 'required|numeric',
            'peringkat' => 'required|integer|min:1|max:4',
            'event_id' => 'nullable|exists:events,id',
            'sesi_id' => 'nullable|exists:sesi_bermains,id',
            'catatan_wasit' => 'nullable|string|max:500',
        ]);

        $sesiId = $request->sesi_id;

        // Jika belum ada sesi_id, buatkan sesi bermain otomatis untuk event/match ini
        if (!$sesiId) {
            $event = $request->event_id ? Event::find($request->event_id) : null;
            $namaSesi = $event 
                ? 'Turnamen: ' . $event->nama_event 
                : 'Sesi Pertandingan (' . now()->translatedFormat('d M Y H:i') . ')';

            $sesi = SesiBermain::create([
                'event_id' => $request->event_id,
                'nama_sesi' => $namaSesi,
                'tanggal_permainan' => now()->toDateString(),
                'waktu_mulai' => now()->toTimeString(),
                'waktu_selesai' => now()->addHours(2)->toTimeString(),
                'status' => 'closed',
            ]);
            $sesiId = $sesi->id;
        }

        // Simpan skor pemain
        $skor = SkorPemain::create([
            'sesi_id' => $sesiId,
            'player_id' => $request->player_id,
            'skor' => $request->skor,
            'peringkat' => $request->peringkat,
            'catatan_wasit' => $request->catatan_wasit,
        ]);

        $skor->load(['player.user', 'sesiBermain']);

        return response()->json([
            'success' => true,
            'message' => 'Skor pertandingan atlet berhasil dicatat dan terintegrasi ke Leaderboard!',
            'data' => $skor,
        ], 201);
    }

    /**
     * Riwayat pertandingan pribadi untuk pemain yang sedang login (RF-08).
     * Terintegrasi dengan sistem skoring resmi Hong Kong Mahjong (WinRecord)
     * dan mempertahankan backward compatibility dengan SkorPemain.
     */
    public function myGameHistory(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $player = Player::where('user_id', $user->id)->first();
        if (!$player) {
            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => [
                        'totalMatches' => 0,
                        'totalWins' => 0,
                        'winRate' => '0.0%',
                        'totalPoints' => 0,
                    ],
                    'history' => [],
                ],
            ]);
        }

        // 1. Ambil kemenangan aktif dari sistem skoring Hong Kong Mahjong (WinRecord)
        $allHandsConfig = config('hk_hands.hands', []);
        $winRecords = WinRecord::with(['sesiBermain.event', 'gameTable', 'gameRound', 'discarder.user'])
            ->where('winner_id', $player->id)
            ->whereNull('voided_at')
            ->orderBy('id', 'desc')
            ->get();

        // 2. Ambil ronde di mana pemain melakukan buang tile penentu (discarder / kena Ron)
        $discardRecords = WinRecord::with(['sesiBermain.event', 'gameTable', 'gameRound', 'winner.user'])
            ->where('discarder_id', $player->id)
            ->whereNull('voided_at')
            ->orderBy('id', 'desc')
            ->get();

        // 3. Format riwayat kemenangan HK
        $formattedWins = $winRecords->map(function ($w) use ($allHandsConfig) {
            $sesi = $w->sesiBermain;
            $tableName = $w->gameTable?->nomor_meja ?? 'Meja Pertandingan';
            $roundNum = $w->gameRound?->round_number ?? 1;

            $handNames = collect($w->hand_codes ?? [])->map(function ($code) use ($allHandsConfig) {
                return $allHandsConfig[$code]['name_id'] ?? $allHandsConfig[$code]['name'] ?? $code;
            })->filter()->implode(', ');

            $methodText = $w->win_method === 'self_draw' ? 'Tarik Sendiri (Zi Mo)' : 'Buang Lawan (Discard)';
            if ($w->discarder?->user?->nama) {
                $methodText .= ' dari ' . $w->discarder->user->nama;
            }

            $catatan = "Menang {$methodText} • {$w->fan} Fan (+{$w->points_awarded} PTS)";
            if (!empty($handNames)) {
                $catatan .= " [{$handNames}]";
            }

            return [
                'id' => $w->id,
                'match_name' => "{$tableName} — Ronde #{$roundNum}",
                'event_name' => $sesi?->event?->nama_event ?? $sesi?->nama_sesi ?? 'Pertandingan Sesi Meja',
                'tanggal' => $w->created_at ? $w->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s'),
                'peringkat' => 1,
                'skor' => (float) $w->points_awarded,
                'catatan_wasit' => $catatan,
                'sesi_id' => $w->sesi_id,
                'created_at' => $w->created_at,
            ];
        });

        // 4. Format riwayat discard (kena Ron)
        $formattedDiscards = $discardRecords->map(function ($w) {
            $sesi = $w->sesiBermain;
            $tableName = $w->gameTable?->nomor_meja ?? 'Meja Pertandingan';
            $roundNum = $w->gameRound?->round_number ?? 1;
            $winnerName = $w->winner?->user?->nama ?? 'Pemain Lawan';

            return [
                'id' => 100000 + $w->id,
                'match_name' => "{$tableName} — Ronde #{$roundNum}",
                'event_name' => $sesi?->event?->nama_event ?? $sesi?->nama_sesi ?? 'Pertandingan Sesi Meja',
                'tanggal' => $w->created_at ? $w->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s'),
                'peringkat' => 4,
                'skor' => 0.0,
                'catatan_wasit' => "Kena Ron (Buang Tile ke {$winnerName}) • {$w->fan} Fan (0 PTS)",
                'sesi_id' => $w->sesi_id,
                'created_at' => $w->created_at,
            ];
        });

        // 5. Data dari tabel lama skor_pemains (backward compatibility)
        $oldSkors = SkorPemain::with(['sesiBermain.event', 'sesiBermain.pemesanan.meja'])
            ->where('player_id', $player->id)
            ->orderBy('id', 'desc')
            ->get();

        $formattedOld = $oldSkors->map(function ($s) {
            $sesi = $s->sesiBermain;
            $namaMatch = $sesi?->event?->nama_event ?? $sesi?->nama_sesi ?? 'Pertandingan Sesi Meja';
            return [
                'id' => 200000 + $s->id,
                'match_name' => $namaMatch,
                'event_name' => $sesi?->event?->nama_event ?? null,
                'tanggal' => $sesi?->tanggal_permainan ? $sesi->tanggal_permainan->format('Y-m-d H:i:s') : ($s->created_at ? $s->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s')),
                'peringkat' => $s->peringkat,
                'skor' => (float) $s->skor,
                'catatan_wasit' => $s->catatan_wasit,
                'sesi_id' => $s->sesi_id,
                'created_at' => $s->created_at,
            ];
        });

        // Gabungkan seluruh riwayat dan urutkan dari yang terbaru
        $history = $formattedWins
            ->concat($formattedDiscards)
            ->concat($formattedOld)
            ->sortByDesc(fn ($item) => $item['created_at'])
            ->values();

        // 6. Hitung Total Match, Menang, Poin, dan Win Rate
        $totalWins = $winRecords->count() + $oldSkors->where('peringkat', 1)->count();
        $totalPoints = (float) ($winRecords->sum('points_awarded') + $oldSkors->sum('skor'));

        // Cek total ronde yang pernah diikuti pemain di meja
        $tableIds = TablePlayer::where('player_id', $player->id)->pluck('game_table_id');
        $participatedRoundsCount = GameRound::whereIn('game_table_id', $tableIds)
            ->where('status', 'selesai')
            ->count();

        $totalMatches = max(
            $totalWins,
            $participatedRoundsCount,
            $history->count(),
            $oldSkors->count()
        );

        $winRate = $totalMatches > 0 ? round(($totalWins / $totalMatches) * 100, 1) . '%' : ($totalWins > 0 ? '100%' : '0.0%');

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'totalMatches' => $totalMatches,
                    'totalWins' => $totalWins,
                    'winRate' => $winRate,
                    'totalPoints' => $totalPoints,
                ],
                'history' => $history,
            ],
        ]);
    }

    /**
     * Reset seluruh skor dan poin atlet menjadi 0 (Pengaturan awal musim / reset skor).
     */
    public function resetScores(): JsonResponse
    {
        SkorPemain::query()->delete();
        SesiBermain::whereNull('pemesanan_id')->delete();

        return response()->json([
            'success' => true,
            'message' => 'Seluruh skor dan poin atlet berhasil di-reset menjadi 0.',
        ]);
    }
}