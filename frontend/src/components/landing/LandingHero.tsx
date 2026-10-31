'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Calendar, Clock, Building2, Wallet, ShieldCheck, Sparkles } from 'lucide-react';
import ApiClient, { ApiEvent } from '@/lib/api';

interface LandingHeroProps {
  onSecureBooking?: (target?: string) => void;
  onShowRulebook: () => void;
  children?: React.ReactNode;
}

// ── Helper: Format YYYY-MM-DD zona Asia/Jakarta ──
function getJakartaTodayStr(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// ── Helper: Format Tanggal Indonesia (contoh: "Sabtu, 7 Nov 2026") ──
function formatEventDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

// ── Helper: Format Waktu (contoh: "13.00 – 18.30 WIB") ──
function formatEventTime(start?: string | null, end?: string | null): string {
  if (start && end) {
    const cleanStart = start.slice(0, 5).replace(':', '.');
    const cleanEnd = end.slice(0, 5).replace(':', '.');
    return `${cleanStart} – ${cleanEnd} WIB`;
  }
  return '07.30 – 21.30 WIB';
}

// ── Helper: Format Biaya Masuk (contoh: "Rp 150.000 /kursi" atau "Gratis") ──
function formatEventPrice(biayaStr?: string | null): { value: string; unit?: string } {
  if (!biayaStr) return { value: 'Gratis' };
  const clean = biayaStr.trim().toLowerCase();
  if (clean === '0' || clean === 'rp 0' || clean === 'gratis' || clean === 'free') {
    return { value: 'Gratis' };
  }
  const digits = clean.replace(/\D/g, '');
  if (!digits || parseInt(digits, 10) === 0) {
    return { value: 'Gratis' };
  }
  const num = parseInt(digits, 10);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
  const withSpace = formatted.replace(/^Rp\s?/, 'Rp ');
  return { value: withSpace, unit: '/kursi' };
}

export default function LandingHero({
  onSecureBooking,
  onShowRulebook,
  children,
}: LandingHeroProps) {
  const [nearestEvent, setNearestEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadNearestEvent() {
      setLoading(true);
      try {
        const res = await ApiClient.getEvents({ status: 'active' });
        if (isMounted) {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const todayStr = getJakartaTodayStr();
            // Filter: aktif & tanggal >= hari ini (Asia/Jakarta)
            const eligible = res.data.filter((ev) => {
              const isActive = ev.status?.toLowerCase() === 'active';
              if (!isActive || !ev.tanggal_event) return false;
              const dateStr = ev.tanggal_event.split('T')[0];
              return dateStr >= todayStr;
            });

            // Urutkan tanggal terdekat, lalu jam mulai terdekat
            eligible.sort((a, b) => {
              const dateA = a.tanggal_event?.split('T')[0] || '';
              const dateB = b.tanggal_event?.split('T')[0] || '';
              if (dateA !== dateB) return dateA.localeCompare(dateB);
              const timeA = a.waktu_mulai || '';
              const timeB = b.waktu_mulai || '';
              return timeA.localeCompare(timeB);
            });

            setNearestEvent(eligible[0] || null);
          } else {
            setNearestEvent(null);
          }
        }
      } catch {
        if (isMounted) {
          setNearestEvent(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadNearestEvent();

    return () => {
      isMounted = false;
    };
  }, []);

  // Nilai tampilan kartu info
  const tanggalText = nearestEvent?.tanggal_event
    ? formatEventDate(nearestEvent.tanggal_event)
    : 'Buka Setiap Hari';

  const waktuText = nearestEvent
    ? formatEventTime(nearestEvent.waktu_mulai, nearestEvent.waktu_selesai)
    : '07.30 – 21.30 WIB';

  const venueText = nearestEvent?.venue?.trim() || 'Game House';

  const biayaData = nearestEvent ? formatEventPrice(nearestEvent.biaya) : null;

  const targetUrl = nearestEvent ? `/events/${nearestEvent.id}` : '/events';
  const targetAriaLabel = nearestEvent
    ? `Lihat detail event ${nearestEvent.nama_event} di Game House`
    : 'Lihat seluruh jadwal event dan turnamen Game House';

  return (
    <section className="landing-hero-fullbleed">
      {/* ── Realistic Parlor Venue Photo Background ── */}
      <div className="landing-hero-bg">
        <Image
          src="/landing/landing-hero.jpg"
          alt="Suasana Riichi Mahjong Mahjongyuks"
          fill
          priority
          quality={90}
          style={{
            objectFit: 'cover',
            objectPosition: 'center 40%',
            filter: 'brightness(0.88) contrast(1.05)',
          }}
          sizes="100vw"
        />
        {/* Dark Forest Green Gradient Overlay for High-Contrast Text Legibility */}
        <div className="landing-hero-overlay" />
      </div>

      <div className="landing-container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="landing-hero-content">
          {/* ── Authentic, Relevant Badges (Uncluttered) ── */}
          <div className="landing-hero-badges-row">
            <span className="hero-badge hero-badge-mint">
              <ShieldCheck size={13} strokeWidth={2.5} />
              WRC SANCTIONED
            </span>
            <span className="hero-badge hero-badge-glass">
              <Sparkles size={12} strokeWidth={2} />
              MEJA OTOMATIS AMOS REXX III
            </span>
          </div>

          {/* ── Main Headline (Proportional Typography & Balanced Width) ── */}
          <h1 className="landing-hero-full-title">
            Temukan Tempat Bermain Riichi Mahjong Favoritmu
          </h1>

          {/* ── Description (Concise & Professional Copywriting) ── */}
          <p className="landing-hero-full-desc">
            Jelajahi lokasi bermain, temukan jadwal dan turnamen, serta reservasi meja untuk menikmati Riichi Mahjong bersama komunitas.
          </p>

          {/* ── Action Buttons ── */}
          <div className="landing-hero-full-actions">
            <a
              href="#events"
              className="landing-btn-hero-primary"
            >
              <span>Cari Jadwal &amp; Meja</span>
              <ArrowRight size={15} strokeWidth={2} />
            </a>

            <button
              type="button"
              onClick={onShowRulebook}
              className="landing-btn-hero-secondary"
            >
              <BookOpen size={16} strokeWidth={1.75} />
              <span>Pelajari Cara Bermain</span>
            </button>
          </div>

          {/* ── 4 Equalized Glassmorphic Info Cards (Aligned with Hero Content) ── */}
          <div className="landing-hero-info-grid">
            {/* 1. Tanggal */}
            <div className="landing-info-card">
              <div className="landing-info-icon">
                <Calendar size={18} strokeWidth={2} />
              </div>
              <div className="landing-info-text-group">
                <div className="landing-info-label">TANGGAL</div>
                <div className="landing-info-value">
                  {loading ? <span className="landing-info-skeleton" /> : tanggalText}
                </div>
              </div>
            </div>

            {/* 2. Waktu */}
            <div className="landing-info-card">
              <div className="landing-info-icon">
                <Clock size={18} strokeWidth={2} />
              </div>
              <div className="landing-info-text-group">
                <div className="landing-info-label">WAKTU</div>
                <div className="landing-info-value">
                  {loading ? <span className="landing-info-skeleton" /> : waktuText}
                </div>
              </div>
            </div>

            {/* 3. Venue */}
            <div className="landing-info-card">
              <div className="landing-info-icon">
                <Building2 size={18} strokeWidth={2} />
              </div>
              <div className="landing-info-text-group">
                <div className="landing-info-label">VENUE</div>
                <div className="landing-info-value">
                  {loading ? <span className="landing-info-skeleton" /> : venueText}
                </div>
              </div>
            </div>

            {/* 4. Biaya Masuk / Informasi (Interactive Link ke Event) */}
            <Link
              href={targetUrl}
              className="landing-info-card landing-info-card-clickable"
              aria-label={targetAriaLabel}
              title={targetAriaLabel}
            >
              <div className="landing-info-icon landing-info-icon-gold">
                {nearestEvent ? <Wallet size={18} strokeWidth={2} /> : <Calendar size={18} strokeWidth={2} />}
              </div>
              <div className="landing-info-text-group">
                <div className="landing-info-label">
                  {nearestEvent ? 'BIAYA MASUK' : 'INFORMASI'}
                </div>
                <div className="landing-info-value">
                  {loading ? (
                    <span className="landing-info-skeleton" />
                  ) : nearestEvent && biayaData ? (
                    <>
                      {biayaData.value}{' '}
                      {biayaData.unit && <span className="landing-info-unit">{biayaData.unit}</span>}
                    </>
                  ) : (
                    'Lihat jadwal event'
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* ── Call To Action Buttons ── */}
          <div className="landing-hero-cta-row">
            <Link
              href="/events"
              className="landing-hero-btn-main"
              aria-label="Lihat seluruh event dan turnamen di MahjongYuks"
            >
              <span>Lihat Semua Event</span>
              <ArrowRight size={15} strokeWidth={2} />
            </Link>

            {nearestEvent && (
              <Link
                href={`/events/${nearestEvent.id}`}
                className="landing-hero-btn-outline"
                aria-label={`Daftar event ${nearestEvent.nama_event}`}
              >
                <span>Daftar Event Ini</span>
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
