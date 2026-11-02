<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DetailPemesanan;
use App\Models\Meja;
use App\Models\Pembayaran;
use App\Models\Pemesanan;
use App\Models\Player;
use App\Services\MidtransService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PemesananController extends Controller
{
    private const TARIF_PER_JAM = ['Casual' => 25000, 'Competitive' => 30000];
    private const BIAYA_LAYANAN = 5000;
    private const MENIT_BAYAR = 15;

    public function __construct(private MidtransService $midtrans)
    {
    }

    /**
     * Riwayat pemesanan milik pemain (atau semua untuk admin).
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

        return response()->json([
            'success' => true,
            'message' => 'Daftar pemesanan berhasil diambil',
            'data' => $query->paginate(15),
        ]);
    }

    /**
     * Buat pemesanan 1 kursi + token pembayaran Midtrans.
     * Harga, jam selesai, dan kode booking SELALU dihitung di server.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'meja_id' => 'required|exists:mejas,id',
            'tanggal_main' => 'required|date|after_or_equal:today',
            'waktu_mulai' => 'required|date_format:H:i',
            'durasi_jam' => 'required|integer|in:1,2,3,4,6',
            'jenis_pemesanan' => 'required|in:Casual,Competitive',
            'kursi_pilihan' => 'required|in:ton,nan,sha,pei',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi pemesanan gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $d = $validator->validated();
        $durasi = (int) $d['durasi_jam'];

        $mulai = Carbon::createFromFormat('H:i', $d['waktu_mulai']);
        $selesai = $mulai->copy()->addHours($durasi);
        if (!$selesai->isSameDay($mulai)) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi tidak boleh melewati tengah malam. Pilih jam mulai lebih awal.',
            ], 422);
        }
        $mulaiStr = $mulai->format('H:i:s');
        $selesaiStr = $selesai->format('H:i:s');

        $harga = $this->hitungHarga($d['jenis_pemesanan'], $durasi);

        $user = $request->user();
        $player = Player::firstOrCreate(
            ['user_id' => $user->id],
            ['tanggal_daftar' => now(), 'status' => 'active']
        );

        // Tahap 1: cek bentrok kursi + simpan, dalam satu transaksi
        $hasil = DB::transaction(function () use ($d, $durasi, $player, $mulaiStr, $selesaiStr, $harga) {
            $meja = Meja::lockForUpdate()->findOrFail($d['meja_id']);

            $bentrok = Pemesanan::where('meja_id', $meja->id)
                ->whereDate('tanggal_main', $d['tanggal_main'])
                ->menempati()
                ->bentrok($mulaiStr, $selesaiStr)
                ->whereHas('detailPemesanans', fn ($q) => $q->where('posisi_kursi', $d['kursi_pilihan']))
                ->with('pembayaran')
                ->first();

            if ($bentrok) {
                return ['bentrok' => $bentrok];
            }

            $pemesanan = Pemesanan::create([
                'player_id' => $player->id,
                'meja_id' => $meja->id,
                'tanggal_pemesanan' => now()->toDateString(),
                'tanggal_main' => $d['tanggal_main'],
                'waktu_mulai' => $mulaiStr,
                'waktu_selesai' => $selesaiStr,
                'jumlah_pemain' => 1,
                'jenis_pemesanan' => $d['jenis_pemesanan'],
                'status_pemesanan' => 'pending',
                'durasi_jam' => $durasi,
            ]);
            $pemesanan->update(['kode_booking' => sprintf('MJY-BOK-%05d', $pemesanan->id)]);

            DetailPemesanan::create([
                'pemesanan_id' => $pemesanan->id,
                'player_id' => $player->id,
                'status_kehadiran' => 'pending',
                'posisi_kursi' => $d['kursi_pilihan'],
            ]);

            $pembayaran = Pembayaran::create([
                'pemesanan_id' => $pemesanan->id,
                'tanggal_pembayaran' => null,
                'jumlah' => $harga['total'],
                'metode_pembayaran' => 'QRIS Instant', // nilai lama yang pasti diterima kolom; jenis asli ada di payment_type
                'status' => 'pending',
                // akhiran acak agar order_id tidak bentrok di Midtrans kalau database direset
                'order_id' => $pemesanan->kode_booking . '-' . strtoupper(Str::random(5)),
                'expires_at' => now()->addMinutes(self::MENIT_BAYAR),
            ]);

            return compact('pemesanan', 'pembayaran', 'meja');
        });

        if (isset($hasil['bentrok'])) {
            $b = $hasil['bentrok'];
            $milikSendiri = $b->player_id === $player->id
                && $b->status_pemesanan === 'pending'
                && $b->pembayaran?->snap_token;

            if ($milikSendiri) {
                return response()->json([
                    'success' => true,
                    'message' => 'Anda sudah punya pemesanan menunggu pembayaran untuk kursi ini.',
                    'data' => $this->payloadBayar($b, $b->pembayaran),
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Kursi ini sudah dipesan pada jam tersebut. Silakan pilih kursi atau jam lain.',
            ], 409);
        }

        ['pemesanan' => $pemesanan, 'pembayaran' => $pembayaran, 'meja' => $meja] = $hasil;

        // Tahap 2: minta token ke Midtrans (di luar transaksi)
        try {
            $token = $this->midtrans->createSnapToken([
                'transaction_details' => [
                    'order_id' => $pembayaran->order_id,
                    'gross_amount' => $harga['total'],
                ],
                'item_details' => [[
                    'id' => 'MEJA-' . $meja->id,
                    'price' => $harga['total'],
                    'quantity' => 1,
                    'name' => "Sewa Meja {$meja->nomor_meja} ({$durasi} jam)",
                ]],
                'customer_details' => [
                    'first_name' => $user->name ?? $user->nama ?? 'Pemain',
                    'email' => $user->email,
                ],
                'expiry' => [
                    'start_time' => now()->format('Y-m-d H:i:s O'),
                    'unit' => 'minutes',
                    'duration' => self::MENIT_BAYAR,
                ],
                'page_expiry' => [
                    'duration' => self::MENIT_BAYAR,
                    'unit' => 'minutes',
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Midtrans gagal membuat snap token: ' . $e->getMessage());
            $pembayaran->update(['status' => 'failed']);
            $pemesanan->update(['status_pemesanan' => 'cancelled']);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghubungi layanan pembayaran. Silakan coba lagi.',
                'detail' => config('app.debug') ? $e->getMessage() : null,
            ], 502);
        }

        $pembayaran->update(['snap_token' => $token]);

        return response()->json([
            'success' => true,
            'message' => 'Pemesanan dibuat. Silakan selesaikan pembayaran.',
            'data' => $this->payloadBayar($pemesanan->fresh(), $pembayaran->fresh()),
        ], 201);
    }

    /**
     * Status pembayaran (dipoll frontend). Hanya pemilik atau admin.
     */
    public function status(Request $request, int $id): JsonResponse
    {
        $pemesanan = Pemesanan::with(['meja.venue', 'pembayaran', 'detailPemesanans', 'player.user'])->find($id);

        if (!$pemesanan) {
            return response()->json(['success' => false, 'message' => 'Data pemesanan tidak ditemukan.'], 404);
        }

        $user = $request->user();
        if ($user->role !== 'admin' && $pemesanan->player?->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Anda tidak berhak melihat pemesanan ini.'], 403);
        }

        $pembayaran = $pemesanan->pembayaran;

        if ($pembayaran && $pembayaran->status === 'pending') {
            // Sinkronisasi cadangan ke Midtrans (maks. 1x tiap 8 detik per order)
            if ($pembayaran->order_id && Cache::add('midtrans-sync:' . $pembayaran->order_id, 1, 8)) {
                $s = $this->midtrans->status($pembayaran->order_id);
                if ($s && isset($s->transaction_status)) {
                    $pembayaran->terapkanStatusGateway(
                        $s->transaction_status,
                        $s->fraud_status ?? null,
                        $s->payment_type ?? null
                    );
                }
            }

            // Lewat batas waktu dan belum dibayar: lepaskan kursi
            if ($pembayaran->status === 'pending' && $pembayaran->expires_at && $pembayaran->expires_at->isPast()) {
                $pembayaran->terapkanStatusGateway('expire');
            }

            $pembayaran->refresh();
            $pemesanan->refresh();
        }

        $state = $this->nilaiStatus($pembayaran);

        return response()->json([
            'success' => true,
            'data' => [
                'pemesanan_id' => $pemesanan->id,
                'status' => $state,
                'kode_booking' => $pemesanan->kode_booking,
                'snap_token' => $state === 'pending' ? $pembayaran?->snap_token : null,
                'expires_at' => $pembayaran?->expires_at,
                'tiket' => $state === 'paid' ? $this->dataTiket($pemesanan, $pembayaran) : null,
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $pemesanan = Pemesanan::with([
            'meja.venue',
            'pembayaran',
            'detailPemesanans.player.user',
            'player.user',
        ])->find($id);

        if (!$pemesanan) {
            return response()->json(['success' => false, 'message' => 'Data pemesanan tidak ditemukan.'], 404);
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

    public function cancel(Request $request, int $id): JsonResponse
    {
        $pemesanan = Pemesanan::with('pembayaran')->find($id);

        if (!$pemesanan) {
            return response()->json(['success' => false, 'message' => 'Data pemesanan tidak ditemukan.'], 404);
        }

        $user = $request->user();
        if ($user->role === 'player' && $pemesanan->player->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki otorisasi untuk membatalkan pemesanan ini.',
            ], 403);
        }

        if ($pemesanan->status_pemesanan === 'cancelled') {
            return response()->json(['success' => false, 'message' => 'Pemesanan ini sudah dibatalkan sebelumnya.'], 400);
        }

        if ($pemesanan->pembayaran?->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Pemesanan yang sudah dibayar tidak bisa dibatalkan dari sini. Hubungi admin untuk refund.',
            ], 409);
        }

        $pemesanan->update(['status_pemesanan' => 'cancelled']);
        $pemesanan->pembayaran?->update(['status' => 'failed']);

        return response()->json([
            'success' => true,
            'message' => 'Pemesanan berhasil dibatalkan.',
            'data' => $pemesanan,
        ]);
    }

    // ----------------------------------------------------------------

    private function hitungHarga(string $jenis, int $durasi): array
    {
        $tarif = self::TARIF_PER_JAM[$jenis] ?? self::TARIF_PER_JAM['Casual'];
        $sewa = $tarif * $durasi;

        return [
            'durasi_jam' => $durasi,
            'tarif_per_jam' => $tarif,
            'biaya_sewa' => $sewa,
            'biaya_layanan' => self::BIAYA_LAYANAN,
            'total' => $sewa + self::BIAYA_LAYANAN,
        ];
    }

    private function payloadBayar(Pemesanan $p, Pembayaran $b): array
    {
        return [
            'pemesanan_id' => $p->id,
            'kode_booking' => $p->kode_booking,
            'order_id' => $b->order_id,
            'snap_token' => $b->snap_token,
            'total_bayar' => (int) $b->jumlah,
            'expires_at' => $b->expires_at,
            'rincian' => $this->hitungHarga($p->jenis_pemesanan, (int) $p->durasi_jam),
        ];
    }

    private function nilaiStatus(?Pembayaran $b): string
    {
        if (!$b) {
            return 'failed';
        }
        if ($b->status === 'paid') {
            return 'paid';
        }
        if ($b->status === 'pending') {
            return ($b->expires_at && $b->expires_at->isPast()) ? 'expired' : 'pending';
        }

        return $b->status_midtrans === 'expire' ? 'expired' : 'failed';
    }

    private function dataTiket(Pemesanan $p, Pembayaran $b): array
    {
        $u = $p->player?->user;

        return [
            'kode_booking' => $p->kode_booking,
            'meja' => $p->meja?->nomor_meja,
            'meja_detail' => $p->meja,
            'kursi' => $p->detailPemesanans->first()?->posisi_kursi,
            'nama_pemain' => $u?->name ?? $u?->nama,
            'jenis_pemesanan' => $p->jenis_pemesanan,
            'durasi_jam' => $p->durasi_jam,
            'tanggal_main' => $p->tanggal_main?->toDateString(),
            'waktu_mulai' => $p->waktu_mulai,
            'waktu_selesai' => $p->waktu_selesai,
            'total_bayar' => (int) $b->jumlah,
        ];
    }
}