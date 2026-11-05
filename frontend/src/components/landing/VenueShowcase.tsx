'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Clock, MapPin, Layers, ArrowRight, Loader2 } from 'lucide-react';
import ApiClient, { ApiVenue } from '@/lib/api';

interface VenueShowcaseProps {
  onOpenPartnership: () => void;
  onSelectBranch: (branchName: string) => void;
}

export default function VenueShowcase({ onOpenPartnership, onSelectBranch }: VenueShowcaseProps) {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVenueId, setActiveVenueId] = useState<number | string | null>(null);

  useEffect(() => {
    let isMounted = true;
    ApiClient.getVenues()
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setVenues(res.data);
          setActiveVenueId(res.data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentVenue = venues.find((v) => v.id === activeVenueId) || venues[0] || null;

  return (
    <section id="venues" className="landing-section landing-section-alt">
      <div className="landing-container">
        {/* Section Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
          <div style={{ maxWidth: '640px' }}>
            <div className="landing-section-subtitle">
              Jaringan Venue Resmi
            </div>
            <h2 className="landing-section-title">
              Suasana Venue Nyaman &amp; Standar Turnamen
            </h2>
            <p className="landing-section-desc">
              Toko utama di Sedayu City dilengkapi meja otomatis empat sisi, ruangan ber-AC, dan peralatan Mahjong berstandar WRC.
            </p>
          </div>

          <Link
            href="/venues"
            className="landing-btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Informasi Lengkap Venue</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Branch Selector Tabs */}
        {venues.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {venues.map((venue) => {
              const isActive = venue.id === currentVenue?.id;
              return (
                <button
                  key={venue.id}
                  type="button"
                  onClick={() => setActiveVenueId(venue.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    backgroundColor: isActive ? '#183629' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#4A524D',
                    border: isActive ? '1px solid #183629' : '1px solid #E4E0D8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {venue.nama_venue}
                </button>
              );
            })}
          </div>
        )}

        {/* Split 2-Column Feature */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#5A675E' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block', color: '#183629' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Memuat data venue resmi...</p>
          </div>
        ) : currentVenue ? (
          <div className="landing-venue-box">
            {/* Left: Photo */}
            <div className="landing-venue-photo-side" style={{ position: 'relative', minHeight: '320px' }}>
              <Image
                src={currentVenue.foto || '/landing/hero-parlor.jpg'}
                alt={currentVenue.nama_venue}
                fill
                unoptimized
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 880px) 100vw, 50vw"
              />
              {/* Location Pill */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  backgroundColor: 'rgba(20, 26, 23, 0.78)',
                  backdropFilter: 'blur(6px)',
                  color: '#FAF8F5',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <MapPin size={13} color="#C59B27" />
                <span>{currentVenue.alamat ? currentVenue.alamat.split(',')[0] : 'Kelapa Gading'}</span>
              </div>
            </div>

            {/* Right: Key Details */}
            <div className="landing-venue-info-side">
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#B8860B',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Jakarta • {currentVenue.jumlah_meja || currentVenue.mejas_count || 4} Meja {currentVenue.nama_venue?.toLowerCase().includes('sedayu') ? 'Otomatis' : 'Standar'}
              </div>

              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#141A17', marginBottom: '12px', letterSpacing: '-0.01em' }}>
                {currentVenue.nama_venue}
              </h3>

              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#4A524D', marginBottom: '20px' }}>
                {currentVenue.deskripsi || 'Homebase resmi & hub penyelenggaraan kegiatan Mahjongyuks.'}
              </p>

              {/* Checklist of Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {(Array.isArray(currentVenue.fasilitas) && currentVenue.fasilitas.length > 0
                  ? currentVenue.fasilitas
                  : [
                      'Meja Otomatis Empat Sisi',
                      'Ruangan Ber-AC & Bebas Asap Rokok',
                      'Peralatan Ubin Standar WRC & Hong Kong',
                      'Area Parkir & Kafe Pendukung',
                    ]
                ).map((feature: string, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#F9F5EA',
                        color: '#B8860B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <Check size={11} strokeWidth={2.5} />
                    </span>
                    <span style={{ fontSize: '13px', color: '#4A524D' }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Operational Metadata */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#FAF8F5',
                  border: '1px solid #E4E0D8',
                  borderRadius: '6px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} color="#183629" />
                  <span style={{ fontSize: '12px', color: '#4A524D' }}>
                    {currentVenue.jam_operasional_display || `${currentVenue.jam_buka?.slice(0, 5) || '07:30'} - ${currentVenue.jam_tutup?.slice(0, 5) || '21:30'} WIB`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} color="#183629" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#141A17' }}>
                    {currentVenue.jumlah_meja || currentVenue.mejas_count || 4} Meja Mahjong
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => onSelectBranch(currentVenue.nama_venue)}
                  className="landing-btn-reserve"
                  style={{ padding: '10px 20px' }}
                >
                  <span>Reservasi di Cabang Ini</span>
                  <ArrowRight size={14} strokeWidth={2} />
                </button>

                <Link
                  href={`/venues/${currentVenue.id}`}
                  className="landing-btn-secondary"
                  style={{ padding: '10px 18px', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Profil Lengkap Lokasi</span>
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {/* Partnership Strip */}
        <div
          style={{
            backgroundColor: '#FAF8F5',
            border: '1px solid #E4E0D8',
            borderRadius: '10px',
            padding: '24px 28px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Program Kemitraan Venue
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#141A17', marginTop: '2px' }}>
              Memiliki Ruang Usaha atau Ingin Membuka Cabang Mahjongyuks?
            </div>
            <div style={{ fontSize: '13px', color: '#4A524D', marginTop: '2px' }}>
              Dukungan pengadaan meja otomatis, lisensi sistem penilaian resmi, dan akses ke pemain aktif.
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPartnership}
            className="landing-btn-secondary"
            style={{ padding: '10px 18px', fontSize: '13px', whiteSpace: 'nowrap' }}
          >
            <span>Konsultasi Kemitraan</span>
            <ArrowRight size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </section>
  );
}
