<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DetailPemesanan;
use App\Models\Meja;
use App\Models\Pembayaran;
use App\Models\Pemesanan;
use App\Models\Player;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PemesananController extends Controller
{
    /**
     * Tampilkan riwayat pemesanan milik pemain (atau semua untuk admin).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Pemesanan::with([
            'meja.venue',
            'pembayaran',
            'detailPemesanans.player.user',
            'player.user',
        ])->latest('tanggal_pemesanan');

        if ($user->role === 'player') {
            $player = Player::where('user_id', $user->id)->first();
            if (!$player) {
                return response()->json([
                    'success' => true,
                    'message' => 'Data riwayat pemesanan kosong',
                    'data' => [],
                ]);
            }
            $query->where('player_id', $player->id);
        }

        $pemesanans = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Daftar pemesanan berhasil diambil',
            'data' => $pemesanans,
        ]);
    }

    /**
     * Buat pemesanan meja dan kursi baru.
     * Sesuai AGENTS.md:
     * - Kapasitas meja MAKS 4 pemain (validasi WAJIB di backend).
     * - Info jadwal (tanggal_main, waktu_mulai, waktu_selesai) embedded di pemesanans.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'meja_id' => 'required|exists:mejas,id',
            'tanggal_main' => 'required|date|after_or_equal:today',
            'waktu_mulai' => 'required|date_format:H:i',
            'waktu_selesai' => 'required|date_format:H:i|after:waktu_mulai',
            'jumlah_pemain' => 'required|integer|min:1|max:4',
            'jenis_pemesanan' => 'required|in:Casual,Competitive',
            'durasi_jam' => 'nullable|integer|min:1|max:12',
            'kursi_pilihan' => 'nullable|in:ton,nan,sha,pei',
            'metode_pembayaran' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi pemesanan gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $meja = Meja::findOrFail($request->meja_id);

        // Validasi kapasitas meja (maks 4)
        if ($request->jumlah_pemain > $meja->kapasitas || $request->jumlah_pemain > 4) {
            return response()->json([
                'success' => false,
                'message' => 'Jumlah pemain melebihi kapasitas maksimal meja (maksimal 4 pemain).',
            ], 422);
        }

        // Cek konflik jadwal meja
        $bentrok = Pemesanan::where('meja_id', $meja->id)
            ->where('tanggal_main', $request->tanggal_main)
            ->whereIn('status_pemesanan', ['pending', 'confirmed'])
            ->where(function ($q) use ($request) {
                $q->whereBetween('waktu_mulai', [$request->waktu_mulai, $request->waktu_selesai])
                  ->orWhereBetween('waktu_selesai', [$request->waktu_mulai, $request->waktu_selesai])
                  ->orWhere(function ($sub) use ($request) {
                      $sub->where('waktu_mulai', '<=', $request->waktu_mulai)
                          ->where('waktu_selesai', '>=', $request->waktu_selesai);
                  });
            })
            ->exists();

        if ($bentrok) {
            return response()->json([
                'success' => false,
                'message' => 'Meja telah dipesan pada slot waktu tersebut. Silakan pilih meja atau jam lain.',
            ], 409);
        }

        $user = $request->user();
        $player = Player::firstOrCreate(
            ['user_id' => $user->id],
            ['tanggal_daftar' => now(), 'status' => 'active']
        );

        // Hitung estimasi harga: Rp 50.000 / jam + Rp 5.000 platform fee
        $durasi = $request->durasi_jam ?? 2;
        $hargaPerJam = 50000;
        $platformFee = 5000;
        $totalBayar = ($durasi * $hargaPerJam) + $platformFee;

        DB::beginTransaction();
        try {
            $pemesanan = Pemesanan::create([
                'player_id' => $player->id,
                'meja_id' => $meja->id,
                'tanggal_pemesanan' => now()->toDateString(),
                'tanggal_main' => $request->tanggal_main,
                'waktu_mulai' => $request->waktu_mulai,
                'waktu_selesai' => $request->waktu_selesai,
                'jumlah_pemain' => $request->jumlah_pemain,
                'jenis_pemesanan' => $request->jenis_pemesanan,
                'status_pemesanan' => 'pending',
            ]);

            // Catat peserta utama dalam detail_pemesanans
            DetailPemesanan::create([
                'pemesanan_id' => $pemesanan->id,
                'player_id' => $player->id,
                'status_kehadiran' => 'pending',
            ]);

            // Buat invoice pembayaran (simulasi)
            $pembayaran = Pembayaran::create([
                'pemesanan_id' => $pemesanan->id,
                'tanggal_pembayaran' => null,
                'jumlah' => $totalBayar,
                'metode_pembayaran' => $request->metode_pembayaran ?? 'QRIS Instant',
                'status' => 'pending',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pemesanan meja berhasil dibuat. Silakan selesaikan pembayaran.',
                'data' => [
                    'pemesanan' => $pemesanan->load(['meja.venue', 'pembayaran']),
                    'kode_booking' => sprintf('#MJY-%06d', $pemesanan->id),
                    'total_bayar' => $totalBayar,
                    'rincian' => [
                        'durasi_jam' => $durasi,
                        'harga_per_jam' => $hargaPerJam,
                        'biaya_sewa' => $durasi * $hargaPerJam,
                        'biaya_platform' => $platformFee,
                    ],
                ],
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat memproses pemesanan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Detail pemesanan berdasarkan ID.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $pemesanan = Pemesanan::with([
            'meja.venue',
            'pembayaran',
            'detailPemesanans.player.user',
            'player.user',
        ])->find($id);

        if (!$pemesanan) {
            return response()->json([
                'success' => false,
                'message' => 'Data pemesanan tidak ditemukan.',
            ], 404);
        }

        $user = $request->user();
        if ($user->role === 'player' && $pemesanan->player->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki otorisasi untuk melihat pemesanan ini.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail pemesanan berhasil dimuat.',
            'data' => $pemesanan,
        ]);
    }

    /**
     * Batalkan pemesanan.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $pemesanan = Pemesanan::find($id);

        if (!$pemesanan) {
            return response()->json([
                'success' => false,
                'message' => 'Data pemesanan tidak ditemukan.',
            ], 404);
        }

        $user = $request->user();
        if ($user->role === 'player' && $pemesanan->player->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki otorisasi untuk membatalkan pemesanan ini.',
            ], 403);
        }

        if ($pemesanan->status_pemesanan === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Pemesanan ini sudah dibatalkan sebelumnya.',
            ], 400);
        }

        $pemesanan->update(['status_pemesanan' => 'cancelled']);
        if ($pemesanan->pembayaran) {
            $pemesanan->pembayaran->update(['status' => 'failed']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pemesanan berhasil dibatalkan.',
            'data' => $pemesanan,
        ]);
    }
}
