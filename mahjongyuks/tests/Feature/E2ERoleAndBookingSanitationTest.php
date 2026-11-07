<?php

namespace Tests\Feature;

use App\Models\Meja;
use App\Models\Player;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class E2ERoleAndBookingSanitationTest extends TestCase
{
    private User $adminUser;
    private User $playerUser;
    private Venue $testVenue;
    private Meja $testMeja;

    protected function setUp(): void
    {
        parent::setUp();

        // Cari atau buat admin user
        $this->adminUser = User::firstOrCreate(
            ['email' => 'admin.test@mahjongyuks.id'],
            [
                'nama' => 'Admin Test RBAC',
                'password' => bcrypt('password123'),
                'role' => 'admin',
                'no_telepon' => '08199999901',
            ]
        );

        // Cari atau buat player user
        $this->playerUser = User::firstOrCreate(
            ['email' => 'player.test@mahjongyuks.id'],
            [
                'nama' => 'Player Test RBAC',
                'password' => bcrypt('password123'),
                'role' => 'player',
                'no_telepon' => '08199999902',
            ]
        );

        Player::firstOrCreate(
            ['user_id' => $this->playerUser->id],
            ['tanggal_daftar' => now(), 'status' => 'active', 'tingkat_kemahiran' => 'intermediate']
        );

        // Cari atau buat venue & meja uji coba
        $this->testVenue = Venue::firstOrCreate(
            ['nama_venue' => 'Venue Uji Coba RBAC'],
            [
                'alamat' => 'Jl. Uji Coba No. 1, Jakarta',
                'deskripsi' => 'Venue testing automatisasi sistem',
                'status' => 'aktif',
            ]
        );

        $this->testMeja = Meja::firstOrCreate(
            ['venue_id' => $this->testVenue->id, 'nomor_meja' => 'Meja Test 01'],
            [
                'kapasitas' => 4,
                'status' => 'tersedia',
            ]
        );
    }

    /**
     * Test: Akun Administrator DITOLAK saat mencoba memesan kursi meja pemain.
     */
    public function test_admin_cannot_book_player_seat(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/pemesanans', [
                'meja_id' => $this->testMeja->id,
                'tanggal_main' => now()->addDays(2)->format('Y-m-d'),
                'waktu_mulai' => '14:00',
                'durasi_jam' => 2,
                'jenis_pemesanan' => 'Casual',
                'kursi_pilihan' => 'ton',
            ]);

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
        ]);
    }

    /**
     * Test: Akun Pemain DITOLAK saat mencoba membuat atau mengubah Event & Venue.
     */
    public function test_player_cannot_create_or_modify_events_and_venues(): void
    {
        // 1. Pemain mencoba membuat event baru
        $responseEvent = $this->actingAs($this->playerUser, 'sanctum')
            ->postJson('/api/events', [
                'nama_event' => 'Illegal Player Event',
                'deskripsi' => 'Event yang dibuat pemain tanpa hak akses',
                'tanggal_event' => now()->addDays(5)->format('Y-m-d'),
                'waktu_mulai' => '10:00',
                'waktu_selesai' => '14:00',
                'venue_id' => $this->testVenue->id,
                'status' => 'active',
            ]);

        $responseEvent->assertStatus(403);

        // 2. Pemain mencoba membuat venue baru
        $responseVenue = $this->actingAs($this->playerUser, 'sanctum')
            ->postJson('/api/venues', [
                'nama_venue' => 'Illegal Player Venue',
                'alamat' => 'Alamat ilegal',
                'deskripsi' => 'Deskripsi ilegal',
                'status' => 'aktif',
            ]);

        $responseVenue->assertStatus(403);
    }

    /**
     * Test: Akun Pemain DITOLAK saat mencoba menginput skor atau wasit desk.
     */
    public function test_player_cannot_record_win_or_void_scores(): void
    {
        $response = $this->actingAs($this->playerUser, 'sanctum')
            ->postJson('/api/hk/record-win', [
                'sesi_id' => 1,
                'game_table_id' => 1,
                'winner_id' => 1,
                'win_method' => 'self_draw',
                'hand_codes' => ['all_chows'],
                'idempotency_key' => 'test-illegal-win-' . uniqid(),
            ]);

        $response->assertStatus(403);
    }

    /**
     * Test: Validasi FormRequest ketat saat input data tidak lengkap.
     */
    public function test_form_request_validations(): void
    {
        // Pendaftaran akun tanpa email dan password
        $resReg = $this->postJson('/api/auth/register', [
            'nama' => 'User Incomplete',
        ]);
        $resReg->assertStatus(422);
        $resReg->assertJsonValidationErrors(['email', 'password']);

        // Pemesanan meja tanpa memilih kursi mata angin
        $resBook = $this->actingAs($this->playerUser, 'sanctum')
            ->postJson('/api/pemesanans', [
                'meja_id' => $this->testMeja->id,
                'tanggal_main' => now()->addDays(3)->format('Y-m-d'),
                'waktu_mulai' => '15:00',
                'durasi_jam' => 3,
                'jenis_pemesanan' => 'Competitive',
            ]);
        $resBook->assertStatus(422);
        $resBook->assertJsonValidationErrors(['kursi_pilihan']);
    }
}

