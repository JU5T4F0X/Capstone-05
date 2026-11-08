'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Repeat,
  Calendar,
  CreditCard,
  ShoppingBag,
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';

export interface FinancialPoint {
  key: string;
  label: string;
  full_date: string;
  revenue: number;
  revenue_formatted: string;
  count: number;
}

export interface TopCustomer {
  player_id: number;
  name: string;
  email: string;
  order_count: number;
  total_spent: number;
  total_spent_formatted: string;
  is_returning: boolean;
  last_order_date: string;
}

export interface FinancialStatsData {
  period: 'daily' | 'weekly' | 'monthly';
  range: {
    start_date: string | null;
    end_date: string | null;
    label: string;
  };
  kpi: {
    total_revenue: number;
    total_revenue_formatted: string;
    total_transactions: number;
    pending_transactions: number;
    failed_transactions: number;
    average_order_value: number;
    average_order_value_formatted: string;
  };
  chart: {
    type: 'daily' | 'weekly' | 'monthly';
    points: FinancialPoint[];
  };
  customer_retention: {
    total_customers: number;
    returning_customers: number;
    single_order_customers: number;
    retention_rate: number;
    retention_rate_label: string;
    top_customers: TopCustomer[];
  };
  breakdown: {
    by_method: Array<{ name: string; count: number; amount: number }>;
    by_type: Array<{ name: string; count: number; amount: number }>;
  };
}

interface FinancialAnalyticsPanelProps {
  stats: FinancialStatsData | null;
  period: 'daily' | 'weekly' | 'monthly';
  onPeriodChange: (p: 'daily' | 'weekly' | 'monthly') => void;
  loading?: boolean;
  compact?: boolean;
}

export default function FinancialAnalyticsPanel({
  stats,
  period,
  onPeriodChange,
  loading = false,
  compact = false,
}: FinancialAnalyticsPanelProps) {
  const [hoveredPoint, setHoveredPoint] = useState<FinancialPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Fallback data structure jika backend stats masih memuat
  const kpi = stats?.kpi || {
    total_revenue: 0,
    total_revenue_formatted: 'Rp 0',
    total_transactions: 0,
    pending_transactions: 0,
    failed_transactions: 0,
    average_order_value: 0,
    average_order_value_formatted: 'Rp 0',
  };

  const points = stats?.chart?.points || [];
  const retention = stats?.customer_retention || {
    total_customers: 0,
    returning_customers: 0,
    single_order_customers: 0,
    retention_rate: 0,
    retention_rate_label: '0%',
    top_customers: [],
  };

  // SVG Chart Dimensions & Headroom Calculations (Clean & Spacious)
  const chartHeight = compact ? 220 : 270;
  const chartWidth = 720;
  const paddingX = 64;
  const paddingTop = 40;
  const paddingBottom = 40;

  const maxRevenue = Math.max(1, ...points.map((p) => p.revenue));
  // Berikan buffer 35% di atas pendapatan maksimal agar batang tidak pernah menabrak langit-langit grafik
  const rawTarget = Math.max(maxRevenue * 1.35, 300000);
  const step = rawTarget > 2000000 ? 500000 : rawTarget > 800000 ? 200000 : 100000;
  const niceMaxRevenue = Math.ceil(rawTarget / step) * step;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const barWidth = Math.max(16, Math.min(34, Math.floor(innerWidth / Math.max(1, points.length * 1.6))));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* ── 1. Top Bar: Header & Period Filter Controls ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #D7E6DB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#004F27',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                backgroundColor: '#EBF6EE',
                padding: '3px 8px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <TrendingUp size={13} color="#004F27" />
              <span>Analitik Keuangan MahjongYuks</span>
            </span>
            <span style={{ fontSize: '12px', color: '#7A897F' }}>•</span>
            <span style={{ fontSize: '12px', color: '#5A675E', fontWeight: 600 }}>
              {stats?.range?.label || 'Rentang Waktu Terpilih'}
            </span>
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111E18', margin: 0 }}>
            Laporan Penjualan &amp; Retensi Pelanggan
          </h3>
        </div>

        {/* Period Selector Tabs (Harian, Mingguan, Bulanan) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#F3F4F6',
            padding: '3px',
            borderRadius: '9px',
            border: '1px solid #E5E7EB',
          }}
          role="tablist"
          aria-label="Filter Periode Keuangan"
        >
          <button
            type="button"
            role="tab"
            aria-selected={period === 'daily'}
            onClick={() => onPeriodChange('daily')}
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: period === 'daily' ? '#183629' : 'transparent',
              color: period === 'daily' ? '#FAF8F5' : '#4B5563',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Calendar size={13} />
            <span>Harian</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={period === 'weekly'}
            onClick={() => onPeriodChange('weekly')}
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: period === 'weekly' ? '#183629' : 'transparent',
              color: period === 'weekly' ? '#FAF8F5' : '#4B5563',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Calendar size={13} />
            <span>Mingguan</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={period === 'monthly'}
            onClick={() => onPeriodChange('monthly')}
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: period === 'monthly' ? '#183629' : 'transparent',
              color: period === 'monthly' ? '#FAF8F5' : '#4B5563',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Calendar size={13} />
            <span>Bulanan</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI Metrics Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
        }}
      >
        {/* KPI 1: Total Omset Penjualan */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px 18px',
            border: '1px solid #D7E6DB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Total Penjualan (Omset)
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#EBF6EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} color="#004F27" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#111E18', lineHeight: 1.15 }}>
              {kpi.total_revenue_formatted}
            </div>
            <div style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={13} />
              <span>Status Pembayaran Sah (Paid)</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Transaksi Sukses & Rata-rata */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px 18px',
            border: '1px solid #D7E6DB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Volume Transaksi
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={16} color="#1D4ED8" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#111E18', lineHeight: 1.15 }}>
              {kpi.total_transactions} <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Tiket Berhasil</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#5A675E', marginTop: '4px' }}>
              Rata-rata: <strong style={{ color: '#111E18' }}>{kpi.average_order_value_formatted}</strong> /order
            </div>
          </div>
        </div>

        {/* KPI 3: Returning Customers Rate (Pelanggan Setia) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px 18px',
            border: '1px solid #D7E6DB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Pelanggan Berulang
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Repeat size={16} color="#B45309" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#111E18', lineHeight: 1.15 }}>
              {retention.returning_customers} <span style={{ fontSize: '13px', fontWeight: 700, color: '#B45309' }}>({retention.retention_rate_label})</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#5A675E', marginTop: '4px' }}>
              Dari total {retention.total_customers} pemain unik terdaftar
            </div>
          </div>
        </div>

        {/* KPI 4: Pending / Perlu Verifikasi */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px 18px',
            border: '1px solid #D7E6DB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Perlu Tindakan
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: kpi.pending_transactions > 0 ? '#FEF2F2' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={16} color={kpi.pending_transactions > 0 ? '#DC2626' : '#6B7280'} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: kpi.pending_transactions > 0 ? '#DC2626' : '#111E18', lineHeight: 1.15 }}>
              {kpi.pending_transactions} <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Antrean</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#5A675E', marginTop: '4px' }}>
              {kpi.pending_transactions > 0 ? 'Menunggu verifikasi admin' : 'Semua transaksi terproses'}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Main Chart & Returning Customers Side-by-Side ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'minmax(0, 1.85fr) minmax(320px, 1fr)',
          gap: '24px',
          alignItems: 'stretch',
        }}
      >
        {/* Sisi Kiri: Visual Interactive Sales Chart (Responsive SVG) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '20px 22px',
            border: '1px solid #D7E6DB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111E18', margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}>
                <TrendingUp size={16} color="#004F27" />
                <span>Tren Omset Penjualan ({period === 'daily' ? 'Harian' : period === 'weekly' ? 'Mingguan' : 'Bulanan'})</span>
              </h4>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#5A675E' }}>
                Arahkan kursor pada batang grafik untuk melihat rincian omset dan jumlah transaksi.
              </p>
            </div>

            {hoveredPoint && (
              <div
                style={{
                  backgroundColor: '#183629',
                  color: '#FAF8F5',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{hoveredPoint.label}:</span>
                <span style={{ color: '#E2BC55' }}>{hoveredPoint.revenue_formatted}</span>
                <span style={{ color: '#86EFAC' }}>({hoveredPoint.count} transaksi)</span>
              </div>
            )}
          </div>

          {/* SVG Chart Container */}
          <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', minWidth: '480px', display: 'block' }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#183629" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#004F27" stopOpacity="0.75" />
                </linearGradient>
                <linearGradient id="barHoverGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E2BC55" stopOpacity="1" />
                  <stop offset="100%" stopColor="#CA8A04" stopOpacity="0.85" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = paddingTop + innerHeight * (1 - pct);
                const val = Math.round(niceMaxRevenue * pct);
                const valFormatted = val >= 1000000
                  ? `${(val / 1000000).toFixed(1)}jt`
                  : val >= 1000
                  ? `${Math.round(val / 1000)}rb`
                  : '0';

                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke={idx === 0 ? '#CBD5E1' : '#F1F5F9'}
                      strokeWidth={idx === 0 ? 1.5 : 1}
                      strokeDasharray={idx === 0 ? 'none' : '3 3'}
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94A3B8"
                      fontWeight="600"
                    >
                      {valFormatted}
                    </text>
                  </g>
                );
              })}

              {/* Bars and Data Points */}
              {points.map((pt, idx) => {
                const totalPoints = points.length;
                const slotWidth = innerWidth / totalPoints;
                const x = paddingX + slotWidth * idx + (slotWidth - barWidth) / 2;

                const barHeight = Math.max(4, (pt.revenue / niceMaxRevenue) * innerHeight);
                const y = paddingTop + innerHeight - barHeight;
                const isHovered = hoveredPoint?.key === pt.key;

                return (
                  <g
                    key={pt.key}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Background hover target slot */}
                    <rect
                      x={paddingX + slotWidth * idx}
                      y={paddingTop}
                      width={slotWidth}
                      height={innerHeight}
                      fill={isHovered ? 'rgba(24, 54, 41, 0.04)' : 'transparent'}
                    />

                    {/* Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={5}
                      fill={isHovered ? 'url(#barHoverGradient)' : 'url(#barGradient)'}
                      style={{ transition: 'all 0.2s ease' }}
                    />

                    {/* Value Pill Above Bar (when hovered or if active) */}
                    {isHovered && (
                      <g>
                        <rect
                          x={x + barWidth / 2 - 40}
                          y={Math.max(10, y - 22)}
                          width={80}
                          height={18}
                          rx={4}
                          fill="#183629"
                        />
                        <text
                          x={x + barWidth / 2}
                          y={Math.max(10, y - 22) + 12}
                          textAnchor="middle"
                          fill="#FAF8F5"
                          fontSize="10"
                          fontWeight="700"
                        >
                          {pt.revenue >= 1000 ? `${Math.round(pt.revenue / 1000)}rb` : pt.revenue}
                        </text>
                      </g>
                    )}

                    {/* X-Axis Label */}
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fill={isHovered ? '#111E18' : '#64748B'}
                      fontWeight={isHovered ? '800' : '600'}
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              Satuan nominal Rupiah (IDR) terverifikasi
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#5A675E' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#183629', display: 'inline-block' }} />
                <span>Omset Berhasil</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#E2BC55', display: 'inline-block' }} />
                <span>Pilihan Aktif</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sisi Kanan: Retention & Returning Customers Detail */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '20px 22px',
            border: '1px solid #D7E6DB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111E18', margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Users size={16} color="#004F27" />
                <span>Pelanggan Setia</span>
              </h4>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 7px', borderRadius: '4px' }}>
                {retention.retention_rate_label} Retensi
              </span>
            </div>

            <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#5A675E', lineHeight: 1.45 }}>
              Pemain yang telah melakukan pemesanan dan bertanding lebih dari 1 kali di MahjongYuks.
            </p>

            {/* Retention Bar Indicator */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px', fontWeight: 600 }}>
                <span style={{ color: '#004F27' }}>Setia: {retention.returning_customers}</span>
                <span style={{ color: '#64748B' }}>1x Main: {retention.single_order_customers}</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
                <div
                  style={{
                    width: `${Math.min(100, retention.retention_rate)}%`,
                    backgroundColor: '#004F27',
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Top Frequent Players List */}
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#111E18', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                Top Returning Players
              </div>

              {retention.top_customers.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>
                  Belum ada riwayat transaksi berulang.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {retention.top_customers.slice(0, 4).map((c, i) => (
                    <div
                      key={c.player_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        backgroundColor: '#F8FAF9',
                        borderRadius: '9px',
                        border: '1px solid #E8EDE9',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, marginRight: '10px' }}>
                        <span
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: i === 0 ? '#FEF3C7' : '#E2E8F0',
                            color: i === 0 ? '#B45309' : '#475569',
                            fontSize: '11px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#111E18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', marginTop: '1px' }}>
                            Terakhir: {c.last_order_date}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#004F27',
                            backgroundColor: '#EBF6EE',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            display: 'inline-block',
                            letterSpacing: '0.2px',
                          }}
                        >
                          {c.order_count}x Booking
                        </span>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#111E18', marginTop: '3px', fontVariantNumeric: 'tabular-nums' }}>
                          {c.total_spent_formatted}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              fontSize: '11.5px',
              color: '#166534',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
            }}
          >
            <Sparkles size={14} color="#166534" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              Pemain dengan booking &gt;1 kali menunjukkan loyalitas tinggi terhadap sesi meja otomatis MahjongYuks.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

