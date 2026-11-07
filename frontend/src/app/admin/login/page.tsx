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
  ShieldAlert,
  Layers,
  CalendarCheck,
  CreditCard,
  Trophy,
  Check,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import '@/app/login/login.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSpvModal, setShowSpvModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // Real API authentication with admin role validation
    const result = await login({
      identifier,
      password,
      role: 'admin',
    });

    setLoading(false);

    if (result.success) {
      const currentUser = ApiClient.getUser();
      if (currentUser?.role !== 'admin') {
        ApiClient.clearToken();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mahjongyuks_user');
          localStorage.removeItem('mahjongyuks_token');
        }
        setErrorMessage('Akses ditolak: Akun ini bukan akun staf/administrator. Silakan masuk melalui Portal Pemain di /login.');
        return;
      }
      router.push('/admin/dashboard');
    } else {
      setErrorMessage(result.message || 'Alamat Email Admin atau Kata Sandi salah. Silakan periksa kembali kredensial Anda.');
    }
  };

  return (
    <div style={{ flex: '1 0 auto', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F1FCF4' }}>
      
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
        {/* Brand & Backoffice Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
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
          </Link>

          <span className="badge-pill badge-mint" style={{ fontSize: '11px', padding: '3px 10px' }}>
            PANEL ADMINISTRATOR
          </span>

          <span style={{ color: '#D7E6DB', fontSize: '16px' }}>|</span>

          <span style={{ fontSize: '12px', color: '#5A675E', fontWeight: 500 }}>
            Game House & Event Management System
          </span>
        </div>

        {/* Right Header: Back to Landing & Player Portal */}
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
            href="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#004F27',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D7E6DB',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              textDecoration: 'none',
              transition: 'background 0.2s'
            }}
          >
            <ExternalLink size={13} />
            <span>Portal Pemain</span>
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

        {/* LEFT COLUMN: Admin Login Form Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid #D7E6DB',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          
          {/* Badge & Title */}
          <div>
            <span className="badge-pill badge-gold" style={{ fontSize: '11px', padding: '4px 10px', marginBottom: '8px' }}>
              <ShieldCheck size={13} /> OTORITAS OPERASIONAL & STAF
            </span>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111E18', marginTop: '6px', letterSpacing: '-0.3px' }}>
              Masuk Konsol Admin
            </h1>
            <p style={{ fontSize: '13px', color: '#5A675E', marginTop: '4px', lineHeight: '1.5' }}>
              Gunakan email resmi administrator dan kata sandi untuk mengelola data venue, meja, jadwal, dan pencatatan skor.
            </p>
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
              fontSize: '12.5px',
              lineHeight: '1.4',
              fontWeight: 600
            }}>
              <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
          >
            
            {/* Field 1: Alamat Email Admin */}
            <div className="login-form-group">
              <label htmlFor="admin_email_input" className="login-form-label">
                <span>Alamat Email Admin</span>
                <span style={{ fontSize: '11px', color: '#7A897F', fontWeight: 500 }}>Email Terdaftar</span>
              </label>
              <div className="login-form-input-wrapper">
                <div className="login-input-icon-left">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  id="admin_email_input"
                  name="admin_email_input"
                  className="login-form-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@mahjongyuks.id"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                />
              </div>
            </div>

            {/* Field 2: Password Admin */}
            <div className="login-form-group">
              <div className="login-form-label">
                <label htmlFor="admin_password_input">Kata Sandi Akun</label>
                <button
                  type="button"
                  onClick={() => setShowSpvModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '11px',
                    color: '#004F27',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Bantuan Kunci?
                </button>
              </div>
              <div className="login-form-input-wrapper">
                <div className="login-input-icon-left">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="admin_password_input"
                  name="admin_password_input"
                  className="login-form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Sanctum Session Info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <label
                className="login-checkbox-label"
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div className={`login-custom-checkbox ${rememberMe ? 'checked' : ''}`}>
                  {rememberMe && <Check size={12} color="white" />}
                </div>
                <span>Ingat sesi di perangkat ini</span>
              </label>
              <span style={{ color: '#5A675E', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                <ShieldCheck size={14} color="#16A34A" />
                <span>Token Sanctum</span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn_admin_login_submit"
              className="login-submit-btn"
              disabled={loading}
              style={{ marginTop: '4px' }}
            >
              {loading ? 'Mengotentikasi...' : (
                <>
                  <span>Masuk ke Panel Admin</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#7A897F',
            lineHeight: '1.4',
            paddingTop: '8px',
            borderTop: '1px solid #F0F5F1'
          }}>
            <ShieldAlert size={14} color="#5A675E" style={{ flexShrink: 0 }} />
            <span>Halaman ini khusus pengelola operasional resmi MahjongYuks. Akses tidak sah akan diblokir.</span>
          </div>

        </div>

        {/* RIGHT COLUMN: Official MahjongYuks Operational Overview */}
        <div style={{
          backgroundColor: '#E8F6ED',
          border: '1px solid #D2E7D8',
          borderRadius: '24px',
          padding: '36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          
          {/* Top Badge */}
          <div>
            <span className="badge-pill badge-mint" style={{ fontSize: '11px', padding: '4px 12px' }}>
              <ShieldCheck size={13} /> PANEL OPERASIONAL
            </span>
          </div>

          {/* Heading */}
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111E18', lineHeight: '1.25', letterSpacing: '-0.4px' }}>
              Pusat Kendali Operasional MahjongYuks
            </h2>
            <p style={{ fontSize: '13.5px', color: '#3F4940', marginTop: '6px', lineHeight: '1.5' }}>
              Portal terpadu pengelola untuk monitoring venue, reservasi meja, verifikasi pembayaran, dan pencatatan sesi permainan.
            </p>
          </div>

          {/* 4 Real Core Capabilities based on AGENTS.md */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '4px' }}>
            
            {/* Feature 1 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '14px 16px',
              border: '1px solid #D7E6DB',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: '#EBF6EE',
                  color: '#004F27',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Layers size={15} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#111E18' }}>
                  Venue & Meja
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#5A675E', lineHeight: '1.45', margin: 0 }}>
                Kelola meja otomatis toko utama Sedayu City dan set meja manual untuk event komunitas.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '14px 16px',
              border: '1px solid #D7E6DB',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: '#EBF6EE',
                  color: '#004F27',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CalendarCheck size={15} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#111E18' }}>
                  Reservasi Kursi
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#5A675E', lineHeight: '1.45', margin: 0 }}>
                Validasi pemesanan kursi pemain secara real-time dengan batas maksimal 4 kursi per meja.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '14px 16px',
              border: '1px solid #D7E6DB',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: '#EBF6EE',
                  color: '#004F27',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CreditCard size={15} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#111E18' }}>
                  Verifikasi Bayar
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#5A675E', lineHeight: '1.45', margin: 0 }}>
                Pantau rekonsiliasi pembayaran simulasi dan konfirmasi status pelunasan booking.
              </p>
            </div>

            {/* Feature 4 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '14px 16px',
              border: '1px solid #D7E6DB',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: '#EBF6EE',
                  color: '#004F27',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Trophy size={15} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#111E18' }}>
                  Sesi & Skor Fan
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#5A675E', lineHeight: '1.45', margin: 0 }}>
                Buka sesi bermain meja, catat poin pemain kompetitif, dan integrasi klasemen leaderboard.
              </p>
            </div>

          </div>

          {/* Internal Assistance Note */}
          <div style={{
            backgroundColor: '#DCF1E3',
            border: '1px solid #BDDFCA',
            borderRadius: '14px',
            padding: '12px 16px',
            fontSize: '11.5px',
            color: '#2B3830',
            lineHeight: '1.5'
          }}>
            <strong>Bantuan Operasional Internal:</strong> Untuk registrasi staf baru atau pengaturan izin akses modul, hubungi Administrator Utama di <strong>admin@mahjongyuks.id</strong>.
          </div>

        </div>

      </main>

      {/* SPV / SSO ASSISTANCE MODAL */}
      {showSpvModal && (
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
              onClick={() => setShowSpvModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                color: '#7A897F',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px'
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
              <HelpCircle size={24} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', marginBottom: '6px' }}>
              Bantuan Akses Kredensial Admin
            </h3>

            <p style={{ fontSize: '13px', color: '#5A675E', lineHeight: '1.5', marginBottom: '18px' }}>
              Untuk alasan kepatuhan keamanan dan perlindungan data operasional, reset kata sandi akun administrator dilakukan melalui verifikasi Administrator Utama.
            </p>

            <div style={{
              backgroundColor: '#F8FAF8',
              border: '1px solid #D2E7D8',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '12px',
              color: '#2B3830',
              lineHeight: '1.5',
              marginBottom: '18px'
            }}>
              <div>Silakan hubungi administrator sistem melalui email: <strong>admin@mahjongyuks.id</strong> untuk prosedur verifikasi dan pemulihan kredensial staf.</div>
            </div>

            <button
              type="button"
              onClick={() => setShowSpvModal(false)}
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
