'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { KemahiranLevel, KEMAHIRAN_MAP } from '@/lib/kemahiran';
import '@/app/login/login.css';
import {
  User as UserIcon,
  AtSign,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  ArrowRight,
  AlertTriangle,
  Store,
  Trophy,
  ShieldCheck,
  Layers,
  BarChart3,
  Users,
  UserPlus,
  AlertCircle
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
  const [kemahiran, setKemahiran] = useState<KemahiranLevel>('Intermediate');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const redirectUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null;
      if (redirectUrl && redirectUrl.startsWith('/')) {
        router.push(redirectUrl);
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(res.message || 'Gagal registrasi.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF8F5',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* HEADER BAR */}
      <header style={{
        height: '76px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #D7E6DB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Brand & Club Portal */}
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
            REGISTRASI ANGGOTA
          </span>

          <span style={{ color: '#D7E6DB', fontSize: '16px' }}>|</span>

          <span style={{ fontSize: '12px', color: '#5A675E', fontWeight: 500 }}>
            Komunitas & Superapp Hong Kong Mahjong Indonesia
          </span>
        </div>

        {/* Right Header: Back to Landing & Login Link */}
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
            className="login-register-btn"
            style={{
              width: 'auto',
              padding: '8px 16px',
              fontSize: '12.5px',
              borderRadius: '10px'
            }}
          >
            <UserIcon size={14} />
            <span>Masuk ke Akun</span>
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT AREA: 2-COLUMN BALANCED GRID */}
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

        {/* LEFT COLUMN: Community & Membership Value */}
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
              Daftar Akun Anggota Mahjongyuks.
            </h1>
            <p style={{ fontSize: '14px', color: '#3F4940', marginTop: '10px', lineHeight: '1.55' }}>
              Dapatkan satu ID komunitas terpadu untuk reservasi meja otomatis, melacak perolehan poin Elo riil, dan bergabung di arena turnamen Hong Kong Style offline bergengsi.
            </p>
          </div>

          {/* Parlor Photo Banner */}
          <div style={{
            position: 'relative',
            height: '240px',
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
                <span>Official Player Pass • MahjongYuks Hub</span>
              </div>
              <span style={{
                backgroundColor: '#004F27',
                color: '#98F6C2',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800
              }}>
                Pendaftaran Gratis
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
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#111E18' }}>Satu ID Terpadu</div>
              <div style={{ fontSize: '11px', color: '#6F7A71', marginTop: '2px' }}>Akses Sedayu City Hub</div>
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
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#111E18' }}>Live MMR & Elo</div>
              <div style={{ fontSize: '11px', color: '#6F7A71', marginTop: '2px' }}>Skor resmi kompetitif</div>
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
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <ShieldCheck size={18} color="#004F27" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#004F27', marginBottom: '2px' }}>
                Standard Olahraga Pikiran & Fairplay Resmi
              </div>
              <div style={{ fontSize: '11.5px', color: '#2B3830', lineHeight: '1.45' }}>
                Poin Rating (Elo) di Mahjongyuks hanya diperoleh dari hasil nyata di meja parlor dan turnamen offline resmi. Murni strategi Hong Kong Style, bebas dari taruhan/judi.
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Real Registration Form Card */}
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
                AKUN ANGGOTA BARU
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111E18', marginTop: '2px' }}>
                Formulir Pendaftaran
              </h2>
            </div>
            <span className="badge-pill badge-mint" style={{ fontSize: '11.5px', padding: '5px 12px' }}>
              <UserPlus size={13} color="#004F27" />
              <span>Registrasi Gratis</span>
            </span>
          </div>

          {/* OTP Development Warning Notice Banner */}
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
                Akun yang didaftarkan langsung aktif secara otomatis tanpa perlu verifikasi kode OTP email. Masuk langsung menggunakan <strong>Email</strong> dan <strong>Kata Sandi</strong>.
              </div>
            </div>
          </div>

          {/* Error Alert Banner */}
          {error && (
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
              <div>{error}</div>
            </div>
          )}

          {/* Registration Form */}
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* ROW 1: Nama Lengkap & Mahjong Handle (2-col grid) */}
            <div className="login-form-grid-2">
              {/* Field 1: Nama Lengkap */}
              <div className="login-form-group">
                <label htmlFor="reg_player_nama" className="login-form-label">
                  <span>Nama Lengkap (KTP/ID)</span>
                </label>
                <div className="login-form-input-wrapper">
                  <div className="login-input-icon-left">
                    <UserIcon size={17} color="#5A675E" />
                  </div>
                  <input
                    type="text"
                    id="reg_player_nama"
                    name="reg_player_nama_prevent_autofill"
                    className="login-form-input"
                    placeholder="Nama lengkap Anda"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="words"
                    spellCheck={false}
                    required
                  />
                </div>
              </div>

              {/* Field 2: Mahjong Handle */}
              <div className="login-form-group">
                <label htmlFor="reg_player_handle" className="login-form-label">
                  <span>Nickname Meja</span>
                  <span style={{ fontSize: '10.5px', color: '#004F27', fontWeight: 700 }}>Layar Meja</span>
                </label>
                <div className="login-form-input-wrapper">
                  <div className="login-input-icon-left">
                    <AtSign size={17} color="#5A675E" />
                  </div>
                  <input
                    type="text"
                    id="reg_player_handle"
                    name="reg_player_handle_prevent_autofill"
                    className="login-form-input"
                    placeholder="Contoh: Kevin_Jkt"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            {/* ROW 2: Email & WhatsApp (2-col grid) */}
            <div className="login-form-grid-2">
              {/* Field 3: Email */}
              <div className="login-form-group">
                <label htmlFor="reg_player_email" className="login-form-label">
                  <span>Alamat Email</span>
                </label>
                <div className="login-form-input-wrapper">
                  <div className="login-input-icon-left">
                    <Mail size={17} color="#5A675E" />
                  </div>
                  <input
                    type="email"
                    id="reg_player_email"
                    name="reg_player_email_prevent_autofill"
                    className="login-form-input"
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

              {/* Field 4: WhatsApp */}
              <div className="login-form-group">
                <label htmlFor="reg_player_phone" className="login-form-label">
                  <span>Nomor WhatsApp</span>
                  <span style={{ fontSize: '10.5px', color: '#004F27', fontWeight: 700 }}>Aktif (SMS/WA)</span>
                </label>
                <div className="login-form-input-wrapper">
                  <div className="login-input-icon-left">
                    <Phone size={17} color="#5A675E" />
                  </div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#2B3830',
                    paddingRight: '10px',
                    marginRight: '2px',
                    borderRight: '1.5px solid #D7E6DB',
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: '22px',
                    userSelect: 'none',
                    letterSpacing: '0.2px'
                  }}>
                    +62
                  </span>
                  <input
                    type="tel"
                    id="reg_player_phone"
                    name="reg_player_phone_prevent_autofill"
                    className="login-form-input"
                    placeholder="812-3456-7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ''))}
                    autoComplete="off"
                    style={{ paddingLeft: '8px' }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Field 5: Kata Sandi */}
            <div className="login-form-group">
              <label htmlFor="reg_player_password" className="login-form-label">
                <span>Kata Sandi Akun</span>
                <span style={{ fontSize: '11px', color: '#7A897F', fontWeight: 500 }}>Min. 8 karakter</span>
              </label>
              <div className="login-form-input-wrapper">
                <div className="login-input-icon-left">
                  <Lock size={17} color="#5A675E" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="reg_player_password"
                  name="reg_player_password_prevent_autofill"
                  className="login-form-input"
                  placeholder="Masukkan kata sandi aman"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Field 6: Tingkat Kemahiran Bermain */}
            <div className="login-form-group">
              <label className="login-form-label">
                <span>Tingkat Kemahiran Bermain</span>
                <span style={{ fontSize: '11px', color: '#004F27', fontWeight: 700 }}>Bisa Diubah Kapan Saja</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {(['Beginner', 'Intermediate', 'Advance'] as const).map((level) => {
                  const isSelected = kemahiran === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setKemahiran(level)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '10px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: isSelected ? '#004F27' : '#F8FBF8',
                        color: isSelected ? '#FFFFFF' : '#3F4940',
                        border: isSelected ? '1.5px solid #004F27' : '1.5px solid #D7E6DB',
                        boxShadow: isSelected ? '0 2px 8px rgba(0, 79, 39, 0.2)' : 'none'
                      }}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
              <div style={{
                marginTop: '4px',
                padding: '8px 12px',
                backgroundColor: '#F8FAF8',
                borderRadius: '10px',
                border: '1px solid #D7E6DB',
                fontSize: '11.5px',
                color: '#2B3830',
                lineHeight: '1.45'
              }}>
                <strong>{kemahiran}:</strong> {KEMAHIRAN_MAP[kemahiran].deskripsi}
              </div>
            </div>

            {/* Agreement Checkbox */}
            <label
              className="login-checkbox-label"
              onClick={() => setAgreed(!agreed)}
              style={{ alignItems: 'flex-start', marginTop: '4px' }}
            >
              <div className={`login-custom-checkbox ${agreed ? 'checked' : ''}`} style={{ marginTop: '2px' }}>
                {agreed && <Check size={12} color="white" />}
              </div>
              <span style={{ fontSize: '12px', color: '#2B3830', lineHeight: '1.4' }}>
                Saya menyetujui <strong style={{ color: '#004F27' }}>Ketentuan Fairplay Komunitas</strong> & Kebijakan Gamehouse Mahjongyuks.
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn_register_submit"
              className="login-submit-btn"
              disabled={loading}
              style={{ marginTop: '4px' }}
            >
              {loading ? 'Mendaftarkan Akun...' : (
                <>
                  <span>Daftar Akun Sekarang</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            {/* Already have account */}
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#5A675E', marginTop: '6px' }}>
              Sudah memiliki akun member?{' '}
              <Link href="/login" style={{ fontWeight: 800, color: '#004F27', textDecoration: 'underline' }}>
                Masuk di sini
              </Link>
            </div>
          </form>

        </div>

      </main>

    </div>
  );
}
