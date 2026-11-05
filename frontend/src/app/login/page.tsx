'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ApiClient from '@/lib/api';
import './login.css';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Check,
  Phone,
  Layers,
  BarChart3,
  Users,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Trophy,
  Headphones,
  AlertTriangle,
  X,
  User,
  UserPlus
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showOtpNoticeModal, setShowOtpNoticeModal] = useState(false);
  const [redirectParam, setRedirectParam] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('redirect');
      if (p) setRedirectParam(p);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    let targetIdentifier = identifier.trim();

    if (loginMethod === 'phone') {
      const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
      if (!cleanPhone || cleanPhone.length < 8) {
        setLoading(false);
        setErrorMessage('Harap masukkan nomor WhatsApp / ponsel yang valid (minimal 8-15 digit angka).');
        return;
      }
      targetIdentifier = cleanPhone;
    } else {
      if (!targetIdentifier) {
        setLoading(false);
        setErrorMessage('Harap masukkan alamat email akun Anda.');
        return;
      }
    }

    if (!password) {
      setLoading(false);
      setErrorMessage('Harap masukkan kata sandi / PIN akun Anda.');
      return;
    }

    // Call real Laravel API authentication
    const result = await login({
      identifier: targetIdentifier,
      email: loginMethod === 'email' ? targetIdentifier : undefined,
      no_telepon: loginMethod === 'phone' ? targetIdentifier : undefined,
      password,
      role: 'player',
    });

    setLoading(false);

    if (result.success) {
      const currentUser = ApiClient.getUser();
      if (currentUser?.role === 'admin') {
        // Keamanan ketat: Administrator dilarang masuk melalui Portal Pemain
        ApiClient.clearToken();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mahjongyuks_user');
          localStorage.removeItem('mahjongyuks_token');
        }
        setErrorMessage('Akses ditolak: Akun Administrator tidak dapat masuk melalui Portal Pemain. Silakan gunakan Portal Khusus Administrator di /admin/login.');
        return;
      }

      const redirectUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null;
      if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('/admin')) {
        router.push(redirectUrl);
      } else {
        router.push('/dashboard');
      }
    } else {
      setErrorMessage(result.message || 'Kombinasi Email dan kata sandi tidak valid. Silakan periksa kembali.');
    }
  };

  return (
    <div style={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column', backgroundColor: '#F1FCF4', width: '100%' }}>
      
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
              src="/assets/logo.png"
              alt="Mahjongyuks"
              width={52}
              height={40}
              priority
              style={{ objectFit: 'contain', height: '40px', width: 'auto' }}
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

        {/* Right Header: Back to Landing & Register Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#5A675E',
              textDecoration: 'none',
              transition: 'color 0.15s ease'
            }}
          >
            ← Kembali ke Beranda
          </Link>
          <Link
            href="/register"
            className="login-register-btn"
            style={{
              width: 'auto',
              padding: '8px 16px',
              fontSize: '12.5px',
              borderRadius: '10px'
            }}
          >
            <UserPlus size={14} />
            <span>Daftar Akun Baru</span>
          </Link>
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
            <span className="badge-pill badge-mint" style={{ fontSize: '11.5px', padding: '5px 12px' }}>
              <User size={13} color="#004F27" />
              <span>Portal Pemain</span>
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

            {/* Tab 2: Nomor HP (Aktif dengan Password) */}
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
                color: loginMethod === 'phone' ? '#004F27' : '#5A675E',
                boxShadow: loginMethod === 'phone' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Phone size={14} color={loginMethod === 'phone' ? '#004F27' : '#7A897F'} />
              <span>Nomor HP</span>
              <span style={{
                fontSize: '10px',
                backgroundColor: loginMethod === 'phone' ? '#DCF1E3' : '#E2EDE5',
                color: '#004F27',
                padding: '2px 7px',
                borderRadius: '6px',
                fontWeight: 800
              }}>
                Aktif
              </span>
            </button>
          </div>

          {/* Informative Tip Banner */}
          <div style={{
            backgroundColor: '#F4FAF6',
            border: '1.5px solid #D1E7D8',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: '#DCF1E3',
              color: '#004F27',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {loginMethod === 'email' ? <Mail size={15} /> : <Phone size={15} />}
            </div>
            <div style={{ fontSize: '11.5px', color: '#2B3830', lineHeight: '1.45' }}>
              {loginMethod === 'email' ? (
                <>Masuk langsung ke akun pemain Anda menggunakan <strong>Alamat Email</strong> dan <strong>Kata Sandi</strong> akun Anda.</>
              ) : (
                <>Masuk langsung ke akun pemain Anda menggunakan <strong>Nomor WhatsApp / Ponsel</strong> dan <strong>Kata Sandi</strong> akun Anda.</>
              )}
            </div>
          </div>

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
                <div className="login-form-group">
                  <label htmlFor="login_player_email" className="login-form-label">
                    <span>Alamat Email Terdaftar</span>
                    <span style={{ fontSize: '11.5px', color: '#004F27', fontWeight: 700 }}>Login Aktif</span>
                  </label>
                  <div className="login-form-input-wrapper">
                    <div className="login-input-icon-left">
                      <Mail size={17} color="#5A675E" />
                    </div>
                    <input
                      type="email"
                      id="login_player_email"
                      name="player_email_prevent_autofill"
                      className="login-form-input"
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
                <div className="login-form-group">
                  <div className="login-form-label">
                    <label htmlFor="login_player_password">Kata Sandi / PIN Akun</label>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); setShowOtpNoticeModal(true); }}
                      style={{ fontSize: '11.5px', color: '#004F27', fontWeight: 700, textDecoration: 'none' }}
                    >
                      Lupa PIN?
                    </a>
                  </div>
                  <div className="login-form-input-wrapper">
                    <div className="login-input-icon-left">
                      <Lock size={17} color="#5A675E" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login_player_password"
                      name="player_password_prevent_autofill"
                      className="login-form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="login-input-icon-right"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 14px' }}
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Secure Session Tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <label
                    className="login-checkbox-label"
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    <div className={`login-custom-checkbox ${rememberMe ? 'checked' : ''}`}>
                      {rememberMe && <Check size={12} color="white" />}
                    </div>
                    <span>Ingat saya di perangkat ini</span>
                  </label>
                  <span style={{ color: '#5A675E', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                    <ShieldCheck size={14} color="#16A34A" />
                    <span>Sesi Terenkripsi</span>
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="btn_login_submit"
                  className="login-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Memverifikasi Kredensial...' : (
                    <>
                      <span>Masuk ke Portal Pemain</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Field 1: Nomor WhatsApp / Ponsel */}
                <div className="login-form-group">
                  <label htmlFor="login_player_phone" className="login-form-label">
                    <span>Nomor WhatsApp / Ponsel Terdaftar</span>
                    <span style={{ fontSize: '11.5px', color: '#004F27', fontWeight: 700 }}>Login Aktif</span>
                  </label>
                  <div className="login-form-input-wrapper">
                    <div className="login-input-icon-left">
                      <Phone size={17} color="#5A675E" />
                    </div>
                    <input
                      type="tel"
                      id="login_player_phone"
                      name="player_phone_prevent_autofill"
                      className="login-form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                {/* Field 2: Password / PIN */}
                <div className="login-form-group">
                  <div className="login-form-label">
                    <label htmlFor="login_player_phone_password">Kata Sandi / PIN Akun</label>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); setShowOtpNoticeModal(true); }}
                      style={{ fontSize: '11.5px', color: '#004F27', fontWeight: 700, textDecoration: 'none' }}
                    >
                      Lupa PIN?
                    </a>
                  </div>
                  <div className="login-form-input-wrapper">
                    <div className="login-input-icon-left">
                      <Lock size={17} color="#5A675E" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login_player_phone_password"
                      name="player_phone_password_prevent_autofill"
                      className="login-form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="login-input-icon-right"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 14px' }}
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Secure Session Tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <label
                    className="login-checkbox-label"
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    <div className={`login-custom-checkbox ${rememberMe ? 'checked' : ''}`}>
                      {rememberMe && <Check size={12} color="white" />}
                    </div>
                    <span>Ingat saya di perangkat ini</span>
                  </label>
                  <span style={{ color: '#5A675E', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                    <ShieldCheck size={14} color="#16A34A" />
                    <span>Sesi Terenkripsi</span>
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="btn_login_phone_submit"
                  className="login-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Memverifikasi Nomor HP...' : (
                    <>
                      <span>Masuk ke Portal Pemain</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </>
            )}
          </form>

          {/* Register Callout */}
          <div className="login-divider">ATAU BELUM PUNYA AKUN?</div>

          <Link
            href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
            className="login-register-btn"
            id="btn_to_register"
          >
            <UserPlus size={16} />
            <span>Daftar Jadi Pemain Baru</span>
          </Link>
        </div>

      </main>



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
              className="login-submit-btn"
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
