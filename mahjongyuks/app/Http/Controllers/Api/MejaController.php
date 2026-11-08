<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meja;
use App\Models\Pemesanan;
use App\Models\Venue;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MejaController extends Controller
{
    /**
     * Ambil daftar meja, opsional difilter berdasarkan venue_id.
     * Mengembalikan daftar kursi terisi (occupied_seats) beserta detail pemain nyata,
     * serta menerapkan regulasi pemenuhan meja MahjongYuks (meja kosong dikunci
     * jika ada meja yang sedang terisi sebagian).
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'venue_id' => 'nullable',
            'tanggal_main' => 'nullable|date',
            'waktu_mulai' => 'nullable|date_format:H:i',
            'durasi_jam' => 'nullable|integer|in:1,2,3,4,6',
            'status' => 'nullable|string',
        ]);

        $query = Meja::with('venue');

        if ($request->filled('venue_id')) {
            $query->where('venue_id', $request->venue_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $mejas = $query->orderBy('id')->get();

        // Kursi dan data pemain yang terisi untuk jadwal yang dipilih
        $terisi = [];
        $seatDetails = [];

        if ($request->filled('tanggal_main') && $request->filled('waktu_mulai')) {
            $mulai = Carbon::createFromFormat('H:i', $request->input('waktu_mulai'));
            $selesai = $mulai->copy()->addHours((int) $request->input('durasi_jam', 4));
            $akhir = $selesai->isSameDay($mulai) ? $selesai->format('H:i:s') : '23:59:59';

            $pemesanans = Pemesanan::whereIn('meja_id', $mejas->pluck('id'))
                ->whereDate('tanggal_main', $request->input('tanggal_main'))
                ->menempati()
                ->bentrok($mulai->format('H:i:s'), $akhir)
                ->with(['detailPemesanans.player.user', 'player.user'])
                ->get();

            foreach ($pemesanans as $pm) {
                foreach ($pm->detailPemesanans as $detail) {
                    $pos = $detail->posisi_kursi;
                    if ($pos) {
                        $occupantName = $detail->player?->user?->nama ?? $pm->player?->user?->nama ?? 'Pemain';
                        $terisi[$pm->meja_id][] = $pos;
                        $seatDetails[$pm->meja_id][$pos] = [
                            'occupant' => $occupantName,
                            'player_id' => $detail->player_id,
                            'user_id' => $detail->player?->user_id ?? $pm->player?->user_id,
                            'status_kehadiran' => $detail->status_kehadiran,
                        ];
                    }
                }
            }
        }

        // Hitung meja yang sedang terisi sebagian (1-3 pemain)
        $partiallyFilledTables = [];
        foreach ($mejas as $m) {
            $occCount = count(array_unique($terisi[$m->id] ?? []));
            if ($occCount > 0 && $occCount < ($m->kapasitas ?: 4)) {
                $partiallyFilledTables[] = $m->id;
            }
        }
        $hasPartiallyFilled = count($partiallyFilledTables) > 0;

        // Cari meja kosong pertama untuk rekomendasi jika semua meja kosong
        $firstEmptyTableId = null;
        foreach ($mejas as $m) {
            $occCount = count(array_unique($terisi[$m->id] ?? []));
            if ($occCount === 0) {
                $firstEmptyTableId = $m->id;
                break;
            }
        }

        $formatted = $mejas->map(function ($m) use ($terisi, $seatDetails, $hasPartiallyFilled, $partiallyFilledTables, $firstEmptyTableId) {
            $occupied = array_values(array_unique($terisi[$m->id] ?? []));
            $occCount = count($occupied);
            $kapasitas = (int) ($m->kapasitas ?: 4);
            $seatsMap = $seatDetails[$m->id] ?? [];

            $isFull = $occCount >= $kapasitas;
            $isPartial = $occCount > 0 && $occCount < $kapasitas;
            $isEmpty = $occCount === 0;

            // Logika Penguncian Meja Berdasarkan Regulasi MahjongYuks:
            // 1. Meja penuh (4/4) dikunci karena kuota habis.
            // 2. Jika ada meja yang terisi sebagian (1-3 pemain), semua meja kosong (0 pemain) DIKUNCI.
            // 3. Jika belum ada meja terisi sebagian, hanya meja kosong PERTAMA yang dibuka; meja kosong selanjutnya DIKUNCI.
            $isLocked = false;
            $lockReason = null;

            if ($isFull) {
                $isLocked = true;
                $lockReason = 'Meja telah penuh (4/4 pemain). Silakan pilih meja lain.';
            } elseif ($isEmpty && $hasPartiallyFilled) {
                $isLocked = true;
                $lockReason = 'Terkunci: Regulasi MahjongYuks mewajibkan memenuhi meja yang sedang terisi terlebih dahulu agar sesi permainan dapat segera dimulai (minimal 4 pemain).';
            } elseif ($isEmpty && $firstEmptyTableId && $m->id !== $firstEmptyTableId) {
                $isLocked = true;
                $lockReason = 'Terkunci: Silakan pilih meja nomor awal yang tersedia terlebih dahulu.';
            }

            // Tentukan status tampilan
            $statusLabel = 'Tersedia';
            if ($isFull) {
                $statusLabel = 'Penuh (4/4)';
            } elseif ($isPartial) {
                $sisa = $kapasitas - $occCount;
                $statusLabel = "Sisa {$sisa} Kursi (Prioritas Penuhkan)";
            } elseif ($isLocked) {
                $statusLabel = 'Terkunci (Regulasi Meja)';
            }

            return [
                'id' => $m->id,
                'venue_id' => $m->venue_id,
                'venue_nama' => $m->venue?->nama_venue,
                'nomor_meja' => $m->nomor_meja,
                'kapasitas' => $kapasitas,
                'status' => $m->status,
                'occupied_seats' => $occupied,
                'occupied_count' => $occCount,
                'seat_details' => $seatsMap,
                'is_full' => $isFull,
                'is_partial' => $isPartial,
                'is_empty' => $isEmpty,
                'is_locked' => $isLocked,
                'lock_reason' => $lockReason,
                'status_label' => $statusLabel,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Data meja berhasil diambil',
            'data' => $formatted,
            'meta' => [
                'has_partially_filled' => $hasPartiallyFilled,
                'partially_filled_table_ids' => $partiallyFilledTables,
            ],
        ]);
    }

    /**
     * Detail meja beserta status ketersediaan kursi.
     */
    public function show(int $id): JsonResponse
    {
        $meja = Meja::with(['venue', 'pemesanans' => function ($q) {
            $q->where('tanggal_main', '>=', now()->toDateString())
              ->whereIn('status_pemesanan', ['pending', 'confirmed'])
              ->with('detailPemesanans.player.user');
        }])->find($id);

        if (!$meja) {
            return response()->json([
                'success' => false,
                'message' => 'Meja tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail meja berhasil diambil',
            'data' => $meja,
        ]);
    }
}