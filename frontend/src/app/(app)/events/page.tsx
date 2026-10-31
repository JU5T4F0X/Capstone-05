'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  AlertTriangle,
  Users,
  CheckCircle,
  Tag,
  Home,
  Trophy
} from 'lucide-react';
import ApiClient, { ApiEvent } from '@/lib/api';
import '@/app/events-venues/events-venues.css';

// ── Helper: Format Tanggal Indonesia ──
function formatIndonesianDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

// ── Helper: Format Biaya Pendaftaran ──
function formatEventPrice(biaya: string | null | undefined): string {
  if (!biaya) return 'Gratis';
  const clean = biaya.trim().toLowerCase();
  if (clean === '0' || clean === 'rp 0' || clean === 'gratis' || clean === 'free') {
    return 'Gratis';
  }
  return biaya;
}

// ── Helper: Evaluasi Status Nyata Event ──
export type EventComputedType = 'active' | 'upcoming' | 'full' | 'selesai' | 'cancelled';

interface ComputedStatus {
  type: EventComputedType;
  label: string;
  badgeClass: string;
  dotColor: string;
}

function computeEventStatus(event: ApiEvent): ComputedStatus {
  if (event.status === 'cancelled') {
    return {
      type: 'cancelled',
      label: '● Dibatalkan',
      badgeClass: 'ev-badge-status cancelled',
      dotColor: '#DC2626',
    };
  }

  const isPast = event.tanggal_event
    ? new Date(event.tanggal_event).setHours(23, 59, 59, 999) < Date.now()
    : false;

  if (event.status === 'selesai' || isPast) {
    return {
      type: 'selesai',
      label: '● Selesai',
      badgeClass: 'ev-badge-status selesai',
      dotColor: '#9CA3AF',
    };
  }

  const max = event.max_kuota || 16;
  const filled = event.pendaftarans_count || 0;
  const sisa = event.sisa_kuota !== undefined ? event.sisa_kuota : Math.max(0, max - filled);

  if (sisa <= 0) {
    return {
      type: 'full',
      label: '● Kuota Penuh',
      badgeClass: 'ev-badge-status full',
      dotColor: '#EF4444',
    };
  }

  if (event.status === 'upcoming') {
    return {
      type: 'upcoming',
      label: '● Segera Dibuka',
      badgeClass: 'ev-badge-status upcoming',
      dotColor: '#F59E0B',
    };
  }

  return {
    type: 'active',
    label: '● Pendaftaran Dibuka',
    badgeClass: 'ev-badge-status active',
    dotColor: '#16A34A',
  };
}

function EventsListContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL query params
  const initialQ = searchParams?.get('q') || '';
  const initialCategory = searchParams?.get('category') || 'all';
  const initialStatus = searchParams?.get('status') || 'all';
  const initialSort = searchParams?.get('sort') || 'nearest';

  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [sortOption, setSortOption] = useState(initialSort);

  // Debounce search query 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync state to URL Query Params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (sortOption !== 'nearest') params.set('sort', sortOption);

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    window.history.replaceState(null, '', newUrl);
  }, [debouncedSearch, categoryFilter, statusFilter, sortOption, pathname]);

  // Load Events from Laravel backend
  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getEvents();
      if (res.success && Array.isArray(res.data)) {
        setEvents(res.data);
      } else {
        setEvents([]);
      }
    } catch {
      setError('Gagal terhubung ke database. Silakan periksa koneksi dan coba lagi.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Compute Available Categories from Real Data
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((ev) => {
      if (ev.kategori) set.add(ev.kategori);
    });
    return Array.from(set);
  }, [events]);

  // Compute Hero Summary Metrics from Real Data
  const heroSummary = useMemo(() => {
    if (events.length === 0) return null;

    let activeCount = 0;
    let tournamentCount = 0;
    let nearestDate: string | null = null;
    let nearestName: string | null = null;

    const now = Date.now();
    let minDiff = Infinity;

    events.forEach((ev) => {
      const status = computeEventStatus(ev);
      if (status.type === 'active') activeCount++;

      const isTournament =
        (ev.kategori && ev.kategori.toLowerCase().includes('resmi')) ||
        (ev.kategori && ev.kategori.toLowerCase().includes('turnamen')) ||
        ev.nama_event.toLowerCase().includes('open') ||
        ev.nama_event.toLowerCase().includes('master') ||
        ev.nama_event.toLowerCase().includes('championship');

      if (isTournament) tournamentCount++;

      if (ev.tanggal_event) {
        const eventTime = new Date(ev.tanggal_event).getTime();
        const diff = eventTime - now;
        if (diff >= -86400000 && diff < minDiff) {
          minDiff = diff;
          nearestDate = formatIndonesianDate(ev.tanggal_event);
          nearestName = ev.nama_event;
        }
      }
    });

    return {
      activeCount,
      tournamentCount,
      nearestDate: nearestDate || 'Segera Diumumkan',
      nearestName: nearestName || '',
    };
  }, [events]);

  // Filter & Sort Logic
  const filteredEvents = useMemo(() => {
    const filtered = events.filter((ev) => {
      // Search by title, venue, or description
      const searchTarget = `${ev.nama_event} ${ev.venue || ''} ${ev.deskripsi || ''}`.toLowerCase();
      const matchSearch =
        debouncedSearch === '' || searchTarget.includes(debouncedSearch.toLowerCase().trim());

      // Category filter
      const matchCategory =
        categoryFilter === 'all' ||
        (ev.kategori && ev.kategori.toLowerCase() === categoryFilter.toLowerCase());

      // Status filter
      const compStatus = computeEventStatus(ev);
      let matchStatus = true;
      if (statusFilter === 'active') {
        matchStatus = compStatus.type === 'active';
      } else if (statusFilter === 'upcoming') {
        matchStatus = compStatus.type === 'upcoming';
      } else if (statusFilter === 'selesai') {
        matchStatus = compStatus.type === 'selesai';
      }

      return matchSearch && matchCategory && matchStatus;
    });

    // Sort order
    return filtered.sort((a, b) => {
      const statusA = computeEventStatus(a);
      const statusB = computeEventStatus(b);

      // Default logic: active/upcoming come first, selesai/cancelled at bottom
      const rankStatus = (st: EventComputedType) => {
        if (st === 'active') return 1;
        if (st === 'upcoming') return 2;
        if (st === 'full') return 3;
        if (st === 'selesai') return 4;
        return 5;
      };

      if (sortOption === 'price_asc') {
        const getPrice = (biayaStr?: string | null) => {
          if (!biayaStr) return 0;
          const match = biayaStr.replace(/\D/g, '');
          return match ? parseInt(match, 10) : 0;
        };
        return getPrice(a.biaya) - getPrice(b.biaya);
      }

      if (sortOption === 'newest') {
        return Number(b.id) - Number(a.id);
      }

      // Default: 'nearest' date with active priority
      const statusRankDiff = rankStatus(statusA.type) - rankStatus(statusB.type);
      if (statusRankDiff !== 0) return statusRankDiff;

      const dateA = a.tanggal_event ? new Date(a.tanggal_event).getTime() : 0;
      const dateB = b.tanggal_event ? new Date(b.tanggal_event).getTime() : 0;
      return dateA - dateB;
    });
  }, [events, debouncedSearch, categoryFilter, statusFilter, sortOption]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setSortOption('nearest');
  };

  const isDatabaseEmpty = !loading && !error && events.length === 0;

  return (
    <div className="ev-page-wrapper">
      {/* ── 1. HERO SECTION ── */}
      <section className="ev-hero-section" style={{ padding: '36px 0 32px 0' }}>
        <div className="ev-container">
          {/* Breadcrumb — Glassmorphic Navigation Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(226, 188, 85, 0.35)',
                borderRadius: '9999px',
                padding: '6px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Link
                href="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#E2BC55',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'opacity 0.2s',
                }}
                title="Kembali ke Dashboard Utama"
              >
                <Home size={13} color="#E2BC55" />
                <span>Dashboard</span>
              </Link>
              <ChevronRight size={13} color="rgba(255, 255, 255, 0.4)" />
              <span style={{ color: '#FAF8F5', fontSize: '12px', fontWeight: 600 }}>
                Daftar Event &amp; Turnamen
              </span>
            </div>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(24, 78, 48, 0.65)',
                border: '1px solid rgba(82, 183, 136, 0.35)',
                color: '#86EFAC',
                fontSize: '11px',
                fontWeight: 700,
                padding: '5px 11px',
                borderRadius: '6px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={11} color="#E2BC55" />
              <span>Sirkuit WRC 2026</span>
            </span>
          </div>

          {/* Hero Content with Explicit Inline Flexbox Layout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '28px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 480px', maxWidth: '640px' }}>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#FAF8F5',
                  margin: '0 0 10px 0',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                }}
              >
                Turnamen &amp; Event Riichi Mahjong
              </h1>
              <p
                style={{
                  fontSize: '13.5px',
                  color: '#C5D2CB',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Jelajahi turnamen resmi berstandar World Riichi Championship (WRC), sesi santai komunitas, dan workshop taktis bersama atlet nasional.
              </p>
            </div>

            {/* Sisi Kanan Hero: 3 Kartu Metrik Eksklusif */}
            {heroSummary && !isDatabaseEmpty && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Kartu 1: Pendaftaran Dibuka */}
                <div
                  style={{
                    backgroundColor: 'rgba(10, 26, 17, 0.75)',
                    border: '1px solid rgba(226, 188, 85, 0.35)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    minWidth: '130px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#E2BC55', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Pendaftaran Dibuka
                    </span>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }} />
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#FAF8F5', lineHeight: 1.1 }}>
                    {heroSummary.activeCount} <span style={{ fontSize: '12px', fontWeight: 600, color: '#8DA79B' }}>Sesi</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#A3C2B3', marginTop: '4px' }}>
                    Registrasi Aktif
                  </div>
                </div>

                {/* Kartu 2: Turnamen Resmi */}
                <div
                  style={{
                    backgroundColor: 'rgba(10, 26, 17, 0.75)',
                    border: '1px solid rgba(226, 188, 85, 0.35)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    minWidth: '130px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#E2BC55', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Turnamen Resmi
                    </span>
                    <Trophy size={14} color="#E2BC55" />
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#FAF8F5', lineHeight: 1.1 }}>
                    {heroSummary.tournamentCount} <span style={{ fontSize: '12px', fontWeight: 600, color: '#8DA79B' }}>Event</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#A3C2B3', marginTop: '4px' }}>
                    Standar WRC
                  </div>
                </div>

                {/* Kartu 3: Event Terdekat */}
                <div
                  style={{
                    backgroundColor: 'rgba(10, 26, 17, 0.75)',
                    border: '1px solid rgba(226, 188, 85, 0.35)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    minWidth: '150px',
                    maxWidth: '220px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#E2BC55', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Event Terdekat
                    </span>
                    <Calendar size={14} color="#E2BC55" />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#FAF8F5', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {heroSummary.nearestDate}
                  </div>
                  <div style={{ fontSize: '11px', color: '#A3C2B3', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={heroSummary.nearestName}>
                    {heroSummary.nearestName || 'Sesi Komunitas'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. MAIN CONTENT ── */}
      <main className="ev-container" style={{ flex: 1, padding: '24px 0 64px 0' }}>
        {/* Loading Skeleton */}
        {loading && (
          <div style={{ marginTop: '24px' }}>
            <div className="ev-grid">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E5E7EB',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    paddingBottom: '20px',
                  }}
                >
                  <div className="ev-skeleton-animated" style={{ width: '100%', aspectRatio: '16 / 10' }} />
                  <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="ev-skeleton-animated" style={{ height: '22px', width: '75%', borderRadius: '6px' }} />
                    <div className="ev-skeleton-animated" style={{ height: '14px', width: '100%', borderRadius: '4px' }} />
                    <div className="ev-skeleton-animated" style={{ height: '14px', width: '60%', borderRadius: '4px' }} />
                    <div className="ev-skeleton-animated" style={{ height: '36px', width: '100%', borderRadius: '8px', marginTop: '10px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Fetch State */}
        {!loading && error && (
          <div className="ev-empty-box" style={{ marginTop: '32px' }}>
            <div style={{ color: '#DC2626', marginBottom: '12px' }}>
              <AlertTriangle size={36} />
            </div>
            <h3 className="ev-empty-title">Gagal Memuat Data Event</h3>
            <p className="ev-empty-desc">{error}</p>
            <button type="button" onClick={loadEvents} className="ev-empty-reset-btn">
              <RotateCcw size={15} />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        {/* Empty State: Database Kosong (Admin belum menambahkan event sama sekali) */}
        {isDatabaseEmpty && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E4E0D8',
              borderRadius: '16px',
              padding: '64px 24px',
              textAlign: 'center',
              marginTop: '36px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
              maxWidth: '640px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#EBF6EE',
                color: '#004F27',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Calendar size={32} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111E18', margin: '0 0 10px 0' }}>
              Belum Ada Event Tersedia
            </h2>
            <p style={{ fontSize: '13.5px', color: '#5A675E', lineHeight: 1.6, margin: '0 0 24px 0', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
              Event dan turnamen akan tampil di sini setelah dijadwalkan oleh admin. Silakan cek kembali nanti.
            </p>
            <button
              type="button"
              onClick={loadEvents}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#183629',
                color: '#FAF8F5',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} />
              <span>Muat Ulang Data</span>
            </button>
          </div>
        )}

        {/* Jika Event Tersedia di Database: Render Filter Bar dan Grid Kartu */}
        {!loading && !error && events.length > 0 && (
          <>
            {/* ── 3. FILTER & SEARCH CONTROLS BAR ── */}
            <div className="ev-controls-bar">
              <div className="ev-search-input-group">
                <Search size={18} className="ev-search-icon" />
                <input
                  type="text"
                  placeholder="Cari judul event, turnamen, atau lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ev-search-input"
                  aria-label="Pencarian Event"
                />
              </div>

              <div className="ev-filter-group">
                {/* Filter Kategori (Dari Data Riil) */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="ev-filter-select"
                  aria-label="Filter Kategori"
                >
                  <option value="all">Semua Kategori</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Filter Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="ev-filter-select"
                  aria-label="Filter Status"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Pendaftaran Dibuka</option>
                  <option value="upcoming">Akan Datang</option>
                  <option value="selesai">Selesai</option>
                </select>

                {/* Dropdown Opsi Urutkan */}
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="ev-filter-select"
                  aria-label="Urutkan Event"
                >
                  <option value="nearest">Urutkan: Terdekat (Tanggal)</option>
                  <option value="newest">Urutkan: Terbaru Dibuat</option>
                  <option value="price_asc">Urutkan: Biaya Terendah</option>
                </select>

                {/* Tombol Reset Filter */}
                {(debouncedSearch || categoryFilter !== 'all' || statusFilter !== 'all' || sortOption !== 'nearest') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="ev-empty-reset-btn"
                    style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                    title="Atur ulang seluruh filter"
                  >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Teks Hasil Counter */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', padding: '0 4px' }}>
              <span style={{ fontSize: '13px', color: '#5A675E', fontWeight: 600 }}>
                Menampilkan <strong style={{ color: '#183629' }}>{filteredEvents.length}</strong> dari {events.length} event
              </span>
            </div>

            {/* State: Hasil Filter Kosong */}
            {filteredEvents.length === 0 ? (
              <div className="ev-empty-box">
                <div className="ev-empty-icon">
                  <Search size={28} />
                </div>
                <h3 className="ev-empty-title">Event Tidak Ditemukan</h3>
                <p className="ev-empty-desc">
                  Tidak ditemukan event yang cocok dengan kriteria kata kunci atau filter yang Anda pilih.
                </p>
                <button type="button" onClick={handleResetFilters} className="ev-empty-reset-btn">
                  <RotateCcw size={14} />
                  <span>Atur Ulang Filter</span>
                </button>
              </div>
            ) : (
              /* ── 4. EVENT CARDS GRID (3 Kolom Desktop, 2 Tablet, 1 Mobile) ── */
              <div className="ev-grid">
                {filteredEvents.map((event) => {
                  const status = computeEventStatus(event);
                  const isRegistered = Boolean(event.is_registered);

                  // Kuota calculations
                  const maxQuota = event.max_kuota || 16;
                  const filledQuota = event.pendaftarans_count || 0;
                  const sisaQuota = event.sisa_kuota !== undefined ? event.sisa_kuota : Math.max(0, maxQuota - filledQuota);
                  const percentFilled = Math.min(100, Math.round((filledQuota / maxQuota) * 100));

                  // Kategori class
                  const isCompetitive =
                    event.kategori?.toLowerCase().includes('resmi') ||
                    event.kategori?.toLowerCase().includes('kompetitif');
                  const isCasual = event.kategori?.toLowerCase().includes('santai');
                  const badgeCategoryClass = isCompetitive
                    ? 'ev-badge-competitive'
                    : isCasual
                    ? 'ev-badge-casual'
                    : 'ev-badge-workshop';

                  // Price
                  const formattedPrice = formatEventPrice(event.biaya);

                  return (
                    <article
                      key={event.id}
                      className="ev-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      {/* Poster 16:10 dengan Fallback Placeholder */}
                      <div className="ev-card-image-wrap">
                        {event.foto ? (
                          <Image
                            src={event.foto}
                            alt={event.nama_event}
                            fill
                            sizes="(max-width: 768px) 100vw, 420px"
                            className="ev-card-image"
                            onError={(e) => {
                              // If image fails, switch to fallback pattern
                              const target = e.target as HTMLElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: '#183629',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#E2BC55',
                              fontSize: '32px',
                              fontWeight: 900,
                            }}
                          >
                            🀄
                          </div>
                        )}

                        {/* Badge Kategori */}
                        <span className={`ev-badge-category ${badgeCategoryClass}`}>
                          {event.kategori || 'Turnamen Resmi'}
                        </span>

                        {/* Badge Status Dinamis */}
                        <span className={status.badgeClass}>
                          {status.label}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="ev-card-body">
                        {/* Judul (maks 2 baris) */}
                        <h2 className="ev-card-title">
                          <Link
                            href={`/events/${event.id}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            {event.nama_event}
                          </Link>
                        </h2>

                        {/* Deskripsi Singkat */}
                        <p className="ev-card-desc">{event.deskripsi}</p>

                        {/* Meta List Informasi */}
                        <div className="ev-meta-list">
                          <div className="ev-meta-item">
                            <Calendar size={15} color="#004F27" />
                            <span>
                              {event.tanggal_formatted || formatIndonesianDate(event.tanggal_event)}
                            </span>
                          </div>

                          <div className="ev-meta-item">
                            <Clock size={15} color="#004F27" />
                            <span>
                              {event.waktu_formatted || `${event.waktu_mulai || '13:00'} - ${event.waktu_selesai || '18:00'} WIB`}
                            </span>
                          </div>

                          <div className="ev-meta-item">
                            <MapPin size={15} color="#004F27" />
                            <span style={{ fontWeight: 600 }}>
                              {event.venue || 'Mahjong Lounge Senopati'}
                            </span>
                          </div>

                          {/* Kuota & Progress Bar */}
                          <div style={{ marginTop: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                              <span style={{ color: '#5A675E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Users size={13} color="#004F27" />
                                <span>Kapasitas Kursi:</span>
                              </span>
                              <strong style={{ color: sisaQuota <= 2 ? '#B91C1C' : '#004F27' }}>
                                {filledQuota} / {maxQuota} Terisi (Sisa {sisaQuota})
                              </strong>
                            </div>

                            <div className="ev-quota-track">
                              <div
                                className="ev-quota-fill"
                                style={{
                                  width: `${percentFilled}%`,
                                  backgroundColor: sisaQuota <= 2 ? '#DC2626' : '#16A34A',
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="ev-card-footer">
                          <div className="ev-price-wrap">
                            <span className="ev-price-label">Biaya Masuk</span>
                            <span className="ev-price-amount">
                              {formattedPrice}
                            </span>
                          </div>

                          {/* Tombol Aksi Sesuai Status Nyata */}
                          {isRegistered ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                backgroundColor: '#DCF1E3',
                                color: '#004F27',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                borderRadius: '8px',
                              }}
                            >
                              <CheckCircle size={14} />
                              <span>Terdaftar</span>
                            </span>
                          ) : status.type === 'active' ? (
                            <Link
                              href={`/events/${event.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="ev-btn-detail"
                              style={{ backgroundColor: '#183629', color: '#FAF8F5' }}
                            >
                              <span>Daftar Sekarang</span>
                              <ArrowRight size={14} />
                            </Link>
                          ) : status.type === 'upcoming' ? (
                            <Link
                              href={`/events/${event.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="ev-btn-detail"
                              style={{ backgroundColor: '#FAF8F5', color: '#183629', borderColor: '#D7E6DB' }}
                            >
                              <span>Lihat Detail</span>
                              <ArrowRight size={14} />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              disabled
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '8px 14px',
                                backgroundColor: '#F3F4F6',
                                color: '#9CA3AF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'not-allowed',
                              }}
                            >
                              <span>{status.label.replace('● ', '')}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="ev-page-wrapper">
          <div className="ev-container" style={{ padding: '60px 24px' }}>
            <div className="ev-skeleton-animated" style={{ height: '320px', borderRadius: '14px' }} />
          </div>
        </div>
      }
    >
      <EventsListContent />
    </Suspense>
  );
}
