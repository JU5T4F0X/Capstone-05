'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ApiClient from '@/lib/api';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Check,
  Phone,
  Store,
  Layers,
  BarChart3,
  Users,
  AlertCircle,
  HelpCircle,
  Calendar,
  Sparkles,
  BookOpen,
  Trophy,
  Headphones,
  AlertTriangle,
  X
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showOtpNoticeModal, setShowOtpNoticeModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMethod === 'phone') {
      setErrorMessage('Metode login via nomor HP belum dikembangkan. Silakan gunakan pilihan masuk dengan Email.');
      return;
    }
    setLoading(true);
    setErrorMessage('');

    // Call real Laravel API authentication
    const result = await login({
      identifier,
      password,
      role: 'player',
    });

    setLoading(false);

    if (result.success) {
      const currentUser = ApiClient.getUser();
      if (currentUser?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } else {
      setErrorMessage(result.message || 'Kombinasi Email dan kata sandi tidak valid. Silakan periksa kembali.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F1FCF4' }}>
      
      {/* TOP DESKTOP NAVBAR */}
      <header style={{
        height: '68px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E4ECE6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Brand & Club Portal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image
              src="/assets/mahjongyuks_logo.png"
              alt="Mahjongyuks"
              width={48}
              height={36}
              priority
              style={{ objectFit: 'contain' }}
            />
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#004F27', letterSpacing: '-0.3px' }}>
              Mahjongyuks
            </span>
          </div>

          <span className="badge-pill badge-mint" style={{ fontSize: '11px', padding: '3px 10px' }}>
            CLUB PORTAL
          </span>

          <span style={{ color: '#D7E6DB', fontSize: '16px' }}>|</span>

          <span style={{ fontSize: '12px', color: '#5A675E', fontWeight: 500 }}>
            Komunitas & Superapp Hong Kong Mahjong Indonesia
          </span>
        </div>

        {/* Location & Server Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#EBF6EE',
            border: '1px solid #D7E6DB',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '11px',
            fontWeight: 600,
            color: '#2B3830'
          }}>
            <Store size={13} color="#004F27" />
            <span>Lokasi Utama: <strong>Alicia Bakery Sedayu City</strong> • Sesi Hari Ini 13:00 - 22:00</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#EBF6EE',
            border: '1px solid #D7E6DB',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '11px',
            fontWeight: 700,
            color: '#004F27'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
            Server Online
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main style={{
        flex: 1,
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto',
        padding: '40px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '32px',
        alignItems: 'start'
      }}>

        {/* LEFT COLUMN: Community & Parlor Showcase */}
        <div style={{
          backgroundColor: '#E8F6ED',
          border: '1px solid #D2E7D8',
          borderRadius: '24px',
          padding: '36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          
          {/* Top Badges */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge-pill badge-mint" style={{ fontSize: '11px', padding: '4px 12px' }}>
              <Sparkles size={13} /> AUTENTIK & KOMPETITIF
            </span>
            <span className="badge-pill badge-gold" style={{ fontSize: '11px', padding: '4px 12px' }}>
              Season 2025 Live
            </span>
          </div>

          {/* Heading */}
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111E18', lineHeight: '1.2', letterSpacing: '-0.5px' }}>
              Selamat Datang di Meja Parlor Mahjongyuks.
            </h1>
            <p style={{ fontSize: '14px', color: '#3F4940', marginTop: '10px', lineHeight: '1.55' }}>
              Pesan kursi meja otomatis, pantau perolehan skor Fan secara live, ikuti turnamen mingguan, dan jalin persahabatan di arena Hong Kong Style paling prestisius.
            </p>
          </div>

          {/* Parlor Photo Banner */}
          <div style={{
            position: 'relative',
            height: '250px',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid #C4DFC8'
          }}>
            <Image
              src="/assets/mahjong_parlor_players.jpg"
              alt="Pemain di Meja Parlor Mahjongyuks"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 18px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#FFFFFF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
                <Trophy size={15} color="#FFDF94" />
                <span>Weekly Fan Masters • Sedayu City Hub</span>
              </div>
              <span style={{
                backgroundColor: '#004F27',
                color: '#98F6C2',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800
              }}>
                12 Meja Aktif
              </span>
            </div>
          </div>

          {/* 3 Features Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '14px 12px',
              border: '1px solid #E2EDE5',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#EBF6EE',
                color: '#004F27',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px'
              }}>
                <Layers size={16} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#111E18' }}>Auto-Shuffler</div>
              <div style={{ fontSize: '11px', color: '#6F7A71', marginTop: '2px' }}>Meja magnetik turnamen</div>
            </div>

            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '14px 12px',
              border: '1px solid #E2EDE5',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#EBF6EE',
                color: '#004F27',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px'
              }}>
                <BarChart3 size={16} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#111E18' }}>Live MMR & Fan</div>
              <div style={{ fontSize: '11px', color: '#6F7A71', marginTop: '2px' }}>Poin resmi & peringkat</div>
            </div>

            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '14px 12px',
              border: '1px solid #E2EDE5',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#EBF6EE',
                color: '#004F27',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px'
              }}>
                <Users size={16} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#111E18' }}>1.400+ Pemain</div>
              <div style={{ fontSize: '11px', color: '#6F7A71', marginTop: '2px' }}>Komunitas Jabodetabek</div>
            </div>
          </div>

          {/* Standard Olahraga Pikiran & Rekreasi Box */}
          <div style={{
            backgroundColor: '#DCF1E3',
            border: '1px solid #BDDFCA',
            borderRadius: '14px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <ShieldCheck size={18} color="#004F27" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#004F27', marginBottom: '2px' }}>
                Standard Olahraga Pikiran & Rekreasi
              </div>
              <div style={{ fontSize: '11px', color: '#2B3830', lineHeight: '1.45' }}>
                Mahjongyuks hanya memainkan format resmi Hong Kong Mahjong Style (Poin & Fan murni hasil strategi, bebas dari taruhan/judi).
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Real Login Form Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#7A897F', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                AKUN ANGGOTA
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111E18', marginTop: '2px' }}>
                Masuk ke Portal
              </h2>
            </div>
            <span className="badge-pill badge-mint" style={{ fontSize: '11px', padding: '4px 10px' }}>
              👤 Pemain & Tamu
            </span>
          </div>

          {/* METODE LOGIN TOGGLE TABS */}
          <div style={{
            backgroundColor: '#F1F5F2',
            padding: '4px',
            borderRadius: '14px',
            display: 'flex',
            gap: '6px',
            border: '1px solid #E2EDE5'
          }}>
            {/* Tab 1: Email Akun (Aktif) */}
            <button
              type="button"
              id="tab_login_email"
              onClick={() => {
                setLoginMethod('email');
                setErrorMessage('');
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: loginMethod === 'email' ? 700 : 600,
                backgroundColor: loginMethod === 'email' ? '#FFFFFF' : 'transparent',
                color: loginMethod === 'email' ? '#004F27' : '#5A675E',
                boxShadow: loginMethod === 'email' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Mail size={15} color={loginMethod === 'email' ? '#004F27' : '#7A897F'} />
              <span>Email Akun</span>
              <span style={{
                fontSize: '10px',
                backgroundColor: loginMethod === 'email' ? '#DCF1E3' : '#E2EDE5',
                color: '#004F27',
                padding: '2px 7px',
                borderRadius: '6px',
                fontWeight: 800
              }}>
                Aktif
              </span>
            </button>

            {/* Tab 2: Nomor HP (Belum Dikembangkan) */}
            <button
              type="button"
              id="tab_login_phone"
              onClick={() => {
                setLoginMethod('phone');
                setErrorMessage('');
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: loginMethod === 'phone' ? 700 : 600,
                backgroundColor: loginMethod === 'phone' ? '#FFFFFF' : 'transparent',
                color: loginMethod === 'phone' ? '#92400E' : '#5A675E',
                boxShadow: loginMethod === 'phone' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Phone size={14} color={loginMethod === 'phone' ? '#D97706' : '#7A897F'} />
              <span>Nomor HP</span>
              <span style={{
                fontSize: '10px',
                backgroundColor: '#FEF3C7',
                color: '#B45309',
                padding: '2px 7px',
                borderRadius: '6px',
                fontWeight: 800
              }}>
                Under Dev
              </span>
            </button>
          </div>

          {/* OTP Development Warning Notice Banner (Email Mode) */}
          {loginMethod === 'email' && (
            <div style={{
              backgroundColor: '#FFFBEB',
              border: '1.5px solid #FCD34D',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px'
              }}>
                <AlertTriangle size={16} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#92400E', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Sistem OTP Tahap Pengembangan</span>
                  <span style={{
                    fontSize: '9px',
                    backgroundColor: '#FDE68A',
                    color: '#78350F',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontWeight: 800,
                    textTransform: 'uppercase'
                  }}>
                    Under Dev
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#B45309', lineHeight: '1.45' }}>
                  Layanan OTP otomatis (Nodemailer / SMTP / WhatsApp) belum aktif. Masuk langsung menggunakan <strong>Email</strong> dan <strong>Kata Sandi</strong> akun Anda.
                </div>
              </div>
            </div>
          )}

          {/* Error Alert Banner */}
          {errorMessage && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#991B1B',
              fontSize: '12px',
              lineHeight: '1.4',
              fontWeight: 600
            }}>
              <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Login Form with strict autocomplete off */}
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
          >
            {loginMethod === 'email' ? (
              <>
                {/* Field 1: Email Akun */}
                <div className="form-group">
                  <div className="form-label">
                    <span>Alamat Email Terdaftar</span>
                    <span style={{ fontSize: '11px', color: '#004F27', fontWeight: 700 }}>Login Aktif</span>
                  </div>
                  <div className="form-input-wrapper">
                    <div className="input-icon-left">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      id="login_player_email"
                      name="player_email_prevent_autofill"
                      className="form-input"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="nama@email.com"
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      required
                    />
                  </div>
                </div>

                {/* Field 2: Password / PIN */}
                <div className="form-group">
                  <div className="form-label">
                    <span>Kata Sandi / PIN Akun</span>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); setShowOtpNoticeModal(true); }}
                      style={{ fontSize: '11px', color: '#004F27', fontWeight: 700 }}
                    >
                      Lupa PIN?
                    </a>
                  </div>
                  <div className="form-input-wrapper">
                    <div className="input-icon-left">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login_player_password"
                      name="player_password_prevent_autofill"
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun"
                      autoComplete="new-password"
                      required
                    />
                    <div className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </div>
                  </div>
                </div>

                {/* Remember Me & Desktop Session Tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div
                    className="checkbox-label"
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    <div className={`custom-checkbox ${rememberMe ? 'checked' : ''}`}>
                      {rememberMe && <Check size={12} color="white" />}
                    </div>
                    <span style={{ color: '#2B3830', fontWeight: 600 }}>Ingat saya di perangkat ini</span>
                  </div>
                  <span style={{ color: '#7A897F', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🖥 Desktop Sesi
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    height: '48px',
                    fontSize: '15px',
                    backgroundColor: '#004F27'
                  }}
                >
                  {loading ? 'Memverifikasi Kredensial...' : (
                    <>
                      <span>Masuk ke Portal Pemain</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Field Nomor HP (Disabled / Under Dev) */}
                <div className="form-group" style={{ opacity: 0.85 }}>
                  <div className="form-label">
                    <span>Nomor WhatsApp / Ponsel</span>
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}>
                      Belum Dikembangkan
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0 12px',
                      backgroundColor: '#F3F4F6',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#9CA3AF'
                    }}>
                      <Phone size={14} color="#9CA3AF" />
                      <span>+62</span>
                    </div>
                    <div className="form-input-wrapper" style={{ flex: 1 }}>
                      <input
                        type="text"
                        disabled
                        className="form-input"
                        placeholder="812-3456-7890 (Fitur Belum Tersedia)"
                        style={{
                          backgroundColor: '#F9FAFB',
                          borderColor: '#E5E7EB',
                          color: '#9CA3AF',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Notice Card Khusus Nomor HP Belum Dikembangkan */}
                <div style={{
                  backgroundColor: '#FFFBEB',
                  border: '1.5px solid #FCD34D',
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#FEF3C7',
                      color: '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#92400E', marginBottom: '3px' }}>
                        Masuk dengan Nomor HP Belum Dikembangkan
                      </div>
                      <div style={{ fontSize: '12px', color: '#B45309', lineHeight: '1.45' }}>
                        Sistem pengiriman kode verifikasi OTP melalui WhatsApp Business API maupun SMS Gateway saat ini masih dalam proses pengembangan. Untuk masuk ke portal, silakan gunakan pilihan <strong>Email Akun</strong>.
                      </div>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #FDE68A',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ fontSize: '12px', color: '#2B3830', fontWeight: 600 }}>
                      Ingin login sekarang?
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('email');
                        setErrorMessage('');
                      }}
                      style={{
                        backgroundColor: '#004F27',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 'var(--radius-full)',
                        padding: '7px 16px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <Mail size={13} />
                      <span>Beralih ke Email Akun →</span>
                    </button>
                  </div>
                </div>

                {/* Action button in phone mode: switches directly to email */}
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('email');
                    setErrorMessage('');
                  }}
                  className="btn-primary"
                  style={{
                    height: '48px',
                    fontSize: '14px',
                    backgroundColor: '#004F27',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Mail size={16} />
                  <span>Pilih Masuk Menggunakan Email</span>
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </form>

            {/* Register Callout */}
          <div className="divider-text">ATAU BELUM PUNYA AKUN?</div>

          <Link
            href="/register"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '13px',
              backgroundColor: '#EBF6EE',
              color: '#004F27',
              border: '1px solid #D2E7D8',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 700,
              transition: 'background 0.2s'
            }}
          >
            + Daftar Jadi Pemain Baru
          </Link>

          {/* Schedule Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#7A897F',
            paddingTop: '6px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} /> Jadwal Sesi: 13:00 - 22:00 WIB
            </span>
            <strong style={{ color: '#004F27' }}>Rabu – Minggu</strong>
          </div>

        </div>

      </main>

      {/* BOTTOM FOOTER BAR */}
      <footer style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #D7E6DB',
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '12px', color: '#5A675E', fontWeight: 600 }}>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={14} color="#004F27" /> Aturan & Panduan Hong Kong Fan
          </a>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="#004F27" /> Jadwal Turnamen & Event
          </a>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trophy size={14} color="#004F27" /> Klasemen Pemain
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: '#7A897F' }}>
            © 2025 Mahjongyuks Indonesia • Rekreasi & Olahraga Pikiran
          </span>
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#EBF6EE',
              color: '#004F27',
              border: '1px solid #D7E6DB',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            <Headphones size={13} />
            Bantuan Admin Concierge
          </button>
        </div>
      </footer>

      {/* OTP SERVICE DEVELOPMENT MODAL */}
      {showOtpNoticeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '420px',
            padding: '28px 24px',
            boxShadow: 'var(--shadow-hover)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setShowOtpNoticeModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                color: '#7A897F'
              }}
            >
              <X size={20} />
            </button>

            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', marginBottom: '6px' }}>
              Fitur Masih Dalam Pengembangan
            </h3>

            <p style={{ fontSize: '13px', color: '#5A675E', lineHeight: '1.5', marginBottom: '18px' }}>
              Integrasi gateway pengiriman kode OTP otomatis (melalui WhatsApp Business API maupun Email SMTP / Nodemailer) saat ini masih dalam proses pengembangan teknis.
            </p>

            <div style={{
              backgroundColor: '#F8FAF8',
              border: '1px solid #D2E7D8',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '12px',
              color: '#2B3830',
              lineHeight: '1.45',
              marginBottom: '18px'
            }}>
              Untuk masuk ke akun Anda, silakan gunakan <strong>Email / Nomor Ponsel</strong> dan <strong>Kata Sandi</strong> yang telah dibuat saat pendaftaran.
            </div>

            <button
              type="button"
              onClick={() => setShowOtpNoticeModal(false)}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              Mengerti & Kembali
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
