<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VenueController extends Controller
{
    /**
     * Tampilkan semua venue yang aktif.
     */
    public function index(): JsonResponse
    {
        $venues = Venue::withCount('mejas')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar venue berhasil diambil',
            'data' => $venues,
        ]);
    }

    /**
     * Detail venue beserta daftar mejanya.
     */
    public function show(int $id): JsonResponse
    {
        $venue = Venue::with('mejas')->find($id);

        if (!$venue) {
            return response()->json([
                'success' => false,
                'message' => 'Venue tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail venue berhasil diambil',
            'data' => $venue,
        ]);
    }
}
