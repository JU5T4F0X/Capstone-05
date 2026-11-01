'use client';

import React, { useState, useEffect } from 'react';
import ApiClient from '@/lib/api';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  History,
  Ticket,
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle,
  X,
  BookOpen,
  Building2,
  UserCheck,
  Mail,
  Hash
} from 'lucide-react';
import '@/components/landing/landing.css';
import './dashboard.css';
import { normalizeKemahiran, KEMAHIRAN_MAP } from '@/lib/kemahiran';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeNav, setActiveNav] = useState('dashboard');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRulebookModal, setShowRulebookModal] = useState(false);
  const [showPartnershipModal, setShowPartnershipModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<string>('Mahjong Lounge Senopati');

  // ── LEADERBOARD: Live data from API ──
  const [liveLeaderboard, setLiveLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    ApiClient.getLeaderboard({ limit: 5 }).then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setLiveLeaderboard(res.data);
      }
    }).catch(() => {});
  }, []);

  const userName = user?.nama || 'Pemain';
  const kemahiranLevel = normalizeKemahiran(user?.kemahiran || user?.dan_rank);
  const kemahiranDetail = KEMAHIRAN_MAP[kemahiranLevel];

  const handleOpenBooking = () => {
    setShowBookingModal(true);
  };

  const handleScrollToLeaderboard = () => {
    const el = document.getElementById('leaderboard-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const confirmBooking = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setShowBookingModal(false);
    }, 1500);
  };

  return (
    <div className="db-root">
      {/* ── MAIN DASHBOARD CONTENT ── */}
      <main className="db-page-content">
        <div className="db-container">
          <div className="db-content-stack">
            
            {/* ── A. Welcome Section & Informasi Profil Singkat (Hero Profile Card) ── */}
            <section className="db-hero-card" aria-labelledby="db-hero-heading">
              {/* Garis Aksen Emas Gradasi di Tepi Atas */}
              <div className="db-hero-top-accent" aria-hidden="true" />

              {/* Sisi Kiri: Identitas (Avatar, Label ID, Sapaan, Deskripsi, Badge Kemahiran) */}
              <div className="db-hero-identity">
                <div
                  className="db-hero-avatar-ring"
                  role="img"
                  aria-label={`Avatar profil ${userName}`}
                >
                  <div className="db-hero-avatar">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={userName}
                        className="db-hero-avatar-img"
                      />
                    ) : (
                      <span className="db-hero-avatar-initial" aria-hidden="true">
                        {(userName || 'P').trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="db-hero-text-wrap">
                  <div className="db-hero-eyebrow">
                    <span>ID PEMAIN #{user?.id || '2'}</span>
                    <span className="db-hero-eyebrow-dot" aria-hidden="true">•</span>
                    <span>ATLET RESMI MAHJONGYUKS</span>
                  </div>

                  <h1 id="db-hero-heading" className="db-hero-title">
                    <span className="db-hero-name" title={userName}>
                      Halo, {userName.split(' ')[0]}!
                    </span>
                    <span className="db-hero-emoji" aria-hidden="true">🀄</span>
                  </h1>

                  <p className="db-hero-desc">
                    Selamat datang di pusat ringkasan akun Anda. Pantau informasi profil, status keanggotaan, kemahiran bermain, dan riwayat aktivitas akun.
                  </p>

                  {/* Badge Kemahiran di Bawah Deskripsi */}
                  <div className="db-hero-badge-wrap">
                    <div className="db-hero-kemahiran-badge">
                      <Award size={15} className="db-hero-kemahiran-icon" aria-hidden="true" />
                      <span className="db-hero-kemahiran-text">
                        Kemahiran: {kemahiranDetail.level}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sisi Kanan: Dekorasi Bersih (CSS/SVG Lingkaran Konsentris & Watermark) */}
              <div className="db-hero-decor" aria-hidden="true">
                <div className="db-hero-circle db-hero-circle-1" />
                <div className="db-hero-circle db-hero-circle-2" />
                <div className="db-hero-circle db-hero-circle-3" />
                <div className="db-hero-glow" />
                <svg className="db-hero-mahjong-watermark" viewBox="0 0 72 96" fill="none" stroke="currentColor">
                  <rect x="2" y="2" width="68" height="92" rx="10" strokeWidth="2" strokeDasharray="4 4" />
                  <rect x="8" y="8" width="56" height="80" rx="6" strokeWidth="1.5" />
                  <path d="M36 20 V76 M20 34 H52 M20 54 H52" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </section>

            {/* ── B. Ringkasan Statistik (4 Kartu Berdasarkan Data Nyata) ── */}
            <div className="db-metrics-grid">
              
              {/* Card 1: Status Akun */}
              <div className="db-metric-card">
                <div className="db-metric-top">
                  <span className="db-metric-label">Status Akun</span>
                  <div className="db-metric-icon">
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <div className="db-metric-val-row">
                  <span className="db-metric-num" style={{ fontSize: '18px' }}>
                    {user?.role === 'player' ? 'Pemain Aktif' : 'Aktif'}
                  </span>
                </div>
                <div className="db-metric-footer">
                  <span className="db-metric-tag" style={{ color: '#2D6A4F' }}>
                    ● Anggota Terverifikasi
                  </span>
                  <span>Akun Resmi</span>
                </div>
              </div>

              {/* Card 2: Tingkat Kemahiran (Hanya 3 Kategori Resmi) */}
              <div className="db-metric-card">
                <div className="db-metric-top">
                  <span className="db-metric-label">Tingkat Kemahiran</span>
                  <div className="db-metric-icon db-metric-icon-gold">
                    <Award size={16} />
                  </div>
                </div>
                <div className="db-metric-val-row">
                  <span className="db-metric-num">{kemahiranDetail.level}</span>
                </div>
                <div className="db-metric-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
                  <span style={{ fontSize: '11px', color: '#5A675E', lineHeight: '1.35' }}>
                    {kemahiranDetail.deskripsi}
                  </span>
                </div>
              </div>

              {/* Card 3: Total Poin Rating */}
              <div className="db-metric-card">
                <div className="db-metric-top">
                  <span className="db-metric-label">Total Poin Rating</span>
                  <div className="db-metric-icon">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <div className="db-metric-val-row">
                  <span className="db-metric-num">
                    {user?.points ? user.points.toLocaleString() : '14,850'}
                  </span>
                  <span className="db-metric-unit" style={{ color: '#183629', fontWeight: 700 }}>PTS</span>
                </div>
                <div className="db-metric-footer">
                  <span className="db-metric-tag">
                    Rating Turnamen
                  </span>
                  <span style={{ color: '#15803D', fontWeight: 600 }}>
                    Terdaftar WRC
                  </span>
                </div>
              </div>

              {/* Card 4: Pemesanan Meja */}
              <div className="db-metric-card">
                <div className="db-metric-top">
                  <span className="db-metric-label">Pemesanan Meja</span>
                  <div className="db-metric-icon">
                    <Ticket size={16} />
                  </div>
                </div>
                <div className="db-metric-val-row">
                  <span className="db-metric-num" style={{ fontSize: '18px' }}>0 Sesi</span>
                  <span className="db-metric-unit">Aktif</span>
                </div>
                <div className="db-metric-footer">
                  <span className="db-metric-tag">Sesi Bermain</span>
                  <span style={{ color: '#78807B' }}>
                    Belum Ada Reservasi
                  </span>
                </div>
              </div>

            </div>

            {/* ── C. Aktivitas Terbaru (Log Aktivitas & Riwayat) ── */}
            <section>
              <div className="db-section-header">
                <div>
                  <div className="db-section-subtitle">Log Aktivitas</div>
                  <h3 className="db-section-title">Aktivitas Terbaru</h3>
                </div>
                <span className="db-panel-link" onClick={() => router.push('/game-history')}>Riwayat Saya ›</span>
              </div>

              <div className="db-activity-card">
                <div className="db-empty-state">
                  <div className="db-empty-icon-wrap">
                    <History size={26} />
                  </div>
                  <h4 className="db-empty-title">Belum Ada Riwayat Aktivitas</h4>
                  <p className="db-empty-desc">
                    Anda belum memiliki reservasi meja aktif atau riwayat pertandingan baru. Seluruh aktivitas pemesanan meja dan riwayat sesi bermain Anda akan tercatat secara otomatis di sini.
                  </p>
                </div>
              </div>
            </section>

            {/* ── D. Klasemen Komunitas (Leaderboard Section) ── */}
            <div id="leaderboard-section" className="db-panel-card">
              <div className="db-panel-header">
                <div>
                  <div className="db-section-subtitle">Musim Gugur (Autumn 2025)</div>
                  <h3 className="db-panel-title">Top 5 Leaderboard Komunitas</h3>
                </div>
                <span
                  className="db-panel-link"
                  onClick={() => router.push('/leaderboard')}
                >
                  Seluruh Klasemen ›
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {liveLeaderboard.length > 0 ? (
                  liveLeaderboard.map((player, idx) => {
                    const rank = idx + 1;
                    const isCurrentUser = player.user_id === user?.id;
                    const rankColors: Record<number, string> = { 1: 'gold', 2: 'silver', 3: 'bronze' };
                    return (
                      <div key={player.id || rank} className={`db-rank-row${isCurrentUser ? ' current-user' : ''}`}>
                        <div className="db-rank-left">
                          <div className={`db-rank-num${rank === 1 ? ' gold' : ''}`}>{rank}</div>
                          <div className="db-rank-avatar" style={isCurrentUser ? { border: '1.5px solid #A3E6C5' } : {}}>
                            <Image
                              src={player.avatar_url || '/assets/avatar_kevin.jpg'}
                              alt={player.nama || 'Player'}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                          <div>
                            <div className="db-rank-player-name">
                              {player.name || player.nama || 'Unknown'}{isCurrentUser ? ' (Anda) ' : ' '}
                              <span style={{ fontSize: '10px', color: isCurrentUser ? '#A3E6C5' : '#78807B' }}>
                                {player.rankTitle || player.kemahiran || ''}
                              </span>
                            </div>
                            <div className="db-rank-sub">{player.danRank || ''} • {player.totalMatches || 0} Hanchan</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="db-rank-pts">{(player.eloRating || 0).toLocaleString()}</div>
                          <span style={{ fontSize: '9.5px', color: isCurrentUser ? '#D3DFD8' : '#78807B', fontWeight: 600 }}>PTS</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    {/* Fallback: Rank 1 */}
                    <div className="db-rank-row">
                      <div className="db-rank-left">
                        <div className="db-rank-num gold">1</div>
                        <div className="db-rank-avatar">
                          <Image src="/assets/avatar_budi.png" alt="Budi" fill style={{ objectFit: 'cover' }} />
                        </div>
                        <div>
                          <div className="db-rank-player-name">Budi Pratama <span style={{ fontSize: '10px', color: '#78807B' }}>Advance</span></div>
                          <div className="db-rank-sub">Win Rate 34.2% • 48 Hanchan</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="db-rank-pts">28,400</div>
                        <span style={{ fontSize: '9.5px', color: '#78807B', fontWeight: 600 }}>PTS</span>
                      </div>
                    </div>

                    {/* Fallback: Rank 2 */}
                    <div className="db-rank-row">
                      <div className="db-rank-left">
                        <div className="db-rank-num">2</div>
                        <div className="db-rank-avatar">
                          <Image src="/assets/avatar_amanda.png" alt="Amanda" fill style={{ objectFit: 'cover' }} />
                        </div>
                        <div>
                          <div className="db-rank-player-name">Amanda Wijaya <span style={{ fontSize: '10px', color: '#78807B' }}>Advance</span></div>
                          <div className="db-rank-sub">Win Rate 31.8% • 42 Hanchan</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="db-rank-pts">24,150</div>
                        <span style={{ fontSize: '9.5px', color: '#78807B', fontWeight: 600 }}>PTS</span>
                      </div>
                    </div>

                    {/* Fallback: Rank 3 */}
                    <div className="db-rank-row">
                      <div className="db-rank-left">
                        <div className="db-rank-num">3</div>
                        <div className="db-rank-avatar">
                          <Image src="/assets/avatar_rendy.png" alt="Rendy" fill style={{ objectFit: 'cover' }} />
                        </div>
                        <div>
                          <div className="db-rank-player-name">Rendy Tanaka <span style={{ fontSize: '10px', color: '#78807B' }}>Advance</span></div>
                          <div className="db-rank-sub">Win Rate 28.5% • 39 Hanchan</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="db-rank-pts">19,800</div>
                        <span style={{ fontSize: '9.5px', color: '#78807B', fontWeight: 600 }}>PTS</span>
                      </div>
                    </div>

                    {/* Fallback: Rank 4 Current User */}
                    <div className="db-rank-row current-user">
                      <div className="db-rank-left">
                        <div className="db-rank-num">4</div>
                        <div className="db-rank-avatar" style={{ border: '1.5px solid #A3E6C5' }}>
                          <Image src={user?.avatar_url || '/assets/avatar_kevin.jpg'} alt={userName} fill style={{ objectFit: 'cover' }} />
                        </div>
                        <div>
                          <div className="db-rank-player-name">{userName} (Anda) <span style={{ fontSize: '10px', color: '#A3E6C5' }}>{kemahiranDetail.level}</span></div>
                          <div className="db-rank-sub">Target berikutnya: 19,801 pts</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="db-rank-pts">{user?.points ? user.points.toLocaleString() : '14,850'}</div>
                        <span style={{ fontSize: '9.5px', color: '#D3DFD8', fontWeight: 600 }}>PTS</span>
                      </div>
                    </div>

                    {/* Fallback: Rank 5 */}
                    <div className="db-rank-row">
                      <div className="db-rank-left">
                        <div className="db-rank-num">5</div>
                        <div className="db-rank-avatar">
                          <Image src="/assets/avatar_felicia.png" alt="Felicia" fill style={{ objectFit: 'cover' }} />
                        </div>
                        <div>
                          <div className="db-rank-player-name">Felicia Zhang <span style={{ fontSize: '10px', color: '#78807B' }}>Intermediate</span></div>
                          <div className="db-rank-sub">Win Rate 26.2% • 31 Hanchan</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="db-rank-pts">13,200</div>
                        <span style={{ fontSize: '9.5px', color: '#78807B', fontWeight: 600 }}>PTS</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>


      {/* ── 4. MODAL: PEMESANAN MEJA (DIPICU DARI HEADER MENU PEMESANAN) ── */}
      {showBookingModal && (
        <div className="db-modal-overlay">
          <div className="db-modal-box">
            <button
              type="button"
              onClick={() => setShowBookingModal(false)}
              className="db-modal-close"
              aria-label="Tutup modal"
            >
              <X size={18} />
            </button>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle size={52} color="#15803D" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#141A17' }}>
                  Reservasi Meja Berhasil!
                </h3>
                <p style={{ fontSize: '13px', color: '#5A675E', marginTop: '6px' }}>
                  Tiket dan nomor kursi telah diterbitkan untuk venue {selectedVenue}.
                </p>
              </div>
            ) : (
              <div>
                <span className="landing-eyebrow" style={{ marginBottom: '8px', fontSize: '10px', padding: '4px 10px' }}>
                  🀄 RESERVASI MEJA
                </span>

                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#141A17', marginTop: '6px' }}>
                  Pemesanan Sesi Bermain
                </h3>
                <p style={{ fontSize: '12.5px', color: '#5A675E', marginTop: '3px', marginBottom: '16px' }}>
                  Maksimal 4 pemain per meja berstandar World Riichi Championship.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4A524D', marginBottom: '6px' }}>
                      Pilih Venue
                    </label>
                    <select
                      value={selectedVenue}
                      onChange={(e) => setSelectedVenue(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #E4E0D8',
                        backgroundColor: '#FAF8F5',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      <option value="Mahjong Lounge Senopati">Mahjong Lounge Senopati (12 Meja Otomatis)</option>
                      <option value="Green Bamboo Club PIK">Green Bamboo Club PIK (16 Meja Standar)</option>
                      <option value="Bandung Tile Hub">Bandung Tile Hub (8 Meja)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4A524D', marginBottom: '6px' }}>
                      Pilih Meja Tersedia
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {['Meja 01', 'Meja 02', 'Meja 03', 'Meja 04'].map((table, i) => (
                        <div
                          key={table}
                          style={{
                            padding: '8px 4px',
                            textAlign: 'center',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            backgroundColor: i === 2 ? '#183629' : '#FAF8F5',
                            color: i === 2 ? '#FFFFFF' : '#141A17',
                            border: i === 2 ? '1px solid #183629' : '1px solid #E4E0D8',
                            cursor: 'pointer'
                          }}
                        >
                          {table}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#FDF6E2',
                    border: '1px solid #F0E0AA',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    color: '#785A00',
                    lineHeight: '1.45'
                  }}>
                    💡 Status tagihan reservasi akan tercatat sebagai <strong>Pending</strong> untuk verifikasi kasir venue saat kedatangan.
                  </div>

                  <button
                    type="button"
                    onClick={confirmBooking}
                    className="db-btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
                  >
                    Konfirmasi Pemesanan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. MODAL: ATURAN RESMI WRC ── */}
      {showRulebookModal && (
        <div className="db-modal-overlay">
          <div className="db-modal-box">
            <button
              type="button"
              onClick={() => setShowRulebookModal(false)}
              className="db-modal-close"
              aria-label="Tutup modal"
            >
              <X size={18} />
            </button>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#183629', marginBottom: '8px' }}>
                <BookOpen size={20} />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#141A17', margin: 0 }}>
                  Ringkasan Aturan WRC 2025
                </h3>
              </div>
              <p style={{ fontSize: '12.5px', color: '#5A675E', marginBottom: '14px', lineHeight: 1.5 }}>
                Seluruh pertandingan resmi Mahjongyuks mengacu pada standar World Riichi Championship.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#2B3830' }}>
                <div style={{ padding: '8px 12px', backgroundColor: '#FAF8F5', borderRadius: '6px', border: '1px solid #E4E0D8' }}>
                  <strong>Starting Points:</strong> 30,000 poin dengan Return Target 30,000 poin.
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: '#FAF8F5', borderRadius: '6px', border: '1px solid #E4E0D8' }}>
                  <strong>Uma / Oka:</strong> +15 / +5 / -5 / -15 dengan Oka +20 kepada pemenang peringkat 1.
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: '#FAF8F5', borderRadius: '6px', border: '1px solid #E4E0D8' }}>
                  <strong>Red Fives (Aka Dora):</strong> Tidak digunakan pada pertandingan WRC resmi kompetitif.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRulebookModal(false)}
                className="db-btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '18px' }}
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. MODAL: PROGRAM KEMITRAAN VENUE ── */}
      {showPartnershipModal && (
        <div className="db-modal-overlay">
          <div className="db-modal-box">
            <button
              type="button"
              onClick={() => setShowPartnershipModal(false)}
              className="db-modal-close"
              aria-label="Tutup modal"
            >
              <X size={18} />
            </button>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#183629', marginBottom: '8px' }}>
                <Building2 size={20} />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#141A17', margin: 0 }}>
                  Kemitraan Venue &amp; Arena
                </h3>
              </div>
              <p style={{ fontSize: '12.5px', color: '#5A675E', marginBottom: '14px', lineHeight: 1.5 }}>
                Bergabunglah bersama jaringan venue Mahjong resmi terbesar di Indonesia dengan dukungan sistem otomatis Amos Rexx III.
              </p>
              <div style={{ padding: '12px', backgroundColor: '#FAF8F5', borderRadius: '6px', border: '1px solid #E4E0D8', fontSize: '12px', color: '#2B3830', lineHeight: 1.6 }}>
                <div>✓ Integrasi POS &amp; Reservasi Realtime</div>
                <div>✓ Pelatihan Wasit Berlisensi WRC</div>
                <div>✓ Pasokan Meja Otomatis &amp; Sparepart Resmi</div>
                <div>✓ Exposure Promosi ke Seluruh Atlet Komunitas</div>
              </div>
              <button
                type="button"
                onClick={() => setShowPartnershipModal(false)}
                className="db-btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '18px' }}
              >
                Hubungi Tim Partnership
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
