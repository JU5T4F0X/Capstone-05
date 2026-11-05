<?php

namespace Tests\Feature;

use App\Models\GameRound;
use App\Models\GameTable;
use App\Models\Player;
use App\Models\SesiBermain;
use App\Models\TablePlayer;
use App\Models\User;
use App\Models\WinRecord;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class HkScoringFeatureTest extends TestCase
{
    use DatabaseTransactions;

    private User $adminUser;
    private SesiBermain $session;
    private GameTable $table;
    private array $players;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Setup Admin User
        $this->adminUser = User::create([
            'nama' => 'Admin Referee',
            'email' => 'wasit@mahjongyuks.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
            'no_telepon' => '081234567890',
        ]);

        // 2. Setup Active Sesi Bermain (Playable today until 23:59)
        $this->session = SesiBermain::create([
            'nama_sesi' => 'Sesi HK Competitive Test',
            'tanggal_permainan' => Carbon::today()->toDateString(),
            'waktu_mulai' => '09:00:00',
            'waktu_selesai' => '23:59:00',
            'status' => 'ongoing',
        ]);

        // 3. Setup Game Table
        $this->table = GameTable::create([
            'sesi_id' => $this->session->id,
            'nomor_meja' => 'Meja 1',
            'status' => 'aktif',
        ]);

        // 4. Setup 4 Players on Table
        $this->players = [];
        for ($i = 1; $i <= 4; $i++) {
            $user = User::create([
                'nama' => "Atlet $i",
                'email' => "atlet$i@mahjongyuks.com",
                'password' => bcrypt('password123'),
                'role' => 'player',
                'no_telepon' => "0812000000$i",
            ]);

            $player = Player::create([
                'user_id' => $user->id,
                'tingkat_kemahiran' => 'intermediate',
                'tanggal_daftar' => now(),
                'status' => 'aktif',
            ]);

            $this->players[$i] = $player;

            TablePlayer::create([
                'game_table_id' => $this->table->id,
                'player_id' => $player->id,
                'seat_wind' => ['east', 'south', 'west', 'north'][$i - 1],
            ]);
        }
    }

    public function test_config_endpoint_returns_hk_rules(): void
    {
        $response = $this->getJson('/api/hk/config');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.min_fan', 3)
            ->assertJsonPath('data.max_fan_limit', 10)
            ->assertJsonPath('data.points_table.3.discard', 3)
            ->assertJsonPath('data.points_table.3.self_draw_total', 3);
    }

    public function test_referee_can_fetch_sessions_and_tables(): void
    {
        $resSession = $this->getJson('/api/hk/sessions');
        $resSession->assertStatus(200)
            ->assertJsonPath('success', true);

        $resTables = $this->getJson("/api/hk/sessions/{$this->session->id}/tables");
        $resTables->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nomor_meja', 'Meja 1')
            ->assertJsonPath('data.0.current_round.round_number', 1);
    }

    public function test_record_win_advances_round_and_awards_points(): void
    {
        $winner = $this->players[1];
        $discarder = $this->players[2];

        // All Sequences (1) + Dragon Triplet (1) + Round/Seat Wind (1) = 3 Fan
        // Discard win for 3 Fan = 3 pts
        $payload = [
            'sesi_id' => $this->session->id,
            'game_table_id' => $this->table->id,
            'winner_id' => $winner->id,
            'win_method' => 'discard',
            'discarder_id' => $discarder->id,
            'hand_codes' => ['all_sequences', 'dragon_triplet', 'round_seat_wind'],
            'idempotency_key' => 'idemp-test-round-1',
        ];

        $response = $this->actingAs($this->adminUser)->postJson('/api/hk/record-win', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.fan', 3)
            ->assertJsonPath('data.points_awarded', 3)
            ->assertJsonPath('data.round_number', 1);

        // Check DB
        $this->assertDatabaseHas('win_records', [
            'game_table_id' => $this->table->id,
            'winner_id' => $winner->id,
            'points_awarded' => 3,
            'active_flag' => 1,
        ]);

        // Next round should be automatically 2
        $resTables = $this->getJson("/api/hk/sessions/{$this->session->id}/tables");
        $resTables->assertJsonPath('data.0.current_round.round_number', 2);
    }

    public function test_idempotency_prevents_duplicate_points(): void
    {
        $winner = $this->players[1];
        $discarder = $this->players[2];

        $payload = [
            'sesi_id' => $this->session->id,
            'game_table_id' => $this->table->id,
            'winner_id' => $winner->id,
            'win_method' => 'discard',
            'discarder_id' => $discarder->id,
            'hand_codes' => ['all_triplets'], // 3 Fan
            'idempotency_key' => 'idemp-duplicate-test',
        ];

        // First call
        $res1 = $this->actingAs($this->adminUser)->postJson('/api/hk/record-win', $payload);
        $res1->assertStatus(201);

        // Second call with same key
        $res2 = $this->actingAs($this->adminUser)->postJson('/api/hk/record-win', $payload);
        $res2->assertStatus(200)
            ->assertJsonPath('message', 'Kemenangan sudah tercatat sebelumnya (Idempotent).');

        // Only 1 record should exist in DB
        $this->assertEquals(1, WinRecord::where('idempotency_key', 'idemp-duplicate-test')->count());
    }

    public function test_cannot_record_win_with_less_than_minimum_3_fan(): void
    {
        $winner = $this->players[1];
        $discarder = $this->players[2];

        // Only All Sequences (1 Fan) - chicken hand / under min 3 fan
        $payload = [
            'sesi_id' => $this->session->id,
            'game_table_id' => $this->table->id,
            'winner_id' => $winner->id,
            'win_method' => 'discard',
            'discarder_id' => $discarder->id,
            'hand_codes' => ['all_sequences'],
            'idempotency_key' => 'idemp-low-fan',
        ];

        $response = $this->actingAs($this->adminUser)->postJson('/api/hk/record-win', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Total 1 Fan belum memenuhi syarat minimum 3 Fan untuk menang (Hu).');
    }

    public function test_cannot_record_win_if_winner_is_discarder(): void
    {
        $winner = $this->players[1];

        $payload = [
            'sesi_id' => $this->session->id,
            'game_table_id' => $this->table->id,
            'winner_id' => $winner->id,
            'win_method' => 'discard',
            'discarder_id' => $winner->id, // Invalid: same player!
            'hand_codes' => ['all_triplets'],
            'idempotency_key' => 'idemp-same-player',
        ];

        $response = $this->actingAs($this->adminUser)->postJson('/api/hk/record-win', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Pemain yang membuang tile tidak boleh sama dengan pemenang.');
    }

    public function test_cannot_record_win_when_session_is_expired_or_closed(): void
    {
        // Set session status to closed
        $this->session->update(['status' => 'closed']);

        $winner = $this->players[1];
        $discarder = $this->players[2];

        $payload = [
            'sesi_id' => $this->session->id,
            'game_table_id' => $this->table->id,
            'winner_id' => $winner->id,
            'win_method' => 'discard',
            'discarder_id' => $discarder->id,
            'hand_codes' => ['all_triplets'],
            'idempotency_key' => 'idemp-expired-session',
        ];

        $response = $this->actingAs($this->adminUser)->postJson('/api/hk/record-win', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Sesi telah selesai atau ditutup. Input kemenangan baru tidak dapat diterima.');
    }

    public function test_void_win_removes_points_from_leaderboard(): void
    {
        $winner = $this->players[1];

        // 1. Self-draw Full Flush (7 + 1 = 8 Fan => 8 pts)
        $payload = [
            'sesi_id' => $this->session->id,
            'game_table_id' => $this->table->id,
            'winner_id' => $winner->id,
            'win_method' => 'self_draw',
            'discarder_id' => null,
            'hand_codes' => ['full_flush'],
            'idempotency_key' => 'idemp-void-test',
        ];

        $resWin = $this->actingAs($this->adminUser)->postJson('/api/hk/record-win', $payload);
        $resWin->assertStatus(201);
        $recordId = $resWin->json('data.id');

        // Leaderboard should have 8 points
        $resLead = $this->getJson('/api/leaderboard');
        $playerRow = collect($resLead->json('data'))->firstWhere('player_id', $winner->id);
        $this->assertEquals(8, $playerRow['points']);

        // 2. Void the win
        $resVoid = $this->actingAs($this->adminUser)->postJson("/api/hk/win-records/{$recordId}/void", [
            'reason' => 'Salah input kombinasi kartu oleh wasit',
        ]);
        $resVoid->assertStatus(200)
            ->assertJsonPath('success', true);

        // Leaderboard should immediately reflect 0 points for this win
        $resLeadAfter = $this->getJson('/api/leaderboard');
        $playerRowAfter = collect($resLeadAfter->json('data'))->firstWhere('player_id', $winner->id);
        $this->assertEquals(0, $playerRowAfter['points']);
    }

    public function test_leaderboard_aggregates_hk_scores_dynamically(): void
    {
        $winner = $this->players[3];

        // Record a 13 Orphans limit hand (10 Fan => 10 pts)
        $payload = [
            'sesi_id' => $this->session->id,
            'game_table_id' => $this->table->id,
            'winner_id' => $winner->id,
            'win_method' => 'self_draw',
            'discarder_id' => null,
            'hand_codes' => ['thirteen_orphans'],
            'idempotency_key' => 'idemp-thirteen-orphans',
        ];

        $this->actingAs($this->adminUser)->postJson('/api/hk/record-win', $payload)->assertStatus(201);

        $resLead = $this->getJson('/api/leaderboard');
        $resLead->assertStatus(200);

        $playerRow = collect($resLead->json('data'))->firstWhere('player_id', $winner->id);
        $this->assertEquals(10, $playerRow['points']);
        $this->assertEquals('Adept', $playerRow['rankTitle']);
        $this->assertEquals('2-Dan', $playerRow['danRank']);
        $this->assertEquals(1, $playerRow['rank']);
    }
}
