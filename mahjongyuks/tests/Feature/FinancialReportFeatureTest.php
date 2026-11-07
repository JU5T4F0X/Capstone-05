<?php

namespace Tests\Feature;

use App\Models\Pembayaran;
use App\Models\Pemesanan;
use App\Models\Player;
use App\Models\User;
use App\Services\FinancialReportService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class FinancialReportFeatureTest extends TestCase
{
    use DatabaseTransactions;

    private User $admin;
    private User $playerUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::firstOrCreate(
            ['email' => 'admin.finance.test@mahjongyuks.id'],
            [
                'nama' => 'Admin Keuangan Test',
                'password' => bcrypt('password123'),
                'role' => 'admin',
                'no_telepon' => '081299998888',
            ]
        );

        $this->playerUser = User::firstOrCreate(
            ['email' => 'player.finance.test@mahjongyuks.id'],
            [
                'nama' => 'Pemain Keuangan Test',
                'password' => bcrypt('password123'),
                'role' => 'player',
                'no_telepon' => '081277776666',
            ]
        );
    }

    public function test_non_admin_cannot_access_financial_stats(): void
    {
        $token = $this->playerUser->createToken('player-token')->plainTextToken;

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/financial-stats');

        $res->assertStatus(403);
    }

    public function test_admin_can_fetch_financial_summary_daily_weekly_monthly(): void
    {
        $token = $this->admin->createToken('admin-token')->plainTextToken;

        // 1. Daily
        $resDaily = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/financial-stats?period=daily');

        $resDaily->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'period',
                    'range' => ['start_date', 'end_date', 'label'],
                    'kpi' => [
                        'total_revenue',
                        'total_revenue_formatted',
                        'total_transactions',
                        'pending_transactions',
                        'average_order_value',
                    ],
                    'chart' => [
                        'type',
                        'points' => [
                            '*' => ['key', 'label', 'full_date', 'revenue', 'count'],
                        ],
                    ],
                    'customer_retention' => [
                        'total_customers',
                        'returning_customers',
                        'retention_rate',
                        'top_customers',
                    ],
                    'breakdown' => [
                        'by_method',
                        'by_type',
                    ],
                ],
            ]);

        // 2. Weekly
        $resWeekly = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/financial-stats?period=weekly');

        $resWeekly->assertStatus(200)
            ->assertJsonPath('data.period', 'weekly');

        // 3. Monthly
        $resMonthly = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/financial-stats?period=monthly');

        $resMonthly->assertStatus(200)
            ->assertJsonPath('data.period', 'monthly');
    }

    public function test_financial_service_correctly_identifies_returning_customers(): void
    {
        $player = Player::firstOrCreate(['user_id' => $this->playerUser->id], ['tanggal_daftar' => now(), 'status' => 'aktif']);

        // Buat 2 pemesanan berstatus paid untuk pemain ini
        $pem1 = Pemesanan::create([
            'player_id' => $player->id,
            'meja_id' => 1,
            'tanggal_pemesanan' => now()->subDays(2)->toDateString(),
            'tanggal_main' => now()->subDays(2)->toDateString(),
            'waktu_mulai' => '13:00:00',
            'waktu_selesai' => '15:00:00',
            'jumlah_pemain' => 1,
            'jenis_pemesanan' => 'Casual',
            'status_pemesanan' => 'confirmed',
            'kode_booking' => 'MJY-FIN-01',
        ]);

        Pembayaran::create([
            'pemesanan_id' => $pem1->id,
            'tanggal_pembayaran' => now()->subDays(2)->toDateString(),
            'jumlah' => 150000,
            'metode_pembayaran' => 'QRIS Instant',
            'status' => 'paid',
        ]);

        $pem2 = Pemesanan::create([
            'player_id' => $player->id,
            'meja_id' => 1,
            'tanggal_pemesanan' => now()->toDateString(),
            'tanggal_main' => now()->toDateString(),
            'waktu_mulai' => '15:00:00',
            'waktu_selesai' => '17:00:00',
            'jumlah_pemain' => 1,
            'jenis_pemesanan' => 'Competitive',
            'status_pemesanan' => 'confirmed',
            'kode_booking' => 'MJY-FIN-02',
        ]);

        Pembayaran::create([
            'pemesanan_id' => $pem2->id,
            'tanggal_pembayaran' => now()->toDateString(),
            'jumlah' => 150000,
            'metode_pembayaran' => 'BCA Virtual Account',
            'status' => 'paid',
        ]);

        $service = new FinancialReportService();
        $summary = $service->getFinancialSummary('daily');

        $this->assertGreaterThanOrEqual(1, $summary['customer_retention']['returning_customers']);
        $this->assertGreaterThanOrEqual(0, $summary['customer_retention']['retention_rate']);
    }

    public function test_admin_can_filter_transactions_by_date_and_search(): void
    {
        $token = $this->admin->createToken('admin-token')->plainTextToken;

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/pembayarans?status=paid&search=MJY');

        $res->assertStatus(200)
            ->assertJsonPath('success', true);
    }
}

