'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Award,
  CheckCircle,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ApiClient from '@/lib/api';
import { normalizeKemahiran, KEMAHIRAN_MAP } from '@/lib/kemahiran';
import '@/app/events-venues/events-venues.css';

export default function ProfilPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    no_telepon: '',
    handle: '',
    tingkat_kemahiran: 'intermediate',
  });

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        nama: user.nama || '',
        email: user.email || '',
        no_telepon: user.no_telepon || '',
        handle: user.handle || '',
        tingkat_kemahiran: normalizeKemahiran(user.kemahiran || (user as any).tingkat_kemahiran || user.dan_rank),
      });
    }
  }, [user]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await ApiClient.updateProfile({
        nama: formData.nama,
        no_telepon: formData.no_telepon,
        tingkat_kemahiran: formData.tingkat_kemahiran,
      });

      if (res.success) {
        showToast('Profil Anda berhasil diperbarui!');
        // Update local session
        if (user) {
          const updatedUser = {
            ...user,
            nama: formData.nama,
            no_telepon: formData.no_telepon,
            handle: formData.handle,
            kemahiran: formData.tingkat_kemahiran,
            tingkat_kemahiran: formData.tingkat_kemahiran,
          };
          ApiClient.setUser(updatedUser as any);
        }
      } else {
        showToast(res.message || 'Gagal memperbarui profil.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan saat menyimpan profil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const kemahiranNormalized = normalizeKemahiran(formData.tingkat_kemahiran);
  const kemahiranDetail = KEMAHIRAN_MAP[kemahiranNormalized];

  return (
    <div className="ev-page-wrapper">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toastMessage.type === 'success' ? '#183629' : '#DC2626',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle size={18} color="#E2BC55" />
          ) : (
            <AlertCircle size={18} color="#FCA5A5" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Header */}
      <section className="ev-hero-section">
        <div className="ev-container">
          <nav aria-label="Breadcrumb" className="ev-breadcrumbs">
            <Link href="/dashboard">Dashboard</Link>
            <span className="separator">/</span>
            <span className="current">Profil Pemain</span>
          </nav>

          <h1 className="ev-hero-title">Pengaturan Profil &amp; Akun Atlet</h1>
          <p className="ev-hero-subtitle">
            Kelola identitas atlet MahjongYuks Anda, kontak verifikasi, preferensi akun, dan tingkat kemahiran bermain resmi.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="ev-container" style={{ flex: 1, padding: '32px 0 64px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '28px',
          alignItems: 'flex-start'
        }}>
          {/* Left Column: Profile Card */}
          <div style={{
            gridColumn: 'span 4',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E4E0D8',
            borderRadius: '14px',
            padding: '28px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              position: 'relative',
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid #183629',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              marginBottom: '16px'
            }}>
              <Image
                src={user?.avatar_url || '/assets/avatar_kevin.jpg'}
                alt={user?.nama || 'Pemain'}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', margin: '0 0 4px 0' }}>
              {user?.nama || 'Pemain Mahjong'}
            </h2>
            <div style={{ fontSize: '12px', color: '#7A897F', marginBottom: '14px' }}>
              {user?.handle || '@pemain'} • ID #{user?.id || '841'}
            </div>

            {/* Kemahiran Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: kemahiranDetail.badgeBg,
              color: kemahiranDetail.badgeColor,
              padding: '6px 14px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '12px',
              marginBottom: '20px'
            }}>
              <Award size={14} />
              <span>Kemahiran: {kemahiranDetail.level}</span>
            </div>

            <div style={{ width: '100%', borderTop: '1px solid #F0ECE4', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5A675E' }}>
                <Mail size={14} color="#004F27" />
                <span style={{ color: '#111E18', fontWeight: 600 }}>{user?.email || '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5A675E' }}>
                <Phone size={14} color="#004F27" />
                <span style={{ color: '#111E18', fontWeight: 600 }}>{user?.no_telepon || '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5A675E' }}>
                <ShieldCheck size={14} color="#16A34A" />
                <span>Status Akun: <strong>Terverifikasi</strong></span>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div style={{
            gridColumn: 'span 8',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E4E0D8',
            borderRadius: '14px',
            padding: '28px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', margin: '0 0 8px 0' }}>
              Perbarui Informasi Profil
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#5A675E' }}>
              Informasi ini akan ditampilkan pada sistem registrasi turnamen dan leaderboard resmi komunitas.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: '#FAF8F5'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                    Player Handle / Username
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.handle}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: '#FAF8F5'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                    Alamat Email (Akun)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '13px',
                      backgroundColor: '#F3F4F6',
                      color: '#6B7280',
                      cursor: 'not-allowed'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#7A897F', marginTop: '4px', display: 'block' }}>
                    Email terhubung dengan kredensial login utama Anda.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                    Nomor WhatsApp / Telepon
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.no_telepon}
                    onChange={(e) => setFormData({ ...formData, no_telepon: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: '#FAF8F5'
                    }}
                  />
                </div>
              </div>

              {/* Tingkat Kemahiran Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                  Tingkat Kemahiran Bermain
                </label>
                <select
                  value={formData.tingkat_kemahiran}
                  onChange={(e) => setFormData({ ...formData, tingkat_kemahiran: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D7E6DB',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#FAF8F5',
                    color: '#111E18',
                    fontWeight: 600
                  }}
                >
                  <option value="beginner">Beginner — Pemula yang baru belajar aturan Mahjong</option>
                  <option value="intermediate">Intermediate — Memahami sistem poin &amp; strategi dasar</option>
                  <option value="advance">Advance — Atlet turnamen dengan taktis komprehensif</option>
                </select>

                <div style={{
                  marginTop: '10px',
                  padding: '12px 16px',
                  backgroundColor: '#FAF8F5',
                  border: '1px solid #E4E0D8',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '12.5px',
                  color: '#5A675E'
                }}>
                  <Info size={16} color="#004F27" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#183629' }}>Tentang Tingkat Kemahiran:</strong> {kemahiranDetail.deskripsi}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#183629',
                    color: '#FAF8F5',
                    border: 'none',
                    padding: '11px 24px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(24, 54, 41, 0.2)'
                  }}
                >
                  <Save size={16} />
                  <span>{saving ? 'Menyimpan Perubahan...' : 'Simpan Profil'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

    </div>
  );
}
