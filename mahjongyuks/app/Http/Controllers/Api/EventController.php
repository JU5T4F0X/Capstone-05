<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EventRequest;
use App\Models\Event;
use App\Models\EventPendaftaran;
use App\Models\Player;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EventController extends Controller
{
    /**
     * Ambil daftar seluruh event dengan pencarian dan filter.
     * Masyarakat umum hanya melihat event terpublikasi (bukan draft).
     * Admin dapat melihat seluruh event termasuk draft.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $isAdmin = $user && $user->isAdmin();
        $player = $user && $user->isPlayer() ? $user->player : null;

        $query = Event::with(['venue', 'pendaftarans']);

        // Jika bukan Admin, sembunyikan event draf dan non-event (hanya tampilkan jenis_event 'Event')
        if (! $isAdmin) {
            $query->where('status', '!=', 'draft');
            $query->where(function ($q) {
                $q->where('jenis_event', 'Event')
                  ->orWhere('jenis_event', 'event')
                  ->orWhereNull('jenis_event');
            });
        } elseif ($request->filled('jenis_event') && $request->jenis_event !== 'all') {
            $query->where('jenis_event', $request->jenis_event);
        }

        // Filter pencarian nama atau deskripsi
        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('nama_event', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        // Filter status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $events = $query->orderBy('tanggal_event', 'asc')
                        ->orderBy('waktu_mulai', 'asc')
                        ->get();

        $formatted = $events->map(function ($event) use ($player) {
            return $this->formatEvent($event, false, $player);
        });

        return response()->json([
            'success' => true,
            'message' => 'Daftar event berhasil dimuat',
            'data' => $formatted,
        ]);
    }

    /**
     * Ambil detail satu event berdasarkan ID.
     * Event draf hanya dapat dibuka oleh Admin.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = auth('sanctum')->user();
        $isAdmin = $user && $user->isAdmin();
        $player = $user && $user->isPlayer() ? $user->player : null;

        $event = Event::with(['venue', 'pendaftarans.player.user'])->find($id);

        if (! $event) {
            return response()->json([
                'success' => false,
                'message' => 'Event tidak ditemukan.',
            ], 404);
        }

        if ($event->status === 'draft' && ! $isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Event ini belum dipublikasikan.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail event berhasil dimuat',
            'data' => $this->formatEvent($event, true, $player),
        ]);
    }

    /**
     * Pendaftaran Event oleh Player yang sedang Login.
     * Wajib auth:sanctum & role 'player'.
     * Menjaga identitas player strictly dari user login.
     */
    public function daftar(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        // 1. Validasi peran pemain
        if (! $user || ! $user->isPlayer()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pengguna dengan akun Pemain (Player) yang dapat mendaftar event.',
            ], 403);
        }

        // 2. Ambil atau buat profil Player terkait
        $player = $user->player ?: Player::firstOrCreate(
            ['user_id' => $user->id],
            ['tanggal_daftar' => now(), 'status' => 'active']
        );

        // 3. Ambil data event
        $event = Event::with(['pendaftarans'])->find($id);

        if (! $event) {
            return response()->json([
                'success' => false,
                'message' => 'Event yang dipilih tidak ditemukan.',
            ], 404);
        }

        // 4. Validasi status publikasi & keterbukaan event
        if ($event->status === 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran belum dibuka karena event masih berupa draf.',
            ], 422);
        }

        if ($event->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran tidak dapat diproses karena event ini telah dibatalkan.',
            ], 422);
        }

        if ($event->status === 'selesai' || $event->status === 'finished') {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran telah ditutup karena event ini sudah selesai.',
            ], 422);
        }

        // 5. Validasi kuota pendaftaran
        $maxCapacity = 16;
        if (preg_match('/(\d+)/', (string)($event->kuota ?? ''), $matches)) {
            $maxCapacity = (int)$matches[1];
        }

        $activeRegistrationsCount = $event->pendaftarans()
            ->where('status_pendaftaran', '!=', 'batal')
            ->count();

        if ($maxCapacity > 0 && $activeRegistrationsCount >= $maxCapacity) {
            return response()->json([
                'success' => false,
                'message' => 'Kuota pendaftaran untuk event ini telah penuh.',
            ], 422);
        }

        // 6. Validasi satu pendaftaran per player (Mencegah ganda)
        $existing = EventPendaftaran::where('event_id', $event->id)
            ->where('player_id', $player->id)
            ->first();

        if ($existing) {
            if ($existing->status_pendaftaran === 'batal') {
                // Aktifkan kembali pendaftaran yang sebelumnya dibatalkan
                $existing->update([
                    'status_pendaftaran' => 'terdaftar',
                    'tanggal_daftar' => now(),
                    'catatan' => $request->input('catatan', $existing->catatan),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => "Pendaftaran Anda untuk event '{$event->nama_event}' berhasil diaktifkan kembali.",
                    'data' => [
                        'pendaftaran_id' => $existing->id,
                        'event_id' => $event->id,
                        'nama_event' => $event->nama_event,
                        'player_id' => $player->id,
                        'nama_player' => $user->nama,
                        'status_pendaftaran' => $existing->status_pendaftaran,
                        'tanggal_daftar' => $existing->tanggal_daftar->format('Y-m-d H:i:s'),
                    ],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Anda sudah terdaftar sebagai peserta pada event ini.',
            ], 422);
        }

        // 7. Simpan data pendaftaran baru
        $pendaftaran = EventPendaftaran::create([
            'event_id' => $event->id,
            'player_id' => $player->id,
            'tanggal_daftar' => now(),
            'status_pendaftaran' => 'terdaftar',
            'catatan' => $request->input('catatan'),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pendaftaran berhasil! Anda telah terdaftar pada event '{$event->nama_event}'.",
            'data' => [
                'pendaftaran_id' => $pendaftaran->id,
                'event_id' => $event->id,
                'nama_event' => $event->nama_event,
                'player_id' => $player->id,
                'nama_player' => $user->nama,
                'status_pendaftaran' => $pendaftaran->status_pendaftaran,
                'tanggal_daftar' => $pendaftaran->tanggal_daftar->format('Y-m-d H:i:s'),
            ],
        ], 201);
    }

    /**
     * Batalkan pendaftaran event oleh player yang bersangkutan
     */
    public function batalDaftar(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->isPlayer()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pengguna Pemain yang dapat membatalkan pendaftaran.',
            ], 403);
        }

        $player = $user->player;
        if (! $player) {
            return response()->json([
                'success' => false,
                'message' => 'Profil pemain tidak ditemukan.',
            ], 404);
        }

        $pendaftaran = EventPendaftaran::where('event_id', $id)
            ->where('player_id', $player->id)
            ->first();

        if (! $pendaftaran || $pendaftaran->status_pendaftaran === 'batal') {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki pendaftaran aktif pada event ini.',
            ], 404);
        }

        $pendaftaran->update([
            'status_pendaftaran' => 'batal',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran event berhasil dibatalkan.',
        ]);
    }

    /**
     * Ambil daftar peserta pendaftar suatu event.
     * Khusus Administrator untuk privasi data pemain.
     */
    public function peserta(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Daftar peserta hanya dapat diakses oleh Administrator.',
            ], 403);
        }

        $event = Event::find($id);
        if (! $event) {
            return response()->json([
                'success' => false,
                'message' => 'Event tidak ditemukan.',
            ], 404);
        }

        $peserta = EventPendaftaran::with(['player.user'])
            ->where('event_id', $id)
            ->orderBy('tanggal_daftar', 'desc')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'player_id' => $p->player_id,
                    'nama_peserta' => $p->player?->user?->nama ?? 'Pemain Mahjong',
                    'email' => $p->player?->user?->email ?? '-',
                    'no_telepon' => $p->player?->user?->no_telepon ?? '-',
                    'tanggal_daftar' => $p->tanggal_daftar ? $p->tanggal_daftar->format('Y-m-d H:i') : null,
                    'tanggal_daftar_formatted' => $p->tanggal_daftar ? $p->tanggal_daftar->translatedFormat('d M Y, H:i') : null,
                    'status_pendaftaran' => $p->status_pendaftaran,
                    'catatan' => $p->catatan,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => "Daftar peserta event '{$event->nama_event}' berhasil dimuat.",
            'data' => [
                'event_id' => $event->id,
                'nama_event' => $event->nama_event,
                'total_peserta' => $peserta->where('status_pendaftaran', '!=', 'batal')->count(),
                'peserta' => $peserta,
            ],
        ]);
    }

    /**
     * Ambil riwayat pendaftaran event milik pengguna yang sedang login
     */
    public function myRegistrations(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->isPlayer()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pengguna Pemain yang memiliki riwayat pendaftaran event.',
            ], 403);
        }

        $player = $user->player;
        if (! $player) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        $registrations = EventPendaftaran::with(['event.venue'])
            ->where('player_id', $player->id)
            ->orderBy('tanggal_daftar', 'desc')
            ->get()
            ->map(function ($p) use ($player) {
                return [
                    'pendaftaran_id' => $p->id,
                    'status_pendaftaran' => $p->status_pendaftaran,
                    'tanggal_daftar' => $p->tanggal_daftar ? $p->tanggal_daftar->format('Y-m-d H:i') : null,
                    'catatan' => $p->catatan,
                    'event' => $p->event ? $this->formatEvent($p->event, false, $player) : null,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Riwayat pendaftaran event berhasil dimuat.',
            'data' => $registrations,
        ]);
    }

    /**
     * Simpan event baru (Admin CRUD)
     */
    public function store(EventRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Handle foto upload jika diunggah via file
        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('events', 'public');
            $validated['foto'] = '/storage/' . $path;
        } elseif (empty($validated['foto'])) {
            $validated['foto'] = '/assets/event_1.jpg';
        }

        // Default kuota & biaya jika kosong
        if (empty($validated['kuota'])) {
            $validated['kuota'] = 'Sisa 4 Kursi (1 Meja)';
        }
        if (empty($validated['biaya'])) {
            $validated['biaya'] = 'Rp 150.000 /kursi';
        }

        // Normalisasi jenis_event (Event vs Non-Event)
        if (empty($validated['jenis_event'])) {
            $validated['jenis_event'] = 'Event';
        } else {
            $validated['jenis_event'] = strcasecmp($validated['jenis_event'], 'Non-Event') === 0 ? 'Non-Event' : 'Event';
        }

        $event = Event::create($validated);
        $event->load('venue');

        return response()->json([
            'success' => true,
            'message' => 'Event baru berhasil ditambahkan ke jadwal MahjongYuks.',
            'data' => $this->formatEvent($event, true),
        ], 201);
    }

    /**
     * Perbarui data event yang ada (Admin CRUD)
     */
    public function update(EventRequest $request, $id): JsonResponse
    {
        $event = Event::find($id);

        if (! $event) {
            return response()->json([
                'success' => false,
                'message' => 'Event tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validated();

        // Handle foto upload jika ada file baru diunggah
        if ($request->hasFile('foto')) {
            // Hapus file lama jika disimpan di storage public
            if ($event->foto && str_starts_with($event->foto, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $event->foto);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('foto')->store('events', 'public');
            $validated['foto'] = '/storage/' . $path;
        } elseif (empty($validated['foto'])) {
            // Pertahankan foto yang sudah ada
            unset($validated['foto']);
        }

        // Normalisasi jenis_event jika ada dalam request
        if (isset($validated['jenis_event'])) {
            $validated['jenis_event'] = strcasecmp($validated['jenis_event'], 'Non-Event') === 0 ? 'Non-Event' : 'Event';
        }

        $event->update($validated);
        $event->load('venue');

        return response()->json([
            'success' => true,
            'message' => 'Data event berhasil diperbarui.',
            'data' => $this->formatEvent($event, true),
        ]);
    }

    /**
     * Hapus event (Admin CRUD)
     */
    public function destroy($id): JsonResponse
    {
        $event = Event::find($id);

        if (! $event) {
            return response()->json([
                'success' => false,
                'message' => 'Event tidak ditemukan.',
            ], 404);
        }

        // Hapus file foto dari storage jika tersimpan secara lokal
        if ($event->foto && str_starts_with($event->foto, '/storage/')) {
            $oldPath = str_replace('/storage/', '', $event->foto);
            Storage::disk('public')->delete($oldPath);
        }

        $namaEvent = $event->nama_event;
        $event->delete();

        return response()->json([
            'success' => true,
            'message' => "Event '{$namaEvent}' berhasil dihapus dari sistem.",
        ]);
    }

    /**
     * Helper pemformat data event
     */
    private function formatEvent(Event $event, bool $isDetail = false, ?Player $currentPlayer = null): array
    {
        // Penentuan venue
        $venueName = 'Mahjong Lounge Senopati';
        $venueId = $event->venue_id ?: 2;
        if ($event->venue) {
            $venueName = $event->venue->nama_venue;
            $venueId = $event->venue->id;
        } elseif ($event->venue_id == 1) {
            $venueName = 'Alicia Bakery Sedayu City';
        } elseif ($event->venue_id == 3) {
            $venueName = 'Green Bamboo Club PIK';
        } elseif (stripos($event->deskripsi ?? '', 'PIK') !== false || stripos($event->nama_event, 'PIK') !== false) {
            $venueName = 'Green Bamboo Club PIK';
            $venueId = 3;
        } elseif (stripos($event->deskripsi ?? '', 'Sedayu') !== false) {
            $venueName = 'Alicia Bakery Sedayu City';
            $venueId = 1;
        }

        // Penentuan foto
        $image = $event->foto;
        if (empty($image)) {
            $imageMap = [
                1 => '/assets/event_1.jpg',
                2 => '/assets/event_2.jpg',
                3 => '/assets/event_3.jpg',
            ];
            $image = $imageMap[$event->id] ?? '/landing/event-clash.jpg';
        }

        // Kategori & Badge
        $category = 'Turnamen Resmi';
        $badgeClass = 'db-event-badge-dark';
        if (stripos($event->nama_event, 'Casual') !== false || stripos($event->nama_event, 'Dimsum') !== false) {
            $category = 'Sesi Santai';
            $badgeClass = 'db-event-badge-mint';
        } elseif (stripos($event->nama_event, 'Bootcamp') !== false || stripos($event->nama_event, 'Workshop') !== false) {
            $category = 'Workshop & Taktik';
            $badgeClass = 'db-event-badge-gold';
        }

        $biaya = $event->biaya;
        if (empty($biaya)) {
            $biaya = (stripos($event->nama_event, 'Casual') !== false || stripos($event->nama_event, 'Dimsum') !== false) 
                ? 'Rp 95.000 /kursi' 
                : 'Rp 150.000 /kursi';
        }

        // Hitung kuota dinamis & sisa kursi
        $maxCapacity = 16;
        if (preg_match('/(\d+)/', (string)($event->kuota ?? ''), $matches)) {
            $maxCapacity = (int)$matches[1];
        }

        $pendaftaransCount = $event->relationLoaded('pendaftarans')
            ? $event->pendaftarans->where('status_pendaftaran', '!=', 'batal')->count()
            : $event->pendaftarans()->where('status_pendaftaran', '!=', 'batal')->count();

        $sisaSeats = max(0, $maxCapacity - $pendaftaransCount);
        $kuotaLabel = $sisaSeats > 0 
            ? "Sisa {$sisaSeats} Kursi (Kapasitas {$maxCapacity})"
            : "Kuota Penuh ({$maxCapacity}/{$maxCapacity})";

        // Cek status pendaftaran player login
        $isRegistered = false;
        $myRegistrationStatus = null;
        if ($currentPlayer) {
            $reg = $event->relationLoaded('pendaftarans')
                ? $event->pendaftarans->firstWhere('player_id', $currentPlayer->id)
                : $event->pendaftarans()->where('player_id', $currentPlayer->id)->first();

            if ($reg && $reg->status_pendaftaran !== 'batal') {
                $isRegistered = true;
                $myRegistrationStatus = $reg->status_pendaftaran;
            }
        }

        return [
            'id' => $event->id,
            'nama_event' => $event->nama_event,
            'jenis_event' => $event->jenis_event ?? 'Event',
            'deskripsi' => $event->deskripsi,
            'tanggal_event' => $event->tanggal_event ? $event->tanggal_event->format('Y-m-d') : null,
            'tanggal_formatted' => $event->tanggal_event ? $event->tanggal_event->translatedFormat('l, d F Y') : null,
            'waktu_mulai' => substr($event->waktu_mulai ?? '', 0, 5),
            'waktu_selesai' => substr($event->waktu_selesai ?? '', 0, 5),
            'waktu_formatted' => substr($event->waktu_mulai ?? '', 0, 5) . ' - ' . substr($event->waktu_selesai ?? '', 0, 5) . ' WIB',
            'status' => $event->status,
            'status_label' => ucfirst($event->status),
            'venue' => $venueName,
            'venue_id' => $venueId,
            'biaya' => $biaya,
            'kuota' => $kuotaLabel,
            'max_kuota' => $maxCapacity,
            'sisa_kuota' => $sisaSeats,
            'pendaftarans_count' => $pendaftaransCount,
            'is_registered' => $isRegistered,
            'registration_status' => $myRegistrationStatus,
            'kategori' => $category,
            'badge_class' => $badgeClass,
            'foto' => $image,
            'standar_aturan' => 'World Riichi Championship (WRC)',
            'kapasitas_meja' => '4 Pemain per Meja (Amos Rexx III)',
        ];
    }
}
