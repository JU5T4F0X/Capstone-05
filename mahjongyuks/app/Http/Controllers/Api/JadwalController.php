<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JadwalController extends Controller
{
    /**
     * Ambil jadwal lengkap: pembedaan tegas antara Jadwal Event Turnamen dan Jadwal Sesi Permainan Reguler
     */
    public function index(Request $request): JsonResponse
    {
        $venueFilter = $request->input('venue_id');
        $dateFilter = $request->input('tanggal');

        // 1. Jadwal Permainan Non-Event khusus Game House (Sedayu City Kelapa Gading SCBRC)
        // Aturan:
        // - Jika jenis_event 'Event', maka TIDAK tertampil di halaman Jadwal (hanya di halaman Event)
        // - Jika jenis_event 'Non-Event', maka tertampil di halaman Jadwal (dan TIDAK di halaman Event)
        // - Di halaman Jadwal hanya permainan yang di-set di GameHouse (Sedayu City Kelapa Gading SCBRC)
        $eventQuery = Event::with('venue')
            ->where(function ($q) {
                $q->where('jenis_event', 'Non-Event')
                  ->orWhere('jenis_event', 'non-event');
            })
            ->where(function ($q) {
                $q->where('venue_id', 1)
                  ->orWhereNull('venue_id')
                  ->orWhereHas('venue', function ($vq) {
                      $vq->where('nama_venue', 'like', '%Game House%')
                         ->orWhere('alamat', 'like', '%Sedayu City%');
                  });
            });

        if ($dateFilter && $dateFilter !== 'all') {
            $eventQuery->where('tanggal_event', $dateFilter);
        }

        $events = $eventQuery->orderBy('tanggal_event', 'asc')
                             ->orderBy('waktu_mulai', 'asc')
                             ->get();

        $jadwalEvents = $events->map(function ($event) {
            $venueName = 'Game House';
            $venueAlamat = 'Sedayu City Kelapa Gading SCBRC, Blok C No. 18, RT 03/RW 09, Kelapa Gading, Jakarta Utara';
            if ($event->venue) {
                $venueName = $event->venue->nama_venue;
                if (!empty($event->venue->alamat)) {
                    $venueAlamat = $event->venue->alamat;
                }
            }

            return [
                'id' => 'ev-' . $event->id,
                'event_id' => $event->id,
                'tipe' => 'non_event',
                'jenis_event' => $event->jenis_event ?? 'Non-Event',
                'judul' => $event->nama_event,
                'deskripsi' => $event->deskripsi,
                'tanggal' => $event->tanggal_event ? $event->tanggal_event->format('Y-m-d') : null,
                'tanggal_formatted' => $event->tanggal_event ? $event->tanggal_event->translatedFormat('d F Y') : null,
                'waktu' => substr($event->waktu_mulai, 0, 5) . ' - ' . substr($event->waktu_selesai, 0, 5) . ' WIB',
                'venue' => $venueName,
                'alamat' => $venueAlamat,
                'status' => $event->status === 'active' ? 'Pendaftaran Dibuka' : ucfirst($event->status),
                'status_code' => $event->status,
                'biaya' => $event->biaya ?: 'Rp 95.000 / kursi',
                'kuota' => $event->kuota ?: 'Sisa 4 Kursi (1 Meja)',
                'aturan' => 'Standar Permainan Resmi Game House Sedayu City',
            ];
        });

        // 2. Jadwal Sesi Permainan Reguler (Sesi Siang & Sesi Malam per Venue)
        $venues = Venue::withCount('mejas')->where('status', 'active')->get();
        $jadwalSesi = [];

        foreach ($venues as $venue) {
            if ($venueFilter && $venue->id != $venueFilter) {
                continue;
            }

            // Sesi Siang
            $jadwalSesi[] = [
                'id' => 'sesi-siang-' . $venue->id,
                'tipe' => 'sesi_permainan',
                'judul' => 'Sesi Bermain Siang (Casual & Ranked)',
                'deskripsi' => 'Sesi permainan reguler santai atau latih tanding dengan meja otomatis Amos Rexx III.',
                'tanggal' => $dateFilter ?: now()->toDateString(),
                'tanggal_formatted' => $dateFilter ? date('d F Y', strtotime($dateFilter)) : 'Hari Ini (' . now()->translatedFormat('d F Y') . ')',
                'waktu' => '13:00 - 18:30 WIB',
                'venue' => $venue->nama_venue,
                'venue_id' => $venue->id,
                'alamat' => $venue->alamat,
                'status' => 'Tersedia ' . ($venue->mejas_count ?? 12) . ' Meja',
                'status_code' => 'tersedia',
                'kapasitas' => 'Maks. 4 Pemain per Meja',
                'biaya' => 'Rp 95.000 / kursi',
                'fasilitas' => 'Meja Otomatis + Free Oolong Tea',
            ];

            // Sesi Malam
            $jadwalSesi[] = [
                'id' => 'sesi-malam-' . $venue->id,
                'tipe' => 'sesi_permainan',
                'judul' => 'Sesi Bermain Malam (Prime Time)',
                'deskripsi' => 'Sesi prime time komunitas setelah jam kerja dengan wasit siaga dan verifikasi skor resmi.',
                'tanggal' => $dateFilter ?: now()->toDateString(),
                'tanggal_formatted' => $dateFilter ? date('d F Y', strtotime($dateFilter)) : 'Hari Ini (' . now()->translatedFormat('d F Y') . ')',
                'waktu' => '19:00 - 23:00 WIB',
                'venue' => $venue->nama_venue,
                'venue_id' => $venue->id,
                'alamat' => $venue->alamat,
                'status' => 'Sisa Meja Terbatas',
                'status_code' => 'kritis',
                'kapasitas' => 'Maks. 4 Pemain per Meja',
                'biaya' => 'Rp 110.000 / kursi',
                'fasilitas' => 'Meja Otomatis + Scoring Screen',
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil dimuat',
            'data' => [
                'events' => $jadwalEvents,
                'sesi_permainan' => $jadwalSesi,
            ],
        ]);
    }
}

