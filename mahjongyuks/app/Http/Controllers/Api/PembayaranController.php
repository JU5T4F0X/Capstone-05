<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pembayaran;
use App\Models\Pemesanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PembayaranController extends Controller
{
    /**
     * Daftar pembayaran (monitoring untuk admin, atau histori untuk pemain).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Pembayaran::with(['pemesanan.player.user', 'pemesanan.meja.venue'])->latest();

        if ($user->role === 'player') {
            $query->whereHas('pemesanan.player', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        return response()->json([
            'success' => true,
            'message' => 'Daftar transaksi pembayaran berhasil diambil',
            'data' => $query->paginate(20),
        ]);
    }

    /**
     * Simulasi Pembayaran oleh Pemain (Sprint 4).
     * Sesuai AGENTS.md: Hanya simulasi — tidak ada payment gateway nyata.
     */
    public function simulasiBayar(Request $request, int $pemesananId): JsonResponse
    {
        $pemesanan = Pemesanan::with('pembayaran')->find($pemesananId);

        if (!$pemesanan) {
            return response()->json([
                'success' => false,
                'message' => 'Data pemesanan tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'metode_pembayaran' => 'nullable|string|in:QRIS Instant,BCA Virtual Account,Mandiri Virtual Account,Tunai di Kasir',
            'bukti_pembayaran' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Metode pembayaran tidak valid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $pembayaran = $pemesanan->pembayaran;
            if (!$pembayaran) {
                $pembayaran = Pembayaran::create([
                    'pemesanan_id' => $pemesanan->id,
                    'tanggal_pembayaran' => now()->toDateString(),
                    'jumlah' => 105000,
                    'metode_pembayaran' => $request->metode_pembayaran ?? 'QRIS Instant',
                    'status' => 'paid',
                ]);
            } else {
                $pembayaran->update([
                    'tanggal_pembayaran' => now()->toDateString(),
                    'metode_pembayaran' => $request->metode_pembayaran ?? $pembayaran->metode_pembayaran,
                    'bukti_pembayaran' => $request->bukti_pembayaran ?? 'SIMULASI-PAY-' . strtoupper(bin2hex(random_bytes(4))),
                    'status' => 'paid',
                ]);
            }

            // Update status pemesanan menjadi confirmed
            $pemesanan->update(['status_pemesanan' => 'confirmed']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Simulasi pembayaran berhasil! Meja Anda telah dikonfirmasi.',
                'data' => [
                    'pemesanan' => $pemesanan->fresh(['meja.venue', 'pembayaran']),
                    'status' => 'confirmed',
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses simulasi pembayaran: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verifikasi pembayaran oleh Admin.
     */
    public function verifikasi(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya admin yang berwenang memverifikasi pembayaran.',
            ], 403);
        }

        $pembayaran = Pembayaran::with('pemesanan')->find($id);

        if (!$pembayaran) {
            return response()->json([
                'success' => false,
                'message' => 'Data pembayaran tidak ditemukan.',
            ], 404);
        }

        $request->validate([
            'status' => 'required|in:paid,failed,pending',
        ]);

        $status = $request->status;
        $pembayaran->update([
            'status' => $status,
            'tanggal_pembayaran' => $status === 'paid' ? now()->toDateString() : null,
        ]);

        if ($pembayaran->pemesanan) {
            $pemesananStatus = $status === 'paid' ? 'confirmed' : ($status === 'failed' ? 'cancelled' : 'pending');
            $pembayaran->pemesanan->update(['status_pemesanan' => $pemesananStatus]);
        }

        return response()->json([
            'success' => true,
            'message' => "Status pembayaran berhasil diubah menjadi {$status}.",
            'data' => $pembayaran->fresh(['pemesanan']),
        ]);
    }
}
