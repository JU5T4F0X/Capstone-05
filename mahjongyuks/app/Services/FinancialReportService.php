<?php

namespace App\Services;

use App\Models\Pembayaran;
use App\Models\Pemesanan;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class FinancialReportService
{
    /**
     * Ambil ringkasan analitik keuangan lengkap (KPI, time-series grafik, returning customers).
     */
    public function getFinancialSummary(string $period = 'daily', ?string $startDate = null, ?string $endDate = null): array
    {
        // 1. Tentukan rentang tanggal
        [$start, $end] = $this->resolveDateRange($period, $startDate, $endDate);

        // 2. Query transaksi dalam rentang tanggal
        $paidQuery = Pembayaran::query()
            ->with(['pemesanan.player.user'])
            ->where('status', 'paid');

        if ($start && $end) {
            $paidQuery->where(function (Builder $q) use ($start, $end) {
                $q->whereBetween('tanggal_pembayaran', [$start->toDateString(), $end->toDateString()])
                  ->orWhere(function (Builder $sub) use ($start, $end) {
                      $sub->whereNull('tanggal_pembayaran')
                          ->whereBetween('created_at', [$start->startOfDay(), $end->endOfDay()]);
                  });
            });
        }

        $paidRecords = $paidQuery->get();

        // 3. Hitung metrik KPI utama
        $totalRevenue = (float) $paidRecords->sum('jumlah');
        $totalPaidCount = $paidRecords->count();
        $averageOrderValue = $totalPaidCount > 0 ? round($totalRevenue / $totalPaidCount, 0) : 0;

        // Pending & Failed count (untuk konteks monitoring)
        $pendingCount = Pembayaran::where('status', 'pending')->count();
        $failedCount = Pembayaran::where('status', 'failed')->count();

        // 4. Susun series data untuk grafik berdasarkan periode (daily, weekly, monthly)
        $chartSeries = match ($period) {
            'weekly' => $this->buildWeeklySeries($paidRecords, $start, $end),
            'monthly' => $this->buildMonthlySeries($paidRecords, $start, $end),
            default => $this->buildDailySeries($paidRecords, $start, $end),
        };

        // 5. Analisis Returning Customer (Pelanggan Berulang)
        $customerAnalytics = $this->calculateReturningCustomers();

        // 6. Breakdown Metode Pembayaran & Tipe Sesi
        $methodBreakdown = $this->calculateMethodBreakdown($paidRecords);
        $typeBreakdown = $this->calculateTypeBreakdown($paidRecords);

        return [
            'period' => $period,
            'range' => [
                'start_date' => $start ? $start->toDateString() : null,
                'end_date' => $end ? $end->toDateString() : null,
                'label' => $this->formatRangeLabel($start, $end, $period),
            ],
            'kpi' => [
                'total_revenue' => $totalRevenue,
                'total_revenue_formatted' => 'Rp ' . number_format($totalRevenue, 0, ',', '.'),
                'total_transactions' => $totalPaidCount,
                'pending_transactions' => $pendingCount,
                'failed_transactions' => $failedCount,
                'average_order_value' => $averageOrderValue,
                'average_order_value_formatted' => 'Rp ' . number_format($averageOrderValue, 0, ',', '.'),
            ],
            'chart' => $chartSeries,
            'customer_retention' => $customerAnalytics,
            'breakdown' => [
                'by_method' => $methodBreakdown,
                'by_type' => $typeBreakdown,
            ],
        ];
    }

    /**
     * Ambil data transaksi dengan filter pencarian, status, dan tanggal.
     */
    public function getFilteredTransactions(array $filters = []): LengthAwarePaginator
    {
        $query = Pembayaran::query()
            ->with(['pemesanan.player.user', 'pemesanan.meja.venue'])
            ->latest('id');

        // Filter status
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        // Filter metode pembayaran
        if (!empty($filters['metode']) && $filters['metode'] !== 'all') {
            $query->where('metode_pembayaran', $filters['metode']);
        }

        // Filter tanggal
        if (!empty($filters['start_date'])) {
            $query->where(function (Builder $q) use ($filters) {
                $q->whereDate('tanggal_pembayaran', '>=', $filters['start_date'])
                  ->orWhere(function (Builder $sub) use ($filters) {
                      $sub->whereNull('tanggal_pembayaran')
                          ->whereDate('created_at', '>=', $filters['start_date']);
                  });
            });
        }

        if (!empty($filters['end_date'])) {
            $query->where(function (Builder $q) use ($filters) {
                $q->whereDate('tanggal_pembayaran', '<=', $filters['end_date'])
                  ->orWhere(function (Builder $sub) use ($filters) {
                      $sub->whereNull('tanggal_pembayaran')
                          ->whereDate('created_at', '<=', $filters['end_date']);
                  });
            });
        }

        // Filter pencarian: nama pemain, email, atau kode booking
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function (Builder $q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                  ->orWhere('bukti_pembayaran', 'like', "%{$search}%")
                  ->orWhereHas('pemesanan', function (Builder $pem) use ($search) {
                      $pem->where('kode_booking', 'like', "%{$search}%")
                          ->orWhereHas('player.user', function (Builder $u) use ($search) {
                              $u->where('nama', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhere('no_telepon', 'like', "%{$search}%");
                          });
                  });
            });
        }

        // Filter spesifik player
        if (!empty($filters['player_id'])) {
            $query->whereHas('pemesanan', function (Builder $q) use ($filters) {
                $q->where('player_id', $filters['player_id']);
            });
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;
        return $query->paginate(max(5, min(100, $perPage)));
    }

    /**
     * Hitung metrik Pelanggan Berulang (Returning Customers).
     */
    private function calculateReturningCustomers(): array
    {
        // Ambil semua pemesanan confirmed/paid dikelompokkan per player
        $playerOrders = Pemesanan::query()
            ->with(['player.user', 'pembayaran'])
            ->whereHas('pembayaran', function (Builder $q) {
                $q->where('status', 'paid');
            })
            ->get()
            ->groupBy('player_id');

        $totalUniqueCustomers = $playerOrders->count();
        $returningCount = 0;
        $singleCount = 0;
        $customerList = [];

        foreach ($playerOrders as $playerId => $orders) {
            $orderCount = $orders->count();
            $totalSpent = (float) $orders->sum(fn ($o) => (float) ($o->pembayaran->jumlah ?? 0));
            $latestOrder = $orders->sortByDesc('created_at')->first();

            $user = $orders->first()->player->user ?? null;
            $customerName = $user->nama ?? "Player #{$playerId}";
            $customerEmail = $user->email ?? '-';

            if ($orderCount > 1) {
                $returningCount++;
            } else {
                $singleCount++;
            }

            $customerList[] = [
                'player_id' => $playerId,
                'name' => $customerName,
                'email' => $customerEmail,
                'order_count' => $orderCount,
                'total_spent' => $totalSpent,
                'total_spent_formatted' => 'Rp ' . number_format($totalSpent, 0, ',', '.'),
                'is_returning' => $orderCount > 1,
                'last_order_date' => $latestOrder?->created_at?->translatedFormat('d M Y') ?? '-',
            ];
        }

        // Urutkan top loyal customers (paling sering booking)
        usort($customerList, fn ($a, $b) => $b['order_count'] <=> $a['order_count'] ?: $b['total_spent'] <=> $a['total_spent']);

        $retentionRate = $totalUniqueCustomers > 0
            ? round(($returningCount / $totalUniqueCustomers) * 100, 1)
            : 0;

        return [
            'total_customers' => $totalUniqueCustomers,
            'returning_customers' => $returningCount,
            'single_order_customers' => $singleCount,
            'retention_rate' => $retentionRate,
            'retention_rate_label' => "{$retentionRate}%",
            'top_customers' => array_slice($customerList, 0, 5),
        ];
    }

    /**
     * Bangun time-series harian (default: 7 - 14 hari).
     */
    private function buildDailySeries(Collection $records, ?Carbon $start, ?Carbon $end): array
    {
        $start = $start ?: now()->subDays(6)->startOfDay();
        $end = $end ?: now()->endOfDay();

        // Indeks data riil berdasarkan tanggal YYYY-MM-DD
        $grouped = [];
        foreach ($records as $r) {
            $date = Carbon::parse($r->tanggal_pembayaran ?: $r->created_at)->toDateString();
            if (!isset($grouped[$date])) {
                $grouped[$date] = ['revenue' => 0.0, 'count' => 0];
            }
            $grouped[$date]['revenue'] += (float) $r->jumlah;
            $grouped[$date]['count'] += 1;
        }

        // Buat rentang kontinyu tanpa bolong tanggal
        $current = $start->copy();
        $points = [];
        while ($current->lte($end)) {
            $dateKey = $current->toDateString();
            $data = $grouped[$dateKey] ?? ['revenue' => 0.0, 'count' => 0];

            $points[] = [
                'key' => $dateKey,
                'label' => $current->translatedFormat('d M'),
                'full_date' => $current->translatedFormat('l, d M Y'),
                'revenue' => (float) $data['revenue'],
                'revenue_formatted' => 'Rp ' . number_format($data['revenue'], 0, ',', '.'),
                'count' => (int) $data['count'],
            ];

            $current->addDay();
        }

        return [
            'type' => 'daily',
            'points' => $points,
        ];
    }

    /**
     * Bangun time-series mingguan (default: 6 - 8 minggu).
     */
    private function buildWeeklySeries(Collection $records, ?Carbon $start, ?Carbon $end): array
    {
        $start = $start ?: now()->subWeeks(5)->startOfWeek();
        $end = $end ?: now()->endOfWeek();

        $grouped = [];
        foreach ($records as $r) {
            $dt = Carbon::parse($r->tanggal_pembayaran ?: $r->created_at);
            $weekKey = $dt->year . '-W' . str_pad($dt->weekOfYear, 2, '0', STR_PAD_LEFT);
            if (!isset($grouped[$weekKey])) {
                $grouped[$weekKey] = ['revenue' => 0.0, 'count' => 0];
            }
            $grouped[$weekKey]['revenue'] += (float) $r->jumlah;
            $grouped[$weekKey]['count'] += 1;
        }

        $current = $start->copy();
        $points = [];
        while ($current->lte($end)) {
            $weekKey = $current->year . '-W' . str_pad($current->weekOfYear, 2, '0', STR_PAD_LEFT);
            $weekEnd = $current->copy()->endOfWeek();
            $data = $grouped[$weekKey] ?? ['revenue' => 0.0, 'count' => 0];

            $points[] = [
                'key' => $weekKey,
                'label' => 'Mgg ' . $current->translatedFormat('d M'),
                'full_date' => $current->translatedFormat('d M') . ' - ' . $weekEnd->translatedFormat('d M Y'),
                'revenue' => (float) $data['revenue'],
                'revenue_formatted' => 'Rp ' . number_format($data['revenue'], 0, ',', '.'),
                'count' => (int) $data['count'],
            ];

            $current->addWeek();
        }

        return [
            'type' => 'weekly',
            'points' => $points,
        ];
    }

    /**
     * Bangun time-series bulanan (default: 6 - 12 bulan).
     */
    private function buildMonthlySeries(Collection $records, ?Carbon $start, ?Carbon $end): array
    {
        $start = $start ?: now()->subMonths(5)->startOfMonth();
        $end = $end ?: now()->endOfMonth();

        $grouped = [];
        foreach ($records as $r) {
            $monthKey = Carbon::parse($r->tanggal_pembayaran ?: $r->created_at)->format('Y-m');
            if (!isset($grouped[$monthKey])) {
                $grouped[$monthKey] = ['revenue' => 0.0, 'count' => 0];
            }
            $grouped[$monthKey]['revenue'] += (float) $r->jumlah;
            $grouped[$monthKey]['count'] += 1;
        }

        $current = $start->copy();
        $points = [];
        while ($current->lte($end)) {
            $monthKey = $current->format('Y-m');
            $data = $grouped[$monthKey] ?? ['revenue' => 0.0, 'count' => 0];

            $points[] = [
                'key' => $monthKey,
                'label' => $current->translatedFormat('M Y'),
                'full_date' => $current->translatedFormat('F Y'),
                'revenue' => (float) $data['revenue'],
                'revenue_formatted' => 'Rp ' . number_format($data['revenue'], 0, ',', '.'),
                'count' => (int) $data['count'],
            ];

            $current->addMonth();
        }

        return [
            'type' => 'monthly',
            'points' => $points,
        ];
    }

    /**
     * Breakdown per metode pembayaran.
     */
    private function calculateMethodBreakdown(Collection $records): array
    {
        $breakdown = [];
        foreach ($records as $r) {
            $method = $r->metode_pembayaran ?: 'Lainnya';
            if (!isset($breakdown[$method])) {
                $breakdown[$method] = ['name' => $method, 'count' => 0, 'amount' => 0.0];
            }
            $breakdown[$method]['count'] += 1;
            $breakdown[$method]['amount'] += (float) $r->jumlah;
        }

        return array_values($breakdown);
    }

    /**
     * Breakdown per jenis pemesanan (Casual vs Competitive).
     */
    private function calculateTypeBreakdown(Collection $records): array
    {
        $breakdown = [
            'Casual' => ['name' => 'Sesi Casual', 'count' => 0, 'amount' => 0.0],
            'Competitive' => ['name' => 'Sesi Competitive', 'count' => 0, 'amount' => 0.0],
        ];

        foreach ($records as $r) {
            $type = $r->pemesanan?->jenis_pemesanan ?? 'Casual';
            if (!isset($breakdown[$type])) {
                $breakdown[$type] = ['name' => "Sesi {$type}", 'count' => 0, 'amount' => 0.0];
            }
            $breakdown[$type]['count'] += 1;
            $breakdown[$type]['amount'] += (float) $r->jumlah;
        }

        return array_values($breakdown);
    }

    /**
     * Tentukan start dan end date dari parameter.
     */
    private function resolveDateRange(string $period, ?string $startDate, ?string $endDate): array
    {
        if ($startDate && $endDate) {
            try {
                return [Carbon::parse($startDate)->startOfDay(), Carbon::parse($endDate)->endOfDay()];
            } catch (\Throwable $e) {}
        }

        return match ($period) {
            'weekly' => [now()->subWeeks(5)->startOfWeek(), now()->endOfWeek()],
            'monthly' => [now()->subMonths(5)->startOfMonth(), now()->endOfMonth()],
            default => [now()->subDays(6)->startOfDay(), now()->endOfDay()],
        };
    }

    private function formatRangeLabel(?Carbon $start, ?Carbon $end, string $period): string
    {
        if (!$start || !$end) {
            return 'Semua Waktu';
        }

        return match ($period) {
            'weekly' => $start->translatedFormat('d M Y') . ' — ' . $end->translatedFormat('d M Y') . ' (6 Minggu)',
            'monthly' => $start->translatedFormat('M Y') . ' — ' . $end->translatedFormat('M Y') . ' (6 Bulan)',
            default => $start->translatedFormat('d M Y') . ' — ' . $end->translatedFormat('d M Y') . ' (7 Hari Terakhir)',
        };
    }
}

