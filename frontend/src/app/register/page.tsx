'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  User as UserIcon,
  AtSign,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Award,
  Sparkles,
  Building,
  Check,
  ArrowRight,
  AlertTriangle,
  X
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [nama, setNama] = useState('');
  const [handle, setHandle] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [kemahiran, setKemahiran] = useState<'Baru Belajar' | 'Intermediate' | 'Kompetitif'>('Intermediate');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDevNoticeModal, setShowDevNoticeModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('Anda harus menyetujui Ketentuan Fairplay Komunitas.');
      return;
    }
    setLoading(true);
    setError('');

    const res = await register({
      nama,
      email,
      password,
      no_telepon: phone ? `+62${phone}` : undefined,
      handle: handle || nama.toLowerCase().replace(/\s+/g, '_'),
      kemahiran,
    });

    setLoading(false);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.message || 'Gagal registrasi.');
    }
  };

  const handleGoogleSignup = () => {
    setShowDevNoticeModal(true);
  };

  return (
    <div className="auth-wrapper" style={{ padding: '32px 16px' }}>
      <div style={{ maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image
              src="/assets/mahjongyuks_logo.png"
              alt="Mahjongyuks"
              width={64}
              height={48}
              priority
              style={{ objectFit: 'contain' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#004F27', lineHeight: '1.2' }}>
                Mahjongyuks
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#6F7A71', letterSpacing: '0.5px' }}>
                KOMUNITAS & TURNAMEN
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#FFDF94',
            color: '#584300',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '11px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <Sparkles size={13} />
            REGISTRASI KOMUNITAS
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111E18', marginBottom: '4px' }}>
            Daftar Akun Mahjongyuks
          </h1>
          <p style={{ fontSize: '13px', color: '#5A675E', lineHeight: '1.45' }}>
            Peringkat dan Elo rating murni dihitung dari skor riil di meja parlor otomatis maupun turnamen offline resmi.
          </p>
        </div>

        {/* Notice Card: Fairplay */}
        <div style={{
          backgroundColor: '#EBF6EE',
          border: '1px solid #D2E7D8',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#004F27',
            color: '#98F6C2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Award size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#004F27', marginBottom: '2px' }}>
              Sistem Poin Kompetitif Fairplay
            </div>
            <p style={{ fontSize: '12px', color: '#3F4940', lineHeight: '1.45' }}>
              Di Mahjongyuks, Poin Rating (Elo) hanya diperoleh dari hasil nyata di meja permainan dan turnamen resmi — tidak ada sistem beli atau bonus instan.
            </p>
          </div>
        </div>

        {/* Main Form */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="auth-card"
          style={{ gap: '16px', padding: '24px' }}
        >
          
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
                <span>Sistem OTP Tahap Pengembangan</span>
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
                Layanan pengiriman kode OTP verifikasi (via Email seperti <strong>Nodemailer / SMTP</strong> atau WhatsApp Gateway) saat ini belum disambungkan ke server dan masih dalam tahap pengembangan aktif. Akun yang didaftarkan langsung aktif menggunakan <strong>Email</strong> dan <strong>Kata Sandi</strong>.
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 600
            }}>
              {error}
            </div>
          )}

          {/* Nama Lengkap */}
          <div className="form-group">
            <label className="form-label">Nama Lengkap (Sesuai KTP/ID)</label>
            <div className="form-input-wrapper">
              <div className="input-icon-left">
                <UserIcon size={16} />
              </div>
              <input
                type="text"
                id="reg_player_nama"
                name="reg_player_nama_prevent_autofill"
                className="form-input"
                placeholder="Nama lengkap"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                autoComplete="off"
                autoCapitalize="words"
                spellCheck={false}
                required
              />
            </div>
          </div>

          {/* Mahjong Handle */}
          <div className="form-group">
            <div className="form-label">
              <span>Mahjong Handle / Nickname Meja</span>
              <span style={{ fontSize: '11px', color: '#855E00', fontWeight: 600 }}>Tampil di Layar Meja</span>
            </div>
            <div className="form-input-wrapper">
              <div className="input-icon-left">
                <AtSign size={16} />
              </div>
              <input
                type="text"
                id="reg_player_handle"
                name="reg_player_handle_prevent_autofill"
                className="form-input"
                placeholder="Damien_Jkt"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="form-group">
            <div className="form-label">
              <span>Nomor WhatsApp Aktif</span>
              <span style={{ fontSize: '11px', color: '#B45309', fontWeight: 700 }}>OTP: Tahap Pengembangan</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 12px',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 700,
                color: '#111E18'
              }}>
                <span>🇮🇩</span>
                <span>+62</span>
              </div>
              <div className="form-input-wrapper" style={{ flex: 1 }}>
                <input
                  type="tel"
                  id="reg_player_phone"
                  name="reg_player_phone_prevent_autofill"
                  className="form-input"
                  placeholder="812-3456-7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="off"
                  required
                />
                <div className="input-icon-right">
                  <Phone size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <div className="form-input-wrapper">
              <div className="input-icon-left">
                <Mail size={16} />
              </div>
              <input
                type="email"
                id="reg_player_email"
                name="reg_player_email_prevent_autofill"
                className="form-input"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Kata Sandi Akun</label>
            <div className="form-input-wrapper">
              <div className="input-icon-left">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="reg_player_password"
                name="reg_player_password_prevent_autofill"
                className="form-input"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <div className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </div>
            </div>
          </div>

          {/* Tingkat Kemahiran Bermain */}
          <div className="form-group">
            <label className="form-label">Tingkat Kemahiran Bermain</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {(['Baru Belajar', 'Intermediate', 'Kompetitif'] as const).map((level) => {
                const isSelected = kemahiran === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setKemahiran(level)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '12px',
                      fontWeight: 700,
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      backgroundColor: isSelected ? '#004F27' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#3F4940',
                      border: isSelected ? '1px solid #004F27' : '1px solid var(--border-color)',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '11px', color: '#6F7A70', marginTop: '4px', lineHeight: '1.4' }}>
              ⓘ Catatan: Tingkat kemahiran ini dapat Anda sesuaikan kapan saja nantinya di pengaturan profil akun.
            </p>
          </div>

          {/* Agreement Checkbox */}
          <div
            className="checkbox-label"
            onClick={() => setAgreed(!agreed)}
            style={{ alignItems: 'flex-start', marginTop: '4px' }}
          >
            <div className={`custom-checkbox ${agreed ? 'checked' : ''}`} style={{ marginTop: '2px' }}>
              {agreed && <Check size={12} color="white" />}
            </div>
            <div style={{ fontSize: '12px', color: '#2B3830', lineHeight: '1.4' }}>
              Saya menyetujui <span style={{ fontWeight: 700, color: '#004F27' }}>Ketentuan Fairplay Komunitas</span> & Kebijakan Gamehouse Mahjongyuks.
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '4px' }}>
            {loading ? 'Mendaftarkan Akun...' : 'Daftar Akun Sekarang →'}
          </button>

          {/* Divider */}
          <div className="divider-text">ATAU DAFTAR INSTAN</div>

          {/* Google Button */}
          <button type="button" className="btn-social" onClick={handleGoogleSignup}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Daftar Cepat dengan Google
          </button>

          {/* Already have account */}
          <div style={{ textAlign: 'center', fontSize: '13px', color: '#5A675E', marginTop: '6px' }}>
            Sudah memiliki akun member?{' '}
            <Link href="/login" style={{ fontWeight: 800, color: '#004F27', textDecoration: 'underline' }}>
              Masuk di sini
            </Link>
          </div>
        </form>

        {/* Bottom Card: Satu ID Komunitas Terpadu */}
        <div style={{
          backgroundColor: '#E8F5EC',
          border: '1px solid #C8E6D2',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <Building size={20} color="#004F27" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#004F27' }}>
              Satu ID Komunitas Terpadu
            </div>
            <div style={{ fontSize: '11px', color: '#455A4C', lineHeight: '1.4' }}>
              Akun otomatis aktif untuk Parlor Alicia Bakery Sedayu City, Meja Otomatis Jabodetabek, dan seluruh Event Mitra Resmi.
            </div>
          </div>
        </div>

      </div>

      {/* DEV NOTICE MODAL FOR GOOGLE SIGNUP / OTP */}
      {showDevNoticeModal && (
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
              onClick={() => setShowDevNoticeModal(false)}
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
              Integrasi pendaftaran instan melalui Google OAuth dan sistem verifikasi OTP via email (seperti <strong>Nodemailer</strong> / SMTP) saat ini masih dalam proses pengerjaan teknis.
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
              Silakan lengkapi formulir pendaftaran di atas secara manual dengan <strong>Email</strong> dan <strong>Kata Sandi</strong> untuk langsung mengaktifkan akun Anda.
            </div>

            <button
              type="button"
              onClick={() => setShowDevNoticeModal(false)}
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
