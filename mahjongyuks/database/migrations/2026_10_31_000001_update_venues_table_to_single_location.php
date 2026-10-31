<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Mengubah struktur dan data venues menjadi data tunggal Game House Sedayu City.
     */
    public function up(): void
    {
        // 1. Tambahkan kolom pendukung informasi lokasi tunggal
        Schema::table('venues', function (Blueprint $table) {
            if (!Schema::hasColumn('venues', 'kota_kecamatan')) {
                $table->string('kota_kecamatan')->nullable()->after('alamat');
            }
            if (!Schema::hasColumn('venues', 'telepon')) {
                $table->string('telepon')->nullable()->after('kota_kecamatan');
            }
            if (!Schema::hasColumn('venues', 'email')) {
                $table->string('email')->nullable()->after('telepon');
            }
            if (!Schema::hasColumn('venues', 'jam_buka')) {
                $table->string('jam_buka')->default('07:30')->after('email');
            }
            if (!Schema::hasColumn('venues', 'jam_tutup')) {
                $table->string('jam_tutup')->default('21:30')->after('jam_buka');
            }
            if (!Schema::hasColumn('venues', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('jam_tutup');
            }
            if (!Schema::hasColumn('venues', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }
            if (!Schema::hasColumn('venues', 'maps_url')) {
                $table->text('maps_url')->nullable()->after('longitude');
            }
        });

        // 2. Data Migration: Update atau Buat record Game House sebagai Venue ID 1
        $gameHouseData = [
            'nama_venue' => 'Game House',
            'alamat' => 'Sedayu City Kelapa Gading SCBRC, Blok C No. 18, RT 03/RW 09, Kelapa Gading, Jakarta Utara',
            'kota_kecamatan' => 'Kelapa Gading, Jakarta Utara',
            'deskripsi' => 'Salon Riichi Mahjong resmi MahjongYuks di Game House Sedayu City Kelapa Gading. Pusat seluruh kegiatan bermain, pembinaan atlet, turnamen sirkuit resmi, dan pelayanan kepada pengunjung.',
            'status' => 'active',
            'jam_buka' => '07:30',
            'jam_tutup' => '21:30',
            'telepon' => null, // Jangan mengarang nomor telepon
            'email' => null,
            'latitude' => null, // Sesuai instruksi: kosongkan jika belum ada koordinat pasti
            'longitude' => null,
            'maps_url' => 'https://maps.google.com/?q=Sedayu+City+Kelapa+Gading+SCBRC+Blok+C+No+18',
            'foto' => '/assets/mahjong_parlor_players.jpg',
            'fasilitas' => 'Meja Otomatis Amos Rexx III, Ruangan Ber-AC Sistem Filtrasi HEPA, Standar Regulasi Turnamen WRC, Area Parkir Luas & Keamanan 24 Jam, Kafe & Refreshment Bar, Wi-Fi Berkecepatan Tinggi',
            'updated_at' => now(),
        ];

        $venue1Exists = DB::table('venues')->where('id', 1)->exists();
        if ($venue1Exists) {
            DB::table('venues')->where('id', 1)->update($gameHouseData);
        } else {
            $gameHouseData['id'] = 1;
            $gameHouseData['created_at'] = now();
            DB::table('venues')->insert($gameHouseData);
        }

        // 3. Pindahkan semua relasi foreign key di tabel mejas dan events ke Venue ID 1
        // Ini menjamin integritas data tetap utuh tanpa merusak relasi pemesanan
        if (Schema::hasTable('events') && Schema::hasColumn('events', 'venue_id')) {
            DB::table('events')->where('venue_id', '!=', 1)->orWhereNull('venue_id')->update(['venue_id' => 1]);
        }

        if (Schema::hasTable('mejas') && Schema::hasColumn('mejas', 'venue_id')) {
            DB::table('mejas')->where('venue_id', '!=', 1)->orWhereNull('venue_id')->update(['venue_id' => 1]);
            
            // Rapikan nomor meja agar seragam menggunakan identitas Game House
            $mejas = DB::table('mejas')->orderBy('id', 'asc')->get();
            $index = 1;
            foreach ($mejas as $m) {
                DB::table('mejas')->where('id', $m->id)->update([
                    'nomor_meja' => sprintf('Meja %02d (Game House)', $index++),
                ]);
            }
        }

        // 4. Hapus / bersihkan record venue dummy lainnya (ID > 1: Senopati, PIK, dll)
        // Aman karena semua child (events dan mejas) sudah dialihkan ke Venue ID 1
        DB::table('venues')->where('id', '>', 1)->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('venues', function (Blueprint $table) {
            $columns = [
                'kota_kecamatan',
                'telepon',
                'email',
                'jam_buka',
                'jam_tutup',
                'latitude',
                'longitude',
                'maps_url'
            ];
            foreach ($columns as $column) {
                if (Schema::hasColumn('venues', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

