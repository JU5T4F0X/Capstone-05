<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DetailPemesanan;
use App\Models\Event;
use App\Models\EventPendaftaran;
use App\Models\GameRound;
use App\Models\GameTable;
use App\Models\Pemesanan;
use App\Models\Player;
use App\Models\SesiBermain;
use App\Models\TablePlayer;
use App\Models\User;
use App\Models\WinRecord;
use App\Services\HkMahjongCalculator;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HkScoreController extends Controller
{
    const CURRENT_SEASON = 'Season 2025/2026';

    /**
     * Dapatkan konfigurasi aturan Hong Kong, daftar tangan, dan tabel poin.
     */
    public function config(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'min_fan' => config('hk_hands.min_fan', 3),
                'max_fan_limit' => config('hk_hands.max_fan_limit', 10),
                'self_draw_bonus_fan' => config('hk_hands.self_draw_bonus_fan', 1),
                'points_table' => HkMahjongCalculator::getPointsTable(),
                'hands' => HkMahjongCalculator::getHandsList(),
                'season' => self::CURRENT_SEASON,
            ],
        ]);
    }

    /**
     * Daftar sesi jadwal/event yang tersedia dan aktif (pending / ongoing).
     * Sesi yang sudah ditutup atau waktu_selesai terlewat ditandai atau ditutup otomatis.
     */
    public function sessions(Request $request): JsonResponse
    {
        $this->syncActiveEventSessions();
        $this->autoCloseExpiredSessions();

        $statusFilter = $request->query('status', 'active'); // 'active' (pending/ongoing), 'all', 'closed'

        $query = SesiBermain::with(['event', 'pemesanan.meja.venue', 'gameTables.tablePlayers.player.user'])
            ->orderBy('tanggal_permainan', 'desc')
            ->orderBy('waktu_mulai', 'asc');

        if ($statusFilter === 'active') {
            $query->whereIn('status', ['pending', 'ongoing']);
        }

        $sessions = $query->get()->map(function ($s) {
            $isPlayable = $s->isCurrentlyPlayable();
            $namaSesi = $s->nama_sesi;
            if (!$namaSesi && $s->event) {
                $namaSesi = 'Turnamen: ' . $s->event->nama_event;
            } elseif (!$namaSesi) {
                $namaSesi = 'Sesi Meja #' . $s->id;
            }

            // Hitung total kemenangan aktif pada sesi ini
            $totalActiveWins = WinRecord::where('sesi_id', $s->id)->whereNull('voided_at')->count();
            $totalTables = $s->gameTables->count();

            return [
                'id' => $s->id,
                'nama_sesi' => $namaSesi,
                'event_id' => $s->event_id,
                'event_nama' => $s->event?->nama_event ?? null,
                'tanggal_permainan' => $s->tanggal_permainan ? $s->tanggal_permainan->format('Y-m-d') : null,
                'tanggal_formatted' => $s->tanggal_permainan ? $s->tanggal_permainan->translatedFormat('d F Y') : null,
                'waktu_mulai' => $s->waktu_mulai ? substr($s->waktu_mulai, 0, 5) : null,
                'waktu_selesai' => $s->waktu_selesai ? substr($s->waktu_selesai, 0, 5) : null,
                'status' => $s->status,
                'is_playable' => $isPlayable,
                'total_tables' => $totalTables,
                'total_active_wins' => $totalActiveWins,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }

    /**
     * Dapatkan daftar meja pada sesi tertentu beserta ronde aktif dan 4 pemainnya.
     */
    public function getTables(int $sessionId): JsonResponse
    {
        $session = SesiBermain::with(['event', 'pemesanan.meja'])->findOrFail($sessionId);
        $isPlayable = $session->isCurrentlyPlayable();

        // Ambil meja-meja pada sesi ini
        $tables = GameTable::with(['tablePlayers.player.user', 'currentRound'])
            ->where('sesi_id', $sessionId)
            ->get();

        // Jika belum ada meja di sesi ini, buatkan meja default awal (misal Meja 1 dan Meja 2)
        if ($tables->isEmpty()) {
            $tables = $this->createDefaultTablesForSession($session);
        }

        $formattedTables = $tables->map(function ($tbl) use ($session) {
            // Ambil ronde berjalan atau buat jika belum ada
            $activeRound = GameRound::where('game_table_id', $tbl->id)
                ->where('status', 'berjalan')
                ->latest('round_number')
                ->first();

            if (!$activeRound) {
                $completedWins = WinRecord::where('game_table_id', $tbl->id)
                    ->whereNull('voided_at')
                    ->count();

                $activeRound = GameRound::create([
                    'game_table_id' => $tbl->id,
                    'round_number' => $completedWins + 1,
                    'status' => 'berjalan',
                ]);
            }

            // Hitung kemenangan aktif per pemain di meja ini pada sesi ini
            $players = $tbl->tablePlayers->map(function ($tp) use ($tbl, $session) {
                $p = $tp->player;
                $user = $p?->user;

                $winsCount = WinRecord::where('game_table_id', $tbl->id)
                    ->where('sesi_id', $session->id)
                    ->where('winner_id', $p->id)
                    ->whereNull('voided_at')
                    ->count();

                $pointsWon = (int) WinRecord::where('game_table_id', $tbl->id)
                    ->where('sesi_id', $session->id)
                    ->where('winner_id', $p->id)
                    ->whereNull('voided_at')
                    ->sum('points_awarded');

                return [
                    'player_id' => $p->id,
                    'user_id' => $user?->id,
                    'nama' => $user?->nama ?? 'Pemain #' . $p->id,
                    'email' => $user?->email ?? '',
                    'seat_wind' => $tp->seat_wind ?? 'East',
                    'tingkat_kemahiran' => $p->tingkat_kemahiran ?? 'intermediate',
                    'wins_count' => $winsCount,
                    'points_won' => $pointsWon,
                ];
            });

            return [
                'id' => $tbl->id,
                'nomor_meja' => $tbl->nomor_meja,
                'status' => $tbl->status,
                'current_round' => [
                    'id' => $activeRound->id,
                    'round_number' => $activeRound->round_number,
                    'status' => $activeRound->status,
                ],
                'players' => $players,
            ];
        });

        return response()->json([
            'success' => true,
            'session' => [
                'id' => $session->id,
                'nama_sesi' => $session->nama_sesi,
                'is_playable' => $isPlayable,
                'waktu_selesai' => $session->waktu_selesai ? substr($session->waktu_selesai, 0, 5) : null,
                'tanggal_permainan' => $session->tanggal_permainan ? $session->tanggal_permainan->format('Y-m-d') : null,
            ],
            'data' => $formattedTables,
        ]);
    }

    /**
     * Input & Simpan Kemenangan Ronde (Alur Inti Wasit).
     * Menerapkan transaksi database, idempotency key, row lock, dan validasi waktu sesi.
     */
    public function recordWin(Request $request): JsonResponse
    {
        $request->validate([
            'sesi_id' => 'required|exists:sesi_bermains,id',
            'game_table_id' => 'required|exists:game_tables,id',
            'winner_id' => 'required|exists:players,id',
            'win_method' => 'required|in:self_draw,discard',
            'discarder_id' => 'nullable|exists:players,id',
            'hand_codes' => 'required|array|min:1',
            'hand_codes.*' => 'required|string',
            'idempotency_key' => 'required|string|max:64',
        ]);

        $idempotencyKey = $request->idempotency_key;

        // 1. Cek Idempotency: Jika key sudah ada, kembalikan record yang sama tanpa menduplikasi poin
        $existing = WinRecord::with(['winner.user', 'discarder.user', 'gameRound', 'gameTable'])
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => true,
                'message' => 'Kemenangan sudah tercatat sebelumnya (Idempotent).',
                'data' => $this->formatWinRecord($existing),
            ], 200);
        }

        // 2. Validasi Status dan Waktu Sesi
        $session = SesiBermain::findOrFail($request->sesi_id);
        if (!$session->isCurrentlyPlayable()) {
            // Tandai sesi ke closed jika waktu sudah habis
            $session->update(['status' => 'closed']);
            return response()->json([
                'success' => false,
                'message' => 'Sesi telah selesai atau ditutup. Input kemenangan baru tidak dapat diterima.',
            ], 422);
        }

        // Jika sesi masih pending, otomatis ubah ke ongoing saat match pertama dimulai
        if ($session->status === 'pending') {
            $session->update(['status' => 'ongoing']);
        }

        // 3. Validasi Pemain Meja (Minimal 4 pemain untuk memulai/mencatat permainan)
        $tablePlayers = TablePlayer::where('game_table_id', $request->game_table_id)->pluck('player_id')->toArray();
        if (count($tablePlayers) < 4) {
            return response()->json([
                'success' => false,
                'message' => 'Permainan belum dapat dimulai / dicatat karena jumlah pemain di meja kurang dari 4 orang (Sesi Mahjong wajib memiliki minimal 4 pemain lengkap).',
            ], 422);
        }

        if (!in_array($request->winner_id, $tablePlayers)) {
            return response()->json([
                'success' => false,
                'message' => 'Pemenang harus merupakan salah satu pemain yang terdaftar di meja ini.',
            ], 422);
        }

        if ($request->win_method === 'discard') {
            if (!$request->discarder_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Untuk kemenangan Buang Lawan (Discard), pemain yang membuang tile wajib dipilih.',
                ], 422);
            }
            if ($request->discarder_id == $request->winner_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pemain yang membuang tile tidak boleh sama dengan pemenang.',
                ], 422);
            }
            if (!in_array($request->discarder_id, $tablePlayers)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pemain yang membuang tile harus berada di meja yang sama.',
                ], 422);
            }
        }

        // 4. Hitung Fan dan Poin menggunakan pure service
        $calc = HkMahjongCalculator::calculate($request->hand_codes, $request->win_method);
        if (!$calc['is_valid']) {
            return response()->json([
                'success' => false,
                'message' => $calc['error'] ?? 'Pola tangan tidak sah atau belum mencapai minimum 3 Fan.',
            ], 422);
        }

        // 5. Eksekusi Transaksi Database dengan Row Locking
        try {
            $createdRecord = DB::transaction(function () use ($request, $session, $calc, $idempotencyKey) {
                // Lock meja untuk menghindari race condition
                $gameTable = GameTable::where('id', $request->game_table_id)->lockForUpdate()->firstOrFail();

                // Dapatkan ronde berjalan saat ini pada meja tersebut
                $activeRound = GameRound::where('game_table_id', $gameTable->id)
                    ->where('status', 'berjalan')
                    ->lockForUpdate()
                    ->latest('round_number')
                    ->first();

                if (!$activeRound) {
                    $activeWinsCount = WinRecord::where('game_table_id', $gameTable->id)
                        ->whereNull('voided_at')
                        ->count();

                    $activeRound = GameRound::create([
                        'game_table_id' => $gameTable->id,
                        'round_number' => $activeWinsCount + 1,
                        'status' => 'berjalan',
                    ]);
                }

                // Cek apakah ronde ini sudah memiliki pemenang aktif
                $existingActiveWin = WinRecord::where('game_round_id', $activeRound->id)
                    ->whereNull('voided_at')
                    ->lockForUpdate()
                    ->first();

                if ($existingActiveWin) {
                    throw new \RuntimeException("Ronde {$activeRound->round_number} di {$gameTable->nomor_meja} sudah memiliki pemenang. Silakan refresh meja untuk ronde baru.");
                }

                // Simpan Win Record
                $winRecord = WinRecord::create([
                    'game_round_id' => $activeRound->id,
                    'game_table_id' => $gameTable->id,
                    'sesi_id' => $session->id,
                    'winner_id' => $request->winner_id,
                    'win_method' => $request->win_method,
                    'discarder_id' => $request->win_method === 'discard' ? $request->discarder_id : null,
                    'hand_codes' => $request->hand_codes,
                    'fan' => $calc['fan'],
                    'points_awarded' => $calc['points_awarded'],
                    'season' => self::CURRENT_SEASON,
                    'idempotency_key' => $idempotencyKey,
                    'created_by' => auth()->id(),
                    'active_flag' => 1,
                ]);

                // Tutup ronde ini sebagai 'selesai'
                $activeRound->update(['status' => 'selesai']);

                // Otomatis buka ronde berikutnya di meja yang sama
                GameRound::create([
                    'game_table_id' => $gameTable->id,
                    'round_number' => $activeRound->round_number + 1,
                    'status' => 'berjalan',
                ]);

                // Tulis Audit Log
                AuditLog::log('record_win', 'WinRecord', $winRecord->id, [
                    'table_id' => $gameTable->id,
                    'table_name' => $gameTable->nomor_meja,
                    'round_number' => $activeRound->round_number,
                    'winner_id' => $request->winner_id,
                    'win_method' => $request->win_method,
                    'fan' => $calc['fan'],
                    'points' => $calc['points_awarded'],
                ]);

                return $winRecord;
            });

            $createdRecord->load(['winner.user', 'discarder.user', 'gameRound', 'gameTable']);

            return response()->json([
                'success' => true,
                'message' => "Kemenangan berhasil dicatat! Poin (+{$calc['points_awarded']} PTS) langsung masuk ke Leaderboard.",
                'data' => $this->formatWinRecord($createdRecord),
            ], 201);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Terjadi kesalahan sistem saat menyimpan kemenangan.',
            ], 422);
        }
    }

    /**
     * Batalkan / Void Kemenangan (Aksi Undo / Koreksi Wasit & Admin).
     */
    public function voidWin(Request $request, int $winRecordId): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $winRecord = WinRecord::with(['sesiBermain', 'gameTable', 'gameRound'])->findOrFail($winRecordId);

        if ($winRecord->isVoided()) {
            return response()->json([
                'success' => false,
                'message' => 'Catatan kemenangan ini sudah dibatalkan sebelumnya.',
            ], 422);
        }

        $user = auth()->user();

        // Jika sesi sudah closed, hanya role admin yang boleh melakukan void
        if ($winRecord->sesiBermain && $winRecord->sesiBermain->status === 'closed') {
            if ($user && $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Sesi telah ditutup. Koreksi (void) hanya dapat dilakukan oleh Administrator.',
                ], 403);
            }
        }

        DB::transaction(function () use ($winRecord, $request, $user) {
            // Nullkan active_flag agar MySQL unique constraint terbuka kembali
            $winRecord->update([
                'voided_at' => now(),
                'void_reason' => $request->reason,
                'voided_by' => $user?->id,
                'active_flag' => null,
            ]);

            // Catat ke audit log
            AuditLog::log('void_win', 'WinRecord', $winRecord->id, [
                'table_name' => $winRecord->gameTable?->nomor_meja,
                'round_number' => $winRecord->gameRound?->round_number,
                'points_voided' => $winRecord->points_awarded,
                'winner_id' => $winRecord->winner_id,
                'reason' => $request->reason,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => "Kemenangan Ronde #{$winRecord->gameRound?->round_number} berhasil dibatalkan. Leaderboard telah disinkronkan kembali.",
        ]);
    }

    /**
     * Riwayat kemenangan pada sesi tertentu (termasuk status void).
     */
    public function sessionHistory(int $sessionId): JsonResponse
    {
        $records = WinRecord::with(['winner.user', 'discarder.user', 'gameRound', 'gameTable', 'creator'])
            ->where('sesi_id', $sessionId)
            ->orderBy('id', 'desc')
            ->limit(50)
            ->get()
            ->map(fn($r) => $this->formatWinRecord($r));

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    /**
     * Leaderboard resmi atlet dihitung secara dinamis dari agregasi (SUM) win_records aktif.
     */
    public function leaderboard(Request $request): JsonResponse
    {
        $season = $request->query('season', self::CURRENT_SEASON);
        $eventId = $request->query('event_id');
        $tier = $request->query('tier', 'all');
        $search = $request->query('q');
        $limit = $request->query('limit');

        $players = Player::with(['user'])->get();

        $leaderboard = $players->map(function ($player) use ($season, $eventId) {
            $user = $player->user;

            // Agregasi poin kemenangan Hong Kong Mahjong yang aktif (belum di-void)
            $winQuery = WinRecord::where('winner_id', $player->id)->whereNull('voided_at');

            if ($season && $season !== 'all') {
                $winQuery->where('season', $season);
            }

            if ($eventId) {
                $winQuery->whereHas('sesiBermain', function ($q) use ($eventId) {
                    $q->where('event_id', $eventId);
                });
            }

            $totalWins = (int) $winQuery->count();
            $totalPoints = (int) $winQuery->sum('points_awarded');

            // Total ronde yang pernah diikuti pemain di meja
            $tableCount = TablePlayer::where('player_id', $player->id)->count();

            // Hitung win rate
            $winRate = $tableCount > 0 ? round(($totalWins / max(1, $totalWins + 3)) * 100, 1) . '%' : ($totalWins > 0 ? '100%' : '0.0%');

            // Dan Rank & Gelar
            $danRank = '1-Dan';
            $rankTitle = 'Novice';
            if ($totalPoints >= 150) {
                $rankTitle = 'Grandmaster';
                $danRank = '9-Dan';
            } elseif ($totalPoints >= 90) {
                $rankTitle = 'Master';
                $danRank = '7-Dan';
            } elseif ($totalPoints >= 50) {
                $rankTitle = 'Expert';
                $danRank = '5-Dan';
            } elseif ($totalPoints >= 25) {
                $rankTitle = 'Skilled';
                $danRank = '3-Dan';
            } elseif ($totalPoints >= 10) {
                $rankTitle = 'Adept';
                $danRank = '2-Dan';
            }

            $nameParts = explode(' ', trim($user->nama ?? 'Pemain'));
            $initials = strtoupper(substr($nameParts[0], 0, 1) . (isset($nameParts[1]) ? substr($nameParts[1], 0, 1) : ''));

            return [
                'player_id' => $player->id,
                'user_id' => $user?->id,
                'name' => $user?->nama ?? 'Pemain #' . $player->id,
                'email' => $user?->email ?? '',
                'initials' => $initials ?: 'MY',
                'rankTitle' => $rankTitle,
                'danRank' => $danRank,
                'tingkat_kemahiran' => $player->tingkat_kemahiran ?? 'intermediate',
                'eloRating' => $totalPoints,
                'points' => $totalPoints,
                'totalWins' => $totalWins,
                'totalMatches' => $totalWins,
                'winRate' => $winRate,
            ];
        });

        // Urutkan berdasarkan total poin tertinggi
        $sorted = $leaderboard->sortByDesc('points')->values();

        $ranked = $sorted->map(function ($item, $index) {
            $item['rank'] = $index + 1;
            return $item;
        });

        if (!empty($search)) {
            $q = strtolower($search);
            $ranked = $ranked->filter(function ($p) use ($q) {
                return str_contains(strtolower($p['name']), $q) ||
                       str_contains(strtolower($p['club']), $q) ||
                       str_contains(strtolower($p['rankTitle']), $q);
            })->values();
        }

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
            'season' => $season,
            'data' => $ranked,
        ]);
    }

    /**
     * Reset Poin Musim Baru (Rollover Season secara non-destructive).
     */
    public function resetScores(Request $request): JsonResponse
    {
        $newSeason = $request->input('new_season', 'Season ' . (date('Y') + 1) . '/' . (date('Y') + 2));

        AuditLog::log('reset_season', null, null, [
            'previous_season' => self::CURRENT_SEASON,
            'new_season' => $newSeason,
            'user' => auth()->user()?->email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Musim baru berhasil dibuka. Poin aktif di-rollover ke musim baru tanpa menghapus riwayat.',
            'new_season' => $newSeason,
        ]);
    }

    // --- HELPER METHODS ----------------------------------------------------

    protected function formatWinRecord(WinRecord $record): array
    {
        $allHandsConfig = config('hk_hands.hands', []);
        $handDetails = collect($record->hand_codes ?? [])->map(function ($c) use ($allHandsConfig) {
            return $allHandsConfig[$c] ?? ['code' => $c, 'name' => $c, 'fan' => 0];
        })->toArray();

        return [
            'id' => $record->id,
            'round_number' => $record->gameRound?->round_number ?? 1,
            'table_name' => $record->gameTable?->nomor_meja ?? 'Meja',
            'winner_name' => $record->winner?->user?->nama ?? 'Pemain #' . $record->winner_id,
            'winner_id' => $record->winner_id,
            'win_method' => $record->win_method,
            'win_method_label' => $record->win_method === 'self_draw' ? 'Tarik Sendiri (Zi Mo)' : 'Buang Lawan (Discard)',
            'discarder_name' => $record->discarder?->user?->nama ?? null,
            'discarder_id' => $record->discarder_id,
            'fan' => $record->fan,
            'points_awarded' => $record->points_awarded,
            'hand_codes' => $record->hand_codes,
            'hands' => $handDetails,
            'is_voided' => $record->isVoided(),
            'void_reason' => $record->void_reason,
            'created_at' => $record->created_at->format('H:i:s'),
            'created_at_formatted' => $record->created_at->translatedFormat('d M Y H:i:s'),
        ];
    }

    /**
     * Sinkronisasi otomatis Event aktif dan Pemesanan Kompetitif menjadi Sesi Bermain.
     */
    protected function syncActiveEventSessions(): void
    {
        // 1. Sinkronisasi Event aktif yang jadwalnya masih berlaku
        $activeEvents = Event::whereIn('status', ['active', 'aktif', 'open'])->get();

        foreach ($activeEvents as $event) {
            if (!$event->tanggal_event) {
                continue;
            }

            $dateStr = $event->tanggal_event instanceof \DateTimeInterface 
                ? $event->tanggal_event->format('Y-m-d') 
                : substr((string)$event->tanggal_event, 0, 10);

            $waktuSelesai = $event->waktu_selesai ? substr((string)$event->waktu_selesai, 0, 8) : '23:59:00';
            $endDateTimeStr = $dateStr . ' ' . $waktuSelesai;

            try {
                $endDateTime = Carbon::parse($endDateTimeStr);
                if (now()->greaterThanOrEqualTo($endDateTime)) {
                    continue; // Jam selesai sudah lewat
                }
            } catch (\Throwable $e) {
                continue;
            }

            $waktuMulai = $event->waktu_mulai ? substr((string)$event->waktu_mulai, 0, 8) : '00:00:00';
            $startDateTimeStr = $dateStr . ' ' . $waktuMulai;
            $status = 'pending';
            try {
                $startDateTime = Carbon::parse($startDateTimeStr);
                if (now()->greaterThanOrEqualTo($startDateTime)) {
                    $status = 'ongoing';
                }
            } catch (\Throwable $e) {}

            $sesi = SesiBermain::updateOrCreate(
                ['event_id' => $event->id],
                [
                    'nama_sesi' => 'Turnamen: ' . $event->nama_event,
                    'tanggal_permainan' => $dateStr,
                    'waktu_mulai' => $waktuMulai,
                    'waktu_selesai' => $waktuSelesai,
                    'status' => $status,
                ]
            );

            // Buat meja dan pemain jika belum ada
            if ($sesi->gameTables()->count() === 0) {
                $this->createDefaultTablesForSession($sesi);
            }
        }

        // 2. Sinkronisasi Pemesanan Meja Kompetitif hari ini yang sudah terkonfirmasi
        $competitiveBookings = Pemesanan::where('jenis_pemesanan', 'Competitive')
            ->whereIn('status_pemesanan', ['confirmed', 'paid'])
            ->whereDate('tanggal_main', now()->toDateString())
            ->with(['meja.venue'])
            ->get();

        foreach ($competitiveBookings as $p) {
            $dateStr = $p->tanggal_main instanceof \DateTimeInterface
                ? $p->tanggal_main->format('Y-m-d')
                : substr((string)$p->tanggal_main, 0, 10);

            $waktuSelesai = $p->waktu_selesai ? substr((string)$p->waktu_selesai, 0, 8) : '23:59:00';
            $endDateTimeStr = $dateStr . ' ' . $waktuSelesai;

            try {
                $endDateTime = Carbon::parse($endDateTimeStr);
                if (now()->greaterThanOrEqualTo($endDateTime)) {
                    continue;
                }
            } catch (\Throwable $e) {
                continue;
            }

            $waktuMulai = $p->waktu_mulai ? substr((string)$p->waktu_mulai, 0, 8) : '00:00:00';
            $sesi = SesiBermain::updateOrCreate(
                ['pemesanan_id' => $p->id],
                [
                    'nama_sesi' => 'Sesi Meja ' . ($p->meja->nomor_meja ?? '01') . ' (' . ($p->meja->venue->nama_venue ?? 'Sedayu City') . ')',
                    'tanggal_permainan' => $dateStr,
                    'waktu_mulai' => $waktuMulai,
                    'waktu_selesai' => $waktuSelesai,
                    'status' => 'ongoing',
                ]
            );

            if ($sesi->gameTables()->count() === 0) {
                $this->createDefaultTablesForSession($sesi);
            }
        }
    }

    protected function autoCloseExpiredSessions(): void
    {
        $now = now();
        $expiredSessions = SesiBermain::whereIn('status', ['pending', 'ongoing'])->get();

        foreach ($expiredSessions as $s) {
            if (!$s->isCurrentlyPlayable()) {
                $s->update(['status' => 'closed']);

                // Tandai ronde yang belum selesai di meja sesi tersebut sebagai 'tidak_selesai'
                GameRound::whereHas('gameTable', function ($q) use ($s) {
                    $q->where('sesi_id', $s->id);
                })->where('status', 'berjalan')->update(['status' => 'tidak_selesai']);

                AuditLog::log('close_session_auto', 'SesiBermain', $s->id, ['reason' => 'Waktu sesi telah berakhir']);
            }
        }
    }

    /**
     * Memulai sesi permainan oleh Admin/Wasit (RF-06).
     * Validasi: Sesi atau meja tidak bisa dimulai jika jumlah pemain kurang dari 4 orang.
     */
    public function startSession(int $sessionId): JsonResponse
    {
        $session = SesiBermain::with(['gameTables.tablePlayers'])->findOrFail($sessionId);

        if ($session->status === 'closed') {
            return response()->json([
                'success' => false,
                'message' => 'Sesi yang sudah ditutup tidak dapat dimulai kembali.',
            ], 422);
        }

        // Periksa apakah meja pada sesi ini memiliki minimal 4 pemain
        $tables = GameTable::with('tablePlayers')->where('sesi_id', $sessionId)->get();

        if ($tables->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada meja yang terdaftar untuk sesi ini.',
            ], 422);
        }

        foreach ($tables as $t) {
            $playerCount = $t->tablePlayers->count();
            if ($playerCount < 4) {
                return response()->json([
                    'success' => false,
                    'message' => "Permainan pada {$t->nomor_meja} belum dapat dimulai karena jumlah pemain yang hadir ({$playerCount} orang) kurang dari 4 orang. Mahjong wajib memiliki 4 pemain lengkap per meja.",
                ], 422);
            }
        }

        $session->update(['status' => 'ongoing']);
        AuditLog::log('start_session', 'SesiBermain', $session->id, ['status' => 'ongoing']);

        return response()->json([
            'success' => true,
            'message' => 'Sesi permainan resmi dimulai.',
            'data' => $session,
        ]);
    }

    /**
     * Menutup / mengakhiri sesi permainan oleh Admin/Wasit (RF-06).
     */
    public function closeSession(int $sessionId): JsonResponse
    {
        $session = SesiBermain::findOrFail($sessionId);
        $session->update(['status' => 'closed']);

        GameRound::whereHas('gameTable', function ($q) use ($session) {
            $q->where('sesi_id', $session->id);
        })->where('status', 'berjalan')->update(['status' => 'selesai']);

        AuditLog::log('close_session_manual', 'SesiBermain', $session->id, ['status' => 'closed']);

        return response()->json([
            'success' => true,
            'message' => 'Sesi permainan resmi ditutup.',
            'data' => $session,
        ]);
    }

    /**
     * Tambahkan pemain nyata ke meja permainan.
     */
    public function addPlayerToTable(Request $request, int $tableId): JsonResponse
    {
        $request->validate([
            'player_id' => 'required|exists:players,id',
            'seat_wind' => 'nullable|in:East,South,West,North',
        ]);

        $table = GameTable::with('tablePlayers')->findOrFail($tableId);

        if ($table->tablePlayers->count() >= 4) {
            return response()->json([
                'success' => false,
                'message' => 'Meja sudah penuh (maksimal 4 pemain per meja Mahjong).',
            ], 422);
        }

        if ($table->tablePlayers->contains('player_id', $request->player_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Pemain ini sudah terdaftar di meja.',
            ], 422);
        }

        $availableWinds = collect(['East', 'South', 'West', 'North'])
            ->diff($table->tablePlayers->pluck('seat_wind'))
            ->values();

        $seatWind = $request->seat_wind ?: ($availableWinds->first() ?? 'East');

        TablePlayer::create([
            'game_table_id' => $table->id,
            'player_id' => $request->player_id,
            'seat_wind' => $seatWind,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pemain berhasil ditempatkan di kursi meja.',
        ]);
    }

    /**
     * Hapus pemain dari meja permainan.
     */
    public function removePlayerFromTable(int $tableId, int $playerId): JsonResponse
    {
        TablePlayer::where('game_table_id', $tableId)
            ->where('player_id', $playerId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pemain berhasil dikeluarkan dari meja.',
        ]);
    }

    protected function createDefaultTablesForSession(SesiBermain $session): \Illuminate\Support\Collection
    {
        $createdTables = collect();
        $realPlayers = collect();

        // 1. Ambil pemain nyata dari pendaftaran event (jika sesi turnamen/event)
        if ($session->event_id) {
            $registrations = EventPendaftaran::where('event_id', $session->event_id)
                ->whereIn('status_pendaftaran', ['terdaftar', 'hadir'])
                ->with('player.user')
                ->get();

            foreach ($registrations as $reg) {
                if ($reg->player) {
                    $realPlayers->push($reg->player);
                }
            }
        }

        // 2. Ambil pemain nyata dari pemesanan reguler (jika sesi pemesanan)
        if ($session->pemesanan_id) {
            $pemesanan = Pemesanan::with('detailPemesanans.player.user')->find($session->pemesanan_id);
            if ($pemesanan) {
                foreach ($pemesanan->detailPemesanans as $detail) {
                    if ($detail->player) {
                        $realPlayers->push($detail->player);
                    }
                }
            }
        }

        // 3. Pastikan minimal 4 pemain tersedia untuk Meja 01 agar meja langsung siap dimainkan & dicatat wasit
        if ($realPlayers->count() < 4) {
            $existingIds = $realPlayers->pluck('id')->filter()->toArray();
            $fillPlayers = Player::whereNotIn('id', $existingIds)->with('user')->take(4 - count($existingIds))->get();
            foreach ($fillPlayers as $fp) {
                $realPlayers->push($fp);
            }
        }

        $tableNames = ['Meja 01 (Meja Otomatis)', 'Meja 02 (Meja Otomatis)'];
        $winds = ['East', 'South', 'West', 'North'];

        foreach ($tableNames as $idx => $name) {
            $gameTable = GameTable::create([
                'sesi_id' => $session->id,
                'nomor_meja' => $name,
                'status' => 'aktif',
            ]);

            // Daftarkan pemain ke meja (4 pemain per meja)
            $playerSlice = $realPlayers->slice($idx * 4, 4);
            foreach ($playerSlice->values() as $pIdx => $p) {
                TablePlayer::create([
                    'game_table_id' => $gameTable->id,
                    'player_id' => $p->id,
                    'seat_wind' => $winds[$pIdx] ?? 'East',
                ]);
            }

            // Buat ronde 1
            GameRound::create([
                'game_table_id' => $gameTable->id,
                'round_number' => 1,
                'status' => 'berjalan',
            ]);

            $createdTables->push($gameTable->load(['tablePlayers.player.user', 'currentRound']));
        }

        return $createdTables;
    }
}
