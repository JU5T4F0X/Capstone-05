'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  Trophy,
  History,
  Settings,
  ShieldCheck,
  Bell,
  Search,
  Plus,
  Ticket,
  Clock,
  QrCode,
  Star,
  Users,
  ChevronRight,
  TrendingUp,
  Award,
  LogOut,
  Info,
  CheckCircle,
  X
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('ringkasan');
  const [eventCategory, setEventCategory] = useState<'all' | 'ranked' | 'casual' | 'workshop'>('all');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const events = [
    {
      id: 'ev-1',
      title: 'Jakarta Riichi Masters Autumn 2025',
      category: 'ranked',
      categoryLabel: 'COMPETITIVE (WRC RULE)',
      badgeClass: 'badge-dark',
      date: '25 Okt 2025, 14:00 WIB',
      desc: 'Turnamen berbobot 4 Hanchan dengan kalkulasi Uma/Oka resmi. Wasit terlisensi & live scoring screen.',
      venue: 'Mahjong Lounge Senopati',
      price: 'Rp 150.000',
      priceUnit: '/org',
      remaining: 'Sisa 2 Meja (8 Kursi)',
      isCritical: true,
      image: '/assets/event_1.jpg'
    },
    {
      id: 'ev-2',
      title: 'Friday Night Casual Mahjong & Dimsum',
      category: 'casual',
      categoryLabel: 'CASUAL FUN GATHERING',
      badgeClass: 'badge-mint',
      date: '24 Okt 2025, 19:00 WIB',
      desc: 'Sesi santai tanpa tekanan rating! Cocok untuk kumpul komunitas akhir pekan & networking sesama pecinta mahjong.',
      venue: 'Green Bamboo Club PIK',
      price: 'Rp 95.000',
      priceUnit: '(Free Snack)',
      remaining: 'Sisa 4 Meja',
      isCritical: false,
      image: '/assets/event_2.jpg'
    },
    {
      id: 'ev-3',
      title: 'Sunday Riichi Bootcamp: Cara Membaca Discard',
      category: 'workshop',
      categoryLabel: 'WORKSHOP & TAKTIK',
      badgeClass: 'badge-gold',
      date: '26 Okt 2025, 10:00 WIB',
      desc: 'Pelajari seni Suji, Kabe, dan teori pertahanan agar tidak kena Ron saat lawan Riichi. Panduan langsung dari Master.',
      venue: 'Bandung Tile Hub',
      price: 'Rp 75.000',
      priceUnit: '/org',
      remaining: 'Sisa 1 Meja (Kritis)',
      isCritical: true,
      image: '/assets/event_3.jpg'
    }
  ];

  const filteredEvents = events.filter(e => {
    if (eventCategory === 'all') return true;
    return e.category === eventCategory;
  });

  const handleBookNow = (title: string) => {
    setSelectedEvent(title);
    setShowBookingModal(true);
  };

  const confirmBooking = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setShowBookingModal(false);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F1FCF4' }}>
      
      {/* SIDEBAR */}
      <aside style={{
        width: '260px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #D7E6DB',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        gap: '24px',
        flexShrink: 0
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 4px' }}>
          <Image
            src="/assets/mahjongyuks_logo.png"
            alt="Mahjongyuks"
            width={58}
            height={44}
            priority
            style={{ objectFit: 'contain' }}
          />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#004F27', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
              Mahjongyuks
            </div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Salon & Arena
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div style={{
          backgroundColor: '#EBF6EE',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          gap: '4px'
        }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: '#004F27',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(0,79,39,0.2)'
            }}
          >
            ● Mode Pemain
          </button>
          <Link
            href={user?.role === 'admin' ? '/admin/dashboard' : '/admin/login'}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '8px',
              color: '#5A675E',
              fontSize: '11px',
              fontWeight: 600,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Mode Admin
          </Link>
        </div>

        {/* Navigation Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, overflowY: 'auto' }}>
          
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#7A897F', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 12px', marginBottom: '8px' }}>
              MANAJEMEN ARENA
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('ringkasan')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'ringkasan' ? 700 : 500,
                  backgroundColor: activeTab === 'ringkasan' ? '#004F27' : 'transparent',
                  color: activeTab === 'ringkasan' ? '#FFFFFF' : '#2B3830',
                  textAlign: 'left'
                }}
              >
                <LayoutDashboard size={16} />
                Ringkasan
              </button>

              <button
                type="button"
                onClick={() => setShowBookingModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#2B3830',
                  textAlign: 'left'
                }}
              >
                <Calendar size={16} />
                Reservasi Meja
              </button>

              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#2B3830',
                  textAlign: 'left'
                }}
              >
                <Trophy size={16} />
                Turnamen & Venue
              </button>

              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#2B3830',
                  textAlign: 'left'
                }}
              >
                <Clock size={16} />
                Jadwal Sesi
              </button>

              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#2B3830',
                  textAlign: 'left'
                }}
              >
                <Award size={16} />
                Peringkat & Skor
              </button>
            </nav>
          </div>

          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#7A897F', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 12px', marginBottom: '8px' }}>
              PANEL ADMIN
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link
                href="/admin/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#2B3830'
                }}
              >
                <Settings size={16} />
                Konfigurasi Meja
              </Link>
              <Link
                href="/admin/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#2B3830'
                }}
              >
                <ShieldCheck size={16} />
                Verifikasi Skor
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom VIP Badge & User Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid #E8F0EA' }}>
          <div style={{
            backgroundColor: '#D1FAE5',
            color: '#065F46',
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>VIP Gold Salon Jakarta</span>
            <span>✪</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #004F27', position: 'relative' }}>
                <Image src="/assets/avatar_kevin.jpg" alt="User" fill style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ fontSize: '12px' }}>
                <div style={{ fontWeight: 700, color: '#111E18' }}>{user?.nama || 'Kevin Sanjaya'}</div>
                <div style={{ fontSize: '10px', color: '#5A675E' }}>{user?.dan_rank || 'DAN 5'}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { logout(); router.push('/login'); }}
              title="Keluar"
              style={{ color: '#7A897F', padding: '6px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* TOP NAVBAR */}
        <header style={{
          height: '68px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #D7E6DB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}>
          {/* Quick Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              style={{
                backgroundColor: '#004F27',
                color: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              Dashboard
            </button>
            <button
              type="button"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#5A675E'
              }}
            >
              Event & Venue
            </button>
            <button
              type="button"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#5A675E'
              }}
            >
              Pemesanan
            </button>
            <button
              type="button"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#5A675E'
              }}
            >
              Leaderboard
            </button>
            <button
              type="button"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#5A675E'
              }}
            >
              Jadwal
            </button>
          </div>

          {/* Search, Notifications & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F1FCF4',
              borderRadius: 'var(--radius-full)',
              padding: '6px 16px',
              width: '240px',
              border: '1px solid #D7E6DB'
            }}>
              <Search size={15} color="#5A675E" style={{ marginRight: '8px' }} />
              <input
                type="text"
                placeholder="Cari meja, event, pemain..."
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  width: '100%',
                  color: '#111E18'
                }}
              />
            </div>

            <button
              type="button"
              style={{
                position: 'relative',
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: '#F1FCF4',
                color: '#2B3830'
              }}
            >
              <Bell size={18} />
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                border: '1.5px solid white'
              }} />
            </button>

            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #004F27',
              position: 'relative'
            }}>
              <Image src="/assets/avatar_kevin.jpg" alt="Kevin" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px' }}>
          
          {/* WELCOME BANNER */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div className="badge-pill badge-mint" style={{ marginBottom: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#004F27' }} />
                AKUN ATLET MAHJONGYUKS ID #0841
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111E18', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Halo, {user?.nama || 'Kevin Sanjaya'}! <span>🀄</span>
              </h1>
              <p style={{ fontSize: '13px', color: '#5A675E', marginTop: '4px' }}>
                Siap bertanding hari ini? Pantau jadwal babak penyisihan dan reservasi meja salon favoritmu.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#004F27',
                  border: '1px solid #D7E6DB',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <History size={16} />
                Riwayat Match
              </button>

              <button
                type="button"
                onClick={() => setShowBookingModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#004F27',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,79,39,0.25)'
                }}
              >
                <Plus size={16} />
                Reservasi Cepat
              </button>
            </div>
          </div>

          {/* 3 STATS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            
            {/* Card 1: Pemesanan Aktif */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: '20px 22px',
              border: '1px solid var(--border-card)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#7A897F', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    PEMESANAN AKTIF
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#111E18', marginTop: '4px' }}>
                    2 <span style={{ fontSize: '14px', fontWeight: 600, color: '#5A675E' }}>Tiket Meja</span>
                  </div>
                </div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#EBF6EE',
                  color: '#004F27',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ticket size={20} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #F0F5F1' }}>
                <span className="badge-pill badge-mint" style={{ fontSize: '11px', padding: '3px 8px' }}>
                  ● 1 Sesi Hari Ini
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#004F27', cursor: 'pointer' }}>
                  Detail Tiket →
                </span>
              </div>
            </div>

            {/* Card 2: Event Mendatang */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: '20px 22px',
              border: '1px solid var(--border-card)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#7A897F', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    EVENT MENDATANG
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#111E18', marginTop: '4px' }}>
                    3 <span style={{ fontSize: '14px', fontWeight: 600, color: '#5A675E' }}>Turnamen</span>
                  </div>
                </div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#EBF6EE',
                  color: '#004F27',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Trophy size={20} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #F0F5F1' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#004F27', backgroundColor: '#E2F2E7', padding: '3px 8px', borderRadius: '4px' }}>
                  Terdaftar Resmi
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#5A675E' }}>
                  Slot Aman (100%)
                </span>
              </div>
            </div>

            {/* Card 3: Total Poin Riichi */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: '20px 22px',
              border: '1px solid var(--border-card)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#7A897F', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    TOTAL POIN RIICHI (MUSIM INI)
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#111E18', marginTop: '4px' }}>
                    14,850 <span style={{ fontSize: '13px', fontWeight: 800, color: '#855E00' }}>PTS</span>
                  </div>
                </div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#FFF4D6',
                  color: '#855E00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Award size={22} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #F0F5F1' }}>
                <span className="badge-pill badge-mint" style={{ fontSize: '11px', padding: '3px 8px' }}>
                  Rank #4 Master JKT
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <TrendingUp size={12} /> +420 pts minggu ini
                </span>
              </div>
            </div>

          </div>

          {/* UPCOMING MATCH HIGHLIGHT CARD (DARK GREEN HERO) */}
          <div style={{
            background: 'linear-gradient(135deg, #004321 0%, #005A2E 100%)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            padding: '24px 28px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              {/* Seat Badge (Nan / South) */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#98F6C2' }}>南</span>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>NAN</span>
              </div>

              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(152, 246, 194, 0.2)',
                  color: '#98F6C2',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginBottom: '6px'
                }}>
                  <Clock size={12} />
                  JADWAL TERDEKAT HARI INI • Mulai 19:00 WIB (Sisa 3 Jam)
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: '6px' }}>
                  Grand Riichi Jakarta Open 2025
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: '#DDECE1', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color="#98F6C2" /> Mahjong Lounge Senopati
                  </span>
                  <span>•</span>
                  <span>🀄 Meja 03 (Automatic Hanma)</span>
                  <span>•</span>
                  <span>Kursi Selatan (Nan)</span>
                </div>
              </div>
            </div>

            {/* Check-In Code & QR Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#98F6C2', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  KODE CHECK-IN
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '1px' }}>
                  #MJK-8821
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                style={{
                  backgroundColor: '#FFDF94',
                  color: '#4B3600',
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  cursor: 'pointer'
                }}
              >
                <QrCode size={18} />
                Tampilkan QR Tiket
              </button>
            </div>
          </div>

          {/* EVENTS SECTION */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#7A897F', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  TURNAMEN & SALON GATHERING
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111E18' }}>
                  Event Mahjong Terbaru & Populer
                </h3>
              </div>

              {/* Filter Tabs */}
              <div style={{
                backgroundColor: '#EBF6EE',
                padding: '4px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                gap: '4px'
              }}>
                {(['all', 'ranked', 'casual', 'workshop'] as const).map(cat => {
                  const labels = {
                    all: 'Semua',
                    ranked: 'Competitive (Ranked)',
                    casual: 'Casual Fun',
                    workshop: 'Pemula & Workshop'
                  };
                  const isSelected = eventCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEventCategory(cat)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '12px',
                        fontWeight: isSelected ? 700 : 500,
                        backgroundColor: isSelected ? '#004F27' : 'transparent',
                        color: isSelected ? '#FFFFFF' : '#3F4940'
                      }}
                    >
                      {labels[cat]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {filteredEvents.map(event => (
                <div
                  key={event.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border-card)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  {/* Image with Tag & Date */}
                  <div style={{ position: 'relative', height: '170px', width: '100%' }}>
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: event.badgeClass === 'badge-dark' ? '#004F27' : event.badgeClass === 'badge-mint' ? '#EBF6EE' : '#FFDF94',
                      color: event.badgeClass === 'badge-dark' ? '#98F6C2' : event.badgeClass === 'badge-mint' ? '#004F27' : '#584300',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.5px'
                    }}>
                      {event.categoryLabel}
                    </div>

                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(4px)',
                      color: '#FFFFFF',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Calendar size={12} />
                      {event.date}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#111E18', lineHeight: '1.3' }}>
                      {event.title}
                    </h4>

                    <p style={{ fontSize: '12px', color: '#5A675E', lineHeight: '1.45', flex: 1 }}>
                      {event.desc}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#3F4940', paddingTop: '8px', borderTop: '1px solid #F0F5F1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#7A897F' }}>Venue:</span>
                        <strong style={{ color: '#111E18' }}>{event.venue}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#7A897F' }}>Biaya Registrasi:</span>
                        <div>
                          <strong style={{ color: '#004F27', fontSize: '13px' }}>{event.price}</strong>
                          <span style={{ fontSize: '11px', color: '#5A675E', marginLeft: '3px' }}>{event.priceUnit}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#7A897F' }}>Ketersediaan:</span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: event.isCritical ? '#B91C1C' : '#15803D',
                          backgroundColor: event.isCritical ? '#FEE2E2' : '#DCFCE7',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {event.remaining}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleBookNow(event.title)}
                        style={{
                          flex: 1,
                          backgroundColor: '#004F27',
                          color: '#FFFFFF',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '13px',
                          fontWeight: 700,
                          textAlign: 'center'
                        }}
                      >
                        Pesan Sekarang
                      </button>
                      <button
                        type="button"
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: '#EBF6EE',
                          color: '#004F27',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Info Detail"
                      >
                        <Info size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM TWO COLUMNS: VENUES & LEADERBOARD */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
            
            {/* LEFT: VENUES */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#7A897F', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    TEMPAT BERMAIN TERVERIFIKASI
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18' }}>
                    Venue Rekomendasi Kerja Sama
                  </h3>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#004F27', cursor: 'pointer' }}>
                  Lihat Semua (14 Salon) ›
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Venue 1: Senopati */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-card)',
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ width: '130px', height: '110px', borderRadius: '12px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                    <Image src="/assets/venue_senopati.jpg" alt="Mahjong Lounge Senopati" fill style={{ objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: '#FFDF94',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}>
                      <Star size={10} fill="#FFDF94" /> 4.9
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111E18' }}>
                          Mahjong Lounge Senopati
                        </h4>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#065F46', backgroundColor: '#D1FAE5', padding: '2px 6px', borderRadius: '4px' }}>
                          Official Partner
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#5A675E', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={11} /> Jl. Senopati No. 42, Jakarta Selatan
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#3F4940', backgroundColor: '#EBF6EE', padding: '2px 6px', borderRadius: '4px' }}>
                          12 Meja Otomatis
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#3F4940', backgroundColor: '#EBF6EE', padding: '2px 6px', borderRadius: '4px' }}>
                          Full AC
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#3F4940', backgroundColor: '#EBF6EE', padding: '2px 6px', borderRadius: '4px' }}>
                          Private VIP Room
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #F0F5F1' }}>
                      <span style={{ fontSize: '11px', color: '#6F7A71' }}>Buka 11:00 - 02:00 WIB</span>
                      <button
                        type="button"
                        onClick={() => handleBookNow('Mahjong Lounge Senopati')}
                        style={{
                          backgroundColor: '#EBF6EE',
                          color: '#004F27',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        Pilih Meja Sesi
                      </button>
                    </div>
                  </div>
                </div>

                {/* Venue 2: PIK */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-card)',
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ width: '130px', height: '110px', borderRadius: '12px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                    <Image src="/assets/venue_pik.jpg" alt="Green Bamboo Club PIK" fill style={{ objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: '#FFDF94',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}>
                      <Star size={10} fill="#FFDF94" /> 4.8
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111E18' }}>
                          Green Bamboo Club PIK
                        </h4>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#1E40AF', backgroundColor: '#DBEAFE', padding: '2px 6px', borderRadius: '4px' }}>
                          Arena Terbuka
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#5A675E', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={11} /> Ruko Crown Golf Boulevard, PIK, Jakarta Utara
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#3F4940', backgroundColor: '#EBF6EE', padding: '2px 6px', borderRadius: '4px' }}>
                          16 Meja Standar & Mat
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#3F4940', backgroundColor: '#EBF6EE', padding: '2px 6px', borderRadius: '4px' }}>
                          Dimsum Bar
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#3F4940', backgroundColor: '#EBF6EE', padding: '2px 6px', borderRadius: '4px' }}>
                          Free Valet
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #F0F5F1' }}>
                      <span style={{ fontSize: '11px', color: '#6F7A71' }}>Buka 13:00 - 24:00 WIB</span>
                      <button
                        type="button"
                        onClick={() => handleBookNow('Green Bamboo Club PIK')}
                        style={{
                          backgroundColor: '#EBF6EE',
                          color: '#004F27',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        Pilih Meja Sesi
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT: LEADERBOARD */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#7A897F', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    MUSIM GUGUR (AUTUMN 2025)
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18' }}>
                    Top 5 Leaderboard
                  </h3>
                </div>
                <span className="badge-pill badge-gold" style={{ fontSize: '10px', padding: '2px 8px' }}>
                  Live Elo
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                
                {/* Rank 1: Budi Pratama */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-card)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#FFDF94',
                      color: '#664A00',
                      fontWeight: 800,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      1
                    </div>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                      <Image src="/assets/avatar_budi.png" alt="Budi" fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111E18' }}>Budi Pratama</span>
                        <span style={{ fontSize: '9px', fontWeight: 800, backgroundColor: '#E5E7EB', color: '#374151', padding: '1px 5px', borderRadius: '3px' }}>
                          DAN 7
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6F7A71' }}>
                        Win Rate 34.2% • 48 Hanchan
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#004F27' }}>28,400</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#7A897F' }}>PTS</div>
                  </div>
                </div>

                {/* Rank 2: Amanda Wijaya */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-card)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#E5E7EB',
                      color: '#374151',
                      fontWeight: 800,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      2
                    </div>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                      <Image src="/assets/avatar_amanda.png" alt="Amanda" fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111E18' }}>Amanda Wijaya</span>
                        <span style={{ fontSize: '9px', fontWeight: 800, backgroundColor: '#E5E7EB', color: '#374151', padding: '1px 5px', borderRadius: '3px' }}>
                          DAN 6
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6F7A71' }}>
                        Win Rate 31.8% • 42 Hanchan
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#004F27' }}>24,150</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#7A897F' }}>PTS</div>
                  </div>
                </div>

                {/* Rank 3: Rendy Tanaka */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-card)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#FDE68A',
                      color: '#78350F',
                      fontWeight: 800,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      3
                    </div>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                      <Image src="/assets/avatar_rendy.png" alt="Rendy" fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111E18' }}>Rendy Tanaka</span>
                        <span style={{ fontSize: '9px', fontWeight: 800, backgroundColor: '#E5E7EB', color: '#374151', padding: '1px 5px', borderRadius: '3px' }}>
                          DAN 5
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6F7A71' }}>
                        Win Rate 28.5% • 39 Hanchan
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#004F27' }}>19,800</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#7A897F' }}>PTS</div>
                  </div>
                </div>

                {/* Rank 4: Kevin Sanjaya (Anda - Current User Highlighted in Dark Green) */}
                <div style={{
                  background: 'linear-gradient(135deg, #004F27 0%, #006834 100%)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 14px rgba(0,79,39,0.22)',
                  color: '#FFFFFF'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#98F6C2',
                      color: '#004F27',
                      fontWeight: 800,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      4
                    </div>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', position: 'relative', border: '1.5px solid #98F6C2' }}>
                      <Image src="/assets/avatar_kevin.jpg" alt="Kevin" fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800 }}>Kevin Sanjaya (Anda)</span>
                        <span style={{ fontSize: '9px', fontWeight: 800, backgroundColor: 'rgba(255,255,255,0.2)', color: '#98F6C2', padding: '1px 5px', borderRadius: '3px' }}>
                          DAN 5
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#DDECE1' }}>
                        Target berikutnya: 19,801 pts (+4,951)
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFDF94' }}>14,850</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#DDECE1' }}>PTS</div>
                  </div>
                </div>

                {/* Rank 5: Felicia Zhang */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-card)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#F3F4F6',
                      color: '#6B7280',
                      fontWeight: 800,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      5
                    </div>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                      <Image src="/assets/avatar_felicia.png" alt="Felicia" fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111E18' }}>Felicia Zhang</span>
                        <span style={{ fontSize: '9px', fontWeight: 800, backgroundColor: '#E5E7EB', color: '#374151', padding: '1px 5px', borderRadius: '3px' }}>
                          DAN 4
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6F7A71' }}>
                        Win Rate 26.2% • 31 Hanchan
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#004F27' }}>13,200</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#7A897F' }}>PTS</div>
                  </div>
                </div>

              </div>

              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#004F27', cursor: 'pointer' }}>
                  Lihat Seluruh Peringkat & Riwayat Hanchan →
                </span>
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* QR TICKET MODAL */}
      {showQrModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '380px',
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-hover)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                color: '#7A897F'
              }}
            >
              <X size={20} />
            </button>

            <div className="badge-pill badge-mint" style={{ marginBottom: '12px' }}>
              ● TIKET CHECK-IN VALID
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18' }}>
              Grand Riichi Jakarta Open 2025
            </h3>
            <p style={{ fontSize: '12px', color: '#5A675E', marginTop: '2px' }}>
              Tunjukkan QR ini ke staf resepsionis atau scan di meja otomatis
            </p>

            {/* Simulated QR Code Box */}
            <div style={{
              margin: '20px auto',
              width: '200px',
              height: '200px',
              backgroundColor: '#F1FCF4',
              borderRadius: '16px',
              border: '2px dashed #004F27',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <QrCode size={110} color="#004F27" />
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#004F27', letterSpacing: '1px' }}>
                #MJK-8821
              </div>
            </div>

            <div style={{
              backgroundColor: '#EBF6EE',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#2B3830',
              lineHeight: '1.4'
            }}>
              <div><strong>Pemain:</strong> Kevin Sanjaya (NAN - Kursi Selatan)</div>
              <div><strong>Meja:</strong> Meja 03 (Automatic Hanma)</div>
              <div><strong>Waktu Mulai:</strong> Hari ini, 19:00 WIB</div>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="btn-primary"
              style={{ marginTop: '16px' }}
            >
              Tutup Tiket
            </button>
          </div>
        </div>
      )}

      {/* QUICK RESERVATION MODAL */}
      {showBookingModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '440px',
            padding: '28px 24px',
            boxShadow: 'var(--shadow-hover)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setShowBookingModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                color: '#7A897F'
              }}
            >
              <X size={20} />
            </button>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle size={56} color="#16A34A" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111E18' }}>
                  Reservasi Berhasil Dipesan!
                </h3>
                <p style={{ fontSize: '13px', color: '#5A675E', marginTop: '6px' }}>
                  Tiket dan nomor kursi telah tercatat di profil Anda.
                </p>
              </div>
            ) : (
              <div>
                <div className="badge-pill badge-mint" style={{ marginBottom: '10px' }}>
                  🀄 SIMULASI RESERVASI CEPAT
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111E18' }}>
                  {selectedEvent ? selectedEvent : 'Reservasi Meja Salon'}
                </h3>
                <p style={{ fontSize: '12px', color: '#5A675E', marginTop: '2px', marginBottom: '16px' }}>
                  Maksimal 4 pemain per meja sesuai standar Mahjongyuks.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Pilih Venue</label>
                    <div className="form-input-wrapper">
                      <select className="form-input" defaultValue="senopati">
                        <option value="senopati">Mahjong Lounge Senopati (12 Meja)</option>
                        <option value="pik">Green Bamboo Club PIK (16 Meja)</option>
                        <option value="sedayu">Alicia Bakery Sedayu City (Homebase)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mode Permainan</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          backgroundColor: '#004F27',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      >
                        Competitive (Riichi)
                      </button>
                      <button
                        type="button"
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          backgroundColor: '#EBF6EE',
                          color: '#3F4940',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        Casual Gathering
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pilih Meja Tersedia</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {['Meja 01', 'Meja 02', 'Meja 03', 'Meja 04'].map((t, i) => (
                        <div
                          key={t}
                          style={{
                            padding: '10px 4px',
                            textAlign: 'center',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: i === 2 ? '#004F27' : '#F1FCF4',
                            color: i === 2 ? '#FFFFFF' : '#111E18',
                            border: i === 2 ? '1px solid #004F27' : '1px solid #D7E6DB',
                            cursor: 'pointer'
                          }}
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#FFF8E6',
                    border: '1px solid #FFE4A3',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#664A00',
                    lineHeight: '1.4'
                  }}>
                    💡 <em>Simulasi Pembayaran:</em> Tagihan akan otomatis dibuat status <strong>Pending</strong> dan siap diverifikasi admin kasir.
                  </div>

                  <button
                    type="button"
                    onClick={confirmBooking}
                    className="btn-primary"
                    style={{ marginTop: '6px' }}
                  >
                    Konfirmasi Reservasi (Simulasi)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
