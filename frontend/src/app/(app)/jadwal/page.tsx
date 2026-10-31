'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Coffee,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  ChevronRight,
  Users
} from 'lucide-react';
import ApiClient, { ApiJadwalItem, ApiJadwalData } from '@/lib/api';
import '@/app/events-venues/events-venues.css';

const fallbackJadwalData: ApiJadwalData = {
  events: [
    {
      id: 'ev-1',
      event_id: 1,
      tipe: 'event',
      judul: 'Grand Riichi Jakarta Open 2025',
      deskripsi: 'Turnamen 4 Hanchan berbobot resmi sirkuit nasional dengan wasit berlisensi WRC.',
      tanggal: '2025-10-25',
      tanggal_formatted: 'Sabtu, 25 Okt 2025',
      waktu: '13:00 - 18:30 WIB',
      venue: 'Game House',
      status: 'Pendaftaran Dibuka (Sisa 4 Kursi)',
      status_code: 'active',
      biaya: 'Rp 150.000 / kursi',
      aturan: 'World Riichi Championship (WRC)',
    },
    {
      id: 'ev-2',
      event_id: 2,
      tipe: 'event',
      judul: 'Friday Night Casual Mahjong & Dimsum',
      deskripsi: 'Sesi santai akhir pekan non-kompetitif disertai hidangan dimsum hangat dan seduhan oolong.',
      tanggal: '2025-10-24',
      tanggal_formatted: 'Jumat, 24 Okt 2025',
      waktu: '19:00 - 23:00 WIB',
      venue: 'Game House',
      status: 'Pendaftaran Dibuka',
      status_code: 'active',
      biaya: 'Rp 95.000 / kursi',
      aturan: 'Casual Friendly Rules',
    },
    {
      id: 'ev-3',
      event_id: 3,
      tipe: 'event',
      judul: 'Sunday Riichi Bootcamp: Cara Membaca Discard',
      deskripsi: 'Workshop bedah taktik Suji, Kabe, dan pertahanan tingkat lanjut bersama instruktur Advance.',
      tanggal: '2025-10-26',
      tanggal_formatted: 'Minggu, 26 Okt 2025',
      waktu: '10:00 - 14:30 WIB',
      venue: 'Game House',
      status: 'Sisa 1 Meja (Kritis)',
      status_code: 'kritis',
      biaya: 'Rp 75.000 / kursi',
      aturan: 'Analisis Papan & Teori WRC',
    }
  ],
  sesi_permainan: [
    {
      id: 'sesi-gh-pagi',
      venue_id: 1,
      tipe: 'sesi_permainan',
      judul: 'Sesi Pagi (07.30 - 12.00 WIB)',
      deskripsi: 'Sesi bermain pagi hari di Game House dengan ubin otomatis Amos Rexx III dan pendingin ruangan HEPA.',
      tanggal: '2026-10-31',
      tanggal_formatted: 'Setiap Hari',
      waktu: '07:30 - 12:00 WIB',
      venue: 'Game House',
      alamat: 'Sedayu City Kelapa Gading SCBRC, Blok C No. 18, RT 03/RW 09, Kelapa Gading, Jakarta Utara',
      status: 'Tersedia 34 Meja Otomatis',
      status_code: 'tersedia',
      kapasitas: 'Maks. 4 Pemain per Meja',
      biaya: 'Rp 75.000 / kursi',
      fasilitas: 'Amos Rexx III Pro + Free Roasted Oolong'
    },
    {
      id: 'sesi-gh-siang',
      venue_id: 1,
      tipe: 'sesi_permainan',
      judul: 'Sesi Siang (12.30 - 17.00 WIB)',
      deskripsi: 'Sesi ramai komunitas dengan wasit siaga dan verifikasi skor digital resmi.',
      tanggal: '2026-10-31',
      tanggal_formatted: 'Setiap Hari',
      waktu: '12:30 - 17:00 WIB',
      venue: 'Game House',
      alamat: 'Sedayu City Kelapa Gading SCBRC, Blok C No. 18, RT 03/RW 09, Kelapa Gading, Jakarta Utara',
      status: 'Tersedia 34 Meja Otomatis',
      status_code: 'tersedia',
      kapasitas: 'Maks. 4 Pemain per Meja',
      biaya: 'Rp 95.000 / kursi',
      fasilitas: 'Amos Rexx III Pro + Scoring Screen'
    },
    {
      id: 'sesi-gh-malam',
      venue_id: 1,
      tipe: 'sesi_permainan',
      judul: 'Sesi Malam (17.30 - 21.30 WIB)',
      deskripsi: 'Sesi prime time malam hari, sparring kompetitif dan turnamen internal komunitas.',
      tanggal: '2026-10-31',
      tanggal_formatted: 'Setiap Hari',
      waktu: '17:30 - 21:30 WIB',
      venue: 'Game House',
      alamat: 'Sedayu City Kelapa Gading SCBRC, Blok C No. 18, RT 03/RW 09, Kelapa Gading, Jakarta Utara',
      status: 'Sesi Terbuka',
      status_code: 'tersedia',
      kapasitas: 'Maks. 4 Pemain per Meja',
      biaya: 'Rp 110.000 / kursi',
      fasilitas: 'Amos Rexx III Pro + Refreshment'
    }
  ]
};

function JadwalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jadwal, setJadwal] = useState<ApiJadwalData>(fallbackJadwalData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [venueFilter, setVenueFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const fetchJadwal = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await ApiClient.getJadwal({
        venue_id: venueFilter !== 'all' ? venueFilter : undefined,
      });

      if (res.success && res.data) {
        setJadwal(res.data);
      } else {
        setJadwal(fallbackJadwalData);
      }
    } catch (err: any) {
      setJadwal(fallbackJadwalData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJadwal();
  }, [venueFilter]);

  // Client-side filtering
  const filteredEvents = useMemo(() => {
    return (jadwal.events || []).filter((item) => {
      const matchVenue =
        venueFilter === 'all' ||
        item.venue?.toLowerCase().includes(venueFilter.toLowerCase());

      return matchVenue;
    });
  }, [jadwal.events, venueFilter]);

  const filteredSessions = useMemo(() => {
    return (jadwal.sesi_permainan || []).filter((item) => {
      const matchVenue =
        venueFilter === 'all' ||
        item.venue?.toLowerCase().includes(venueFilter.toLowerCase()) ||
        String(item.venue_id) === venueFilter;

      return matchVenue;
    });
  }, [jadwal.sesi_permainan, venueFilter]);

  const handleResetFilters = () => {
    setVenueFilter('all');
    setDateFilter('all');
  };

  return (
    <div className="ev-page-wrapper">
      {/* Hero Header */}
      <section className="ev-hero-section">
        <div className="ev-container">
          <nav aria-label="Breadcrumb" className="ev-breadcrumbs">
            <Link href="/">Beranda</Link>
            <span className="separator">/</span>
            <span className="current">Jadwal Pertandingan &amp; Sesi Bermain</span>
          </nav>

          <h1 className="ev-hero-title">Jadwal Pertandingan &amp; Sesi Bermain</h1>
          <p className="ev-hero-subtitle">
            Pilih dan ikuti jadwal turnamen resmi sirkuit WRC atau reservasi sesi bermain reguler harian dengan meja otomatis Amos Rexx III di Game House MahjongYuks.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="ev-container" style={{ flex: 1, padding: '32px 0 64px 0' }}>
        {/* Controls Bar */}
        <div className="ev-controls-bar" style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#183629" />
            <span style={{ fontSize: '0.925rem', fontWeight: 700, color: '#183629' }}>
              Filter Jadwal
            </span>
          </div>

          <div className="ev-filter-group">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(24, 54, 41, 0.08)',
                padding: '7px 12px',
                borderRadius: '6px',
                fontSize: '0.825rem',
                color: '#183629',
                fontWeight: 600,
              }}
            >
              <MapPin size={13} color="#183629" />
              <span>Game House (Sedayu City)</span>
            </span>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="ev-filter-select"
              aria-label="Filter Waktu"
            >
              <option value="all">Semua Waktu Sesi</option>
              <option value="today">Hari Ini (Sabtu)</option>
              <option value="tomorrow">Besok (Minggu)</option>
              <option value="weekend">Akhir Pekan Ini</option>
            </select>

            {(venueFilter !== 'all' || dateFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="ev-empty-reset-btn"
                style={{ padding: '8px 14px', fontSize: '0.8rem' }}
              >
                <RotateCcw size={14} />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="ev-skeleton" style={{ height: '110px', borderRadius: '12px' }} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="ev-empty-box">
            <h3 className="ev-empty-title">Gagal Memuat Jadwal</h3>
            <p className="ev-empty-desc">{error}</p>
            <button type="button" onClick={fetchJadwal} className="ev-empty-reset-btn">
              Coba Lagi
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── SECTION 1: JADWAL TURNAMEN & EVENT RESMI ── */}
            <section className="ev-schedule-block">
              <div className="ev-schedule-block-header">
                <h2 className="ev-schedule-block-title">
                  <Trophy size={20} color="#E2BC55" />
                  <span>Jadwal Turnamen &amp; Event Resmi</span>
                </h2>
                <span className="ev-schedule-badge">
                  {filteredEvents.length} Event Terdaftar
                </span>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="ev-empty-box" style={{ padding: '32px 20px', margin: '16px 0' }}>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
                    Tidak ada turnamen yang cocok dengan venue yang dipilih.
                  </p>
                </div>
              ) : (
                filteredEvents.map((ev) => (
                  <div key={ev.id} className="ev-schedule-item-card">
                    {/* Time block */}
                    <div className="ev-schedule-time-box">
                      <div className="ev-schedule-time-val">{ev.waktu}</div>
                      <div className="ev-schedule-date-val">{ev.tanggal_formatted || ev.tanggal}</div>
                    </div>

                    {/* Info */}
                    <div className="ev-schedule-info-col">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(24, 54, 41, 0.1)',
                            color: '#183629',
                            textTransform: 'uppercase'
                          }}
                        >
                          Turnamen WRC
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: ev.status_code === 'kritis' ? '#DC2626' : '#059669'
                          }}
                        >
                          ● {ev.status}
                        </span>
                      </div>

                      <h3 className="ev-schedule-item-title">{ev.judul}</h3>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#4B5563' }}>
                        {ev.deskripsi}
                      </p>

                      <div className="ev-schedule-item-meta">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={14} color="#183629" />
                          <span>{ev.venue}</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <ShieldCheck size={14} color="#183629" />
                          <span>{ev.aturan}</span>
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="ev-schedule-action-col">
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.725rem', color: '#6B7280', textTransform: 'uppercase' }}>
                          Biaya Kursi
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#183629' }}>
                          {ev.biaya}
                        </div>
                      </div>

                      <Link
                        href={`/events/${ev.event_id || 1}`}
                        className="ev-btn-detail"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        <span>Lihat &amp; Daftar</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* ── SECTION 2: JADWAL SESI BERMAIN REGULER ── */}
            <section className="ev-schedule-block" style={{ marginTop: '48px' }}>
              <div className="ev-schedule-block-header">
                <h2 className="ev-schedule-block-title">
                  <Coffee size={20} color="#183629" />
                  <span>Jadwal Sesi Bermain Reguler di Game House</span>
                </h2>
                <span className="ev-schedule-badge">
                  {filteredSessions.length} Sesi Aktif
                </span>
              </div>

              {filteredSessions.length === 0 ? (
                <div className="ev-empty-box" style={{ padding: '32px 20px', margin: '16px 0' }}>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
                    Tidak ada sesi bermain reguler untuk filter yang Anda tentukan.
                  </p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div key={session.id} className="ev-schedule-item-card">
                    {/* Time block */}
                    <div className="ev-schedule-time-box">
                      <div className="ev-schedule-time-val">{session.waktu}</div>
                      <div className="ev-schedule-date-val">{session.tanggal_formatted}</div>
                    </div>

                    {/* Info */}
                    <div className="ev-schedule-info-col">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#ECFDF5',
                            color: '#065F46',
                            textTransform: 'uppercase'
                          }}
                        >
                          Sesi Bermain Reguler
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: session.status_code === 'kritis' ? '#D97706' : '#10B981'
                          }}
                        >
                          ● {session.status}
                        </span>
                      </div>

                      <h3 className="ev-schedule-item-title">{session.judul}</h3>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#4B5563' }}>
                        {session.deskripsi}
                      </p>

                      <div className="ev-schedule-item-meta">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={14} color="#183629" />
                          <span style={{ fontWeight: 600 }}>{session.venue}</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Layers size={14} color="#183629" />
                          <span>{session.fasilitas}</span>
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="ev-schedule-action-col">
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.725rem', color: '#6B7280', textTransform: 'uppercase' }}>
                          Tarif Kursi
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#183629' }}>
                          {session.biaya}
                        </div>
                      </div>

                      <Link
                        href="/pemesanan"
                        className="ev-btn-detail"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        <span>Reservasi Sesi</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </main>

    </div>
  );
}

export default function JadwalPage() {
  return (
    <Suspense
      fallback={
        <div className="ev-page-wrapper">
          <div className="ev-container" style={{ padding: '60px 24px' }}>
            <div className="ev-skeleton" style={{ height: '300px', borderRadius: '14px' }} />
          </div>
        </div>
      }
    >
      <JadwalContent />
    </Suspense>
  );
}

