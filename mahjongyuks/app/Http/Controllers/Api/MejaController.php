<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meja;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MejaController extends Controller
{
    /**
     * Ambil daftar meja, opsional difilter berdasarkan venue_id.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Meja::with('venue');

        if ($request->has('venue_id')) {
            $query->where('venue_id', $request->venue_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $mejas = $query->get();

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
