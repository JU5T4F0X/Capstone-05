'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Trophy,
  History,
  LogOut,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  Timer,
  CreditCard,
  Shield,
  Star,
  ChevronLeft,
  AlertCircle,
  Check,
  Ticket,
  Building2,
  QrCode,
  Copy,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import ApiClient from '@/lib/api';

type BookingMode = 'casual' | 'competitive';
type SeatPosition = 'ton' | 'nan' | 'sha' | 'pei';
type SeatStatus = 'available' | 'selected' | 'taken' | 'processing';

interface Seat {
  position: SeatPosition;
  status: SeatStatus;
  occupant?: string;
}

interface MejaData {
  id: number;
  nomor: string;
  label: string;
  status: 'tersedia' | 'terisi_sebagian' | 'penuh' | 'maintenance';
  tipe: string;
  seats: Seat[];
}

interface EventData {
  id: string;
  title: string;
  category: 'competitive' | 'casual';
  date: string;
  time: string;
  venue: string;
  price: number;
  remaining: number;
}

const WIND_LABEL: Record<SeatPosition, { id: string; kanji: string; short: string }> = {
  ton: { id: 'Timur',   kanji: '東', short: 'TON' },
  nan: { id: 'Selatan', kanji: '南', short: 'NAN' },
  sha: { id: 'Barat',   kanji: '西', short: 'SHA' },
  pei: { id: 'Utara',   kanji: '北', short: 'PEI' },
};

const HARGA_PER_JAM = 50000;
const PLATFORM_FEE = 5000;

const MOCK_MEJAS: MejaData[] = [
  {
    id: 1, nomor: 'Meja 01', label: 'Auto Deluxe',
    status: 'terisi_sebagian', tipe: 'Amos Rexx III Auto-Shuffle',
    seats: [
      { position: 'ton', status: 'taken',     occupant: 'Bima H.' },
      { position: 'nan', status: 'taken',     occupant: 'Rian K.' },
      { position: 'sha', status: 'available' },
      { position: 'pei', status: 'taken',     occupant: 'Jess T.' },
    ],
  },
  {
    id: 2, nomor: 'Meja 02', label: 'Standard Mat',
    status: 'tersedia', tipe: 'Meja Standar / Mat',
    seats: [
      { position: 'ton', status: 'available' },
      { position: 'nan', status: 'available' },
      { position: 'sha', status: 'available' },
      { position: 'pei', status: 'available' },
    ],
  },
  {
    id: 3, nomor: 'Meja 03', label: 'Auto Deluxe',
    status: 'tersedia', tipe: 'Amos Rexx III Auto-Shuffle',
    seats: [
      { position: 'ton', status: 'available' },
      { position: 'nan', status: 'available' },
      { position: 'sha', status: 'processing', occupant: '...' },
      { position: 'pei', status: 'available' },
    ],
  },
  {
    id: 4, nomor: 'Meja 04', label: 'Maintenance',
    status: 'maintenance', tipe: 'Kalibrasi Berkala',
    seats: [
      { position: 'ton', status: 'taken' },
      { position: 'nan', status: 'taken' },
      { position: 'sha', status: 'taken' },
      { position: 'pei', status: 'taken' },
    ],
  },
];

const MOCK_EVENTS: EventData[] = [
  { id: 'ev-1', title: 'Jakarta Riichi Masters Autumn 2025', category: 'competitive',
    date: '25 Okt 2025', time: '14:00 – 18:00 WIB', venue: 'Mahjong Lounge Senopati',
    price: 150000, remaining: 3 },
  { id: 'ev-2', title: 'Friday Night Casual Mahjong & Dimsum', category: 'casual',
    date: '24 Okt 2025', time: '19:00 – 22:00 WIB', venue: 'Green Bamboo Club PIK',
    price: 95000, remaining: 8 },
  { id: 'ev-3', title: 'Grand Riichi Jakarta Open 2025', category: 'competitive',
    date: '26 Okt 2025', time: '10:00 – 16:00 WIB', venue: 'Alicia Bakery Sedayu City',
    price: 200000, remaining: 12 },
];

const VENUES = [
  { id: 'senopati', nama: 'Mahjong Lounge Senopati',    alamat: 'Jl. Senopati No. 42, Jakarta Selatan' },
  { id: 'pik',      nama: 'Green Bamboo Club PIK',       alamat: 'Ruko Crown Golf Boulevard, PIK, Jakarta Utara' },
  { id: 'sedayu',   nama: 'Alicia Bakery Sedayu City',  alamat: 'Sedayu City Kelapa Gading, Jakarta Utara' },
];

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

function formatCountdown(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

// ── Seat Button ───────────────────────────────────────────────────────────────
function SeatButton({ seat, isMySelected, onSelect }: {
  seat: Seat; isMySelected: boolean; onSelect: () => void;
}) {
  const w = WIND_LABEL[seat.position];
  const disabled = seat.status === 'taken' || seat.status === 'processing';

  let bg = '#FFFFFF', border = '1.5px dashed #7ABF97', color = '#004F27';
  if (isMySelected)            { bg = '#004F27'; border = '1.5px solid #004F27'; color = '#FFFFFF'; }
  else if (seat.status === 'taken')      { bg = '#F3F4F6'; border = '1px solid #D1D5DB'; color = '#9CA3AF'; }
  else if (seat.status === 'processing') { bg = '#FFF8E6'; border = '1.5px solid #FFC72C'; color = '#664A00'; }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
        padding: '6px 8px', borderRadius: '8px', minWidth: '54px',
        fontSize: '10px', fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.18s ease', background: bg, border, color,
      }}
    >
      <span style={{ fontSize: '15px', fontWeight: 900, lineHeight: 1 }}>{w.kanji}</span>
      <span style={{ letterSpacing: '0.3px' }}>{w.short}</span>
      <span style={{ fontSize: '9px', fontWeight: 500, opacity: 0.85 }}>
        {isMySelected ? '✓ Pilihan' : seat.status === 'taken' ? (seat.occupant || 'Terisi') : seat.status === 'processing' ? 'Diproses' : w.id}
      </span>
    </button>
  );
}

// ── Table Card ─────────────────────────────────────────────────────────────────
function TableCard({ meja, selectedMejaId, selectedSeat, onSelectMeja, onSelectSeat }: {
  meja: MejaData; selectedMejaId: number | null; selectedSeat: SeatPosition | null;
  onSelectMeja: (id: number) => void; onSelectSeat: (id: number, pos: SeatPosition) => void;
}) {
  const isSelected = selectedMejaId === meja.id;
  const isMaintenance = meja.status === 'maintenance';

  const badgeMap: Record<MejaData['status'], { label: string; bg: string; color: string }> = {
    tersedia:        { label: 'Tersedia',        bg: '#DCFCE7', color: '#15803D' },
    terisi_sebagian: { label: 'Terisi Sebagian', bg: '#FFF8E6', color: '#B45309' },
    penuh:           { label: 'Penuh',            bg: '#FEE2E2', color: '#DC2626' },
    maintenance:     { label: 'Maintenance',      bg: '#F3F4F6', color: '#6B7280' },
  };
  const badge = badgeMap[meja.status];

  const getSeat = (pos: SeatPosition) => meja.seats.find(s => s.position === pos)!;
  // Layout: top=pei(N), right=ton(E), bottom=nan(S), left=sha(W)
  const top    = getSeat('pei');
  const right  = getSeat('ton');
  const bottom = getSeat('nan');
  const left   = getSeat('sha');

  const handleSeatClick = (pos: SeatPosition) => {
    if (isMaintenance) return;
    onSelectMeja(meja.id);
    onSelectSeat(meja.id, pos);
  };

  return (
    <div style={{
      borderRadius: '16px', padding: '18px',
      border: isSelected ? '2px solid #004F27' : '1.5px solid #D7E6DB',
      background: isSelected ? '#F0FDF4' : '#FFFFFF',
      boxShadow: isSelected ? '0 4px 16px rgba(0,79,39,0.15)' : '0 1px 4px rgba(0,79,39,0.05)',
      opacity: isMaintenance ? 0.6 : 1,
      transition: 'all 0.2s ease', position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: isSelected ? '#004F27' : '#EBF6EE',
            color: isSelected ? '#98F6C2' : '#004F27',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 800,
          }}>
            {meja.id.toString().padStart(2, '0')}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#111E18' }}>{meja.nomor}</div>
            <div style={{ fontSize: '10px', color: '#7A897F' }}>{meja.label}</div>
          </div>
        </div>
        <span style={{
          padding: '3px 8px', borderRadius: '99px',
          fontSize: '10px', fontWeight: 700,
          background: badge.bg, color: badge.color,
        }}>{badge.label}</span>
      </div>

      {/* Seat Grid — compass layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 76px 1fr',
        gridTemplateRows: 'auto 48px auto',
        gap: '6px', alignItems: 'center', justifyItems: 'center',
        marginBottom: '10px',
      }}>
        {/* Top: Pei (North) */}
        <div style={{ gridColumn: 2, gridRow: 1 }}>
          <SeatButton seat={top} isMySelected={isSelected && selectedSeat === 'pei'} onSelect={() => handleSeatClick('pei')} />
        </div>
        {/* Left: Sha (West) */}
        <div style={{ gridColumn: 1, gridRow: 2, justifySelf: 'end' }}>
          <SeatButton seat={left} isMySelected={isSelected && selectedSeat === 'sha'} onSelect={() => handleSeatClick('sha')} />
        </div>
        {/* Center table */}
        <div
          style={{
            gridColumn: 2, gridRow: 2,
            width: '76px', height: '48px', borderRadius: '10px',
            background: isMaintenance ? '#E5E7EB' : isSelected ? '#004F27' : '#1A4531',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(0,0,0,0.25)', cursor: isMaintenance ? 'default' : 'pointer',
          }}
          onClick={() => !isMaintenance && onSelectMeja(meja.id)}
        >
          <span style={{ fontSize: '9px', color: '#98F6C2', fontWeight: 700, letterSpacing: '0.5px' }}>
            {isMaintenance ? '🔧' : meja.label.split(' ')[0].toUpperCase()}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 900, color: '#FFFFFF' }}>
            {isMaintenance ? 'TUTUP' : meja.id.toString().padStart(2, '0')}
          </span>
        </div>
        {/* Right: Ton (East) */}
        <div style={{ gridColumn: 3, gridRow: 2, justifySelf: 'start' }}>
          <SeatButton seat={right} isMySelected={isSelected && selectedSeat === 'ton'} onSelect={() => handleSeatClick('ton')} />
        </div>
        {/* Bottom: Nan (South) */}
        <div style={{ gridColumn: 2, gridRow: 3 }}>
          <SeatButton seat={bottom} isMySelected={isSelected && selectedSeat === 'nan'} onSelect={() => handleSeatClick('nan')} />
        </div>
      </div>

      {/* Footer */}
      <p style={{ fontSize: '10px', color: '#7A897F', textAlign: 'center', fontStyle: isMaintenance ? 'italic' : 'normal' }}>
        {isMaintenance ? 'Tidak tersedia untuk sesi ini' : meja.tipe}
      </p>

      {/* Active badge */}
      {isSelected && selectedSeat && (
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: '#004F27', color: '#98F6C2',
          padding: '2px 7px', borderRadius: '99px',
          fontSize: '9px', fontWeight: 800, letterSpacing: '0.4px',
        }}>★ AKTIF</div>
      )}
    </div>
  );
}

// ── Dashboard Nav ─────────────────────────────────────────────────────────────
function DashboardNav({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <header style={{
      background: '#FFFFFF', borderBottom: '1px solid var(--border-color)',
      padding: '0 24px', position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 1px 8px rgba(0,79,39,0.06)',
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', height: '60px', gap: '16px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: '32px', height: '32px', background: '#004F27', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#98F6C2', fontSize: '14px', fontWeight: 900 }}>M</span>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#111E18', lineHeight: '1.2' }}>Mahjongyuks</div>
            <div style={{ fontSize: '9px', color: '#7A897F', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Salon & Arena</div>
          </div>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '24px', flex: 1 }}>
          {[
            { href: '/dashboard', icon: <LayoutDashboard size={14} />, label: 'Dashboard', active: false },
            { href: '/dashboard/booking', icon: <Calendar size={14} />, label: 'Reservasi Meja', active: true },
            { href: '/dashboard', icon: <Trophy size={14} />, label: 'Leaderboard', active: false },
            { href: '/dashboard', icon: <History size={14} />, label: 'Riwayat', active: false },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 12px', borderRadius: '8px',
              fontSize: '12px', fontWeight: item.active ? 700 : 600,
              color: item.active ? '#004F27' : '#5A675E',
              background: item.active ? '#EBF6EE' : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s ease',
            }}>
              {item.icon}{item.label}
            </Link>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EBF6EE', border: '2px solid #D7E6DB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#004F27' }}>{user.nama?.charAt(0) || 'U'}</span>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#111E18' }}>{user.nama}</div>
                <div style={{ fontSize: '10px', color: '#7A897F' }}>{user.dan_rank || user.role}</div>
              </div>
            </div>
          )}
          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 12px', borderRadius: '8px',
            fontSize: '12px', fontWeight: 600, color: '#DC2626',
            background: '#FEF2F2', cursor: 'pointer',
          }}>
            <LogOut size={13} />Keluar
          </button>
        </div>
      </div>
    </header>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSuccess, setIsSuccess] = useState(false);

  // Step 1
  const [mode, setMode] = useState<BookingMode>('casual');
  const [selectedVenueId, setSelectedVenueId] = useState('senopati');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [duration, setDuration] = useState(2);
  const [selectedEventId, setSelectedEventId] = useState('ev-1');

  // Step 2
  const [selectedMejaId, setSelectedMejaId] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<SeatPosition | null>(null);

  // Step 3 & Pembayaran Simulasi
  const [playerNama, setPlayerNama] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerTelp, setPlayerTelp] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'bca_va' | 'mandiri_va' | 'cash'>('qris');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [copiedVa, setCopiedVa] = useState(false);

  // Countdown
  const [countdown, setCountdown] = useState(900);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!timerActive || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, timerActive]);

  useEffect(() => {
    if (user) {
      setPlayerNama(user.nama || '');
      setPlayerEmail(user.email || '');
      setPlayerTelp(user.no_telepon || '');
    }
  }, [user]);

  const handleSelectSeat = useCallback((mejaId: number, pos: SeatPosition) => {
    setSelectedMejaId(mejaId);
    setSelectedSeat(pos);
  }, []);

  const handleSelectMeja = useCallback((mejaId: number) => {
    setSelectedMejaId(mejaId);
    setSelectedSeat(prev => (selectedMejaId !== mejaId ? null : prev));
  }, [selectedMejaId]);

  const goStep2 = () => { setStep(2); setTimerActive(true); };
  const goStep3 = () => { if (selectedMejaId && selectedSeat) setStep(3); };

  const selectedEvent   = MOCK_EVENTS.find(e => e.id === selectedEventId);
  const selectedVenue   = VENUES.find(v => v.id === selectedVenueId);
  const selectedMeja    = MOCK_MEJAS.find(m => m.id === selectedMejaId);
  const windInfo        = selectedSeat ? WIND_LABEL[selectedSeat] : null;
  const biayaSewa       = mode === 'casual' ? HARGA_PER_JAM * duration : 0;
  const biayaEvent      = mode === 'competitive' ? (selectedEvent?.price || 0) : 0;
  const totalBayar      = (mode === 'casual' ? biayaSewa : biayaEvent) + PLATFORM_FEE;
  const isTimerCritical = countdown < 120;

  const confirmBooking = async () => {
    if (!agreed) return;
    const code = `#MJY-${Date.now().toString().slice(-6)}`;
    const bookingPayload = {
      code,
      mejaId: selectedMejaId,
      mejaNomor: selectedMeja?.nomor || 'Meja 01',
      mejaLabel: selectedMeja?.label || 'Amos Rexx III',
      seat: selectedSeat,
      windInfo,
      mode,
      date: mode === 'casual' ? (selectedDate === 'today' ? 'Hari Ini' : selectedDate === 'tomorrow' ? 'Besok' : '26 Okt 2025') : (selectedEvent?.date || '-'),
      time: mode === 'casual' ? `${selectedTime} – ${String((parseInt(selectedTime) + duration) % 24).padStart(2,'0')}:00 WIB` : (selectedEvent?.time || '-'),
      duration,
      venue: mode === 'competitive' ? (selectedEvent?.venue || '-') : (selectedVenue?.nama || '-'),
      playerNama,
      playerEmail,
      playerTelp,
      paymentMethod,
      paymentStatus: 'pending',
      totalBayar,
      createdAt: new Date().toISOString(),
    };

    // Simpan ke LocalStorage agar terintegrasi instan dengan dashboard pemain
    try {
      const existing = JSON.parse(localStorage.getItem('mahjongyuks_bookings') || '[]');
      localStorage.setItem('mahjongyuks_bookings', JSON.stringify([bookingPayload, ...existing]));
    } catch {
      // ignore
    }

    // Panggil API Laravel di background
    try {
      await ApiClient.createBooking({
        meja_id: selectedMejaId || 1,
        tanggal_main: new Date().toISOString().split('T')[0],
        waktu_mulai: selectedTime,
        waktu_selesai: `${String((parseInt(selectedTime) + duration) % 24).padStart(2,'0')}:00`,
        jumlah_pemain: 1,
        jenis_pemesanan: mode === 'casual' ? 'Casual' : 'Competitive',
        durasi_jam: duration,
        kursi_pilihan: selectedSeat || undefined,
        metode_pembayaran: paymentMethod === 'qris' ? 'QRIS Instant' : paymentMethod === 'bca_va' ? 'BCA Virtual Account' : paymentMethod === 'mandiri_va' ? 'Mandiri Virtual Account' : 'Tunai di Kasir',
      });
    } catch {
      // fallback offline
    }

    setConfirmedBooking(bookingPayload);
    setPaymentStatus('pending');
    setIsSuccess(true);
    setTimerActive(false);
  };

  const handleSimulatePayment = async () => {
    setIsProcessingPayment(true);
    await new Promise(r => setTimeout(r, 1000));

    // Update di localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('mahjongyuks_bookings') || '[]');
      if (existing.length > 0) {
        existing[0].paymentStatus = 'paid';
        localStorage.setItem('mahjongyuks_bookings', JSON.stringify(existing));
      }
    } catch {
      // ignore
    }

    setPaymentStatus('paid');
    setIsProcessingPayment(false);
  };

  // ── Success State (E-Tiket & Simulasi Pembayaran) ─────────────────────────
  if (isSuccess) {
    const bookingCode = confirmedBooking?.code || `#MJY-${Date.now().toString().slice(-6)}`;
    const isPaid = paymentStatus === 'paid';

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
        <DashboardNav user={user} onLogout={logout} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '24px', padding: '36px 32px',
            border: '1px solid var(--border-card)', boxShadow: '0 12px 48px rgba(0,79,39,0.12)',
            maxWidth: '560px', width: '100%', textAlign: 'center',
          }}>
            <div style={{
              width: '68px', height: '68px', borderRadius: '50%',
              background: isPaid ? 'linear-gradient(135deg, #004F27, #007A3D)' : 'linear-gradient(135deg, #D97706, #F59E0B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: isPaid ? '0 8px 24px rgba(0,79,39,0.3)' : '0 8px 24px rgba(217,119,6,0.3)',
            }}>
              {isPaid ? <CheckCircle2 size={36} color="#98F6C2" strokeWidth={2.5} /> : <CreditCard size={32} color="#FFFFFF" />}
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '99px',
              background: isPaid ? '#DCFCE7' : '#FEF3C7',
              color: isPaid ? '#15803D' : '#92400E',
              fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px'
            }}>
              {isPaid ? '● Pembayaran Lunas (Simulasi)' : '● Menunggu Pembayaran'}
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111E18', marginBottom: '6px' }}>
              {isPaid ? 'Reservasi Berhasil Dikonfirmasi! 🎉' : 'Pemesanan Meja Berhasil Dibuat'}
            </h2>
            <p style={{ fontSize: '13px', color: '#5A675E', lineHeight: '1.6', marginBottom: '24px' }}>
              {isPaid
                ? 'E-Tiket resmi telah terbit. Tunjukkan kode check-in saat hadir di lokasi venue.'
                : 'Selesaikan simulasi pembayaran di bawah ini agar meja dan kursi angin terkunci.'}
            </p>

            {/* Ticket Info Card */}
            <div style={{
              background: '#F8FAF9', border: '1px solid #D7E6DB', borderRadius: '18px',
              padding: '20px', marginBottom: '24px', textAlign: 'left',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#7A897F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Kode Booking</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#004F27', letterSpacing: '0.5px' }}>{bookingCode}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#7A897F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Meja & Posisi</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111E18' }}>
                    {selectedMeja?.nomor || 'Meja 01'} • {windInfo ? `${windInfo.kanji} ${windInfo.id}` : '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#7A897F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Jadwal & Durasi</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111E18' }}>
                    {mode === 'casual' ? `${duration} Jam (${selectedTime} WIB)` : (selectedEvent?.time || '-')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#7A897F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Total Tagihan</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#004F27' }}>{formatRupiah(totalBayar)}</div>
                </div>
              </div>

              {/* Payment details preview */}
              {!isPaid && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #D7E6DB', background: '#FFFFFF', padding: '14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#2B3830', marginBottom: '8px' }}>
                    Metode: {paymentMethod === 'qris' ? 'QRIS Instant' : paymentMethod === 'bca_va' ? 'BCA Virtual Account' : paymentMethod === 'mandiri_va' ? 'Mandiri Virtual Account' : 'Kasir Tunai Venue'}
                  </div>
                  {paymentMethod === 'qris' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '64px', height: '64px', background: '#F0FDF4', border: '1px solid #C8E6D0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <QrCode size={40} color="#004F27" />
                      </div>
                      <div style={{ fontSize: '11px', color: '#5A675E', lineHeight: '1.5' }}>
                        Scan dengan GoPay, OVO, BCA, atau aplikasi perbankan lainnya.<br />
                        <span style={{ color: '#004F27', fontWeight: 700 }}>Simulasi otomatis instan</span>
                      </div>
                    </div>
                  )}
                  {(paymentMethod === 'bca_va' || paymentMethod === 'mandiri_va') && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F1FCF4', padding: '10px 14px', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#5A675E' }}>No. Virtual Account:</div>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#004F27', letterSpacing: '1px' }}>8277 0812 3456 7890</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard?.writeText('8277081234567890'); setCopiedVa(true); setTimeout(() => setCopiedVa(false), 2000); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#004F27', background: '#FFFFFF', padding: '6px 10px', borderRadius: '6px', border: '1px solid #C8E6D0' }}
                      >
                        {copiedVa ? <Check size={12} /> : <Copy size={12} />}
                        {copiedVa ? 'Disalin!' : 'Salin'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment simulation action button */}
            {!isPaid ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSimulatePayment}
                  disabled={isProcessingPayment}
                  style={{
                    borderRadius: '14px', fontSize: '15px', padding: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {isProcessingPayment ? (
                    <>Memproses Simulasi Pembayaran...</>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Simulasikan Pembayaran Lunas Sekarang
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => router.push('/dashboard')}
                  style={{ borderRadius: '14px', fontSize: '13px', padding: '12px' }}
                >
                  Bayar Nanti & Masuk ke Dashboard
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => router.push('/dashboard')}
                  style={{
                    borderRadius: '14px', fontSize: '15px', padding: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <Ticket size={18} />
                  Buka Dashboard & Lihat E-Tiket Saya
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsSuccess(false);
                    setStep(1);
                    setSelectedMejaId(null);
                    setSelectedSeat(null);
                    setCountdown(900);
                    setTimerActive(false);
                    setPaymentStatus('pending');
                  }}
                  style={{ borderRadius: '14px', fontSize: '13px', padding: '12px' }}
                >
                  Reservasi Meja Tambahan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main Flow ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      <DashboardNav user={user} onLogout={logout} />

      {/* Breadcrumb + Stepper */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid var(--border-color)', padding: '14px 0' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#5A675E', marginBottom: '14px' }}>
            <Link href="/dashboard" style={{ color: '#5A675E', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              <LayoutDashboard size={13} />Dashboard
            </Link>
            <ChevronRight size={13} />
            <span style={{ color: '#004F27', fontWeight: 700 }}>Reservasi Meja</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {[
              { n: 1, label: 'Pilih Jadwal' },
              { n: 2, label: 'Meja & Kursi' },
              { n: 3, label: 'Konfirmasi & Bayar' },
            ].map((s, idx) => (
              <React.Fragment key={s.n}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 800, transition: 'all 0.3s ease',
                    background: step >= s.n ? '#004F27' : '#EBF6EE',
                    color: step >= s.n ? '#FFFFFF' : '#7A897F',
                  }}>
                    {step > s.n ? <Check size={14} strokeWidth={3} /> : s.n}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: step === s.n ? 700 : 500, color: step === s.n ? '#004F27' : step > s.n ? '#111E18' : '#7A897F' }}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div style={{ flex: 1, height: '2px', margin: '0 12px', maxWidth: '80px', background: step > s.n ? '#004F27' : '#E4ECE6', transition: 'background 0.3s ease' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, maxWidth: '1240px', width: '100%', margin: '0 auto',
        padding: '28px 24px',
        display: 'grid',
        gridTemplateColumns: step === 1 ? '1fr' : '1fr 340px',
        gap: '24px', alignItems: 'start',
      }}>

        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* STEP 1 */}
          {step === 1 && (
            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid var(--border-card)', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', marginBottom: '4px' }}>Pilih Tipe & Jadwal Sesi</h2>
              <p style={{ fontSize: '13px', color: '#5A675E', marginBottom: '24px' }}>Tentukan mode permainan dan jadwal yang Anda inginkan.</p>

              {/* Mode toggle */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#2B3830', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                  Mode Permainan
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {(['casual', 'competitive'] as BookingMode[]).map(m => (
                    <button key={m} type="button" onClick={() => setMode(m)} style={{
                      padding: '16px', borderRadius: '14px', textAlign: 'left', cursor: 'pointer',
                      border: mode === m ? '2px solid #004F27' : '1.5px solid #D7E6DB',
                      background: mode === m ? '#F0FDF4' : '#FFFFFF',
                      transition: 'all 0.2s ease', boxShadow: mode === m ? '0 4px 12px rgba(0,79,39,0.12)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '20px' }}>{m === 'casual' ? '☕' : '🏆'}</span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: mode === m ? '#004F27' : '#111E18' }}>
                          {m === 'casual' ? 'Casual (Per Jam)' : 'Competitive (Event)'}
                        </span>
                        {mode === m && (
                          <div style={{ marginLeft: 'auto', width: '18px', height: '18px', borderRadius: '50%', background: '#004F27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={11} color="#FFFFFF" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '11px', color: '#5A675E', lineHeight: '1.5', marginLeft: '30px' }}>
                        {m === 'casual'
                          ? `Sesi santai tanpa rating. Bayar ${formatRupiah(HARGA_PER_JAM)}/jam. Bebas pilih durasi.`
                          : 'Daftar ke turnamen atau event resmi dengan harga tetap per kursi.'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* CASUAL fields */}
              {mode === 'casual' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Venue */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#2B3830', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Pilih Venue</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {VENUES.map(v => (
                        <button key={v.id} type="button" onClick={() => setSelectedVenueId(v.id)} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '14px 16px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer',
                          border: selectedVenueId === v.id ? '2px solid #004F27' : '1.5px solid #D7E6DB',
                          background: selectedVenueId === v.id ? '#F0FDF4' : '#FFFFFF',
                          transition: 'all 0.18s ease',
                        }}>
                          <Building2 size={18} color={selectedVenueId === v.id ? '#004F27' : '#7A897F'} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: selectedVenueId === v.id ? '#004F27' : '#111E18' }}>{v.nama}</div>
                            <div style={{ fontSize: '11px', color: '#7A897F', marginTop: '2px' }}>{v.alamat}</div>
                          </div>
                          {selectedVenueId === v.id && <Check size={16} color="#004F27" strokeWidth={3} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date + Time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Tanggal Main</label>
                      <div className="form-input-wrapper">
                        <span className="input-icon-left"><Calendar size={15} /></span>
                        <input type="date" className="form-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} style={{ paddingLeft: '8px' }} />
                      </div>
                    </div>
                    <div>
                      <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Waktu Mulai</label>
                      <div className="form-input-wrapper">
                        <span className="input-icon-left"><Clock size={15} /></span>
                        <select className="form-input" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} style={{ paddingLeft: '8px', appearance: 'none' as const }}>
                          {['13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(t => (
                            <option key={t} value={t}>{t} WIB</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#2B3830', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Durasi Sesi</label>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#004F27' }}>{formatRupiah(HARGA_PER_JAM)}/jam</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                      {[1,2,3,4,5,6].map(h => (
                        <button key={h} type="button" onClick={() => setDuration(h)} style={{
                          padding: '12px 4px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer',
                          border: duration === h ? '2px solid #004F27' : '1px solid #D7E6DB',
                          background: duration === h ? '#004F27' : '#F1FCF4',
                          color: duration === h ? '#FFFFFF' : '#2B3830',
                          fontSize: '13px', fontWeight: 700, transition: 'all 0.15s ease',
                        }}>{h}j</button>
                      ))}
                    </div>
                    {/* Estimasi */}
                    <div style={{
                      marginTop: '12px', padding: '14px 18px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #F0FDF4, #EBF6EE)',
                      border: '1px solid #C8E6D0',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#5A675E', fontWeight: 600 }}>Estimasi Selesai</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#004F27' }}>
                          {selectedTime} → {String((parseInt(selectedTime) + duration) % 24).padStart(2, '0')}:00 WIB
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#5A675E', fontWeight: 600 }}>Subtotal Sewa</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#004F27' }}>{formatRupiah(biayaSewa)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* COMPETITIVE fields */}
              {mode === 'competitive' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#2B3830', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                    Pilih Event / Turnamen
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {MOCK_EVENTS.map(ev => (
                      <button key={ev.id} type="button" onClick={() => setSelectedEventId(ev.id)} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '14px',
                        padding: '16px', borderRadius: '14px', textAlign: 'left', cursor: 'pointer',
                        border: selectedEventId === ev.id ? '2px solid #004F27' : '1.5px solid #D7E6DB',
                        background: selectedEventId === ev.id ? '#F0FDF4' : '#FFFFFF',
                        transition: 'all 0.18s ease',
                      }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, background: ev.category === 'competitive' ? '#004F27' : '#EBF6EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                          {ev.category === 'competitive' ? '🏆' : '☕'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#111E18', marginBottom: '4px' }}>{ev.title}</div>
                          <div style={{ fontSize: '11px', color: '#5A675E', display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                            <span><Calendar size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} />{ev.date} · {ev.time}</span>
                            <span><MapPin size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} />{ev.venue}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#004F27' }}>{formatRupiah(ev.price)}</span>
                            <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: ev.remaining < 4 ? '#FEE2E2' : '#DCFCE7', color: ev.remaining < 4 ? '#DC2626' : '#15803D' }}>
                              Sisa {ev.remaining} kursi
                            </span>
                          </div>
                        </div>
                        {selectedEventId === ev.id && (
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#004F27', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Check size={12} color="#FFFFFF" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Total preview */}
              <div style={{
                marginTop: '24px', padding: '16px 18px', borderRadius: '14px',
                background: '#FFF8E6', border: '1px solid #FFE4A3',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#664A00', fontWeight: 600 }}>Total Estimasi</div>
                  <div style={{ fontSize: '11px', color: '#92661B', marginTop: '2px' }}>
                    {mode === 'casual' ? `Sewa ${duration} jam + Platform Fee` : 'Tiket Event + Platform Fee'}
                  </div>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#004F27' }}>{formatRupiah(totalBayar)}</div>
              </div>

              <button
                className="btn-primary"
                style={{ marginTop: '20px', borderRadius: '14px', fontSize: '15px', padding: '15px' }}
                onClick={goStep2}
                disabled={mode === 'casual' && !selectedDate}
              >
                Lanjut Pilih Meja & Kursi <ArrowRight size={16} />
              </button>
              {mode === 'casual' && !selectedDate && (
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#DC2626', marginTop: '8px' }}>⚠ Pilih tanggal main terlebih dahulu</p>
              )}
            </div>
          )}

          {/* STEP 2 — Denah Meja */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Session info */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px 24px', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge-pill badge-dark" style={{ fontSize: '10px', padding: '4px 10px' }}>
                    {mode === 'casual' ? '☕ Casual' : '🏆 Competitive'}
                  </span>
                  <span className="badge-pill badge-mint" style={{ fontSize: '10px', padding: '4px 10px' }}>Auto-Update Live</span>
                </div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111E18', marginBottom: '4px' }}>
                  {mode === 'competitive' ? selectedEvent?.title : `Sesi Casual — ${selectedVenue?.nama}`}
                </h2>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#5A675E', flexWrap: 'wrap' as const }}>
                  <span><MapPin size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{mode === 'competitive' ? selectedEvent?.venue : selectedVenue?.nama}</span>
                  <span><Clock size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{mode === 'competitive' ? selectedEvent?.time : `${selectedTime} – ${String((parseInt(selectedTime) + duration) % 24).padStart(2, '0')}:00 WIB (${duration} Jam)`}</span>
                </div>
              </div>

              {/* Table floor plan */}
              <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111E18' }}>Denah Meja Salon & Alokasi Kursi</h3>
                    <p style={{ fontSize: '11px', color: '#7A897F', marginTop: '2px' }}>Klik posisi angin pada meja untuk memilih kursi Anda.</p>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' as const, marginBottom: '20px' }}>
                  {[
                    { bg: '#FFFFFF', border: '1.5px dashed #7ABF97', label: 'Tersedia' },
                    { bg: '#004F27', border: '1.5px solid #004F27', label: 'Dipilih' },
                    { bg: '#F3F4F6', border: '1px solid #D1D5DB', label: 'Terisi' },
                    { bg: '#FFF8E6', border: '1.5px solid #FFC72C', label: 'Sedang Diproses' },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: l.bg, border: l.border }} />
                      <span style={{ fontSize: '11px', color: '#5A675E', fontWeight: 600 }}>{l.label}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', padding: '0 4px' }}>
                  <span style={{ fontSize: '10px', color: '#7A897F', fontWeight: 700 }}>← SISI BARAT</span>
                  <span style={{ fontSize: '10px', color: '#7A897F', fontWeight: 700 }}>SISI TIMUR →</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {MOCK_MEJAS.map(meja => (
                    <TableCard
                      key={meja.id}
                      meja={meja}
                      selectedMejaId={selectedMejaId}
                      selectedSeat={selectedSeat}
                      onSelectMeja={handleSelectMeja}
                      onSelectSeat={handleSelectSeat}
                    />
                  ))}
                </div>
              </div>

              {/* Nav buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" style={{ flex: '0 0 auto', width: 'auto', padding: '14px 20px' }} onClick={() => setStep(1)}>
                  <ChevronLeft size={16} />Kembali
                </button>
                <button className="btn-primary" style={{ flex: 1, borderRadius: '14px' }} onClick={goStep3} disabled={!selectedMejaId || !selectedSeat}>
                  Konfirmasi Pilihan Kursi <ArrowRight size={16} />
                </button>
              </div>
              {!selectedSeat && (
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#DC2626' }}>⚠ Pilih posisi kursi angin pada salah satu meja untuk melanjutkan</p>
              )}
            </div>
          )}

          {/* STEP 3 — Data & Konfirmasi */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', marginBottom: '4px' }}>Data & Kualifikasi Pemain</h2>
                <p style={{ fontSize: '13px', color: '#5A675E', marginBottom: '24px' }}>Identitas yang akan tercatat pada reservasi dan e-tiket Anda.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Nama Lengkap <span style={{ color: '#DC2626' }}>*</span></label>
                    <div className="form-input-wrapper">
                      <span className="input-icon-left"><Users size={15} /></span>
                      <input type="text" className="form-input" placeholder="Nama lengkap" value={playerNama} onChange={e => setPlayerNama(e.target.value)} style={{ paddingLeft: '8px' }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Aktif <span style={{ color: '#DC2626' }}>*</span></label>
                    <div className="form-input-wrapper">
                      <input type="email" className="form-input" placeholder="email@example.com" value={playerEmail} onChange={e => setPlayerEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">No. WhatsApp / Ponsel <span style={{ color: '#DC2626' }}>*</span></label>
                    <div className="form-input-wrapper">
                      <input type="tel" className="form-input" placeholder="08xx-xxxx-xxxx" value={playerTelp} onChange={e => setPlayerTelp(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ID Lisensi Mahjongyuks</label>
                    <div className="form-input-wrapper">
                      <input type="text" className="form-input" defaultValue={user?.id ? `#MJY-${user.id.toString().padStart(4, '0')}` : ''} readOnly style={{ color: '#5A675E' }} />
                    </div>
                  </div>
                </div>

                {mode === 'competitive' && (
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Tingkat Pengalaman Riichi</label>
                    <div className="form-input-wrapper">
                      <select className="form-input" style={{ appearance: 'none' as const }}>
                        <option>Pemula (Baru Belajar Riichi)</option>
                        <option>Intermediate Riichi (Paham Suji, Kabe, Tenpai Scoring)</option>
                        <option>Advanced (EMA/WRC Rule Familiar)</option>
                        <option>Dan Player (Sudah Memiliki Dan Rank)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* METODE PEMBAYARAN SIMULASI */}
                <div style={{ marginTop: '20px', marginBottom: '24px' }}>
                  <label className="form-label" style={{ marginBottom: '10px' }}>
                    Pilih Metode Pembayaran Simulasi <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                    {[
                      { id: 'qris', label: 'QRIS Instant', desc: 'BCA, GoPay, OVO, Dana', badge: 'Rekomendasi', icon: <QrCode size={18} /> },
                      { id: 'bca_va', label: 'BCA Virtual Account', desc: 'Konfirmasi otomatis', badge: 'VA Otomatis', icon: <CreditCard size={18} /> },
                      { id: 'mandiri_va', label: 'Mandiri Virtual Account', desc: 'Transfer antar bank', badge: 'VA', icon: <Wallet size={18} /> },
                      { id: 'cash', label: 'Tunai di Kasir', desc: 'Bayar di resepsionis venue', badge: 'Manual', icon: <Building2 size={18} /> },
                    ].map(pm => {
                      const isSel = paymentMethod === pm.id;
                      return (
                        <div
                          key={pm.id}
                          onClick={() => setPaymentMethod(pm.id as any)}
                          style={{
                            padding: '14px',
                            borderRadius: '14px',
                            border: isSel ? '2px solid #004F27' : '1px solid #D7E6DB',
                            background: isSel ? '#F1FCF4' : '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isSel ? '#004F27' : '#111E18', fontWeight: 700, fontSize: '13px' }}>
                              {pm.icon}
                              {pm.label}
                            </div>
                            {isSel && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#004F27' }} />}
                          </div>
                          <span style={{ fontSize: '11px', color: '#5A675E' }}>{pm.desc}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment instruction hint */}
                  <div style={{ padding: '14px 16px', borderRadius: '12px', background: '#F8FAF9', border: '1px solid #D7E6DB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '12px', color: '#2B3830' }}>
                      Metode terpilih: <strong>{paymentMethod === 'qris' ? 'QRIS Instant' : paymentMethod === 'bca_va' ? 'BCA Virtual Account' : paymentMethod === 'mandiri_va' ? 'Mandiri Virtual Account' : 'Tunai di Kasir'}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#004F27', fontWeight: 700 }}>
                      Tanpa Biaya Tambahan
                    </div>
                  </div>
                </div>

                <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#FFF8E6', border: '1px solid #FFE4A3', fontSize: '12px', color: '#664A00', lineHeight: '1.6', marginBottom: '20px' }}>
                  💡 <strong>Simulasi Pembayaran:</strong> Ini adalah modul simulasi untuk Capstone Design Project. Anda dapat memilih untuk langsung menyimulasikan pelunasan atau membayarnya nanti.
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '24px' }}>
                  <div className={`custom-checkbox ${agreed ? 'checked' : ''}`} onClick={() => setAgreed(!agreed)} style={{ marginTop: '2px', flexShrink: 0 }}>
                    {agreed && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '12px', color: '#2B3830', lineHeight: '1.6' }}>
                    Saya menyetujui seluruh <strong>regulasi kompetisi</strong>, pedoman <em>fair play</em>, dan etika meja resmi MahjongYuks.
                    {mode === 'competitive' && ' Saya bersedia mematuhi Zero Table-Talk selama rotasi discard berlangsung.'}
                  </span>
                </label>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-secondary" style={{ flex: '0 0 auto', width: 'auto', padding: '14px 20px' }} onClick={() => setStep(2)}>
                    <ChevronLeft size={16} />Kembali
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, borderRadius: '14px', fontSize: '15px', padding: '15px', opacity: agreed && playerNama && playerEmail ? 1 : 0.5 }}
                    onClick={confirmBooking}
                    disabled={!agreed || !playerNama || !playerEmail}
                  >
                    <CreditCard size={16} />Konfirmasi & Buat Tagihan Reservasi
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────────── */}
        {step > 1 && (
          <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Countdown */}
            <div style={{
              background: isTimerCritical ? 'linear-gradient(135deg, #FEE2E2, #FFF0F0)' : 'linear-gradient(135deg, #F0FDF4, #EBF6EE)',
              border: isTimerCritical ? '1.5px solid #FCA5A5' : '1.5px solid #C8E6D0',
              borderRadius: '14px', padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Timer size={16} color={isTimerCritical ? '#DC2626' : '#004F27'} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: isTimerCritical ? '#DC2626' : '#004F27' }}>Selesaikan reservasi:</span>
              </div>
              <span style={{ fontSize: '22px', fontWeight: 900, color: isTimerCritical ? '#DC2626' : '#004F27', fontVariantNumeric: 'tabular-nums' as const, letterSpacing: '1px' }}>
                {formatCountdown(countdown)}
              </span>
            </div>

            {/* Booking summary */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '22px', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#111E18' }}>Ringkasan Pemesanan</h3>
                {selectedSeat && <span style={{ padding: '3px 8px', borderRadius: '99px', background: '#004F27', color: '#98F6C2', fontSize: '10px', fontWeight: 800 }}>1 Kursi</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Event / Sesi', value: mode === 'competitive' ? (selectedEvent?.title || '-') : `Casual — ${duration} Jam` },
                  { label: 'Venue', value: mode === 'competitive' ? (selectedEvent?.venue || '-') : (selectedVenue?.nama || '-') },
                  selectedMeja ? { label: 'Meja', value: `${selectedMeja.nomor} (${selectedMeja.label})` } : null,
                  selectedSeat && windInfo ? { label: 'Posisi Kursi', value: `${windInfo.kanji} ${windInfo.id} (${windInfo.short})` } : null,
                  { label: 'Waktu', value: mode === 'competitive' ? (selectedEvent?.time || '-') : `${selectedTime} – ${String((parseInt(selectedTime) + duration) % 24).padStart(2,'0')}:00 WIB` },
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#7A897F', fontWeight: 600, flexShrink: 0 }}>{item.label}</span>
                    <span style={{ fontSize: '11px', color: '#111E18', fontWeight: 700, textAlign: 'right' as const }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div style={{ borderTop: '1px solid #E4ECE6', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#5A675E' }}>
                    {mode === 'casual' ? `Sewa Meja (${duration} Jam)` : 'Biaya Registrasi Event'}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#111E18' }}>{formatRupiah(mode === 'casual' ? biayaSewa : biayaEvent)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#5A675E' }}>Biaya Platform</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#111E18' }}>{formatRupiah(PLATFORM_FEE)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed #D7E6DB', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#111E18' }}>Total Pembayaran</span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', background: '#DCFCE7', color: '#15803D', borderRadius: '4px', fontWeight: 700 }}>Nett + Pajak</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#004F27', letterSpacing: '-0.5px' }}>{formatRupiah(totalBayar)}</div>
              </div>

              {/* Trust */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '12px', borderTop: '1px solid #E4ECE6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
                  <Shield size={13} color="#004F27" />
                  <span style={{ fontSize: '10px', color: '#5A675E', fontWeight: 600 }}>Garansi Meja 100%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
                  <Star size={13} color="#FFC72C" />
                  <span style={{ fontSize: '10px', color: '#5A675E', fontWeight: 600 }}>Enkripsi SSL 256-Bit</span>
                </div>
              </div>
            </div>

            {/* Facility note */}
            <div style={{ background: '#EBF6EE', borderRadius: '12px', padding: '14px 16px', border: '1px solid #C8E6D0', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <AlertCircle size={15} color="#004F27" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '11px', color: '#2B3830', lineHeight: '1.6' }}>
                <strong>Fasilitas Termasuk:</strong> Automatic tile shuffle. USB port per kursi. Gratis 1× matcha latte.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
