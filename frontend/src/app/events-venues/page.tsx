'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Layers,
  Building2
} from 'lucide-react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import ApiClient, { ApiEvent, ApiVenue } from '@/lib/api';
import { FEATURED_EVENTS, VENUE_BRANCHES } from '@/lib/mock-data';
import './events-venues.css';

// Fallback mappings when backend is offline or loading
const fallbackEvents: ApiEvent[] = FEATURED_EVENTS.map((fe, idx) => ({
  id: idx + 1,
  nama_event: fe.title,
  deskripsi: fe.description,
  tanggal_event: '2025-10-25',
  tanggal_formatted: fe.dateTime.split('•')[0]?.trim() || 'Sabtu, 25 Okt 2025',
  waktu_mulai: fe.dateTime.split('•')[1]?.trim() || '13:00 WIB',
  waktu_selesai: '18:30',
  waktu_formatted: fe.dateTime.split('•')[1]?.trim() || '13:00 - 18:30 WIB',
  status: 'active',
  status_label: 'Pendaftaran Dibuka',
  venue: fe.venue,
  kategori: fe.categoryLabel,
  badge_class: fe.category === 'kompetitif' ? 'ev-badge-competitive' : fe.category === 'santai' ? 'ev-badge-casual' : 'ev-badge-workshop',
  foto: fe.image,
  standar_aturan: 'World Riichi Championship (WRC)',
  kapasitas_meja: 'Amos Rexx III (Maks. 4 Pemain)',
}));

const fallbackVenues: ApiVenue[] = VENUE_BRANCHES.map((vb, idx) => ({
  id: idx + 1,
  nama_venue: vb.name,
  alamat: vb.address,
  deskripsi: vb.description,
  status: 'active',
  foto: vb.image,
  jumlah_meja: vb.tableCount,
  rating: 4.9,
  jam_buka: vb.hours,
  fasilitas: vb.features,
  tipe_meja: vb.tableType,
}));

function EventsVenuesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active tab: 'events' or 'venues'
  const initialTab = searchParams.get('tab') === 'venues' ? 'venues' : 'events';
  const [activeTab, setActiveTab] = useState<'events' | 'venues'>(initialTab);

  // Data states
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [venues, setVenues] = useState<ApiVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  // Synchronize state when query param tab changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'venues' || tabParam === 'events') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'events' | 'venues') => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    router.replace(`/events-venues?${params.toString()}`);
  };

  // Fetch events & venues from Laravel API
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, venuesRes] = await Promise.all([
        ApiClient.getEvents(),
        ApiClient.getVenues(),
      ]);

      if (eventsRes.success && eventsRes.data && eventsRes.data.length > 0) {
        setEvents(eventsRes.data);
      } else {
        setEvents(fallbackEvents);
      }

      if (venuesRes.success && venuesRes.data && venuesRes.data.length > 0) {
        setVenues(venuesRes.data);
      } else {
        setVenues(fallbackVenues);
      }
    } catch (err: any) {
      // In case of error, fall back gracefully to local data
      setEvents(fallbackEvents);
      setVenues(fallbackVenues);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesSearch =
        searchQuery === '' ||
        ev.nama_event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.venue && ev.venue.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        categoryFilter === 'all' ||
        (ev.kategori && ev.kategori.toLowerCase().includes(categoryFilter.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' || ev.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [events, searchQuery, categoryFilter, statusFilter]);

  // Filtered Venues
  const filteredVenues = useMemo(() => {
    return venues.filter((vn) => {
      const matchesSearch =
        searchQuery === '' ||
        vn.nama_venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vn.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vn.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity =
        cityFilter === 'all' ||
        vn.alamat.toLowerCase().includes(cityFilter.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || vn.status === statusFilter;

      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [venues, searchQuery, cityFilter, statusFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setCityFilter('all');
  };

  return (
    <div className="ev-page-wrapper">
      {/* Universal Sticky Header */}
      <LandingNavbar activeItem="events-venues" />

      {/* Hero Header Section */}
      <section className="ev-hero-section">
        <div className="ev-container">
          <nav aria-label="Breadcrumb" className="ev-breadcrumbs">
            <Link href="/">Beranda</Link>
            <span className="separator">/</span>
            <span className="current">
              {activeTab === 'events' ? 'Turnamen & Event Mahjong' : 'Lokasi & Venue'}
            </span>
          </nav>

          <h1 className="ev-hero-title">
            {activeTab === 'events'
              ? 'Turnamen & Sesi Event Mahjong'
              : 'Lokasi & Venue Resmi MahjongYuks'}
          </h1>
          <p className="ev-hero-subtitle">
            {activeTab === 'events'
              ? 'Ikuti turnamen resmi bersertifikasi WRC, gathering komunitas akhir pekan, dan workshop taktis bersama atlet profesional.'
              : 'Kunjungi Game House MahjongYuks berstandar internasional dengan fasilitas meja otomatis Amos Rexx III.'}
          </p>
        </div>
      </section>

      {/* Tab Switcher */}
      <div className="ev-tabs-container">
        <div className="ev-container">
          <div className="ev-tabs-inner" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'events'}
              className={`ev-tab-btn ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => handleTabChange('events')}
            >
              <Sparkles size={16} />
              <span>Turnamen &amp; Event</span>
              <span className="ev-tab-count">{events.length}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'venues'}
              className={`ev-tab-btn ${activeTab === 'venues' ? 'active' : ''}`}
              onClick={() => handleTabChange('venues')}
            >
              <Building2 size={16} />
              <span>Lokasi &amp; Venue</span>
              <span className="ev-tab-count">{venues.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="ev-container" style={{ flex: 1 }}>
        {/* Controls: Search & Filters */}
        <div className="ev-controls-bar">
          <div className="ev-search-input-group">
            <Search size={18} className="ev-search-icon" />
            <input
              type="text"
              placeholder={
                activeTab === 'events'
                  ? 'Cari nama turnamen, topik workshop, atau venue...'
                  : 'Cari nama venue, lokasi distrik, atau alamat...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ev-search-input"
            />
          </div>

          <div className="ev-filter-group">
            {activeTab === 'events' ? (
              <>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="ev-filter-select"
                  aria-label="Filter Kategori"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="kompetitif">Turnamen Resmi (WRC)</option>
                  <option value="santai">Sesi Santai &amp; Gathering</option>
                  <option value="workshop">Workshop &amp; Kelas Pemula</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="ev-filter-select"
                  aria-label="Filter Status"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Pendaftaran Dibuka</option>
                  <option value="finished">Selesai</option>
                </select>
              </>
            ) : (
              <>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="ev-filter-select"
                  aria-label="Filter Kota"
                >
                  <option value="all">Semua Wilayah</option>
                  <option value="senopati">Jakarta Selatan (Senopati)</option>
                  <option value="pik">Jakarta Utara (PIK 2)</option>
                  <option value="sedayu">Jakarta Timur (Sedayu City)</option>
                  <option value="bandung">Bandung (Dago)</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="ev-filter-select"
                  aria-label="Filter Status"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Beroperasi Normal</option>
                </select>
              </>
            )}

            {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || cityFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="ev-empty-reset-btn"
                style={{ padding: '8px 14px', fontSize: '0.8rem' }}
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="ev-grid">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="ev-skeleton ev-skeleton-card" />
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="ev-empty-box">
            <div className="ev-empty-icon">
              <RotateCcw size={28} />
            </div>
            <h3 className="ev-empty-title">Gagal Memuat Data</h3>
            <p className="ev-empty-desc">{error}</p>
            <button type="button" onClick={loadData} className="ev-empty-reset-btn">
              Coba Lagi
            </button>
          </div>
        )}

        {/* TAB 1: EVENTS CATALOG */}
        {!loading && !error && activeTab === 'events' && (
          <>
            {filteredEvents.length === 0 ? (
              <div className="ev-empty-box">
                <div className="ev-empty-icon">
                  <Calendar size={28} />
                </div>
                <h3 className="ev-empty-title">Tidak Ada Event yang Sesuai</h3>
                <p className="ev-empty-desc">
                  Tidak ditemukan event yang sesuai dengan kata kunci atau filter yang Anda pilih. Silakan atur ulang pencarian Anda.
                </p>
                <button type="button" onClick={handleResetFilters} className="ev-empty-reset-btn">
                  Atur Ulang Filter
                </button>
              </div>
            ) : (
              <div className="ev-grid">
                {filteredEvents.map((event) => {
                  const badgeClass =
                    event.kategori?.toLowerCase().includes('resmi') || event.kategori?.toLowerCase().includes('kompetitif')
                      ? 'ev-badge-competitive'
                      : event.kategori?.toLowerCase().includes('santai')
                      ? 'ev-badge-casual'
                      : 'ev-badge-workshop';

                  return (
                    <article key={event.id} className="ev-card">
                      <div className="ev-card-image-wrap">
                        <Image
                          src={event.foto || '/landing/event-clash.jpg'}
                          alt={event.nama_event}
                          fill
                          sizes="(max-width: 768px) 100vw, 420px"
                          className="ev-card-image"
                        />
                        <span className={`ev-badge-category ${badgeClass}`}>
                          {event.kategori || 'Turnamen Resmi'}
                        </span>
                        <span className={`ev-badge-status ${event.status === 'active' ? 'active' : ''}`}>
                          {event.status === 'active' ? 'Dibuka' : 'Selesai'}
                        </span>
                      </div>

                      <div className="ev-card-body">
                        <h2 className="ev-card-title">{event.nama_event}</h2>
                        <p className="ev-card-desc">{event.deskripsi}</p>

                        <div className="ev-meta-list">
                          <div className="ev-meta-item">
                            <Calendar size={15} />
                            <span>{event.tanggal_formatted || event.tanggal_event || 'Sabtu, 25 Okt 2025'}</span>
                          </div>
                          <div className="ev-meta-item">
                            <Clock size={15} />
                            <span>{event.waktu_formatted || `${event.waktu_mulai} - ${event.waktu_selesai} WIB`}</span>
                          </div>
                          <div className="ev-meta-item">
                            <MapPin size={15} />
                            <span>{event.venue || 'Mahjong Lounge Senopati'}</span>
                          </div>
                          <div className="ev-meta-item">
                            <ShieldCheck size={15} />
                            <span>{event.standar_aturan || 'Regulasi Standar WRC'}</span>
                          </div>
                        </div>

                        <div className="ev-card-footer">
                          <div className="ev-price-wrap">
                            <span className="ev-price-label">Biaya Pendaftaran</span>
                            <span className="ev-price-amount">
                              {event.kategori?.toLowerCase().includes('santai') ? 'Rp 95.000' : 'Rp 150.000'}
                              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6B7280' }}> /kursi</span>
                            </span>
                          </div>

                          <Link href={`/events/${event.id}`} className="ev-btn-detail">
                            <span>Detail</span>
                            <ArrowRight size={15} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TAB 2: VENUES CATALOG */}
        {!loading && !error && activeTab === 'venues' && (
          <>
            {filteredVenues.length === 0 ? (
              <div className="ev-empty-box">
                <div className="ev-empty-icon">
                  <Building2 size={28} />
                </div>
                <h3 className="ev-empty-title">Tidak Ada Venue yang Sesuai</h3>
                <p className="ev-empty-desc">
                  Tidak ditemukan venue yang sesuai dengan filter wilayah atau kata kunci pencarian Anda.
                </p>
                <button type="button" onClick={handleResetFilters} className="ev-empty-reset-btn">
                  Atur Ulang Filter
                </button>
              </div>
            ) : (
              <div className="ev-grid">
                {filteredVenues.map((venue) => (
                  <article key={venue.id} className="ev-card">
                    <div className="ev-card-image-wrap">
                      <Image
                        src={venue.foto || '/landing/hero-parlor.jpg'}
                        alt={venue.nama_venue}
                        fill
                        sizes="(max-width: 768px) 100vw, 420px"
                        className="ev-card-image"
                      />
                      <span className="ev-venue-rating">
                        <Star size={13} fill="#E2BC55" color="#E2BC55" />
                        <span>{venue.rating || 4.9}</span>
                      </span>
                      <span className="ev-badge-status active">
                        Buka Hari Ini
                      </span>
                    </div>

                    <div className="ev-card-body">
                      <h2 className="ev-card-title">{venue.nama_venue}</h2>
                      <p className="ev-card-desc">{venue.deskripsi}</p>

                      <div className="ev-venue-tags">
                        {(venue.fasilitas || ['Meja Otomatis', 'Full AC', 'WiFi']).slice(0, 3).map((f, i) => (
                          <span key={i} className="ev-venue-tag">
                            ✓ {f}
                          </span>
                        ))}
                      </div>

                      <div className="ev-meta-list">
                        <div className="ev-meta-item">
                          <MapPin size={15} />
                          <span style={{ fontSize: '0.825rem' }}>{venue.alamat}</span>
                        </div>
                        <div className="ev-meta-item">
                          <Clock size={15} />
                          <span>{venue.jam_buka || '11:00 - 23:00 WIB (Setiap Hari)'}</span>
                        </div>
                        <div className="ev-meta-item">
                          <Layers size={15} />
                          <span>{venue.jumlah_meja ? `${venue.jumlah_meja} Meja Aktif (${venue.tipe_meja || 'Amos Rexx III'})` : 'Meja Otomatis Amos Rexx III'}</span>
                        </div>
                      </div>

                      <div className="ev-card-footer">
                        <div className="ev-price-wrap">
                          <span className="ev-price-label">Tarif Sesi Mulai</span>
                          <span className="ev-price-amount">
                            Rp 95.000
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6B7280' }}> /kursi</span>
                          </span>
                        </div>

                        <Link href={`/venues/${venue.id}`} className="ev-btn-detail">
                          <span>Detail Venue</span>
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
}

export default function EventsVenuesPage() {
  return (
    <Suspense
      fallback={
        <div className="ev-page-wrapper">
          <LandingNavbar activeItem="events-venues" />
          <div className="ev-container" style={{ padding: '60px 24px' }}>
            <div className="ev-skeleton" style={{ height: '300px', borderRadius: '14px' }} />
          </div>
        </div>
      }
    >
      <EventsVenuesContent />
    </Suspense>
  );
}

