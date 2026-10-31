'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  Store,
  Terminal,
  Clock,
  Layers,
  Award,
  CreditCard,
  Scale,
  QrCode,
  Headphones,
  Check,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  X
} from 'lucide-react';

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
      router.push('/admin/dashboard');
    } else {
      setErrorMessage(result.message || 'Alamat Email Admin atau Kata Sandi SSO salah. Silakan periksa kembali.');
    }
  };

  return (
    <div style={{ flex: '1 0 auto', minHeight: 'auto', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F1FCF4' }}>
      
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
            BACKOFFICE & STAF
          </span>

          <span style={{ color: '#D7E6DB', fontSize: '16px' }}>|</span>

          <span style={{ fontSize: '12px', color: '#5A675E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Store size={14} color="#004F27" />
            Game House MahjongYuks Sedayu City • Kelapa Gading Hub #01
          </span>
        </div>

        {/* Server Status & Player Portal Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
            Sistem Server Normal <span style={{ color: '#5A675E', fontWeight: 500 }}>99.98%</span>
          </div>

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
              transition: 'background 0.2s'
            }}
          >
            <ExternalLink size={13} />
            Portal Tamu & Peserta
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main style={{
        flex: 1,
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto',
        padding: '36px 24px',
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
          border: '1px solid var(--border-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          
          {/* Badge & Title */}
          <div>
            <span className="badge-pill badge-gold" style={{ fontSize: '11px', padding: '4px 10px', marginBottom: '8px' }}>
              <KeyRound size={12} /> Otoritas Petugas & Juri
            </span>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111E18', marginTop: '6px' }}>
              Masuk Staf & Operasional
            </h1>
            <p style={{ fontSize: '13px', color: '#5A675E', marginTop: '4px', lineHeight: '1.5' }}>
              Gunakan email resmi administrator & kata sandi SSO untuk membuka instans meja dan panel skor.
            </p>
          </div>

          {/* OTP Development Warning Notice Banner */}
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '1.5px solid #FCD34D',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '1px'
            }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#92400E', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Sistem Verifikasi OTP Tahap Pengembangan</span>
                <span style={{
                  fontSize: '10px',
                  backgroundColor: '#FDE68A',
                  color: '#78350F',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}>
                  Under Dev
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#B45309', lineHeight: '1.45' }}>
                Integrasi sistem OTP otomatis (seperti <strong>Nodemailer / Email Gateway</strong> dan SMS 2FA) saat ini masih dalam proses pengembangan. Masuk konsol diverifikasi langsung ke database menggunakan <strong>Alamat Email Admin</strong> dan <strong>Kata Sandi SSO</strong>.
              </div>
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

          {/* Form with strict autocomplete off */}
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
          >
            
            {/* Field 1: Alamat Email Admin */}
            <div className="form-group">
              <div className="form-label">
                <span>Alamat Email Admin / Staf</span>
                <span style={{ fontSize: '11px', color: '#7A897F' }}>Email Terdaftar</span>
              </div>
              <div className="form-input-wrapper">
                <div className="input-icon-left">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  id="admin_email_input"
                  name="admin_email_prevent_autofill"
                  className="form-input"
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

            {/* Field 2: Password SSO */}
            <div className="form-group">
              <div className="form-label">
                <span>Kata Sandi SSO</span>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setShowSpvModal(true); }}
                  style={{ fontSize: '11px', color: '#004F27', fontWeight: 700 }}
                >
                  Lupa Kunci?
                </a>
              </div>
              <div className="form-input-wrapper">
                <div className="input-icon-left">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="admin_password_input"
                  name="admin_password_prevent_autofill"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  required
                />
                <div className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </div>
              </div>
            </div>

            {/* Remember Me & Session Duration */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <div
                className="checkbox-label"
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div className={`custom-checkbox ${rememberMe ? 'checked' : ''}`}>
                  {rememberMe && <Check size={12} color="white" />}
                </div>
                <span style={{ color: '#2B3830', fontWeight: 600 }}>Ingat sesi di perangkat terminal ini</span>
              </div>
              <span style={{
                backgroundColor: '#F1F5F2',
                color: '#5A675E',
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Clock size={11} /> Sesi 8 Jam
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
              {loading ? 'Mengotentikasi...' : (
                <>
                  <span>Masuk Dashboard Konsol</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Warning Notice Box */}
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <ShieldAlert size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '11px', color: '#991B1B', lineHeight: '1.45' }}>
              Akses terbatas staf terdaftar Mahjongyuks. Semua transaksi koin, faan, dan pergantian meja tercatat pada audit log HKMA.
            </span>
          </div>

          {/* Terminal Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#7A897F',
            fontFamily: 'monospace',
            paddingTop: '8px',
            borderTop: '1px solid #F0F5F1'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Terminal size={12} /> Terminal ID: SEDAYU-01
            </span>
            <span>v2.4.0-staf (TLS 1.3)</span>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Operations Overview (Mint Panel) */}
        <div style={{
          backgroundColor: '#E8F6ED',
          border: '1px solid #D2E7D8',
          borderRadius: '24px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          
          {/* Live Hub Header Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            border: '1px solid #E2EDE5',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#EBF6EE',
              color: '#004F27',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Check size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#111E18' }}>
                  Game House MahjongYuks Sedayu City
                </span>
                <span className="badge-pill badge-mint" style={{ fontSize: '9px', padding: '2px 8px' }}>
                  ● Live Hub
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#5A675E', marginTop: '2px' }}>
                Pusat Operasional Meja Otomatis & Turnamen Komunitas
              </div>
            </div>
          </div>

          {/* 3 Live Tables Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            
            {/* Table 1 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '12px',
              border: '1px solid #E2EDE5',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#111E18' }}>Meja A1 - Auto</span>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' }}>
                    In-Game
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#5A675E', lineHeight: '1.3' }}>
                  Round: East 3 • Mahjong HK 8 Faan
                </div>
              </div>
              <div style={{ fontSize: '9px', color: '#7A897F', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F0F5F1', paddingTop: '6px' }}>
                <strong style={{ color: '#004F27' }}>Shuffler: 100% Ready</strong>
                <span>42 Min Sisa</span>
              </div>
            </div>

            {/* Table 2 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '12px',
              border: '1px solid #E2EDE5',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#111E18' }}>Meja A2 - Auto</span>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#855E00', backgroundColor: '#FFF4D6', padding: '2px 6px', borderRadius: '4px' }}>
                    Shuffle
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#5A675E', lineHeight: '1.3' }}>
                  Siklus Tile Wash Sedang Berjalan
                </div>
              </div>
              <div style={{ fontSize: '9px', color: '#7A897F', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F0F5F1', paddingTop: '6px' }}>
                <strong style={{ color: '#004F27' }}>Sensor: Clean</strong>
                <span>Ready in 20s</span>
              </div>
            </div>

            {/* Table 3 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '12px',
              border: '1px solid #E2EDE5',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#111E18' }}>Meja B1 - VIP</span>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#4B5563', backgroundColor: '#E5E7EB', padding: '2px 6px', borderRadius: '4px' }}>
                    Standby
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#5A675E', lineHeight: '1.3' }}>
                  Reservasi Turnamen Pukul 15:00
                </div>
              </div>
              <div style={{ fontSize: '9px', color: '#7A897F', borderTop: '1px solid #F0F5F1', paddingTop: '6px' }}>
                Mesin: Standby Tile Set Blue
              </div>
            </div>

          </div>

          {/* Active Tournament Bracket Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid #E2EDE5',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#004F27',
                  color: '#98F6C2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Award size={16} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#111E18' }}>
                  Bracket Turnamen Aktif: Sedayu Open Q2
                </span>
              </div>
              <span className="badge-pill badge-gold" style={{ fontSize: '10px', padding: '2px 8px' }}>
                Babak 16 Besar
              </span>
            </div>

            <p style={{ fontSize: '11px', color: '#5A675E', lineHeight: '1.45', marginLeft: '36px' }}>
              12 dari 16 peserta sudah check-in via QR tiket. Meja eliminasi sinkron otomatis ke papan klasemen.
            </p>

            <div style={{ marginLeft: '36px', fontSize: '11px', fontWeight: 700, color: '#004F27', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🀄 HK Style Auto-Faan</span>
              <span>•</span>
              <span style={{ color: '#5A675E', fontWeight: 500 }}>Aturan: Min 3 Faan - Max 10 Faan</span>
            </div>
          </div>

          {/* Fungsi Terbuka Pasca-Login (3 Mini Cards) */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#7A897F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
              FUNGSI TERBUKA PASCA-LOGIN
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid #E2EDE5',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#EBF6EE', color: '#004F27', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CreditCard size={15} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#111E18' }}>Kasir & Topup</div>
                  <div style={{ fontSize: '10px', color: '#6F7A71' }}>EDC & QRIS</div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid #E2EDE5',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#EBF6EE', color: '#004F27', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Scale size={15} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#111E18' }}>Validasi Juri</div>
                  <div style={{ fontSize: '10px', color: '#6F7A71' }}>Dispute Log</div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid #E2EDE5',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#EBF6EE', color: '#004F27', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <QrCode size={15} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#111E18' }}>Pemindai Tiket</div>
                  <div style={{ fontSize: '10px', color: '#6F7A71' }}>Check-in Cepat</div>
                </div>
              </div>

            </div>
          </div>

          {/* SPV Assistance Box */}
          <div style={{
            backgroundColor: '#DCF1E3',
            border: '1px solid #BDDFCA',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Headphones size={16} color="#004F27" />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#004F27' }}>
                Butuh Otorisasi Supervisor (SPV)?
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#2B3830', lineHeight: '1.4' }}>
              Hubungi Duty Manager lantai via intercom atau panggil bantuan teknis meja.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
              <span style={{
                backgroundColor: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#004F27',
                border: '1px solid #C4DFC8'
              }}>
                Intercom: Ext 402
              </span>
              <span style={{
                backgroundColor: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#855E00',
                border: '1px solid #FFE4A3'
              }}>
                Emergency Shuffler Reset #9
              </span>
            </div>
          </div>

        </div>

      </main>



      {/* SPV / SSO NOTICE MODAL */}
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
              Reset Otorisasi Kunci Staf
            </h3>

            <p style={{ fontSize: '13px', color: '#5A675E', lineHeight: '1.5', marginBottom: '18px' }}>
              Fitur reset mandiri melalui email gateway (seperti <strong>Nodemailer</strong> / SMTP) dan kode OTP saat ini masih dalam tahap pengembangan teknis. Untuk alasan kepatuhan regulasi, pemulihan ID dan kunci operator wajib melalui verifikasi Duty Manager / Supervisor Venue.
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
              <div><strong>Intercom Operasional:</strong> Ext 402</div>
              <div><strong>Terminal Supervisor:</strong> Game House MahjongYuks Sedayu Hub Zone B</div>
            </div>

            <button
              type="button"
              onClick={() => setShowSpvModal(false)}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
