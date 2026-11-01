<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Player;
use App\Models\SesiBermain;
use App\Models\SkorPemain;
use App\Models\User;
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

            // Total akumulasi skor dari skor_pemains
            $scoreSum = (float) $skors->sum('skor');

            // Kalkulasi Elo Rating / Poin WRC resmi
            // Base rating awal berdasarkan tingkat kemahiran + akumulasi skor
            $basePoints = match (strtolower($player->tingkat_kemahiran ?? 'intermediate')) {
                'advance' => 18000,
                'intermediate' => 12000,
                default => 8000,
            };
            $eloRating = (int) ($basePoints + ($scoreSum * 10));

            // Tentukan Dan Rank & Rank Title
            $rankTitle = 'Novice';
            $danRank = '1-Kyu';
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

        $skors = SkorPemain::with(['sesiBermain.event', 'sesiBermain.pemesanan.meja'])
            ->where('player_id', $player->id)
            ->orderBy('id', 'desc')
            ->get();

        $totalMatches = $skors->count();
        $totalWins = $skors->where('peringkat', 1)->count();
        $winRate = $totalMatches > 0 ? round(($totalWins / $totalMatches) * 100, 1) . '%' : '0.0%';
        $totalPoints = (float) $skors->sum('skor');

        $history = $skors->map(function ($s) {
            $sesi = $s->sesiBermain;
            $namaMatch = $sesi->event->nama_event ?? $sesi->nama_sesi ?? 'Pertandingan Sesi Meja';
            return [
                'id' => $s->id,
                'match_name' => $namaMatch,
                'tanggal' => $sesi->tanggal_permainan ? $sesi->tanggal_permainan->format('d M Y') : $s->created_at->format('d M Y'),
                'peringkat' => $s->peringkat,
                'skor' => (float) $s->skor,
                'catatan_wasit' => $s->catatan_wasit,
            ];
        });

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
}

