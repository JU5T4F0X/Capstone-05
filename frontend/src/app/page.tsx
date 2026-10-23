'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface EventItem {
  id: string;
  badge: string;
  badgeType: 'hot' | 'mint' | 'yellow';
  title: string;
  venue: string;
  dateTime: string;
  price: string;
  description: string;
  tags: string[];
  image: string;
  seatsRemaining: number;
}

const FEATURED_EVENTS: EventItem[] = [
  {
    id: 'ev-1',
    badge: '🔥 POPULER • MODE KOMPETITIF',
    badgeType: 'hot',
    title: 'Jakarta Riichi Masters: Autumn Clash',
    venue: 'SENOPATI PARLOR',
    dateTime: '28 Okt 2025 • 13:00 WIB',
    price: 'Rp 150.000',
    description: 'Turnamen resmi 4 hanchan WRC. Poin terhitung ke klasemen Dan/Kyu nasional dengan wasit tersertifikasi.',
    tags: ['🤖 Amos Rexx III', '🏆 Prize Pool Rp 5 Juta', '4 Kursi Tersisa'],
    image: '/landing/event-clash.jpg',
    seatsRemaining: 4,
  },
  {
    id: 'ev-2',
    badge: '🍵 CASUAL FUN & DIMSUM',
    badgeType: 'mint',
    title: 'Friday Night Casual & Dimsum Tiles',
    venue: 'GREEN BAMBOO CLUB PIK',
    dateTime: '24 Okt 2025 • 19:30 WIB',
    price: 'Rp 95.000',
    description: 'Main santai tanpa stres rating. Tiket sudah termasuk 2 porsi siomay dimsum hangat dan free-flow Roasted Oolong Tea.',
    tags: ['🥟 Free Dimsum', '🍵 Oolong Refill', 'Santai & Ramah'],
    image: '/landing/event-dimsum.jpg',
    seatsRemaining: 8,
  },
  {
    id: 'ev-3',
    badge: '⭐ PEMULA FRIENDLY',
    badgeType: 'yellow',
    title: 'Beginner Workshop: Mahjong 101 & Yaku Mastery',
    venue: 'BANDUNG TILE SOCIETY',
    dateTime: '26 Okt 2025 • 10:00 WIB',
    price: 'Rp 75.000',
    description: 'Belajar dari nol tanpa takut bingung! Diajarkan cara membaca ubin, Riichi, Tanyao, Pinfu, dan etika bermain salon modern.',
    tags: ['🎓 Coach Berpengalaman', '📄 Cheat Sheet Yaku'],
    image: '/landing/event-workshop.jpg',
    seatsRemaining: 6,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  const [selectedCity, setSelectedCity] = useState('Senopati, Jakarta Selatan');
  const [selectedSchedule, setSelectedSchedule] = useState('Akhir Pekan Ini (Sabtu/Minggu)');
  const [selectedFormat, setSelectedFormat] = useState('Riichi Competitive (WRC Rule)');
  const [selectedPrice, setSelectedPrice] = useState('Rp 100.000 - Rp 200.000');
  
  // Modals state
  const [showRulebookModal, setShowRulebookModal] = useState(false);
  const [showPartnershipModal, setShowPartnershipModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingActionTarget, setPendingActionTarget] = useState<string>('Pemesanan Meja');

  // Secure booking handler: prevents unauthorized access to player dashboard
  const handleSecureBooking = (targetName: string = 'Pemesanan Meja') => {
    if (!token || !user) {
      setPendingActionTarget(targetName);
      setShowAuthModal(true);
      return;
    }

    if (user.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', overflowX: 'hidden', backgroundColor: '#EEFDF2', color: '#111E18', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div style={{
        backgroundColor: '#063A24',
        color: '#FFFFFF',
        padding: '7px 16px',
        fontSize: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{
          maxWidth: '1180px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{
              backgroundColor: '#FFC72C',
              color: '#111E18',
              fontWeight: 800,
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '999px',
              letterSpacing: '0.5px',
              flexShrink: 0
            }}>
              TURNAMEN
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Image src="/landing/mahjong-tile.png" alt="tile" width={14} height={14} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Jakarta Riichi Masters Autumn 2025 • Pendaftaran Dibuka — Meja Otomatis Amos Rexx III
              </span>
            </span>
          </div>
          <Link 
            href="/register"
            style={{
              color: '#98F6C2',
              fontWeight: 700,
              fontSize: '11px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Daftar Sekarang →
          </Link>
        </div>
      </div>

      {/* 2. REFINED, COMPACT & GUARANTEED NO-OVERFLOW MAIN NAVBAR */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #D7E6DB',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 10px rgba(0, 79, 39, 0.04)',
        width: '100%'
      }}>
        <div style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Logo Brand (Official MahjongYuks Logo) */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <Image 
              src="/assets/mahjongyuks_logo.png" 
              alt="Mahjongyuks" 
              width={140} 
              height={42} 
              style={{ objectFit: 'contain' }}
              priority
            />
          </Link>

          {/* Navigation Links (Center: 1 Line, Compact, Elegantly Spaced) */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="hidden md:flex">
            <Link 
              href="/"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#EBF6EE',
                color: '#004F27',
                fontWeight: 700,
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}
            >
              Beranda
            </Link>
            <a 
              href="#events"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                color: '#2B3830',
                fontWeight: 600,
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}
            >
              Event
            </a>
            <a 
              href="#venues"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                color: '#2B3830',
                fontWeight: 600,
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}
            >
              Venue
            </a>
            <a 
              href="#leaderboard"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                color: '#2B3830',
                fontWeight: 600,
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}
            >
              Leaderboard
            </a>
            <a 
              href="#komunitas"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                color: '#2B3830',
                fontWeight: 600,
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}
            >
              Komunitas
            </a>
          </nav>

          {/* Right Action Controls: Fits comfortably, no overflow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {!user ? (
              <>
                <Link
                  href="/login"
                  style={{
                    padding: '6px 14px',
                    color: '#004F27',
                    fontWeight: 700,
                    fontSize: '13px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    textDecoration: 'none'
                  }}
                >
                  Masuk
                </Link>

                <button
                  onClick={() => handleSecureBooking('Reservasi Meja Salon')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: '#004F27',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    boxShadow: '0 3px 10px rgba(0, 79, 39, 0.2)',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  Pesan Meja
                </button>
              </>
            ) : (
              <>
                <Link
                  href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#EBF6EE',
                    color: '#004F27',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    border: '1px solid #D7E6DB'
                  }}
                >
                  {user.role === 'admin' ? 'Panel Admin →' : 'Dashboard →'}
                </Link>

                <button
                  onClick={() => handleSecureBooking('Reservasi Meja Salon')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: '#004F27',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    boxShadow: '0 3px 10px rgba(0, 79, 39, 0.2)',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  Pesan Meja
                </button>

                <button
                  onClick={logout}
                  title="Keluar"
                  style={{
                    color: '#7A897F',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: 'none',
                    border: 'none'
                  }}
                >
                  Keluar
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 20px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'center'
        }}>
          {/* Left Text Column */}
          <div>
            {/* Badges bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: '999px',
                border: '1px solid #D7E6DB',
                fontSize: '11px',
                fontWeight: 800,
                color: '#004F27',
                letterSpacing: '0.6px'
              }}>
                <span style={{ color: '#D97706' }}>🀀 🀁 🀂 🀃</span>
                PLATFORM RESERVASI SALON & TURNAMEN MAHJONG #1 DI INDONESIA
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#004F27'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                SERTIFIKASI WRC & EMA
              </div>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: '48px',
              lineHeight: 1.15,
              fontWeight: 800,
              color: '#0B291B',
              letterSpacing: '-1px',
              marginBottom: '20px'
            }}>
              Your Next{' '}
              <span style={{
                color: '#78530C',
                textDecoration: 'underline',
                textDecorationColor: '#004F27',
                textUnderlineOffset: '6px',
                textDecorationThickness: '3px'
              }}>
                Mahjong
              </span>{' '}
              Experience Starts Here.
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#2B3830',
              fontWeight: 400,
              marginBottom: '32px',
              maxWidth: '560px'
            }}>
              Temukan keseruan bermain Riichi Mahjong di salon modern ber-AC dengan meja pengocok otomatis Amos Rexx III. Ikuti turnamen berstandar WRC, booking kursi meja santai bersama kawan, dan panjat klasemen Elo nasional pertama di Indonesia.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}>
              <a
                href="#events"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#004F27',
                  color: '#FFFFFF',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '15px',
                  boxShadow: '0 6px 18px rgba(0, 79, 39, 0.25)',
                  transition: 'transform 0.2s',
                  textDecoration: 'none'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Jelajahi Event & Booking Meja →
              </a>

              <button
                onClick={() => setShowRulebookModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#111E18',
                  padding: '14px 22px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: '1px solid #D7E6DB',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                📖 Cara Bermain & Rulebook 101
              </button>
            </div>

            {/* 4 Stat Badges Under Hero */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px'
            }}>
              <div style={{ backgroundColor: '#E4F4E8', padding: '12px 14px', borderRadius: '10px', border: '1px solid #D2E9D8' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#004F27' }}>14+</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#5A675E' }}>Venue Terverifikasi</div>
              </div>
              <div style={{ backgroundColor: '#E4F4E8', padding: '12px 14px', borderRadius: '10px', border: '1px solid #D2E9D8' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#004F27' }}>1.200+</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#5A675E' }}>Pemain Aktif</div>
              </div>
              <div style={{ backgroundColor: '#E4F4E8', padding: '12px 14px', borderRadius: '10px', border: '1px solid #D2E9D8' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#004F27' }}>WRC / EMA</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#5A675E' }}>Standar Resmi</div>
              </div>
              <div style={{ backgroundColor: '#E4F4E8', padding: '12px 14px', borderRadius: '10px', border: '1px solid #D2E9D8' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#004F27' }}>100% AMOS</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#5A675E' }}>Auto-Shuffle Rexx</div>
              </div>
            </div>
          </div>

          {/* Right Visual Card */}
          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 79, 39, 0.16)',
              position: 'relative',
              backgroundColor: '#003B1D'
            }}>
              {/* Image */}
              <div style={{ position: 'relative', height: '420px', width: '100%' }}>
                <Image
                  src="/landing/hero-parlor.jpg"
                  alt="Live di Senopati Parlor"
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </div>

              {/* Glass Tag Top Left */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 800,
                color: '#004F27',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
                LIVE DI SENOPATI PARLOR
              </div>

              {/* Floating Bottom Card Over Image */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      backgroundColor: '#FEE2E2',
                      color: '#DC2626',
                      fontWeight: 800,
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '999px'
                    }}>
                      SISA 3 KURSI
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#7A897F' }}>
                      Sesi 19:00 WIB
                    </span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#111E18' }}>
                    Autumn Masters Cup #3
                  </div>
                  <div style={{ fontSize: '12px', color: '#5A675E' }}>
                    Senopati Parlor • Amos Rexx Table 02
                  </div>
                </div>

                <button
                  onClick={() => handleSecureBooking('Autumn Masters Cup #3')}
                  style={{
                    backgroundColor: '#FFC72C',
                    color: '#111E18',
                    padding: '10px 22px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '13px',
                    boxShadow: '0 4px 10px rgba(255, 199, 44, 0.35)',
                    cursor: 'pointer'
                  }}
                >
                  Pesan
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. QUICK SEARCH & FILTER BAR */}
      <section style={{ maxWidth: '1280px', margin: '30px auto 40px auto', padding: '0 24px' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px 28px',
          boxShadow: '0 8px 30px rgba(0, 79, 39, 0.08)',
          border: '1px solid #D7E6DB'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr)) 160px',
            gap: '16px',
            alignItems: 'flex-end'
          }}>
            {/* 1. Kota & Area */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#004F27', letterSpacing: '0.5px', marginBottom: '6px' }}>
                📍 KOTA & AREA
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#EBF6EE',
                  border: '1px solid #D7E6DB',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111E18',
                  outline: 'none'
                }}
              >
                <option value="Senopati, Jakarta Selatan">Senopati, Jakarta Selatan</option>
                <option value="Pantai Indah Kapuk (PIK)">Pantai Indah Kapuk (PIK)</option>
                <option value="Dago Atrium, Bandung">Dago Atrium, Bandung</option>
                <option value="Semua Cabang Venue">Semua Cabang Venue</option>
              </select>
            </div>

            {/* 2. Jadwal Sesi */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#004F27', letterSpacing: '0.5px', marginBottom: '6px' }}>
                📅 JADWAL SESI
              </label>
              <select
                value={selectedSchedule}
                onChange={(e) => setSelectedSchedule(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#EBF6EE',
                  border: '1px solid #D7E6DB',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111E18',
                  outline: 'none'
                }}
              >
                <option value="Akhir Pekan Ini (Sabtu/Minggu)">Akhir Pekan Ini (Sabtu/Minggu)</option>
                <option value="Hari Ini (Malam 19:00)">Hari Ini (Malam 19:00)</option>
                <option value="Besok Siang (13:00)">Besok Siang (13:00)</option>
                <option value="Jadwal Mendatang 7 Hari">Jadwal Mendatang 7 Hari</option>
              </select>
            </div>

            {/* 3. Format Sesi */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#004F27', letterSpacing: '0.5px', marginBottom: '6px' }}>
                🀄 FORMAT SESI
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#EBF6EE',
                  border: '1px solid #D7E6DB',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111E18',
                  outline: 'none'
                }}
              >
                <option value="Riichi Competitive (WRC Rule)">Riichi Competitive (WRC Rule)</option>
                <option value="Casual Free Play + Dimsum">Casual Free Play + Dimsum</option>
                <option value="Beginner Coaching 101">Beginner Coaching 101</option>
                <option value="Semua Mode Permainan">Semua Mode Permainan</option>
              </select>
            </div>

            {/* 4. Biaya Masuk */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#004F27', letterSpacing: '0.5px', marginBottom: '6px' }}>
                💳 BIAYA MASUK
              </label>
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#EBF6EE',
                  border: '1px solid #D7E6DB',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111E18',
                  outline: 'none'
                }}
              >
                <option value="Rp 100.000 - Rp 200.000">Rp 100.000 - Rp 200.000</option>
                <option value="Di Bawah Rp 100.000">Di Bawah Rp 100.000</option>
                <option value="VIP Meja Privat (Rp 400.000+)">VIP Meja Privat (Rp 400.000+)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => handleSecureBooking('Pencarian Meja Langsung')}
              style={{
                backgroundColor: '#004F27',
                color: '#FFFFFF',
                padding: '13px 18px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                height: '45px',
                boxShadow: '0 4px 12px rgba(0, 79, 39, 0.25)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Cari Meja
            </button>
          </div>

          {/* Trending Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #EBF6EE' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#7A897F', letterSpacing: '0.5px' }}>
              TREN SAAT INI:
            </span>
            {[
              '#SenopatiWeekend',
              '#FridayNightPIK',
              '#FreeCoachingNewbie',
              '#DanRankedArena',
            ].map((tag) => (
              <span
                key={tag}
                onClick={() => handleSecureBooking(tag)}
                style={{
                  backgroundColor: '#EBF6EE',
                  color: '#004F27',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 5. EVENT PILIHAN MINGGU INI */}
      <section id="events" style={{ maxWidth: '1280px', margin: '0 auto', padding: '30px 24px 50px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#004F27', letterSpacing: '0.8px', marginBottom: '4px' }}>
              KATALOG EVENT UNGGULAN
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0B291B', letterSpacing: '-0.5px', margin: 0 }}>
              Event Pilihan Minggu Ini
            </h2>
            <p style={{ fontSize: '14px', color: '#5A675E', margin: '4px 0 0 0' }}>
              Dari turnamen resmi bersertifikasi hingga sesi santai berteman teh oolong & dimsum.
            </p>
          </div>
          <button
            onClick={() => handleSecureBooking('Katalog Semua Sesi')}
            style={{
              color: '#004F27',
              fontWeight: 700,
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              background: 'none',
              border: 'none'
            }}
          >
            Lihat Semua 38 Sesi →
          </button>
        </div>

        {/* 3 Event Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {FEATURED_EVENTS.map((ev) => (
            <div
              key={ev.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid #D7E6DB',
                boxShadow: '0 8px 24px rgba(0, 79, 39, 0.06)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Event Image Banner */}
              <div style={{ position: 'relative', height: '190px', width: '100%', backgroundColor: '#0B291B' }}>
                <Image
                  src={ev.image}
                  alt={ev.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
                {/* Badge Top Left */}
                <div style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  backgroundColor:
                    ev.badgeType === 'hot' ? '#DC2626' : ev.badgeType === 'mint' ? '#98F6C2' : '#FFC72C',
                  color: ev.badgeType === 'mint' ? '#003B1D' : ev.badgeType === 'hot' ? '#FFFFFF' : '#111E18',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {ev.badge}
                </div>

                {/* Date overlay bottom right */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(4px)',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  {ev.dateTime}
                </div>
              </div>

              {/* Event Body */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#004F27', letterSpacing: '0.6px' }}>
                    {ev.venue}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#004F27' }}>
                    {ev.price} <span style={{ fontSize: '12px', fontWeight: 500, color: '#7A897F' }}>/seat</span>
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', marginBottom: '8px', lineHeight: 1.3 }}>
                  {ev.title}
                </h3>

                <p style={{ fontSize: '13px', color: '#5A675E', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                  {ev.description}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {ev.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        backgroundColor: tag.includes('Tersisa') ? '#DCFCE7' : '#F1FCF4',
                        color: tag.includes('Tersisa') ? '#16A34A' : '#2B3830',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #D7E6DB'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Secure CTA Button */}
                <button
                  onClick={() => handleSecureBooking(ev.title)}
                  style={{
                    backgroundColor: ev.id === 'ev-3' ? '#DDECE1' : '#004F27',
                    color: ev.id === 'ev-3' ? '#004F27' : '#FFFFFF',
                    padding: '12px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    width: '100%',
                    boxShadow: ev.id === 'ev-3' ? 'none' : '0 4px 12px rgba(0, 79, 39, 0.2)'
                  }}
                >
                  {ev.id === 'ev-1'
                    ? 'Pesan Kursi Sekarang →'
                    : ev.id === 'ev-2'
                    ? 'Pesan Kursi Santai →'
                    : 'Daftar Kelas Workshop →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. LANGKAH PRAKTIS - CARA MEMULAI */}
      <section style={{ backgroundColor: '#E4F4E8', padding: '60px 24px', borderTop: '1px solid #D2E9D8', borderBottom: '1px solid #D2E9D8' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#004F27', letterSpacing: '0.8px', marginBottom: '4px' }}>
            LANGKAH PRAKTIS
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0B291B', letterSpacing: '-0.5px', marginBottom: '10px' }}>
            Cara Memulai di Mahjongyuks
          </h2>
          <p style={{ fontSize: '15px', color: '#5A675E', maxWidth: '600px', margin: '0 auto' }}>
            Nikmati kemudahan reservasi salon mahjong berstandar internasional dalam tiga sentuhan mudah.
          </p>
        </div>

        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {/* Step 01 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            padding: '28px',
            border: '1px solid #D7E6DB',
            boxShadow: '0 4px 16px rgba(0, 79, 39, 0.05)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#004F27',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#DDECE1' }}>01</span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', marginBottom: '10px' }}>
              Temukan Event & Venue
            </h3>
            <p style={{ fontSize: '14px', color: '#5A675E', lineHeight: 1.6 }}>
              Pilih salon mitra terdekat dari lokasimu di Jakarta, Bandung, atau Surabaya. Tentukan jadwal main siang, senja, atau sesi malam.
            </p>
          </div>

          {/* Step 02 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            padding: '28px',
            border: '1px solid #D7E6DB',
            boxShadow: '0 4px 16px rgba(0, 79, 39, 0.05)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#004F27',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#DDECE1' }}>02</span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', marginBottom: '10px' }}>
              Pilih Meja & Posisi Angin
            </h3>
            <p style={{ fontSize: '14px', color: '#5A675E', lineHeight: 1.6 }}>
              Pilih langsung kursi angin favoritmu (Timur/Ton, Selatan/Nan, Barat/Sha, Utara/Pei) lewat visual 4-quadrant denah meja live interaktif.
            </p>
          </div>

          {/* Step 03 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            padding: '28px',
            border: '1px solid #D7E6DB',
            boxShadow: '0 4px 16px rgba(0, 79, 39, 0.05)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#FFC72C',
                color: '#111E18',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#DDECE1' }}>03</span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', marginBottom: '10px' }}>
              Datang & Scan QR Check-in
            </h3>
            <p style={{ fontSize: '14px', color: '#5A675E', lineHeight: 1.6 }}>
              Tunjukkan QR e-pass di kasir venue, nikmati teh aromatik selamat datang, dan mulai ronde seru tanpa lelah mengocok ubin manual.
            </p>
          </div>
        </div>
      </section>

      {/* 7. SUASANA SALON MODERN, TENANG & HIGIENIS */}
      <section id="venues" style={{ maxWidth: '1280px', margin: '60px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#004F27', letterSpacing: '0.8px', marginBottom: '4px' }}>
              SALON RESMI BERLISENSI
            </div>
            <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#0B291B', letterSpacing: '-0.5px', margin: 0 }}>
              Suasana Salon Modern, Tenang & Higienis
            </h2>
            <p style={{ fontSize: '14px', color: '#5A675E', margin: '4px 0 0 0' }}>
              Standar kenyamanan premium dengan AC filter HEPA, pencahayaan bebas silau, dan layanan lounge.
            </p>
          </div>
          <button
            onClick={() => handleSecureBooking('Eksplorasi Cabang Salon')}
            style={{
              color: '#004F27',
              fontWeight: 700,
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Jelajahi 12 Cabang Salon ⊞
          </button>
        </div>

        {/* Big Feature Showcase Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid #D7E6DB',
          boxShadow: '0 12px 35px rgba(0, 79, 39, 0.08)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
        }}>
          {/* Left Photo */}
          <div style={{ position: 'relative', minHeight: '360px', backgroundColor: '#0B291B' }}>
            <Image
              src="/landing/parlor-lounge.jpg"
              alt="Senopati Elite Parlor"
              fill
              style={{ objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: '18px',
              left: '18px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              padding: '8px 16px',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#004F27', letterSpacing: '0.6px' }}>
                FLAGSHIP PARLOR
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#111E18' }}>
                Senopati Elite Parlor • Jakarta Selatan
              </div>
            </div>
          </div>

          {/* Right Details */}
          <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{
                  backgroundColor: '#98F6C2',
                  color: '#003B1D',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '999px'
                }}>
                  🛡️ Mitra Resmi Grade-A
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#7A897F' }}>
                  Kapasitas 32 Pemain
                </span>
              </div>

              <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#111E18', marginBottom: '12px', lineHeight: 1.3 }}>
                Pengalaman Bermain Seperti Salon Tokyo & Hong Kong
              </h3>

              <p style={{ fontSize: '14px', color: '#5A675E', lineHeight: 1.6, marginBottom: '24px' }}>
                Dilengkapi 8 Meja Otomatis Amos Rexx III impor dari Jepang, kartu skor digital RFID terintegrasi, ruang bebas asap rokok, serta Barista Tea Lounge yang menyajikan teh premium pilihan.
              </p>

              {/* 4 Feature Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
                <div style={{ backgroundColor: '#EBF6EE', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#004F27', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🍃 Filter HEPA 99.9%
                </div>
                <div style={{ backgroundColor: '#EBF6EE', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#004F27', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🍵 Barista Tea Bar
                </div>
                <div style={{ backgroundColor: '#EBF6EE', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#004F27', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📶 WiFi Fiber High-Speed
                </div>
                <div style={{ backgroundColor: '#EBF6EE', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#004F27', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔒 Ruang VIP Privat
                </div>
              </div>
            </div>

            {/* Bottom Schedule & Booking button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '20px',
              borderTop: '1px solid #EBF6EE'
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7A897F' }}>Jam Operasional</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#111E18' }}>11:00 - 23:30 WIB Setiap Hari</div>
              </div>

              <button
                onClick={() => handleSecureBooking('Senopati Elite Parlor')}
                style={{
                  backgroundColor: '#004F27',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(0, 79, 39, 0.2)',
                  cursor: 'pointer'
                }}
              >
                Booking Meja Senopati
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. KEMITRAAN BANNER */}
      <section style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{
          backgroundColor: '#0B3B24',
          borderRadius: '20px',
          padding: '36px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
          boxShadow: '0 12px 30px rgba(0, 79, 39, 0.15)'
        }}>
          <div style={{ maxWidth: '680px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#98F6C2', letterSpacing: '0.8px', marginBottom: '6px' }}>
              🤝 KEMITRAAN SALON & ARENA
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px', lineHeight: 1.3 }}>
              Punya Ruang atau Kafe Mahjong? Gabung Menjadi Mitra Venue Mahjongyuks
            </h3>
            <p style={{ fontSize: '14px', color: '#DDECE1', lineHeight: 1.6, margin: 0 }}>
              Tingkatkan occupancy meja salon hingga 85%, terhubung langsung dengan sistem POS, manajemen antrean live, dan turnamen resmi.
            </p>
          </div>

          <button
            onClick={() => setShowPartnershipModal(true)}
            style={{
              backgroundColor: '#FFC72C',
              color: '#111E18',
              padding: '14px 28px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '14px',
              boxShadow: '0 6px 16px rgba(255, 199, 44, 0.3)',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            Konsultasi Kemitraan Salon
          </button>
        </div>
      </section>

      {/* 9. SIRKUIT TURNAMEN - LEADERBOARD PODIUM */}
      <section id="leaderboard" style={{ maxWidth: '1280px', margin: '60px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#004F27', letterSpacing: '0.8px', marginBottom: '4px' }}>
              SIRKUIT TURNAMEN 2025
            </div>
            <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#0B291B', letterSpacing: '-0.5px', margin: 0 }}>
              Leaderboard Nasional Dan/Kyu
            </h2>
            <p style={{ fontSize: '14px', color: '#5A675E', margin: '4px 0 0 0' }}>
              Pemain teratas dari kompetisi resmi WRC & turnamen salon mitra di seluruh Indonesia.
            </p>
          </div>
          <button
            onClick={() => handleSecureBooking('Klasemen Nasional')}
            style={{
              color: '#004F27',
              fontWeight: 700,
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Lihat Klasemen Lengkap & Rating Pemain 🏆
          </button>
        </div>

        {/* Podium 3 Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}>
          {/* Rank 2 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '28px 24px',
            border: '1px solid #D7E6DB',
            boxShadow: '0 6px 20px rgba(0, 79, 39, 0.05)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#E5E7EB',
                color: '#374151',
                fontWeight: 800,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                2
              </div>
              <span style={{
                backgroundColor: '#F3F4F6',
                color: '#374151',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '999px'
              }}>
                7-Dan Master
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                color: '#16A34A',
                fontWeight: 800,
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                JT
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#111E18' }}>Jessica Tan</div>
                <div style={{ fontSize: '12px', color: '#5A675E' }}>Green Bamboo Club PIK</div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#EBF6EE',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#5A675E' }}>Rating Elo</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#004F27' }}>24.150 pts</span>
            </div>
          </div>

          {/* Rank 1 (Elevated Center Card) */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '32px 28px',
            border: '2px solid #FFC72C',
            boxShadow: '0 12px 35px rgba(255, 199, 44, 0.25)',
            position: 'relative',
            transform: 'scale(1.03)',
            zIndex: 10
          }}>
            <div style={{
              position: 'absolute',
              top: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#FFC72C',
              color: '#111E18',
              padding: '4px 16px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: '0 4px 10px rgba(255, 199, 44, 0.4)',
              whiteSpace: 'nowrap'
            }}>
              👑 PERINGKAT #1 NASIONAL
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', marginTop: '6px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#FFC72C',
                color: '#111E18',
                fontWeight: 800,
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                1
              </div>
              <span style={{
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '999px'
              }}>
                9-Dan Grandmaster
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
              <div style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                backgroundColor: '#004F27',
                color: '#98F6C2',
                fontWeight: 800,
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 79, 39, 0.25)'
              }}>
                BP
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#111E18' }}>Budi Pratama</div>
                <div style={{ fontSize: '13px', color: '#5A675E' }}>Senopati Parlor Champion</div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#EBF6EE',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Rating Elo</span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#004F27' }}>28.400 pts</span>
            </div>
          </div>

          {/* Rank 3 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '28px 24px',
            border: '1px solid #D7E6DB',
            boxShadow: '0 6px 20px rgba(0, 79, 39, 0.05)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#FDE68A',
                color: '#92400E',
                fontWeight: 800,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                3
              </div>
              <span style={{
                backgroundColor: '#F3F4F6',
                color: '#374151',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '999px'
              }}>
                6-Dan Expert
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                color: '#16A34A',
                fontWeight: 800,
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                RS
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#111E18' }}>Rendy Setiawan</div>
                <div style={{ fontSize: '12px', color: '#5A675E' }}>Bandung Tile Society</div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#EBF6EE',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#5A675E' }}>Rating Elo</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#004F27' }}>21.800 pts</span>
            </div>
          </div>
        </div>
      </section>

      {/* 10. KOMUNITAS & INTEGRITAS */}
      <section id="komunitas" style={{ maxWidth: '1280px', margin: '40px auto 60px auto', padding: '0 24px' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '40px 48px',
          border: '1px solid #D7E6DB',
          boxShadow: '0 8px 30px rgba(0, 79, 39, 0.06)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Peaking Decorative Tile */}
          <div style={{
            position: 'absolute',
            right: '-16px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.15,
            pointerEvents: 'none'
          }}>
            <Image src="/landing/mahjong-tile.png" alt="Mahjong" width={180} height={180} />
          </div>

          <div style={{ maxWidth: '780px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#004F27', letterSpacing: '0.8px', marginBottom: '6px' }}>
              KOMUNITAS & INTEGRITAS
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0B291B', letterSpacing: '-0.5px', marginBottom: '14px', lineHeight: 1.25 }}>
              Bergabung dengan Komunitas Mahjong Terbesar di Indonesia
            </h2>
            <p style={{ fontSize: '15px', color: '#5A675E', lineHeight: 1.6, marginBottom: '28px' }}>
              Lebih dari 2.500+ anggota aktif berdiskusi strategi discard, latihan mingguan di Tenhou/Mahjong Soul, serta menjunjung tinggi kode etik zero table-talk dan fairplay internasional.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#004F27',
                  color: '#FFFFFF',
                  padding: '12px 22px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(0, 79, 39, 0.2)',
                  textDecoration: 'none'
                }}
              >
                💬 Join Discord Mahjongyuks (2.5k Member)
              </a>

              <a
                href="https://chat.whatsapp.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#DDECE1',
                  color: '#004F27',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
              >
                💬 WhatsApp Regional Circle
              </a>

              <button
                onClick={() => setShowRulebookModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#2B3830',
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '10px 14px',
                  cursor: 'pointer'
                }}
              >
                ⚖️ Pedoman Fairplay & Wasit
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 11. QUICK NAVIGATION BAR */}
      <div style={{ backgroundColor: '#DDECE1', padding: '16px 24px', borderTop: '1px solid #D2E9D8', borderBottom: '1px solid #D2E9D8' }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#004F27', letterSpacing: '0.8px' }}>
            NAVIGASI CEPAT MAHJONGYUKS:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a
              href="#events"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#111E18',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                border: '1px solid #D7E6DB',
                textDecoration: 'none'
              }}
            >
              Jelajahi Event (/events)
            </a>
            <button
              onClick={() => handleSecureBooking('Denah & Booking Meja')}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#111E18',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                border: '1px solid #D7E6DB',
                cursor: 'pointer'
              }}
            >
              Denah & Booking Meja (/booking)
            </button>
            <a
              href="#leaderboard"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#111E18',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                border: '1px solid #D7E6DB',
                textDecoration: 'none'
              }}
            >
              Leaderboard (/leaderboard)
            </a>
            <Link
              href={user ? '/dashboard' : '/login'}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#111E18',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                border: '1px solid #D7E6DB',
                textDecoration: 'none'
              }}
            >
              Portal Pemain (/profile)
            </Link>
          </div>
        </div>
      </div>

      {/* 12. COMPREHENSIVE FOOTER */}
      <footer style={{ backgroundColor: '#FFFFFF', padding: '60px 24px 30px 24px' }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '40px',
          marginBottom: '50px'
        }}>
          {/* Column 1: Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Image 
                src="/assets/mahjongyuks_logo.png" 
                alt="Mahjongyuks" 
                width={140} 
                height={42} 
                style={{ objectFit: 'contain' }}
              />
            </div>

            <p style={{ fontSize: '13px', color: '#5A675E', lineHeight: 1.6, marginBottom: '20px' }}>
              Pelopor platform reservasi meja otomatis, turnamen resmi Riichi & MCR, serta akademi Mahjong modern pertama di Indonesia. Menggabungkan tradisi ubin klasik dengan presisi arena modern.
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: '#DCFCE7',
                color: '#16A34A',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '999px'
              }}>
                🛡️ Lisensi EMA / WMC
              </span>
              <span style={{
                backgroundColor: '#EBF6EE',
                color: '#004F27',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '999px'
              }}>
                ⚡ Meja Otomatis Amos Rexx
              </span>
            </div>
          </div>

          {/* Column 2: Eksplorasi */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111E18', letterSpacing: '0.5px', marginBottom: '16px' }}>
              EKSPLORASI
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#5A675E' }}>
              <li><a href="#events" style={{ color: 'inherit' }}>Katalog Event & Turnamen</a></li>
              <li><button onClick={() => handleSecureBooking('Sewa Meja VIP')} style={{ color: 'inherit', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>Sewa Meja Salon VIP</button></li>
              <li><a href="#leaderboard" style={{ color: 'inherit' }}>Peringkat Nasional (Dan/Kyu)</a></li>
              <li><a href="#komunitas" style={{ color: 'inherit' }}>Direktori Klub & Guild</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setShowRulebookModal(true); }} style={{ color: 'inherit' }}>Sertifikasi & Lisensi Wasit</a></li>
            </ul>
          </div>

          {/* Column 3: Salon & Partner */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111E18', letterSpacing: '0.5px', marginBottom: '16px' }}>
              SALON & PARTNER
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#111E18' }}>Senopati Parlor</div>
                <div style={{ color: '#7A897F', fontSize: '12px' }}>Jl. Suryo No. 28, Jakarta Selatan</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#111E18' }}>PIK Cove Arena</div>
                <div style={{ color: '#7A897F', fontSize: '12px' }}>Pantai Indah Kapuk 2, Batavia Pier</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#111E18' }}>Dago Atrium</div>
                <div style={{ color: '#7A897F', fontSize: '12px' }}>Ir. H. Djuanda No. 112, Bandung</div>
              </div>
              <button onClick={() => handleSecureBooking('Semua Cabang Salon')} style={{ color: '#004F27', fontWeight: 700, fontSize: '12px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                Lihat Semua 12 Cabang →
              </button>
            </div>
          </div>

          {/* Column 4: Akses Khusus & Staf (Admin & Staff portal kept discreet here) */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111E18', letterSpacing: '0.5px', marginBottom: '16px' }}>
              AKSES STAF & WASIT
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href="/admin/login"
                style={{
                  backgroundColor: '#F8FBF8',
                  color: '#2B3830',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid #D7E6DB',
                  textDecoration: 'none'
                }}
              >
                🛡️ Portal Staf & Admin Venue
              </Link>
              <Link
                href="/admin/login"
                style={{
                  backgroundColor: '#F8FBF8',
                  color: '#2B3830',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid #D7E6DB',
                  textDecoration: 'none'
                }}
              >
                🖩 Terminal POS Kasir & Turnamen
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          paddingTop: '24px',
          borderTop: '1px solid #D7E6DB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '12px',
          color: '#7A897F'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Image src="/landing/mahjong-tile.png" alt="tile" width={14} height={14} />
            <span>© 2025 Mahjongyuks Indonesia. Hak cipta dilindungi undang-undang. Integritas dan Fair Play tersertifikasi.</span>
          </div>
          <div style={{ display: 'flex', gap: '18px' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setShowRulebookModal(true); }} style={{ color: 'inherit' }}>Pedoman Fairplay</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Ketentuan Penggunaan: Reservasi salon diperuntukkan bagi anggota terdaftar. Dilarang bertaruh atau judi uang tunai dalam bentuk apa pun.'); }} style={{ color: 'inherit' }}>Syarat & Ketentuan</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Hubungi Concierge Mahjongyuks via WhatsApp: +62 812-9988-7766'); }} style={{ color: 'inherit' }}>Pusat Bantuan</a>
          </div>
        </div>
      </footer>

      {/* MODAL: AUTH REQUIRED FOR BOOKING (Security Guard) */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '32px 28px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#EBF6EE',
              color: '#004F27',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111E18', marginBottom: '8px' }}>
              Autentikasi Diperlukan
            </h3>

            <p style={{ fontSize: '14px', color: '#5A675E', lineHeight: 1.6, marginBottom: '24px' }}>
              Untuk memesan kursi meja <strong>{pendingActionTarget}</strong> dan memastikan nomor induk atlet terverifikasi, silakan masuk ke akun Anda terlebih dahulu.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  router.push('/login?redirect=/dashboard&reason=booking');
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#004F27',
                  color: '#FFFFFF',
                  padding: '13px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  boxShadow: '0 4px 14px rgba(0, 79, 39, 0.25)',
                  cursor: 'pointer'
                }}
              >
                Masuk ke Akun Pemain
              </button>

              <button
                onClick={() => {
                  setShowAuthModal(false);
                  router.push('/register');
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#EBF6EE',
                  color: '#004F27',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: '1px solid #D7E6DB',
                  cursor: 'pointer'
                }}
              >
                Daftar Member Baru
              </button>

              <button
                onClick={() => setShowAuthModal(false)}
                style={{
                  marginTop: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#7A897F',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RULEBOOK & FAIRPLAY 101 */}
      {showRulebookModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📖</span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#004F27', margin: 0 }}>
                  Rulebook & Panduan Bermain 101
                </h3>
              </div>
              <button
                onClick={() => setShowRulebookModal(false)}
                style={{ fontSize: '20px', color: '#7A897F', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#5A675E', lineHeight: 1.6, marginBottom: '20px' }}>
              Mahjongyuks mengadopsi standar internasional <strong>WRC (World Riichi Championship)</strong> dan standar etika salon modern tanpa perjudian.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#EBF6EE', padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontWeight: 800, color: '#004F27', fontSize: '14px', marginBottom: '4px' }}>
                  1. Meja Otomatis Amos Rexx III
                </div>
                <div style={{ fontSize: '13px', color: '#2B3830' }}>
                  Ubin dikocok secara magnetik dalam 5 detik. Pemain tidak perlu membalik atau menyusun dinding manual.
                </div>
              </div>

              <div style={{ backgroundColor: '#EBF6EE', padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontWeight: 800, color: '#004F27', fontSize: '14px', marginBottom: '4px' }}>
                  2. Aturan Dasar Yaku
                </div>
                <div style={{ fontSize: '13px', color: '#2B3830' }}>
                  Untuk memenangkan tangan, tangan wajib memiliki minimal 1 Yaku (Riichi, Tanyao, Yakuhai, Pinfu, dll.).
                </div>
              </div>

              <div style={{ backgroundColor: '#EBF6EE', padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontWeight: 800, color: '#004F27', fontSize: '14px', marginBottom: '4px' }}>
                  3. Zero Tolerance Gambling & No Table-Talk
                </div>
                <div style={{ fontSize: '13px', color: '#2B3830' }}>
                  Dilarang keras bertaruh uang nyata. Semua poin adalah murni sistem Elo dan gelar keatletan nasional.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRulebookModal(false)}
              style={{
                width: '100%',
                backgroundColor: '#004F27',
                color: '#FFFFFF',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Saya Mengerti & Siap Bermain
            </button>
          </div>
        </div>
      )}

      {/* MODAL: KONSULTASI KEMITRAAN SALON */}
      {showPartnershipModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🤝</span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#004F27', margin: 0 }}>
                  Konsultasi Kemitraan Salon
                </h3>
              </div>
              <button
                onClick={() => setShowPartnershipModal(false)}
                style={{ fontSize: '20px', color: '#7A897F', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#5A675E', lineHeight: 1.6, marginBottom: '20px' }}>
              Daftarkan kafe, lounge, atau ruang komunitas Anda untuk menjadi venue berlisensi resmi Mahjongyuks. Kami menyediakan sistem booking terintegrasi, unit Amos Rexx, dan supply wasit resmi.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '4px' }}>
                  Nama Venue / Bisnis
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kopi Ubin Senopati"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D7E6DB',
                    backgroundColor: '#EBF6EE',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '4px' }}>
                  Kota & Lokasi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jakarta Selatan"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D7E6DB',
                    backgroundColor: '#EBF6EE',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '4px' }}>
                  Nomor WhatsApp PIC
                </label>
                <input
                  type="text"
                  placeholder="08123456789"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D7E6DB',
                    backgroundColor: '#EBF6EE',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                alert('Terima kasih! Tim Partnership Mahjongyuks akan segera menghubungi nomor Anda.');
                setShowPartnershipModal(false);
              }}
              style={{
                width: '100%',
                backgroundColor: '#FFC72C',
                color: '#111E18',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(255, 199, 44, 0.35)',
                cursor: 'pointer'
              }}
            >
              Kirim Pengajuan Kemitraan
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
