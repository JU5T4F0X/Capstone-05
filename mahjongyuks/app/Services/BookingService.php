<?php

namespace App\Services;

use App\Models\Meja;
use App\Models\Pembayaran;
use App\Models\Pemesanan;
use Illuminate\Support\Facades\DB;

class BookingService
{
    public const TARIF_PER_JAM = [
        'Casual' => 25000,
        'Competitive' => 30000,
    ];
    public const BIAYA_LAYANAN = 5000;

    /**
     * Hitung rincian biaya pemesanan meja permainan.
     */
    public function hitungHarga(string $jenis, int $durasi, ?int $totalKhusus = null): array
    {
        if ($totalKhusus !== null && $totalKhusus > 0) {
            return [
                'durasi_jam' => $durasi,
                'tarif_per_jam' => (int) round($totalKhusus / max(1, $durasi)),
                'biaya_sewa' => $totalKhusus,
                'biaya_layanan' => 0,
                'total' => $totalKhusus,
            ];
        }

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

    /**
     * Cek regulasi alokasi meja MahjongYuks:
     * - Meja yang sedang terisi sebagian harus diprioritaskan sebelum membuka meja baru.
     * - Jika semua meja kosong, wajib mulai dari meja nomor terendah.
     */
    public function cekRegulasiMeja(Meja $meja, string $tanggalMain, string $mulaiStr, string $selesaiStr): ?string
    {
        $currentMejaOccupied = Pemesanan::where('meja_id', $meja->id)
            ->whereDate('tanggal_main', $tanggalMain)
            ->menempati()
            ->bentrok($mulaiStr, $selesaiStr)
            ->count();

        if ($currentMejaOccupied === 0) {
            $venueTableIds = Meja::where('venue_id', $meja->venue_id)->orderBy('id')->pluck('id');

            $partiallyFilledMejaExists = Pemesanan::whereIn('meja_id', $venueTableIds)
                ->where('meja_id', '!=', $meja->id)
                ->whereDate('tanggal_main', $tanggalMain)
                ->menempati()
                ->bentrok($mulaiStr, $selesaiStr)
                ->select('meja_id', DB::raw('count(*) as total'))
                ->groupBy('meja_id')
                ->havingRaw('total >= 1 AND total < 4')
                ->exists();

            if ($partiallyFilledMejaExists) {
                return 'Sesuai regulasi MahjongYuks, silakan pilih kursi di meja yang sedang terisi sebagian terlebih dahulu sebelum membuka meja baru agar sesi permainan dapat segera dimulai (minimal 4 pemain).';
            }

            $firstAvailableTableId = null;
            foreach ($venueTableIds as $vId) {
                $cnt = Pemesanan::where('meja_id', $vId)
                    ->whereDate('tanggal_main', $tanggalMain)
                    ->menempati()
                    ->bentrok($mulaiStr, $selesaiStr)
                    ->count();
                if ($cnt < 4) {
                    $firstAvailableTableId = $vId;
                    break;
                }
            }

            if ($firstAvailableTableId && $meja->id !== $firstAvailableTableId) {
                return 'Sesuai regulasi MahjongYuks, silakan pilih meja nomor awal yang tersedia terlebih dahulu sebelum membuka meja lainnya.';
            }
        }

        return null;
    }

    /**
     * Format payload e-tiket reservasi.
     */
    public function formatTiket(Pemesanan $p, ?Pembayaran $b): array
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
            'total_bayar' => (int) ($b?->jumlah ?? 0),
        ];
    }
}

