'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Building2,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Search,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ApiClient, { ApiMyEventRegistration } from '@/lib/api';
import '@/app/events-venues/events-venues.css';

export default function PemesananPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<ApiMyEventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'event' | 'meja'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample mock regular table booking
  const sampleTableBookings = [
    {
      id: 'TB-841-01',
      type: 'meja' as const,
      title: 'Sesi Sparing Reguler (4 Jam)',
      venue: 'Game House',
      address: 'Sedayu City Kelapa Gading SCBRC, Blok C No. 18, Kelapa Gading, Jakarta Utara',
      table: 'Meja Otomatis Amos Rexx #02',
      dateTime: 'Sabtu, 1 November 2026 • 14:00 - 18:00 WIB',
      status: 'confirmed',
      statusLabel: 'Terkonfirmasi',
      price: 'Rp 120.000',
    },
  ];

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.getMyEventRegistrations();
      if (res.success && res.data) {
        setRegistrations(res.data);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="ev-page-wrapper">
      {/* Hero Header */}
      <section className="ev-hero-section">
        <div className="ev-container">
          <nav aria-label="Breadcrumb" className="ev-breadcrumbs">
            <Link href="/dashboard">Dashboard</Link>
            <span className="separator">/</span>
            <span className="current">Pemesanan &amp; Reservasi</span>
          </nav>

          <h1 className="ev-hero-title">Riwayat Pemesanan &amp; Tiket Saya</h1>
          <p className="ev-hero-subtitle">
            Kelola seluruh reservasi meja parlor reguler, tiket masuk turnamen resmi WRC, dan status kehadiran sesi bermain Anda.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="ev-container" style={{ flex: 1, padding: '32px 0 64px 0' }}>
        {/* Stat Badges Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E4E0D8',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase' }}>
              Total Reservasi
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#183629', marginTop: '6px' }}>
              {registrations.length + sampleTableBookings.length} Sesi
            </div>
            <div style={{ fontSize: '12px', color: '#004F27', marginTop: '4px', fontWeight: 600 }}>
              Aktif &amp; Terkonfirmasi
            </div>
          </div>

          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E4E0D8',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase' }}>
              Pendaftaran Turnamen
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#004F27', marginTop: '6px' }}>
              {registrations.length} Tiket
            </div>
            <div style={{ fontSize: '12px', color: '#5A675E', marginTop: '4px' }}>
              Sirkuit Resmi WRC
            </div>
          </div>

          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E4E0D8',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase' }}>
              Meja Reguler
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#111E18', marginTop: '6px' }}>
              {sampleTableBookings.length} Sesi
            </div>
            <div style={{ fontSize: '12px', color: '#B8860B', marginTop: '4px', fontWeight: 600 }}>
              Game House Sedayu City
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeFilter === 'all' ? '1px solid #183629' : '1px solid #D7E6DB',
                backgroundColor: activeFilter === 'all' ? '#183629' : '#FFFFFF',
                color: activeFilter === 'all' ? '#FFFFFF' : '#2B3830',
              }}
            >
              Semua ({registrations.length + sampleTableBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('event')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeFilter === 'event' ? '1px solid #183629' : '1px solid #D7E6DB',
                backgroundColor: activeFilter === 'event' ? '#183629' : '#FFFFFF',
                color: activeFilter === 'event' ? '#FFFFFF' : '#2B3830',
              }}
            >
              Tiket Event ({registrations.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('meja')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeFilter === 'meja' ? '1px solid #183629' : '1px solid #D7E6DB',
                backgroundColor: activeFilter === 'meja' ? '#183629' : '#FFFFFF',
                color: activeFilter === 'meja' ? '#FFFFFF' : '#2B3830',
              }}
            >
              Meja Parlor ({sampleTableBookings.length})
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/events"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#183629',
                color: '#FAF8F5',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <Ticket size={15} />
              <span>Daftar Event Baru</span>
            </Link>
          </div>
        </div>

        {/* Bookings List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Event registrations */}
          {(activeFilter === 'all' || activeFilter === 'event') && registrations.map((reg) => (
            <div
              key={reg.pendaftaran_id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E4E0D8',
                padding: '24px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: '1 1 340px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: '#EBF6EE',
                  color: '#004F27',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Ticket size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      backgroundColor: '#DCF1E3',
                      color: '#004F27',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      TIKET TURNAMEN RESMI
                    </span>
                    <span style={{ fontSize: '11px', color: '#7A897F' }}>
                      #{reg.pendaftaran_id}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#111E18' }}>
                    {reg.event?.nama_event || 'Grand Riichi Championship'}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12.5px', color: '#5A675E' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} color="#004F27" />
                      {reg.event?.tanggal_formatted || reg.event?.tanggal_event || 'Jadwal Turnamen'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#004F27" />
                      {reg.event?.venue || 'Game House MahjongYuks'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#7A897F' }}>Status Pendaftaran</div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#004F27',
                    fontWeight: 700,
                    fontSize: '13px',
                    marginTop: '2px'
                  }}>
                    <CheckCircle size={14} color="#16A34A" />
                    <span>Terkonfirmasi</span>
                  </div>
                </div>

                <Link
                  href={`/events/${reg.event?.id || 1}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D7E6DB',
                    color: '#183629',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    backgroundColor: '#FAF8F5'
                  }}
                >
                  <span>Detail Event</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}

          {/* Table Regular Bookings */}
          {(activeFilter === 'all' || activeFilter === 'meja') && sampleTableBookings.map((b) => (
            <div
              key={b.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E4E0D8',
                padding: '24px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: '1 1 340px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF9EE',
                  color: '#B8860B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Layers size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      RESERVASI MEJA BERMAIN
                    </span>
                    <span style={{ fontSize: '11px', color: '#7A897F' }}>
                      #{b.id}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#111E18' }}>
                    {b.title}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12.5px', color: '#5A675E' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} color="#004F27" />
                      {b.dateTime}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#004F27" />
                      {b.venue}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#183629' }}>
                      <Layers size={13} color="#B8860B" />
                      {b.table}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#7A897F' }}>Biaya Sewa</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#004F27', marginTop: '2px' }}>
                    {b.price}
                  </div>
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: '#DCF1E3',
                  color: '#004F27',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  <CheckCircle size={14} color="#16A34A" />
                  <span>{b.statusLabel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

    </div>
  );
}
