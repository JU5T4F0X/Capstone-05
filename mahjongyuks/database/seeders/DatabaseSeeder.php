<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Meja;
use App\Models\Player;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Admin Operator (Sedayu City Ops)
        $adminUser = User::updateOrCreate(
            ['email' => 'adm-jkt-042@mahjongyuks.id'],
            [
                'nama' => 'Staf Operasional Sedayu',
                'password' => Hash::make('password123'),
                'no_telepon' => '081987654321',
                'role' => 'admin',
            ]
        );

        // General admin backup
        User::updateOrCreate(
            ['email' => 'admin@mahjongyuks.id'],
            [
                'nama' => 'Administrator Utama',
                'password' => Hash::make('password123'),
                'no_telepon' => '08111222333',
                'role' => 'admin',
            ]
        );

        // Operator OP-049 (Sesuai Figma Desktop Widescreen)
        User::updateOrCreate(
            ['email' => 'op-049@mahjongyuks.id'],
            [
                'nama' => 'Operator Sedayu (OP-049)',
                'password' => Hash::make('password123'),
                'no_telepon' => '081987654322',
                'role' => 'admin',
            ]
        );

        // 2. Pemain Utama (Kevin Sanjaya - Sesuai Figma Dashboard)
        $playerUser = User::updateOrCreate(
            ['email' => 'kevin.sanjaya@mahjongyuks.id'],
            [
                'nama' => 'Kevin Sanjaya',
                'password' => Hash::make('password123'),
                'no_telepon' => '081234567890',
                'role' => 'player',
            ]
        );

        Player::updateOrCreate(
            ['user_id' => $playerUser->id],
            [
                'tanggal_daftar' => now()->subMonths(6),
                'status' => 'active',
            ]
        );

        // Pemain Lainnya (Leaderboard: Budi, Amanda, Rendy, Felicia)
        $athletes = [
            ['nama' => 'Budi Pratama', 'email' => 'budi.pratama@mahjongyuks.id'],
            ['nama' => 'Amanda Wijaya', 'email' => 'amanda.wijaya@mahjongyuks.id'],
            ['nama' => 'Rendy Tanaka', 'email' => 'rendy.tanaka@mahjongyuks.id'],
            ['nama' => 'Felicia Zhang', 'email' => 'felicia.zhang@mahjongyuks.id'],
        ];

        foreach ($athletes as $athlete) {
            $u = User::updateOrCreate(
                ['email' => $athlete['email']],
                [
                    'nama' => $athlete['nama'],
                    'password' => Hash::make('password123'),
                    'no_telepon' => '0812' . rand(10000000, 99999999),
                    'role' => 'player',
                ]
            );

            Player::updateOrCreate(
                ['user_id' => $u->id],
                [
                    'tanggal_daftar' => now()->subMonths( rand(1, 12) ),
                    'status' => 'active',
                ]
            );
        }

        // 3. Venues (Sesuai Figma)
        $venueSedayu = Venue::updateOrCreate(
            ['nama_venue' => 'Alicia Bakery Sedayu City'],
            [
                'alamat' => 'Sedayu City Kelapa Gading, Jakarta Utara',
                'deskripsi' => 'Homebase resmi & hub penyelenggaraan event luar ruang Mahjongyuks.',
                'status' => 'active',
            ]
        );

        $venueSenopati = Venue::updateOrCreate(
            ['nama_venue' => 'Mahjong Lounge Senopati'],
            [
                'alamat' => 'Jl. Senopati No. 42, Jakarta Selatan',
                'deskripsi' => 'Official Partner Parlor. Full AC, 12 meja otomatis, dan VIP Room.',
                'status' => 'active',
            ]
        );

        $venuePik = Venue::updateOrCreate(
            ['nama_venue' => 'Green Bamboo Club PIK'],
            [
                'alamat' => 'Ruko Crown Golf Boulevard, PIK, Jakarta Utara',
                'deskripsi' => 'Arena terbuka santai dengan 16 meja standar/mat dan dimsum bar.',
                'status' => 'active',
            ]
        );

        // 4. Mejas (Kapasitas maks 4 pemain)
        for ($i = 1; $i <= 12; $i++) {
            Meja::updateOrCreate(
                [
                    'venue_id' => $venueSenopati->id,
                    'nomor_meja' => sprintf('Meja %02d (Senopati)', $i),
                ],
                [
                    'kapasitas' => 4,
                    'status' => 'tersedia',
                ]
            );
        }

        for ($i = 1; $i <= 16; $i++) {
            Meja::updateOrCreate(
                [
                    'venue_id' => $venuePik->id,
                    'nomor_meja' => sprintf('Meja %02d (PIK)', $i),
                ],
                [
                    'kapasitas' => 4,
                    'status' => 'tersedia',
                ]
            );
        }

        // 5. Events (Sesuai Figma)
        Event::updateOrCreate(
            ['nama_event' => 'Grand Riichi Jakarta Open 2025'],
            [
                'deskripsi' => 'Babak turnamen resmi bergengsi tingkat nasional di Mahjong Lounge Senopati.',
                'tanggal_event' => now()->toDateString(),
                'waktu_mulai' => '19:00:00',
                'waktu_selesai' => '22:30:00',
                'status' => 'active',
            ]
        );

        Event::updateOrCreate(
            ['nama_event' => 'Jakarta Riichi Masters Autumn 2025'],
            [
                'deskripsi' => 'Turnamen berbobot 4 Hanchan dengan kalkulasi Uma/Oka resmi. Wasit terlisensi.',
                'tanggal_event' => now()->addDays(2)->toDateString(),
                'waktu_mulai' => '14:00:00',
                'waktu_selesai' => '18:00:00',
                'status' => 'active',
            ]
        );

        Event::updateOrCreate(
            ['nama_event' => 'Friday Night Casual Mahjong & Dimsum'],
            [
                'deskripsi' => 'Sesi santai tanpa tekanan rating, cocok untuk kumpul komunitas akhir pekan.',
                'tanggal_event' => now()->addDays(1)->toDateString(),
                'waktu_mulai' => '19:00:00',
                'waktu_selesai' => '22:00:00',
                'status' => 'active',
            ]
        );
    }
}
