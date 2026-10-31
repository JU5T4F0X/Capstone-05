'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, BookOpen, Building2, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface LandingModalsProps {
  showRulebook: boolean;
  onCloseRulebook: () => void;
  showPartnership: boolean;
  onClosePartnership: () => void;
  showAuth: boolean;
  onCloseAuth: () => void;
  pendingTarget: string;
}

export default function LandingModals({
  showRulebook,
  onCloseRulebook,
  showPartnership,
  onClosePartnership,
  showAuth,
  onCloseAuth,
  pendingTarget,
}: LandingModalsProps) {
  const router = useRouter();

  return (
    <>
      {/* ── MODAL 1: RULEBOOK & PANDUAN BERMAIN 101 ── */}
      {showRulebook && (
        <div className="landing-modal-overlay" onClick={onCloseRulebook}>
          <div className="landing-modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #E4E0D8', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} color="#183629" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#141A17', margin: 0 }}>
                  Panduan Bermain & Etika Bermain
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseRulebook}
                style={{ color: '#78807B', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#4A524D', lineHeight: 1.6, marginBottom: '20px' }}>
              Mahjongyuks mengadopsi standar internasional <strong>World Riichi Championship (WRC)</strong> dengan fokus pada ketangkasan intelektual, strategi, dan etika permainan tanpa perjudian.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#FAF8F5', border: '1px solid #E4E0D8', padding: '14px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 700, color: '#183629', fontSize: '13px', marginBottom: '4px' }}>
                  1. Meja Otomatis Amos Rexx III
                </div>
                <div style={{ fontSize: '13px', color: '#4A524D', lineHeight: 1.5 }}>
                  Seluruh ubin dikocok secara magnetik dalam 5 detik. Pemain tidak perlu membalik atau menyusun dinding ubin secara manual.
                </div>
              </div>

              <div style={{ backgroundColor: '#FAF8F5', border: '1px solid #E4E0D8', padding: '14px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 700, color: '#183629', fontSize: '13px', marginBottom: '4px' }}>
                  2. Syarat Kemenangan Yaku
                </div>
                <div style={{ fontSize: '13px', color: '#4A524D', lineHeight: 1.5 }}>
                  Untuk menyatakan kemenangan (Ron atau Tsumo), tangan wajib memiliki setidaknya 1 Yaku yang valid (seperti Riichi, Tanyao, Yakuhai, atau Pinfu).
                </div>
              </div>

              <div style={{ backgroundColor: '#FAF8F5', border: '1px solid #E4E0D8', padding: '14px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 700, color: '#183629', fontSize: '13px', marginBottom: '4px' }}>
                  3. Nol Toleransi Perjudian & Etika Fairplay
                </div>
                <div style={{ fontSize: '13px', color: '#4A524D', lineHeight: 1.5 }}>
                  Dilarang keras bertaruh uang nyata dalam bentuk apapun. Skor pertandingan murni digunakan untuk penilaian sistem Elo dan klasemen peringkat resmi.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onCloseRulebook}
                className="landing-btn-primary"
                style={{ minHeight: '38px', padding: '8px 18px', fontSize: '13px' }}
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: KEMITRAAN VENUE ── */}
      {showPartnership && (
        <div className="landing-modal-overlay" onClick={onClosePartnership}>
          <div className="landing-modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #E4E0D8', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} color="#183629" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#141A17', margin: 0 }}>
                  Kemitraan & Lisensi Venue
                </h3>
              </div>
              <button
                type="button"
                onClick={onClosePartnership}
                style={{ color: '#78807B', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#4A524D', lineHeight: 1.6, marginBottom: '20px' }}>
              Bergabunglah dengan jaringan venue Mahjong modern nomor satu di Indonesia. Kami menyediakan solusi menyeluruh dari hardware hingga sistem turnamen terpusat.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#141A17' }}>
                <ShieldCheck size={16} color="#B8860B" />
                <span>Pengadaan resmi Meja Otomatis Amos Rexx III & Amos JP-EX</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#141A17' }}>
                <ShieldCheck size={16} color="#B8860B" />
                <span>Lisensi software scoring & integrasi Leaderboard Atlet Nasional</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#141A17' }}>
                <ShieldCheck size={16} color="#B8860B" />
                <span>Pelatihan staf wasit bersertifikasi standar WRC</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#FAF8F5', border: '1px solid #E4E0D8', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#78807B', marginBottom: '4px' }}>
                Hubungi Divisi Kemitraan:
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#183629' }}>
                partnership@mahjongyuks.id
              </div>
              <div style={{ fontSize: '12px', color: '#4A524D', marginTop: '2px' }}>
                WhatsApp Bisnis: +62 811-928-8800 (Senin - Jumat, 09:00 - 18:00 WIB)
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={onClosePartnership}
                className="landing-btn-secondary"
                style={{ minHeight: '38px', padding: '8px 16px', fontSize: '13px' }}
              >
                Tutup
              </button>
              <a
                href="mailto:partnership@mahjongyuks.id?subject=Inquiry Kemitraan Mahjongyuks"
                className="landing-btn-primary"
                style={{ minHeight: '38px', padding: '8px 18px', fontSize: '13px' }}
              >
                Kirim Email Formal
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: REDIREKSI AUTENTIKASI UNTUK PEMESANAN MEJA ── */}
      {showAuth && (
        <div className="landing-modal-overlay" onClick={onCloseAuth}>
          <div className="landing-modal-box" style={{ maxWidth: '440px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#FAF8F5',
                border: '1px solid #E4E0D8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <Lock size={24} color="#183629" />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#141A17', marginBottom: '8px' }}>
              Silakan Masuk untuk Melanjutkan
            </h3>

            <p style={{ fontSize: '13px', color: '#4A524D', lineHeight: 1.5, marginBottom: '24px' }}>
              Untuk memesan kursi pada <strong>{pendingTarget}</strong>, Anda perlu masuk ke akun Mahjongyuks agar tiket & rating pertandingan dapat dicatat.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  onCloseAuth();
                  router.push('/login');
                }}
                className="landing-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Masuk ke Akun</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  onCloseAuth();
                  router.push('/register');
                }}
                className="landing-btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Daftar Akun Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
