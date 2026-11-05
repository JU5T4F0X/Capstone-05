'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, Users, Loader2 } from 'lucide-react';
import ApiClient, { ApiEvent } from '@/lib/api';
import type { EventSession } from '@/types/mahjong';

interface FeaturedEventsProps {
  onSelectEvent: (event: EventSession) => void;
}

const QUICK_FILTER_TABS = [
  { id: 'all', label: 'Semua Sesi' },
  { id: 'tournament', label: 'Turnamen Resmi' },
  { id: 'casual', label: 'Sesi Santai' },
];

export default function FeaturedEvents({ onSelectEvent }: FeaturedEventsProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    ApiClient.getEvents({ status: 'active' })
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data)) {
          setEvents(res.data);
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

  const filteredEvents = events.filter((ev) => {
    if (activeTab === 'all') return true;
    const cat = (ev.kategori || ev.jenis_event || '').toLowerCase();
    if (activeTab === 'tournament') return cat.includes('turnamen') || cat.includes('wrc');
    if (activeTab === 'casual') return cat.includes('santai') || cat.includes('casual') || cat.includes('mabar');
    return true;
  });

  return (
    <section id="events" className="landing-section">
      <div className="landing-container">
        {/* Section Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
          <div>
            <div className="landing-section-subtitle">
              Katalog Sesi Pilihan
            </div>
            <h2 className="landing-section-title">
              Jadwal Sesi &amp; Turnamen Pekan Ini
            </h2>
            <p className="landing-section-desc">
              Pilih sesi bertanding dengan meja otomatis di Game House MahjongYuks.
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="landing-events-tabs">
            {QUICK_FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`landing-events-tab ${isActive ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Structured 3-Column Catalog Grid */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#5A675E' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block', color: '#183629' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Memuat katalog event dan turnamen...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E4E0D8' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#183629' }}>Belum ada jadwal sesi untuk filter ini.</p>
          </div>
        ) : (
          <div className="landing-events-grid">
            {filteredEvents.map((event) => {
              const sisaKursi = event.sisa_kuota ?? 0;
              const isFewSeats = sisaKursi > 0 && sisaKursi <= 4;
              const photoUrl = event.foto || '/landing/hero-parlor.jpg';
              const cleanBiaya = event.biaya ? (event.biaya.startsWith('Rp') ? event.biaya : `Rp ${event.biaya}`) : 'Gratis';

              return (
                <div key={event.id} className="landing-event-card">
                  {/* Image Header */}
                  <div className="landing-event-img-wrap" style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                    <Image
                      src={photoUrl}
                      alt={event.nama_event}
                      fill
                      unoptimized
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* Top-Left Category Pill */}
                    <div className="landing-event-badge">
                      {event.kategori || (event.jenis_event === 'event' ? 'Turnamen Resmi' : 'Sesi Bermain')}
                    </div>

                    {/* Top-Right Seat Availability */}
                    {isFewSeats && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          backgroundColor: 'rgba(184, 134, 11, 0.92)',
                          backdropFilter: 'blur(6px)',
                          WebkitBackdropFilter: 'blur(6px)',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '4px',
                          letterSpacing: '0.02em',
                        }}
                      >
                        Sisa {sisaKursi} Kursi
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="landing-event-body">
                    {/* Meta Row: Venue + Date & Time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#78807B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {event.venue || 'Game House'}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#4A524D' }}>
                        {event.tanggal_event ? event.tanggal_event.split('T')[0] : 'Sesuai Jadwal'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="landing-event-title">
                      {event.nama_event}
                    </h3>

                    {/* Concise Summary */}
                    <p className="landing-event-desc">
                      {event.deskripsi}
                    </p>

                    {/* Meta Info */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#183629',
                          backgroundColor: '#DCF1E3',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        {event.waktu_mulai ? `${event.waktu_mulai.slice(0, 5)} - ${event.waktu_selesai?.slice(0, 5)} WIB` : '13:00 - 18:00 WIB'}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#4A524D',
                          backgroundColor: '#F2EFE9',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #E4E0D8',
                        }}
                      >
                        {event.jumlah_meja ? `${event.jumlah_meja} Meja (${event.max_kuota || event.jumlah_meja * 4} Kursi)` : `${event.max_kuota || 16} Kursi`}
                      </span>
                    </div>

                    {/* Price & Primary CTA */}
                    <div className="landing-event-footer">
                      <div className="landing-event-price">
                        {cleanBiaya} <span>/kursi</span>
                      </div>

                      <Link
                        href={`/events/${event.id}`}
                        className="landing-btn-reserve"
                        style={{ padding: '8px 14px', fontSize: '12px', textDecoration: 'none' }}
                      >
                        <span>Pesan Kursi</span>
                        <ArrowRight size={13} strokeWidth={2} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
