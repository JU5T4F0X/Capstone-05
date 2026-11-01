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
     * Kalau tanggal_main + waktu_mulai dikirim, tiap meja diberi
     * daftar kursi yang sudah terisi (occupied_seats).
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'tanggal_main' => 'nullable|date',
            'waktu_mulai' => 'nullable|date_format:H:i',
            'durasi_jam' => 'nullable|integer|in:1,2,3,4,6',
        ]);

        $query = Meja::with('venue');

        if ($request->has('venue_id')) {
            $query->where('venue_id', $request->venue_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $mejas = $query->get();

        // Kursi yang terisi untuk jadwal yang dipilih
        $terisi = [];
        if ($request->filled('tanggal_main') && $request->filled('waktu_mulai')) {
            $mulai = Carbon::createFromFormat('H:i', $request->input('waktu_mulai'));
            $selesai = $mulai->copy()->addHours((int) $request->input('durasi_jam', 1));
            $akhir = $selesai->isSameDay($mulai) ? $selesai->format('H:i:s') : '23:59:59';

            $pemesanans = Pemesanan::whereIn('meja_id', $mejas->pluck('id'))
                ->whereDate('tanggal_main', $request->input('tanggal_main'))
                ->menempati()
                ->bentrok($mulai->format('H:i:s'), $akhir)
                ->with('detailPemesanans:id,pemesanan_id,posisi_kursi')
                ->get();

            foreach ($pemesanans as $pm) {
                foreach ($pm->detailPemesanans as $detail) {
                    if ($detail->posisi_kursi) {
                        $terisi[$pm->meja_id][] = $detail->posisi_kursi;
                    }
                }
            }
        }

        $mejas->each(fn ($m) => $m->setAttribute(
            'occupied_seats',
            array_values(array_unique($terisi[$m->id] ?? []))
        ));

        return response()->json([
            'success' => true,
            'message' => 'Data meja berhasil diambil',
            'data' => $mejas,
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