'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Clock,
  Layers,
  ArrowRight,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  Compass,
  Calendar,
  CheckCircle,
  ChevronRight,
  Home,
  Sparkles,
  Wind,
  ShieldCheck,
  Car,
  Coffee,
  Wifi,
  RotateCcw
} from 'lucide-react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import ApiClient, { ApiVenue } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import '@/components/landing/landing.css';
import '../events-venues/events-venues.css';

// ── Helper: Evaluasi Status Real-Time Operasional (Zona Waktu Asia/Jakarta) ──
interface OperatingStatus {
  isOpen: boolean;
  label: string;
  subText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
  dotColor: string;
}

function computeOperatingStatus(jamBukaStr = '07:30', jamTutupStr = '21:30'): OperatingStatus {
  try {
    const now = new Date();
    // Ambil jam dan menit terkini di zona waktu Asia/Jakarta (WIB)
    const jakartaFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = jakartaFormatter.formatToParts(now);
    const hourPart = parts.find((p) => p.type === 'hour')?.value || '12';
    const minPart = parts.find((p) => p.type === 'minute')?.value || '00';

    const curHour = parseInt(hourPart, 10);
    const curMin = parseInt(minPart, 10);
    const currentTotalMinutes = curHour * 60 + curMin;

    // Bersihkan format jam buka dan jam tutup (07.30 atau 07:30)
    const cleanBuka = jamBukaStr.replace('.', ':').trim();
    const cleanTutup = jamTutupStr.replace('.', ':').trim();

    const [bukaH, bukaM] = cleanBuka.split(':').map((v) => parseInt(v, 10));
    const [tutupH, tutupM] = cleanTutup.split(':').map((v) => parseInt(v, 10));

    const bukaMinutes = (isNaN(bukaH) ? 7 : bukaH) * 60 + (isNaN(bukaM) ? 30 : bukaM);
    const tutupMinutes = (isNaN(tutupH) ? 21 : tutupH) * 60 + (isNaN(tutupM) ? 30 : tutupM);

    const isOpen = currentTotalMinutes >= bukaMinutes && currentTotalMinutes < tutupMinutes;
    const formattedBuka = `${String(isNaN(bukaH) ? 7 : bukaH).padStart(2, '0')}.${String(isNaN(bukaM) ? 30 : bukaM).padStart(2, '0')}`;
    const formattedTutup = `${String(isNaN(tutupH) ? 21 : tutupH).padStart(2, '0')}.${String(isNaN(tutupM) ? 30 : tutupM).padStart(2, '0')}`;

    if (isOpen) {
      return {
        isOpen: true,
        label: 'Buka Sekarang',
        subText: `Buka sampai pukul ${formattedTutup} WIB`,
        badgeBg: 'rgba(16, 185, 129, 0.12)',
        badgeBorder: 'rgba(16, 185, 129, 0.35)',
        badgeColor: '#059669',
        dotColor: '#10B981',
      };
    } else {
      return {
        isOpen: false,
        label: 'Tutup',
        subText: `Buka kembali pukul ${formattedBuka} WIB`,
        badgeBg: 'rgba(239, 68, 68, 0.12)',
        badgeBorder: 'rgba(239, 68, 68, 0.35)',
        badgeColor: '#DC2626',
        dotColor: '#EF4444',
      };
    }
  } catch {
    return {
      isOpen: true,
      label: 'Buka Sekarang',
      subText: 'Setiap hari 07.30 - 21.30 WIB',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      badgeBorder: 'rgba(16, 185, 129, 0.35)',
      badgeColor: '#059669',
      dotColor: '#10B981',
    };
  }
}

// Helper untuk memilih ikon fasilitas berdasarkan teks
function getFacilityIcon(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('meja') || lower.includes('amos') || lower.includes('otomatis')) {
    return <Layers size={18} color="#B8860B" />;
  }
  if (lower.includes('ac') || lower.includes('hepa') || lower.includes('udara')) {
    return <Wind size={18} color="#0284C7" />;
  }
  if (lower.includes('wrc') || lower.includes('standar') || lower.includes('turnamen') || lower.includes('regulasi')) {
    return <ShieldCheck size={18} color="#183629" />;
  }
  if (lower.includes('parkir') || lower.includes('valet') || lower.includes('keamanan')) {
    return <Car size={18} color="#059669" />;
  }
  if (lower.includes('kafe') || lower.includes('kopi') || lower.includes('snack') || lower.includes('refreshment') || lower.includes('bakery')) {
    return <Coffee size={18} color="#D97706" />;
  }
  if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet')) {
    return <Wifi size={18} color="#6366F1" />;
  }
  return <CheckCircle size={18} color="#183629" />;
}

export default function SingleVenuePage() {
  const { user } = useAuth();
  const [venue, setVenue] = useState<ApiVenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('/assets/mahjong_parlor_players.jpg');

  // Galeri foto alternatif
  const galleryPhotos = useMemo(() => {
    const list = [
      '/assets/mahjong_parlor_players.jpg',
      '/landing/hero-parlor.jpg',
      '/assets/venue_senopati.jpg',
    ];
    if (venue?.foto && !list.includes(venue.foto)) {
      list.unshift(venue.foto);
    }
    return list;
  }, [venue]);

  // Load Data Venue Tunggal dari Backend API
  const fetchSingleVenue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getVenues();
      if (res.success && res.data && res.data.length > 0) {
        // Ambil venue aktif (MahjongYuks beroperasi di SATU lokasi Game House)
        const activeVenue = res.data.find((v) => v.status === 'active') || res.data[0];
        setVenue(activeVenue);
        if (activeVenue.foto) {
          setSelectedPhoto(activeVenue.foto);
        }
      } else {
        setVenue(null);
      }
    } catch (err: any) {
      setError('Gagal memuat informasi lokasi dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSingleVenue();
  }, []);

  // Hitung status jam operasional terkini
  const operatingStatus = useMemo(() => {
    if (!venue) return computeOperatingStatus('07:30', '21:30');
    return computeOperatingStatus(venue.jam_buka_raw || '07:30', venue.jam_tutup_raw || '21:30');
  }, [venue]);

  // Format link Google Maps
  const mapsSearchUrl = useMemo(() => {
    if (venue?.maps_url) return venue.maps_url;
    if (venue?.alamat) {
      return `https://maps.google.com/?q=${encodeURIComponent(venue.alamat)}`;
    }
    return 'https://maps.google.com/?q=Sedayu+City+Kelapa+Gading+SCBRC+Blok+C+No+18';
  }, [venue]);

  // Embed URL untuk Google Maps iframe (tanpa API key)
  const mapsEmbedUrl = useMemo(() => {
    if (venue?.latitude && venue?.longitude) {
      return `https://maps.google.com/maps?q=${venue.latitude},${venue.longitude}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
    }
    const query = venue?.alamat || 'Sedayu City Kelapa Gading SCBRC Blok C No 18 Jakarta Utara';
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }, [venue]);

  // Structured Data Schema.org (LocalBusiness)
  const structuredData = useMemo(() => {
    if (!venue) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: `${venue.nama_venue} - MahjongYuks`,
      image: venue.foto ? `https://mahjongyuks.id${venue.foto}` : 'https://mahjongyuks.id/assets/mahjong_parlor_players.jpg',
      description: venue.deskripsi,
      address: {
        '@type': 'PostalAddress',
        streetAddress: venue.alamat,
        addressLocality: venue.kota_kecamatan || 'Kelapa Gading, Jakarta Utara',
        addressRegion: 'DKI Jakarta',
        addressCountry: 'ID',
      },
      telephone: venue.telepon || '+62-812-3456-7890',
      priceRange: 'Rp 75.000 - Rp 150.000',
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: venue.jam_buka_raw || '07:30',
          closes: venue.jam_tutup_raw || '21:30',
        },
      ],
    };
  }, [venue]);

  return (
    <div className="ev-page-wrapper" style={{ backgroundColor: '#FAF8F5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Schema.org Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      {/* ── 1. HEADER PUBLIK STICKY ── */}
      <LandingNavbar activeItem="venues" />

      {/* ── 2. HERO SECTION LOKASI KAMI ── */}
      {/* Menggunakan container yang identik dengan landing-container untuk presisi garis tepi kiri */}
      <section
        style={{
          backgroundColor: '#183629',
          backgroundImage: 'linear-gradient(180deg, #183629 0%, #10261D 100%)',
          padding: '40px 0 36px 0',
          borderBottom: '1px solid rgba(226, 188, 85, 0.25)',
          position: 'relative',
        }}
      >
        <div className="landing-container">
          {/* Breadcrumb — Glassmorphic Capsule */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
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
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#E2BC55',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
                title="Kembali ke Beranda"
              >
                <Home size={13} color="#E2BC55" />
                <span>Beranda</span>
              </Link>
              <ChevronRight size={13} color="rgba(255, 255, 255, 0.4)" />
              <span style={{ color: '#FAF8F5', fontSize: '12px', fontWeight: 600 }}>
                Lokasi Kami
              </span>
            </div>
          </div>

          {/* Hero Titles — Sesuai format: "Game House - MahjongYuks" */}
          <div style={{ maxWidth: '820px' }}>
            <h1
              style={{
                fontSize: '30px',
                fontWeight: 900,
                color: '#FAF8F5',
                margin: '0 0 10px 0',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
              }}
            >
              Game House - MahjongYuks
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: '#C5D2CB',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Pusat seluruh aktivitas permainan, pelatihan, turnamen berstandar World Riichi Championship (WRC), dan pelayanan resmi bagi seluruh pengunjung dan komunitas MahjongYuks di Sedayu City Kelapa Gading.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. MAIN CONTENT (Menggunakan landing-container agar persis sejajar dengan header dan hero) ── */}
      <div style={{ flex: 1, padding: '40px 0 64px 0' }}>
        <div className="landing-container">
          {/* State Loading Skeleton */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
              <div className="ev-skeleton" style={{ height: '460px', borderRadius: '16px' }} />
              <div className="ev-skeleton" style={{ height: '460px', borderRadius: '16px' }} />
            </div>
          )}

          {/* State Error atau Kosong (Sesuai Syarat: Tampilkan Pesan Ramah) */}
          {!loading && (!venue || error) && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E4E0D8',
                borderRadius: '16px',
                padding: '64px 24px',
                textAlign: 'center',
                maxWidth: '560px',
                margin: '32px auto',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#F3F4F6',
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Building2 size={32} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111E18', margin: '0 0 8px 0' }}>
                Informasi Lokasi Belum Tersedia
              </h2>
              <p style={{ fontSize: '13.5px', color: '#5A675E', margin: '0 0 24px 0', lineHeight: 1.6 }}>
                {error || 'Data venue sedang dalam proses sinkronisasi oleh administrator. Silakan coba beberapa saat lagi.'}
              </p>
              <button
                type="button"
                onClick={fetchSingleVenue}
                className="ev-empty-reset-btn"
                style={{ margin: '0 auto' }}
              >
                <RotateCcw size={15} />
                <span>Muat Ulang Halaman</span>
              </button>
            </div>
          )}

          {/* State Berhasil Memuat Data Venue Tunggal */}
          {!loading && venue && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {/* ── BAGIAN UTAMA (2 Kolom Seimbang: Galeri & Kartu Informasi) ── */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '32px',
                  alignItems: 'stretch',
                }}
              >
                {/* Kolom Kiri: Galeri Foto Venue */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      flex: 1,
                      minHeight: '380px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      backgroundColor: '#183629',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                      border: '1px solid #E4E0D8',
                    }}
                  >
                    <Image
                      src={selectedPhoto || venue.foto || '/assets/mahjong_parlor_players.jpg'}
                      alt={venue.nama_venue}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                      style={{ objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        backgroundColor: 'rgba(24, 54, 41, 0.88)',
                        backdropFilter: 'blur(8px)',
                        color: '#FAF8F5',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.4px',
                        textTransform: 'uppercase',
                        border: '1px solid rgba(226, 188, 85, 0.35)',
                      }}
                    >
                      Homebase Utama
                    </div>
                  </div>

                  {/* Thumbnail Galeri Foto Alternatif */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
                    {galleryPhotos.map((photoUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPhoto(photoUrl)}
                        style={{
                          position: 'relative',
                          width: '84px',
                          height: '56px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: selectedPhoto === photoUrl ? '2px solid #183629' : '1px solid #E4E0D8',
                          padding: 0,
                          cursor: 'pointer',
                          opacity: selectedPhoto === photoUrl ? 1 : 0.65,
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src={photoUrl}
                          alt={`Sudut MahjongYuks ${idx + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kolom Kanan: Kartu Informasi Utama */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E4E0D8',
                    padding: '28px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '20px',
                    height: '100%',
                  }}
                >
                  {/* Atas: Status Real-Time & Rating */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                      {/* Badge Status Real-Time */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: operatingStatus.badgeBg,
                          border: `1px solid ${operatingStatus.badgeBorder}`,
                          padding: '6px 14px',
                          borderRadius: '9999px',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: operatingStatus.dotColor,
                            display: 'inline-block',
                            boxShadow: `0 0 8px ${operatingStatus.dotColor}`,
                          }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 800, color: operatingStatus.badgeColor }}>
                          {operatingStatus.label}
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#4B5563', fontWeight: 500 }}>
                          • {operatingStatus.subText}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#183629',
                          backgroundColor: '#F3EFE6',
                          padding: '4px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        ⭐ 4.9 (Official Rated)
                      </span>
                    </div>

                    {/* Nama & Deskripsi */}
                    <h2
                      style={{
                        fontSize: '24px',
                        fontWeight: 800,
                        color: '#111E18',
                        margin: '0 0 8px 0',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {venue.nama_venue}
                    </h2>
                    <p style={{ fontSize: '13.5px', color: '#4B5563', lineHeight: 1.65, margin: 0 }}>
                      {venue.deskripsi}
                    </p>

                    {/* Detail Baris: Alamat, Jam, Meja, Kontak */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #F0ECE4', paddingTop: '16px', marginTop: '16px' }}>
                      {/* Alamat Lengkap */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <MapPin size={17} color="#183629" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#78807B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Alamat Lengkap
                          </div>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111E18', lineHeight: 1.45, marginTop: '2px' }}>
                            {venue.alamat}
                          </div>
                        </div>
                      </div>

                      {/* Jam Operasional */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Clock size={17} color="#183629" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#78807B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Jam Operasional
                          </div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#111E18', marginTop: '2px' }}>
                            07.30 - 21.30 WIB (Setiap Hari)
                          </div>
                        </div>
                      </div>

                      {/* Jumlah Meja & Kapasitas */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Layers size={17} color="#183629" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#78807B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Inventaris Meja Otomatis
                          </div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#183629', marginTop: '2px' }}>
                            {venue.jumlah_meja || 34} Meja Otomatis Amos Rexx III ({venue.kapasitas || `${(venue.jumlah_meja || 34) * 4} Pemain Maksimal`})
                          </div>
                        </div>
                      </div>

                      {/* Kontak Telepon / WhatsApp */}
                      {venue.telepon && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <Phone size={17} color="#183629" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#78807B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Kontak Telepon / WhatsApp
                            </div>
                            <a
                              href={`https://wa.me/${venue.telepon.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '13.5px', fontWeight: 600, color: '#059669', marginTop: '2px', textDecoration: 'none' }}
                            >
                              {venue.telepon}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Kontak Email */}
                      {venue.email && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <Mail size={17} color="#183629" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#78807B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Email Resmi
                            </div>
                            <a
                              href={`mailto:${venue.email}`}
                              style={{ fontSize: '13.5px', fontWeight: 600, color: '#183629', marginTop: '2px', textDecoration: 'none' }}
                            >
                              {venue.email}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bawah: Action Buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid #F0ECE4', paddingTop: '18px' }}>
                    <a
                      href={mapsSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: '1 1 140px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '11px 18px',
                        backgroundColor: '#FFFFFF',
                        color: '#183629',
                        border: '1.5px solid #183629',
                        borderRadius: '8px',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Compass size={16} />
                      <span>Petunjuk Arah</span>
                    </a>

                    <Link
                      href={user ? '/pemesanan' : '/login?redirect=/pemesanan'}
                      style={{
                        flex: '1 1 140px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '11px 18px',
                        backgroundColor: '#183629',
                        color: '#FAF8F5',
                        border: '1.5px solid #183629',
                        borderRadius: '8px',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(24, 54, 41, 0.25)',
                      }}
                    >
                      <Layers size={16} color="#E2BC55" />
                      <span>Pesan Meja</span>
                    </Link>

                    <Link
                      href="/jadwal"
                      style={{
                        flex: '1 1 100%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: '#F2EFE9',
                        color: '#183629',
                        border: '1px solid #E4E0D8',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <Calendar size={15} />
                      <span>Lihat Jadwal Pertandingan</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* ── 4. BAGIAN FASILITAS LOKASI (Hanya jika ada di database) ── */}
              {venue.fasilitas && venue.fasilitas.length > 0 && (
                <section style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E4E0D8', padding: '32px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                      <Sparkles size={13} color="#B8860B" />
                      <span>Fasilitas Resmi Game House</span>
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111E18', margin: 0 }}>
                      Kenyamanan &amp; Standar Perlengkapan
                    </h3>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    {venue.fasilitas.map((fas, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '14px 16px',
                          backgroundColor: '#FAF8F5',
                          border: '1px solid #EAE6DE',
                          borderRadius: '10px',
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E4E0D8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getFacilityIcon(fas)}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#183629', lineHeight: 1.4 }}>
                          {fas}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── 5. TABEL JAM OPERASIONAL LENGKAP ── */}
              <section style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E4E0D8', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={20} color="#183629" />
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', margin: 0 }}>
                      Jadwal &amp; Jam Operasional Game House
                    </h3>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#059669',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <CheckCircle size={13} />
                    <span>Setiap hari 07.30 - 21.30 WIB</span>
                  </span>
                </div>

                {/* Tabel Ringkas 7 Hari */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => (
                    <div
                      key={day}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#FAF8F5',
                        borderRadius: '8px',
                        border: '1px solid #EAE6DE',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#183629' }}>{day}</div>
                      <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                        07.30 - 21.30
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── 6. PETA GOOGLE MAPS EMBED & PETUNJUK AKSES ── */}
              <section style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E4E0D8', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#183629', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                      <MapPin size={13} color="#183629" />
                      <span>Navigasi Lokasi</span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', margin: 0 }}>
                      Peta Interaktif &amp; Rute Perjalanan
                    </h3>
                  </div>

                  <a
                    href={mapsSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: '#183629',
                      color: '#FAF8F5',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <span>Buka di Google Maps</span>
                    <ExternalLink size={13} />
                  </a>
                </div>

                {/* Iframe Peta Google Maps Embed (Lazy Loading, Bebas API Key) */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '400px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #E4E0D8',
                  }}
                >
                  <iframe
                    title="Google Maps Lokasi Game House MahjongYuks"
                    src={mapsEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                {/* Tips Akses & Transportasi */}
                <div
                  style={{
                    marginTop: '20px',
                    padding: '16px 20px',
                    backgroundColor: '#FAF8F5',
                    borderRadius: '10px',
                    border: '1px solid #EAE6DE',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <Compass size={18} color="#183629" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#183629', marginBottom: '3px' }}>
                      Tips Rute &amp; Parkir Pengunjung:
                    </div>
                    <div style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.6 }}>
                      Dapat diakses dengan mudah melalui jalan arteri Kelapa Gading menuju komplek Ruko Sedayu City SCBRC Blok C No. 18. Tersedia area parkir kendaraan mobil dan motor yang sangat luas tepat di depan Game House dengan pengawasan keamanan 24 jam.
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
