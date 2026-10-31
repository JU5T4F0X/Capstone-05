'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle,
  ArrowLeft,
  Users,
  Award,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  Building2,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  X,
  CreditCard,
  Home
} from 'lucide-react';
import ApiClient, { ApiEvent } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import '@/app/events-venues/events-venues.css';

// ── Helper: Format Tanggal Indonesia ──
function formatIndonesianDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
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

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal pendaftaran dengan catatan opsional
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [catatan, setCatatan] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await ApiClient.getEventById(id);
      if (res.success && res.data) {
        setEvent(res.data);
        if (res.data.is_registered) {
          setBooked(true);
        }
      } else {
        setEvent(null);
        setError(res.message || 'Data event tidak ditemukan di database.');
      }
    } catch {
      setEvent(null);
      setError('Terjadi kesalahan saat mengambil detail event dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchDetail();
  }, [id]);

  const handleOpenBookingModal = () => {
    setRegisterError(null);
    setSuccessMessage(null);

    if (!user) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }

    if (user.role === 'admin') {
      setRegisterError('Akun Anda saat ini bertipe Administrator. Silakan beralih ke Mode Pemain untuk mendaftar turnamen.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmRegistration = async () => {
    setSubmitting(true);
    setRegisterError(null);

    try {
      const res = await ApiClient.daftarEvent(id, catatan);
      if (res.success) {
        setBooked(true);
        setShowConfirmModal(false);
        setSuccessMessage(res.message || 'Pendaftaran berhasil dikonfirmasi! Kursi Anda telah diamankan.');
        fetchDetail();
      } else {
        setRegisterError(res.message || 'Gagal memproses pendaftaran event.');
        if (res.message?.toLowerCase().includes('sudah terdaftar')) {
          setBooked(true);
          setShowConfirmModal(false);
        }
      }
    } catch {
      setRegisterError('Terjadi kesalahan jaringan saat mendaftarkan kursi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pendaftaran event ini? Kursi Anda akan dibuka kembali untuk pemain lain.')) return;
    setSubmitting(true);
    setRegisterError(null);
    try {
      const res = await ApiClient.batalDaftarEvent(id);
      if (res.success) {
        setBooked(false);
        setSuccessMessage('Pendaftaran Anda berhasil dibatalkan.');
        fetchDetail();
      } else {
        setRegisterError(res.message || 'Gagal membatalkan pendaftaran.');
      }
    } catch {
      setRegisterError('Terjadi kesalahan saat membatalkan pendaftaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const status = event ? computeEventStatus(event) : null;
  const venueId = event?.venue_id || (event?.venue?.includes('PIK') ? 3 : event?.venue?.includes('Sedayu') ? 1 : 2);

  const maxQuota = event?.max_kuota || 16;
  const filledQuota = event?.pendaftarans_count || 0;
  const sisaQuota = event?.sisa_kuota !== undefined ? event.sisa_kuota : Math.max(0, maxQuota - filledQuota);
  const percentFilled = Math.min(100, Math.round((filledQuota / maxQuota) * 100));

  const isCompetitive =
    event?.kategori?.toLowerCase().includes('resmi') ||
    event?.kategori?.toLowerCase().includes('kompetitif');
  const isCasual = event?.kategori?.toLowerCase().includes('santai');
  const badgeCategoryClass = isCompetitive
    ? 'ev-badge-competitive'
    : isCasual
    ? 'ev-badge-casual'
    : 'ev-badge-workshop';

  return (
    <div className="ev-page-wrapper">
      {/* ── 1. HERO HEADER DETAIL ── */}
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
              <Link
                href="/events"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: '#E2BC55',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
                title="Ke Halaman Daftar Event"
              >
                <span>Event</span>
              </Link>
              <ChevronRight size={13} color="rgba(255, 255, 255, 0.4)" />
              <span style={{ color: '#FAF8F5', fontSize: '12px', fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event?.nama_event || 'Detail Event'}
              </span>
            </div>

            {/* Tombol Cepat Kembali */}
            <Link
              href="/events"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FAF8F5',
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '9999px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowLeft size={13} color="#E2BC55" />
              <span>Semua Event</span>
            </Link>
          </div>

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
            {loading ? 'Memuat Informasi Event...' : event?.nama_event || 'Detail Event'}
          </h1>
          <p
            style={{
              fontSize: '13.5px',
              color: '#C5D2CB',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {event?.venue || 'Venue Resmi MahjongYuks'} • {event?.tanggal_formatted || (event?.tanggal_event ? formatIndonesianDate(event.tanggal_event) : 'Jadwal Resmi')}
          </p>
        </div>
      </section>

      {/* ── 2. MAIN DETAIL AREA ── */}
      <main className="ev-container ev-detail-wrap" style={{ flex: 1, padding: '32px 0 64px 0' }}>
        {/* Loading State Skeleton */}
        {loading && (
          <div className="ev-detail-grid">
            <div className="ev-skeleton-animated" style={{ height: '520px', borderRadius: '16px' }} />
            <div className="ev-skeleton-animated" style={{ height: '360px', borderRadius: '16px' }} />
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && (!event || error) && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E4E0D8',
              borderRadius: '16px',
              padding: '64px 24px',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '32px auto',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <AlertTriangle size={32} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111E18', margin: '0 0 10px 0' }}>
              Event Tidak Ditemukan
            </h2>
            <p style={{ fontSize: '13.5px', color: '#5A675E', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              Data event yang Anda cari tidak tersedia di database atau telah ditarik oleh administrator.
            </p>
            <Link
              href="/events"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#183629',
                color: '#FAF8F5',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={15} />
              <span>Kembali ke Daftar Event</span>
            </Link>
          </div>
        )}

        {/* Content Detail (Jika Data Ditemukan) */}
        {!loading && event && status && (
          <div className="ev-detail-grid">
            {/* ── Sisi Kiri: Banner, Spesifikasi, Deskripsi & Fasilitas ── */}
            <div className="ev-detail-main">
              {/* Gambar / Banner Utama (16:10 aspect ratio) */}
              <div className="ev-detail-hero-img-wrap" style={{ position: 'relative', width: '100%', aspectRatio: '16 / 10', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#183629' }}>
                {event.foto ? (
                  <Image
                    src={event.foto}
                    alt={event.nama_event}
                    fill
                    priority
                    className="ev-detail-hero-img"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      const target = e.target as HTMLElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#E2BC55',
                      fontSize: '48px',
                      fontWeight: 900,
                    }}
                  >
                    🀄
                  </div>
                )}

                {/* Badge Kategori & Status di Atas Banner */}
                <span className={`ev-badge-category ${badgeCategoryClass}`} style={{ top: '20px', left: '20px' }}>
                  {event.kategori || 'Turnamen Resmi'}
                </span>
                <span className={status.badgeClass} style={{ top: '20px', right: '20px' }}>
                  {status.label}
                </span>
              </div>

              {/* Konten & Deskripsi Lengkap */}
              <div className="ev-detail-content" style={{ marginTop: '28px' }}>
                <h2 className="ev-detail-title" style={{ fontSize: '24px', fontWeight: 800, color: '#111E18', margin: '0 0 12px 0' }}>
                  {event.nama_event}
                </h2>
                <p className="ev-detail-desc" style={{ fontSize: '14.5px', color: '#4B5563', lineHeight: 1.7, margin: '0 0 28px 0' }}>
                  {event.deskripsi}
                </p>

                {/* Grid Spesifikasi Nyata */}
                <h3 className="ev-detail-section-title" style={{ fontSize: '16px', fontWeight: 800, color: '#183629', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Sparkles size={18} color="#E2BC55" />
                  <span>Informasi Sesi Pertandingan</span>
                </h3>

                <div className="ev-detail-specs-grid" style={{ marginBottom: '32px' }}>
                  <div className="ev-spec-item">
                    <span className="ev-spec-label">Hari &amp; Tanggal</span>
                    <span className="ev-spec-value">
                      {event.tanggal_formatted || formatIndonesianDate(event.tanggal_event)}
                    </span>
                  </div>

                  <div className="ev-spec-item">
                    <span className="ev-spec-label">Waktu Pelaksanaan</span>
                    <span className="ev-spec-value">
                      {event.waktu_formatted || `${event.waktu_mulai || '13:00'} - ${event.waktu_selesai || '18:00'} WIB`}
                    </span>
                  </div>

                  <div className="ev-spec-item">
                    <span className="ev-spec-label">Lokasi / Venue</span>
                    <span className="ev-spec-value">{event.venue || 'Game House'}</span>
                  </div>

                  <div className="ev-spec-item">
                    <span className="ev-spec-label">Standar Regulasi</span>
                    <span className="ev-spec-value">{event.standar_aturan || 'World Riichi Championship (WRC)'}</span>
                  </div>

                  <div className="ev-spec-item">
                    <span className="ev-spec-label">Biaya Pendaftaran</span>
                    <span className="ev-spec-value" style={{ color: '#004F27', fontWeight: 800 }}>
                      {formatEventPrice(event.biaya)}
                    </span>
                  </div>

                  <div className="ev-spec-item">
                    <span className="ev-spec-label">Kapasitas Kursi</span>
                    <span className="ev-spec-value">
                      {filledQuota} / {maxQuota} Kursi (Sisa {sisaQuota})
                    </span>
                  </div>
                </div>

                {/* Regulasi dan Aturan Resmi */}
                <h3 className="ev-detail-section-title" style={{ fontSize: '16px', fontWeight: 800, color: '#183629', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <ShieldCheck size={18} color="#004F27" />
                  <span>Regulasi Resmi &amp; Akumulasi Poin</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <CheckCircle size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: 1.6 }}>
                      <strong>Format Sesi Kompetitif:</strong> Mengacu pada regulasi resmi WRC dengan kalkulasi Uma/Oka terverifikasi wasit berlisensi.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <CheckCircle size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: 1.6 }}>
                      <strong>Meja Otomatis Amos Rexx III:</strong> Pengocokan magnetis 4 kompartemen ubin otomatis tanpa sentuh manual demi integritas pertandingan.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <CheckCircle size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: 1.6 }}>
                      <strong>Poin Rating Nasional:</strong> Hasil pertandingan otomatis terintegrasi ke papan klasemen Leaderboard atlet MahjongYuks.
                    </p>
                  </div>
                </div>

                {/* Relasi Informasi Venue */}
                <div className="ev-related-venue-box">
                  <div className="ev-related-venue-info">
                    <div className="ev-related-venue-icon">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>
                        Diselenggarakan di Venue Resmi
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#183629' }}>
                        {event.venue || 'Game House'}
                      </div>
                      <div style={{ fontSize: '0.825rem', color: '#4B5563', marginTop: '2px' }}>
                        Meja otomatis, ruang ber-AC dengan filtrasi HEPA anti-asap, dan fasilitas lengkap.
                      </div>
                    </div>
                  </div>

                  <Link href={`/venues/${venueId}`} className="ev-btn-detail">
                    <span>Lihat Profil Venue</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Sisi Kanan: Panel Pendaftaran Sticky ── */}
            <aside className="ev-detail-sidebar">
              <div className="ev-booking-card" style={{ position: 'sticky', top: '96px' }}>
                <span className={status.badgeClass} style={{ display: 'inline-block', position: 'static', marginBottom: '14px' }}>
                  {status.label}
                </span>

                <h3 className="ev-booking-card-title">Registrasi Kursi Peserta</h3>

                {/* Biaya Pendaftaran */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>
                    Biaya Registrasi
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#004F27', marginTop: '2px' }}>
                    {formatEventPrice(event.biaya)}
                  </div>
                </div>

                {/* Info Kuota & Progress Bar */}
                <div style={{ padding: '16px', background: '#FAF8F5', borderRadius: '10px', border: '1px solid #E5E7EB', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ color: '#6B7280' }}>Ketersediaan Kuota:</span>
                    <strong style={{ color: sisaQuota <= 2 ? '#B91C1C' : '#004F27' }}>
                      {sisaQuota > 0 ? `Sisa ${sisaQuota} Kursi` : 'Kuota Penuh'}
                    </strong>
                  </div>

                  <div className="ev-quota-track" style={{ height: '6px' }}>
                    <div
                      className="ev-quota-fill"
                      style={{
                        width: `${percentFilled}%`,
                        backgroundColor: sisaQuota <= 2 ? '#DC2626' : '#16A34A',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#7A897F', marginTop: '6px' }}>
                    <span>{filledQuota} Terisi</span>
                    <span>Kapasitas {maxQuota}</span>
                  </div>
                </div>

                {/* Notifikasi / Feedback Errors */}
                {registerError && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                    fontSize: '0.825rem',
                    marginBottom: '14px',
                    lineHeight: 1.4,
                  }}>
                    {registerError}
                  </div>
                )}

                {successMessage && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    fontSize: '0.825rem',
                    marginBottom: '14px',
                    lineHeight: 1.4,
                  }}>
                    {successMessage}
                  </div>
                )}

                {/* Status Pendaftaran User */}
                {booked ? (
                  <div
                    style={{
                      padding: '18px',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      borderRadius: '10px',
                      textAlign: 'center',
                    }}
                  >
                    <CheckCircle size={32} color="#059669" style={{ margin: '0 auto 8px auto' }} />
                    <div style={{ fontWeight: 800, color: '#065F46', fontSize: '1rem' }}>
                      Pendaftaran Terkonfirmasi!
                    </div>
                    <p style={{ margin: '4px 0 14px 0', fontSize: '0.825rem', color: '#047857' }}>
                      Kursi Anda pada event ini telah resmi tercatat di sistem.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Link
                        href="/pemesanan"
                        style={{
                          display: 'inline-block',
                          padding: '9px 16px',
                          background: '#065F46',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        Lihat Tiket di Pemesanan
                      </Link>
                      <button
                        type="button"
                        onClick={handleCancelRegistration}
                        disabled={submitting}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: '4px',
                          fontWeight: 600,
                        }}
                      >
                        {submitting ? 'Memproses...' : 'Batalkan Pendaftaran'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenBookingModal}
                      disabled={submitting || status.type !== 'active'}
                      className="ev-booking-cta-btn"
                      style={{
                        width: '100%',
                        opacity: status.type !== 'active' ? 0.6 : 1,
                        cursor: status.type !== 'active' ? 'not-allowed' : 'pointer',
                        backgroundColor: status.type === 'active' ? '#183629' : '#9CA3AF',
                      }}
                    >
                      <span>
                        {submitting
                          ? 'Memproses...'
                          : status.type === 'active'
                          ? 'Daftar Event Sekarang'
                          : status.type === 'full'
                          ? 'Kuota Penuh'
                          : status.type === 'upcoming'
                          ? 'Segera Dibuka'
                          : 'Pendaftaran Ditutup'}
                      </span>
                      <ChevronRight size={16} />
                    </button>

                    {!user && (
                      <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.8rem', color: '#5A675E' }}>
                        Wajib login untuk mendaftar event.{' '}
                        <Link
                          href={`/login?redirect=/events/${id}`}
                          style={{ color: '#004F27', fontWeight: 700, textDecoration: 'underline' }}
                        >
                          Masuk ke Akun
                        </Link>
                      </div>
                    )}
                  </>
                )}

                <div style={{ marginTop: '18px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={15} color="#8DA79B" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280', lineHeight: 1.5 }}>
                    Pendaftaran resmi sirkuit MahjongYuks berstandar WRC. Mohon hadir 15 menit sebelum sesi dimulai.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* ── 3. MODAL KONFIRMASI PENDAFTARAN EVENT ── */}
      {showConfirmModal && event && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(10, 26, 17, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              position: 'relative',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#7A897F',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EBF6EE', color: '#004F27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111E18' }}>
                Konfirmasi Pendaftaran
              </h3>
            </div>

            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#5A675E' }}>
              Pastikan Anda siap menghadiri sesi turnamen berikut:
            </p>

            {/* Ringkasan Tiket */}
            <div style={{ backgroundColor: '#FAF8F5', border: '1px solid #E4E0D8', borderRadius: '10px', padding: '16px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div>
                <strong style={{ color: '#111E18', fontSize: '14px' }}>{event.nama_event}</strong>
              </div>
              <div style={{ color: '#5A675E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} color="#004F27" />
                <span>{event.tanggal_formatted || formatIndonesianDate(event.tanggal_event)}</span>
              </div>
              <div style={{ color: '#5A675E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} color="#004F27" />
                <span>{event.venue || 'Game House'}</span>
              </div>
              <div style={{ color: '#004F27', fontWeight: 700, paddingTop: '6px', borderTop: '1px solid #E5E7EB' }}>
                Biaya: {formatEventPrice(event.biaya)}
              </div>
            </div>

            {/* Input Catatan Opsional */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                Catatan Khusus (Opsional)
              </label>
              <textarea
                placeholder="Contoh: Preferensi meja non-smoking, datang bersama rekan..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #D7E6DB',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none',
                }}
              />
            </div>

            {/* Tombol Aksi */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid #D7E6DB',
                  backgroundColor: '#FFFFFF',
                  color: '#2B3830',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmRegistration}
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#183629',
                  color: '#FAF8F5',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{submitting ? 'Mendaftarkan...' : 'Konfirmasi & Daftar'}</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
