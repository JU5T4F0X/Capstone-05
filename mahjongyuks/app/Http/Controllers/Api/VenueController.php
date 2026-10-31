<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\VenueRequest;
use App\Models\Event;
use App\Models\Meja;
use App\Models\Pemesanan;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class VenueController extends Controller
{
    /**
     * Ambil daftar seluruh venue beserta ringkasan meja & fasilitas
     */
    public function index(Request $request): JsonResponse
    {
        $query = Venue::withCount(['mejas', 'events']);

        // Pencarian nama, alamat, atau deskripsi
        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('nama_venue', 'like', "%{$search}%")
                  ->orWhere('alamat', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        // Filter status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $venues = $query->orderBy('id', 'asc')->get();

        $formatted = $venues->map(function ($venue) {
            return $this->formatVenue($venue);
        });

        return response()->json([
            'success' => true,
            'message' => 'Daftar venue berhasil dimuat',
            'data' => $formatted,
        ]);
    }

    /**
     * Ambil detail satu venue lengkap dengan daftar meja aktif & event terkait
     */
    public function show($id): JsonResponse
    {
        $venue = Venue::with(['mejas' => function ($query) {
            $query->orderBy('id', 'asc');
        }, 'events' => function ($query) {
            $query->orderBy('tanggal_event', 'asc');
        }])->find($id);

        if (! $venue) {
            return response()->json([
                'success' => false,
                'message' => 'Venue tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail venue berhasil dimuat',
            'data' => $this->formatVenue($venue, true),
        ]);
    }

    /**
     * Simpan venue baru (Admin CRUD)
     */
    public function store(VenueRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Handle foto upload jika diunggah via file
        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('venues', 'public');
            $validated['foto'] = '/storage/' . $path;
        } elseif (empty($validated['foto'])) {
            $validated['foto'] = '/landing/hero-parlor.jpg';
        }

        $venue = Venue::create($validated);

        // Jika ada jumlah_meja di request, sediakan meja default
        $tableCount = (int) $request->input('jumlah_meja', 4);
        if ($tableCount > 0) {
            for ($i = 1; $i <= $tableCount; $i++) {
                Meja::create([
                    'venue_id' => $venue->id,
                    'nomor_meja' => sprintf('Meja %02d (%s)', $i, explode(' ', $venue->nama_venue)[0]),
                    'kapasitas' => 4,
                    'status' => 'tersedia',
                ]);
            }
        }

        $venue->load('mejas');

        return response()->json([
            'success' => true,
            'message' => 'Venue baru berhasil didaftarkan.',
            'data' => $this->formatVenue($venue, true),
        ], 201);
    }

    /**
     * Perbarui data venue yang ada (Admin CRUD)
     */
    public function update(VenueRequest $request, $id): JsonResponse
    {
        try {
            $venue = Venue::find($id);

            if (! $venue) {
                return response()->json([
                    'success' => false,
                    'message' => 'Venue tidak ditemukan.',
                ], 404);
            }

            $validated = $request->validated();

            // Handle foto upload jika ada file baru
            if ($request->hasFile('foto')) {
                // Hapus file lama jika disimpan di storage public
                if ($venue->foto && str_starts_with($venue->foto, '/storage/')) {
                    $oldPath = str_replace('/storage/', '', $venue->foto);
                    Storage::disk('public')->delete($oldPath);
                }
                $path = $request->file('foto')->store('venues', 'public');
                $validated['foto'] = '/storage/' . $path;
            } elseif (empty($validated['foto'])) {
                unset($validated['foto']);
            }

            return DB::transaction(function () use ($venue, $validated, $request) {
                // Sinkronisasi jumlah meja jika disertakan dalam request
                if ($request->has('jumlah_meja')) {
                    $targetCount = max(0, (int) $request->input('jumlah_meja'));
                    $currentMejas = $venue->mejas()->orderBy('id', 'asc')->get();
                    $currentCount = $currentMejas->count();

                    if ($targetCount > $currentCount) {
                        // Tambah meja baru dengan nomor lanjutan
                        $needed = $targetCount - $currentCount;

                        // Deteksi format penomoran dan suffix venue dari meja yang ada
                        $venueSuffix = $venue->nama_venue;
                        $maxNum = $currentCount;
                        foreach ($currentMejas as $cm) {
                            if (preg_match('/Meja\s+(\d+)\s*\((.*?)\)/i', $cm->nomor_meja, $matches)) {
                                $num = (int) $matches[1];
                                if ($num > $maxNum) {
                                    $maxNum = $num;
                                }
                                if (!empty($matches[2])) {
                                    $venueSuffix = $matches[2];
                                }
                            } elseif (preg_match('/Meja\s+(\d+)/i', $cm->nomor_meja, $matches)) {
                                $num = (int) $matches[1];
                                if ($num > $maxNum) {
                                    $maxNum = $num;
                                }
                            }
                        }

                        for ($i = 1; $i <= $needed; $i++) {
                            $nextIndex = $maxNum + $i;
                            Meja::create([
                                'venue_id' => $venue->id,
                                'nomor_meja' => sprintf('Meja %02d (%s)', $nextIndex, $venueSuffix),
                                'kapasitas' => 4,
                                'status' => 'tersedia',
                            ]);
                        }
                    } elseif ($targetCount < $currentCount) {
                        // Kurangi meja: ambil dari meja bernomor tertinggi ke bawah
                        $toRemoveCount = $currentCount - $targetCount;
                        $candidateMejas = $venue->mejas()->orderBy('id', 'desc')->take($toRemoveCount)->get();

                        // Cek apakah meja yang akan dikurangi memiliki reservasi aktif/mendatang
                        $conflictingMejaNames = [];
                        $today = now()->toDateString();
                        foreach ($candidateMejas as $meja) {
                            $hasActiveBooking = DB::table('pemesanans')
                                ->where('meja_id', $meja->id)
                                ->whereIn('status_pemesanan', ['pending', 'confirmed'])
                                ->where('tanggal_main', '>=', $today)
                                ->exists();

                            if ($hasActiveBooking) {
                                $conflictingMejaNames[] = $meja->nomor_meja;
                            }
                        }

                        if (!empty($conflictingMejaNames)) {
                            $countConflict = count($conflictingMejaNames);
                            return response()->json([
                                'success' => false,
                                'message' => "Tidak bisa mengurangi meja karena {$countConflict} meja (" . implode(', ', $conflictingMejaNames) . ") masih punya reservasi aktif.",
                            ], 422);
                        }

                        // Hapus meja yang sudah dipastikan tidak memiliki reservasi aktif
                        foreach ($candidateMejas as $meja) {
                            $meja->delete();
                        }
                    }
                }

                $venue->update($validated);
                $venue->load(['mejas', 'events']);

                return response()->json([
                    'success' => true,
                    'message' => 'Data venue berhasil diperbarui.',
                    'data' => $this->formatVenue($venue, true),
                ]);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Error updating venue: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat memperbarui data venue. Silakan coba beberapa saat lagi.',
            ], 500);
        }
    }

    /**
     * Hapus venue dengan proteksi relasi integritas (Admin CRUD)
     */
    public function destroy($id): JsonResponse
    {
        $venue = Venue::find($id);

        if (! $venue) {
            return response()->json([
                'success' => false,
                'message' => 'Venue tidak ditemukan.',
            ], 404);
        }

        // PENTING: Proteksi relasi integritas ke Event
        $linkedEventsCount = Event::where('venue_id', $venue->id)->count();
        if ($linkedEventsCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Venue tidak dapat dihapus karena masih digunakan oleh {$linkedEventsCount} event terdaftar. Ubah lokasi event terlebih dahulu sebelum menghapus venue ini.",
            ], 422);
        }

        // Hapus file foto dari storage jika tersimpan lokal
        if ($venue->foto && str_starts_with($venue->foto, '/storage/')) {
            $oldPath = str_replace('/storage/', '', $venue->foto);
            Storage::disk('public')->delete($oldPath);
        }

        $namaVenue = $venue->nama_venue;
        
        // Hapus meja terkait
        $venue->mejas()->delete();
        $venue->delete();

        return response()->json([
            'success' => true,
            'message' => "Venue '{$namaVenue}' beserta seluruh konfigurasi mejanya berhasil dihapus.",
        ]);
    }

    /**
     * Helper pemformat data venue tunggal
     */
    private function formatVenue(Venue $venue, bool $includeMejas = false): array
    {
        $foto = $venue->foto ?: '/assets/mahjong_parlor_players.jpg';

        // Parse fasilitas dari teks dipisah koma atau baris baru
        $fasilitas = [];
        if (!empty($venue->fasilitas)) {
            $fasilitas = array_values(array_filter(array_map('trim', preg_split('/[,\n]+/', $venue->fasilitas))));
        }

        if (empty($fasilitas)) {
            $fasilitas = [
                'Meja Otomatis Amos Rexx III',
                'Ruangan Ber-AC Sistem Filtrasi HEPA',
                'Standar Regulasi Turnamen WRC',
                'Area Parkir Luas & Keamanan 24 Jam',
                'Kafe & Refreshment Bar',
                'Wi-Fi Berkecepatan Tinggi',
            ];
        }

        // Hitung meja nyata dari relasi tabel mejas (jangan input manual ganda)
        $mejaCount = $venue->mejas_count ?? $venue->mejas()->count();
        if ($mejaCount === 0) {
            $mejaCount = Meja::where('venue_id', $venue->id)->count();
        }
        $kapasitasTotal = ($mejaCount * 4) . ' Pemain (' . $mejaCount . ' Meja Otomatis)';

        // Format jam operasional
        $jamBuka = $venue->jam_buka ?: '07:30';
        $jamTutup = $venue->jam_tutup ?: '21:30';
        $jamOperasionalDisplay = sprintf('%s - %s WIB', str_replace(':', '.', substr($jamBuka, 0, 5)), str_replace(':', '.', substr($jamTutup, 0, 5)));

        $result = [
            'id' => $venue->id,
            'nama_venue' => $venue->nama_venue,
            'alamat' => $venue->alamat,
            'kota_kecamatan' => $venue->kota_kecamatan ?: 'Kelapa Gading, Jakarta Utara',
            'telepon' => $venue->telepon,
            'email' => $venue->email,
            'jam_buka' => $jamOperasionalDisplay,
            'jam_buka_raw' => substr($jamBuka, 0, 5),
            'jam_tutup_raw' => substr($jamTutup, 0, 5),
            'latitude' => $venue->latitude,
            'longitude' => $venue->longitude,
            'maps_url' => $venue->maps_url ?: ('https://maps.google.com/?q=' . urlencode($venue->alamat)),
            'deskripsi' => $venue->deskripsi,
            'status' => $venue->status,
            'foto' => $foto,
            'jumlah_meja' => $mejaCount,
            'kapasitas' => $kapasitasTotal,
            'rating' => 4.9,
            'fasilitas' => $fasilitas,
            'fasilitas_text' => is_array($fasilitas) ? implode(', ', $fasilitas) : $venue->fasilitas,
            'tipe_meja' => 'Amos Rexx III Pro',
        ];

        if ($includeMejas) {
            if ($venue->relationLoaded('mejas')) {
                $result['mejas'] = $venue->mejas->map(function ($meja) {
                    return [
                        'id' => $meja->id,
                        'nomor_meja' => $meja->nomor_meja,
                        'kapasitas' => $meja->kapasitas,
                        'status' => $meja->status,
                    ];
                });
            } else {
                $result['mejas'] = $venue->mejas()->get()->map(function ($meja) {
                    return [
                        'id' => $meja->id,
                        'nomor_meja' => $meja->nomor_meja,
                        'kapasitas' => $meja->kapasitas,
                        'status' => $meja->status,
                    ];
                });
            }

            // Temukan event yang terafiliasi dengan venue ini
            $relatedEvents = Event::where('venue_id', $venue->id)->orderBy('tanggal_event', 'asc')->get();
            $result['events'] = $relatedEvents->map(function ($ev) {
                return [
                    'id' => $ev->id,
                    'nama_event' => $ev->nama_event,
                    'tanggal_formatted' => $ev->tanggal_event ? $ev->tanggal_event->translatedFormat('d F Y') : null,
                    'waktu_formatted' => substr($ev->waktu_mulai, 0, 5) . ' - ' . substr($ev->waktu_selesai, 0, 5) . ' WIB',
                    'biaya' => $ev->biaya ?: 'Rp 150.000 /kursi',
                    'status' => $ev->status,
                ];
            });
        }

        return $result;
    }
}
