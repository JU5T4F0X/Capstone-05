'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Users,
  Compass,
  QrCode,
  CreditCard,
  Wallet,
  Timer,
  Coffee,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ApiClient, { ApiMyEventRegistration } from '@/lib/api';
import { KemahiranLevel, KEMAHIRAN_MAP, normalizeKemahiran } from '@/lib/kemahiran';
import '@/app/events-venues/events-venues.css';
import { muatSnap, buatPesanan, bukaPopupBayar, tungguStatus, cekStatus } from '@/lib/midtrans';

// Orientasi mata angin mahjong (Hong Kong Style)
type WindPosition = 'ton' | 'nan' | 'sha' | 'pei';

interface SeatInfo {
  position: WindPosition;
  label: string;
  kanji: string;
  direction: string;
  status: 'available' | 'taken' | 'selected' | 'processing';
  occupant?: string;
}

interface TableArena {
  id: number;
  nomor: string;
  tipe: string;
  badgeTipe: string;
  status: 'tersedia' | 'terisi_sebagian' | 'penuh' | 'maintenance';
  statusLabel: string;
  centerText: string;
  centerSub: string;
  seats: Record<WindPosition, SeatInfo>;
}

const WIND_DETAILS: Record<WindPosition, { name: string; kanji: string; dir: string }> = {
  ton: { name: 'Angin Timur (Ton)', kanji: '東', dir: 'Timur' },
  nan: { name: 'Angin Selatan (Nan)', kanji: '南', dir: 'Selatan' },
  sha: { name: 'Angin Barat (Sha)', kanji: '西', dir: 'Barat' },
  pei: { name: 'Angin Utara (Pei)', kanji: '北', dir: 'Utara' },
};

// Peralatan Meja: Toko utama (Alicia Bakery Sedayu City) menggunakan meja otomatis,
// sedangkan event luar menggunakan set manual (sesuai AGENTS.md)
const INITIAL_TABLES: TableArena[] = [
  {
    id: 1,
    nomor: 'Meja 01',
    tipe: 'Meja Otomatis Empat Sisi',
    badgeTipe: 'Meja Otomatis',
    status: 'penuh',
    statusLabel: 'Penuh (4/4)',
    centerText: '01',
    centerSub: 'LENGKAP',
    seats: {
      pei: { position: 'pei', label: 'Pei', kanji: '北', direction: 'Utara', status: 'taken', occupant: 'Hendra' },
      ton: { position: 'ton', label: 'Ton', kanji: '東', direction: 'Timur', status: 'taken', occupant: 'Jess' },
      nan: { position: 'nan', label: 'Nan', kanji: '南', direction: 'Selatan', status: 'taken', occupant: 'Rian' },
      sha: { position: 'sha', label: 'Sha', kanji: '西', direction: 'Barat', status: 'taken', occupant: 'Bima' },
    },
  },
  {
    id: 2,
    nomor: 'Meja 02',
    tipe: 'Meja Otomatis Empat Sisi',
    badgeTipe: 'Meja Otomatis',
    status: 'terisi_sebagian',
    statusLabel: '1 Tersedia',
    centerText: '02',
    centerSub: 'SISA 1',
    seats: {
      pei: { position: 'pei', label: 'Pei', kanji: '北', direction: 'Utara', status: 'available' },
      ton: { position: 'ton', label: 'Ton', kanji: '東', direction: 'Timur', status: 'taken', occupant: 'Andi' },
      nan: { position: 'nan', label: 'Nan', kanji: '南', direction: 'Selatan', status: 'taken', occupant: 'Siska' },
      sha: { position: 'sha', label: 'Sha', kanji: '西', direction: 'Barat', status: 'taken', occupant: 'Fikri' },
    },
  },
  {
    id: 3,
    nomor: 'Meja 03',
    tipe: 'Meja Otomatis Empat Sisi',
    badgeTipe: 'Meja Otomatis',
    status: 'tersedia',
    statusLabel: 'Pilihan Aktif',
    centerText: '03',
    centerSub: 'TERSEDIA',
    seats: {
      pei: { position: 'pei', label: 'Pei', kanji: '北', direction: 'Utara', status: 'taken', occupant: 'David' },
      ton: { position: 'ton', label: 'Ton', kanji: '東', direction: 'Timur', status: 'available' },
      nan: { position: 'nan', label: 'Nan', kanji: '南', direction: 'Selatan', status: 'available' },
      sha: { position: 'sha', label: 'Sha', kanji: '西', direction: 'Barat', status: 'available' },
    },
  },
  {
    id: 4,
    nomor: 'Meja 04',
    tipe: 'Set Mahjong Manual & Mat Standar',
    badgeTipe: 'Meja Manual',
    status: 'penuh',
    statusLabel: 'Penuh (4/4)',
    centerText: '04',
    centerSub: 'LENGKAP',
    seats: {
      pei: { position: 'pei', label: 'Pei', kanji: '北', direction: 'Utara', status: 'taken', occupant: 'Citra' },
      ton: { position: 'ton', label: 'Ton', kanji: '東', direction: 'Timur', status: 'taken', occupant: 'Budi' },
      nan: { position: 'nan', label: 'Nan', kanji: '南', direction: 'Selatan', status: 'taken', occupant: 'Yosef' },
      sha: { position: 'sha', label: 'Sha', kanji: '西', direction: 'Barat', status: 'taken', occupant: 'Maya' },
    },
  },
];

export default function PemesananPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Tab utama: 'booking' (wizard baru) atau 'riwayat' (daftar pemesanan & tiket)
  const [viewTab, setViewTab] = useState<'booking' | 'riwayat'>('booking');

  // State konfigurasi booking
  const [mode, setMode] = useState<'Casual' | 'Competitive'>('Competitive');
  const [selectedDate, setSelectedDate] = useState('2026-11-01');
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [durationHours, setDurationHours] = useState(4);
  const [tables] = useState<TableArena[]>(INITIAL_TABLES);
  const [selectedTableId, setSelectedTableId] = useState<number>(3);
  const [selectedSeat, setSelectedSeat] = useState<WindPosition>('ton');

  // Form identitas pemain (Hong Kong Style)
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [licenseId, setLicenseId] = useState('#MJY-9201');
  const [tingkatKemahiran, setTingkatKemahiran] = useState<KemahiranLevel>('Intermediate');
  const [agreed, setAgreed] = useState(true);

  // Simulasi Pembayaran
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'bca_va' | 'cash'>('qris');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessTicket, setShowSuccessTicket] = useState(false);
  const [confirmedData, setConfirmedData] = useState<any>(null);

  // Timer countdown 15 menit
  const [timeLeft, setTimeLeft] = useState(887); // ~14:47

  // Data riwayat pendaftaran event & pemesanan lokal
  const [registrations, setRegistrations] = useState<ApiMyEventRegistration[]>([]);
  const [localBookings, setLocalBookings] = useState<any[]>([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'event' | 'meja'>('all');

  // Set default identitas dari session user
  useEffect(() => {
    if (user) {
      if (user.nama) setNamaLengkap(user.nama);
      if (user.email) setEmail(user.email);
      if (user.no_telepon) setNoTelp(user.no_telepon);
      if (user.handle) setLicenseId(user.handle.startsWith('#') ? user.handle : `#${user.handle}`);
      if (user.tingkat_kemahiran || user.kemahiran) {
        setTingkatKemahiran(normalizeKemahiran(user.tingkat_kemahiran || user.kemahiran));
      }
    } else {
      setNamaLengkap('Kevin Sanjaya');
      setEmail('kevin@example.com');
      setNoTelp('08123456789');
      setTingkatKemahiran('Intermediate');
    }
  }, [user]);

  // Load saved bookings dari localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mahjongyuks_bookings');
      if (stored) {
        setLocalBookings(JSON.parse(stored));
      } else {
        // Sample default regular booking jika belum ada
        const defaultSample = [
          {
            id: 'TB-841-01',
            type: 'meja',
            title: 'Sesi Sparing Reguler Hong Kong Style (4 Jam)',
            venue: 'Alicia Bakery Sedayu City (Game House MahjongYuks)',
            address: 'Sedayu City Kelapa Gading SCBRC, Blok C No. 18, Jakarta Utara',
            table: 'Meja Otomatis #02',
            seatKanji: '東',
            seatName: 'Angin Timur (Ton)',
            dateTime: 'Sabtu, 1 November 2026 • 14:00 - 18:00 WIB',
            status: 'confirmed',
            statusLabel: 'Terkonfirmasi & Lunas',
            price: 'Rp 125.000',
          },
        ];
        setLocalBookings(defaultSample);
        localStorage.setItem('mahjongyuks_bookings', JSON.stringify(defaultSample));
      }
    } catch {
      // fallback
    }
  }, []);

  // Fetch riwayat event dari API
  const fetchBookings = async () => {
    setLoadingRiwayat(true);
    try {
      const res = await ApiClient.getMyEventRegistrations();
      if (res.success && res.data) {
        setRegistrations(res.data);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoadingRiwayat(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Timer countdown tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Kalkulasi harga sewa meja
  const ratePerHour = mode === 'Competitive' ? 30000 : 25000;
  const tableRentalPrice = ratePerHour * durationHours;
  const platformFee = 5000;
  const totalPrice = tableRentalPrice + platformFee;

  // Handler pemilihan kursi
  const handleSelectSeat = (tableId: number, pos: WindPosition) => {
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable) return;
    const seat = targetTable.seats[pos];
    if (seat.status === 'taken') return;

    setSelectedTableId(tableId);
    setSelectedSeat(pos);
  };

  // Submit: buat pesanan di backend, lalu buka popup pembayaran Midtrans
  const handleProceedPayment = async () => {
    if (!selectedSeat) {
      alert('Silakan pilih salah satu kursi mata angin yang tersedia.');
      return;
    }
    if (!agreed) {
      alert('Harap menyetujui regulasi dan etika permainan sebelum melanjutkan.');
      return;
    }
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await muatSnap();

      const pesanan = await buatPesanan({
        meja_id: selectedTableId,
        tanggal_main: selectedDate,
        waktu_mulai: selectedTime.slice(0, 5),
        durasi_jam: durationHours,
        jenis_pemesanan: mode,
        kursi_pilihan: selectedSeat,
      });

      const hasilPopup = await bukaPopupBayar(pesanan.snap_token);

      // Keputusan akhir selalu dari backend, bukan dari popup
      const hasil =
        hasilPopup === 'closed' || hasilPopup === 'error'
          ? await cekStatus(pesanan.pemesanan_id)
          : await tungguStatus(pesanan.pemesanan_id);

      if (hasil.status === 'paid') {
        const currentTable = tables.find((t) => t.id === selectedTableId);
        const windInfo = WIND_DETAILS[selectedSeat];
        const total = hasil.tiket?.total_bayar ?? pesanan.total_bayar;

        const newBooking = {
          id: hasil.kode_booking,
          type: 'meja' as const,
          title: mode === 'Competitive' ? 'Sesi Pertandingan Kompetitif Hong Kong Style' : 'Sesi Sparing Casual Hong Kong Style',
          venue: 'Alicia Bakery Sedayu City (Game House MahjongYuks)',
          address: 'Sedayu City Kelapa Gading SCBRC Blok C No. 18, Jakarta Utara',
          table: `${currentTable?.nomor} (${currentTable?.tipe})`,
          seatKanji: windInfo.kanji,
          seatName: windInfo.name,
          seatPosition: selectedSeat,
          dateTime: `${selectedDate} \u2022 ${selectedTime} WIB (${durationHours} Jam)`,
          duration: durationHours,
          price: `Rp ${total.toLocaleString('id-ID')}`,
          mode,
          playerName: namaLengkap || 'Kevin Sanjaya',
          playerEmail: email || 'kevin@example.com',
          playerPhone: noTelp || '08123456789',
          licenseId,
          tingkatKemahiran,
          status: 'confirmed',
          statusLabel: 'Terkonfirmasi & Lunas',
          createdAt: new Date().toISOString(),
        };

        const updated = [newBooking, ...localBookings];
        setLocalBookings(updated);
        try {
          localStorage.setItem('mahjongyuks_bookings', JSON.stringify(updated));
        } catch {
          // abaikan
        }

        setConfirmedData(newBooking);
        setShowSuccessTicket(true);
      } else if (hasil.status === 'pending') {
        alert('Pembayaran belum selesai. Klik tombol bayar lagi untuk melanjutkan pesanan yang sama.');
      } else if (hasil.status === 'expired') {
        alert('Waktu pembayaran habis. Silakan pesan ulang.');
      } else {
        alert('Pembayaran gagal atau dibatalkan. Silakan coba lagi.');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Eksekusi simulasi bayar
  const handleConfirmSimulation = async () => {
    setIsProcessing(true);

    const bookingCode = `MJY-BOK-${Math.floor(1000 + Math.random() * 9000)}`;
    const currentTable = tables.find((t) => t.id === selectedTableId);
    const windInfo = WIND_DETAILS[selectedSeat];

    const newBooking = {
      id: bookingCode,
      type: 'meja' as const,
      title: mode === 'Competitive' ? 'Sesi Pertandingan Kompetitif Hong Kong Style' : 'Sesi Sparing Casual Hong Kong Style',
      venue: 'Alicia Bakery Sedayu City (Game House MahjongYuks)',
      address: 'Sedayu City Kelapa Gading SCBRC Blok C No. 18, Jakarta Utara',
      table: `${currentTable?.nomor} (${currentTable?.tipe})`,
      seatKanji: windInfo.kanji,
      seatName: windInfo.name,
      seatPosition: selectedSeat,
      dateTime: `${selectedDate} • ${selectedTime} WIB (${durationHours} Jam)`,
      duration: durationHours,
      price: `Rp ${totalPrice.toLocaleString('id-ID')}`,
      mode,
      playerName: namaLengkap || 'Kevin Sanjaya',
      playerEmail: email || 'kevin@example.com',
      playerPhone: noTelp || '08123456789',
      licenseId,
      tingkatKemahiran,
      status: 'confirmed',
      statusLabel: 'Terkonfirmasi & Lunas',
      createdAt: new Date().toISOString(),
    };

    // Simpan ke Backend Laravel jika backend aktif
    try {
      await ApiClient.createBooking({
        meja_id: selectedTableId,
        tanggal_main: selectedDate,
        waktu_mulai: selectedTime,
        waktu_selesai: `${parseInt(selectedTime.split(':')[0]) + durationHours}:00`,
        jumlah_pemain: 1,
        jenis_pemesanan: mode,
        durasi_jam: durationHours,
        kursi_pilihan: selectedSeat,
        metode_pembayaran: paymentMethod,
      });
    } catch {
      // Backend offline/mock fallback
    }

    // Simpan ke state dan localStorage
    const updated = [newBooking, ...localBookings];
    setLocalBookings(updated);
    try {
      localStorage.setItem('mahjongyuks_bookings', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setConfirmedData(newBooking);
    setIsProcessing(false);
    setIsPayModalOpen(false);
    setShowSuccessTicket(true);
  };

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const selectedWindInfo = WIND_DETAILS[selectedSeat];

  return (
    <div className="ev-page-wrapper">
      {/* Hero Header */}
      <section className="ev-hero-section">
        <div className="ev-container">
          <nav aria-label="Breadcrumb" className="ev-breadcrumbs">
            <Link href="/dashboard">Dashboard</Link>
            <span className="separator">/</span>
            <span className="current">Pemesanan &amp; Reservasi Meja</span>
          </nav>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px' }}>
            <div>
              <h1 className="ev-hero-title">Denah Meja &amp; Alokasi Kursi Permainan</h1>
              <p className="ev-hero-subtitle">
                Pilih meja otomatis empat sisi atau meja manual, alokasi kursi mata angin (東・南・西・北), durasi bermain, dan konfirmasi tiket instan format Hong Kong Style.
              </p>
            </div>

            {/* Tab switch header */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <button
                type="button"
                onClick={() => setViewTab('booking')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: viewTab === 'booking' ? '#FAF8F5' : 'transparent',
                  color: viewTab === 'booking' ? '#183629' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Compass size={15} />
                <span>Pesan Meja Baru</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('riwayat')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: viewTab === 'riwayat' ? '#FAF8F5' : 'transparent',
                  color: viewTab === 'riwayat' ? '#183629' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Ticket size={15} />
                <span>Tiket &amp; Riwayat ({localBookings.length + registrations.length})</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          VIEW TAB 1: INTERACTIVE BOOKING WIZARD (Denah Meja & Alokasi Kursi)
         ========================================================================= */}
      {viewTab === 'booking' && (
        <main className="ev-container" style={{ flex: 1, padding: '32px 0 64px 0' }}>
          {/* Progress Steps Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '32px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#004F27',
              backgroundColor: '#DCF1E3',
              padding: '6px 14px',
              borderRadius: '9999px'
            }}>
              <CheckCircle size={15} color="#16A34A" />
              <span>1. Pilih Jadwal &amp; Sesi</span>
            </div>
            <div style={{ width: '24px', height: '1px', backgroundColor: '#CBD5E1' }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#FFFFFF',
              backgroundColor: '#183629',
              padding: '6px 16px',
              borderRadius: '9999px',
              boxShadow: '0 2px 8px rgba(24, 54, 41, 0.2)'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                color: '#183629',
                fontSize: '11px',
                fontWeight: 800
              }}>2</span>
              <span>Meja &amp; Kursi Angin</span>
            </div>
            <div style={{ width: '24px', height: '1px', backgroundColor: '#CBD5E1' }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748B',
              backgroundColor: '#F1F5F9',
              padding: '6px 14px',
              borderRadius: '9999px'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#CBD5E1',
                color: '#64748B',
                fontSize: '11px',
                fontWeight: 700
              }}>3</span>
              <span>Rincian &amp; Pembayaran</span>
            </div>
          </div>

          {/* Sesi Banner Strip */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E4E0D8',
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '28px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: '#183629',
                color: '#FAF8F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(24, 54, 41, 0.25)'
              }}>
                🀄
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.04em'
                  }}>
                    {mode === 'Competitive' ? 'KOMPETISI HONG KONG STYLE' : 'SESI SPARING REGULER'}
                  </span>
                  <span style={{
                    backgroundColor: '#DCF1E3',
                    color: '#004F27',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    Aturan Hong Kong (HK Style)
                  </span>
                </div>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800, color: '#183629' }}>
                  Game House Sedayu City — Meja Otomatis Empat Sisi
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#5A675E' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={14} color="#004F27" />
                    <span>Alicia Bakery Sedayu City, Kelapa Gading</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} color="#004F27" />
                    <span>{selectedDate}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={14} color="#004F27" />
                    <span>{selectedTime} WIB ({durationHours} Jam)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sisa Kuota Badge */}
            <div style={{
              textAlign: 'right',
              backgroundColor: '#F8FAF9',
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid #E4E0D8'
            }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase' }}>
                Sisa Kuota Kursi
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#004F27', marginTop: '2px' }}>
                3 / 16 Kursi
              </div>
              <div style={{ fontSize: '11px', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                <span>Live Status</span>
              </div>
            </div>
          </div>

          {/* Grid Layout: Left Interactive Arena + Right Sticky Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 380px',
            gap: '28px',
            alignItems: 'start'
          }}>
            {/* LEFT COLUMN: Denah Meja & Seat Allocation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Box Denah Meja Arena */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E4E0D8',
                padding: '24px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 800, color: '#183629' }}>
                      Denah Meja &amp; Alokasi Kursi Permainan
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#5A675E' }}>
                      Pilih salah satu kursi tersedia dengan orientasi mata angin (東・南・西・北) untuk memilih kursi Anda.
                    </p>
                  </div>

                  {/* Mode Casual vs Competitive Switcher */}
                  <div style={{
                    display: 'flex',
                    backgroundColor: '#F1F5F9',
                    padding: '3px',
                    borderRadius: '8px',
                    gap: '4px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setMode('Casual')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: mode === 'Casual' ? '#183629' : 'transparent',
                        color: mode === 'Casual' ? '#FFFFFF' : '#475569',
                      }}
                    >
                      Casual (Santai)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('Competitive')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: mode === 'Competitive' ? '#183629' : 'transparent',
                        color: mode === 'Competitive' ? '#FFFFFF' : '#475569',
                      }}
                    >
                      Competitive (Poin)
                    </button>
                  </div>
                </div>

                {/* Status Legend Bar */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  backgroundColor: '#F8FAF9',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #EBF1ED',
                  marginBottom: '24px',
                  fontSize: '12px',
                  color: '#475569'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#183629' }} />
                    <span style={{ fontWeight: 600, color: '#183629' }}>Kursi Dipilih (Anda)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#DCFCE7', border: '1px dashed #16A34A' }} />
                    <span>Tersedia</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }} />
                    <span>Terisi / Penuh</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#F1F5F9' }} />
                    <span>Maintenance / Tutup</span>
                  </div>
                </div>

                {/* Zona Indikator */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#8DA79B',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '16px'
                }}>
                  <span>Sisi Jendela Taman (Utara)</span>
                  <span>Pintu Masuk Ruang Utama</span>
                </div>

                {/* The 4 Tables Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px'
                }}>
                  {tables.map((table) => {
                    const isSelectedTable = selectedTableId === table.id;
                    return (
                      <div
                        key={`table-arena-${table.id}`}
                        style={{
                          backgroundColor: isSelectedTable ? '#FCFDFC' : '#FFFFFF',
                          borderRadius: '12px',
                          border: isSelectedTable ? '2px solid #183629' : '1px solid #E4E0D8',
                          padding: '18px',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: isSelectedTable ? '0 4px 14px rgba(24, 54, 41, 0.12)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Table Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#183629' }}>
                              {table.nomor}
                            </div>
                            <div style={{ fontSize: '11px', color: '#5A675E' }}>
                              {table.tipe}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor:
                              table.status === 'penuh'
                                ? '#FEE2E2'
                                : table.status === 'terisi_sebagian'
                                ? '#DCFCE7'
                                : isSelectedTable
                                ? '#183629'
                                : '#FEF3C7',
                            color:
                              table.status === 'penuh'
                                ? '#B91C1C'
                                : table.status === 'terisi_sebagian'
                                ? '#15803D'
                                : isSelectedTable
                                ? '#FFFFFF'
                                : '#B45309',
                          }}>
                            {isSelectedTable ? 'Pilihan Aktif' : table.statusLabel}
                          </span>
                        </div>

                        {/* Interactive Compass Layout */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '70px 100px 70px',
                          gridTemplateRows: '50px 70px 50px',
                          gap: '8px',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '12px 0 16px 0',
                          padding: '12px',
                          backgroundColor: '#F8FAF9',
                          borderRadius: '10px'
                        }}>
                          {/* TOP: PEI (North) */}
                          <div style={{ gridColumn: '2', gridRow: '1', display: 'flex', justifyContent: 'center' }}>
                            <SeatButton
                              seat={table.seats.pei}
                              isSelected={isSelectedTable && selectedSeat === 'pei'}
                              onClick={() => handleSelectSeat(table.id, 'pei')}
                            />
                          </div>

                          {/* LEFT: SHA (West) */}
                          <div style={{ gridColumn: '1', gridRow: '2', display: 'flex', justifyContent: 'center' }}>
                            <SeatButton
                              seat={table.seats.sha}
                              isSelected={isSelectedTable && selectedSeat === 'sha'}
                              onClick={() => handleSelectSeat(table.id, 'sha')}
                            />
                          </div>

                          {/* CENTER TABLE BLOCK */}
                          <div style={{
                            gridColumn: '2',
                            gridRow: '2',
                            backgroundColor: isSelectedTable ? '#183629' : table.status === 'penuh' ? '#E2E8F0' : '#E8F3EB',
                            color: isSelectedTable ? '#FAF8F5' : table.status === 'penuh' ? '#64748B' : '#004F27',
                            borderRadius: '8px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px',
                            textAlign: 'center',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                          }}>
                            <div style={{ fontSize: '18px', fontWeight: 900, lineHeight: 1 }}>
                              {table.centerText}
                            </div>
                            <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.04em', marginTop: '3px' }}>
                              {table.centerSub}
                            </div>
                          </div>

                          {/* RIGHT: TON (East) */}
                          <div style={{ gridColumn: '3', gridRow: '2', display: 'flex', justifyContent: 'center' }}>
                            <SeatButton
                              seat={table.seats.ton}
                              isSelected={isSelectedTable && selectedSeat === 'ton'}
                              onClick={() => handleSelectSeat(table.id, 'ton')}
                            />
                          </div>

                          {/* BOTTOM: NAN (South) */}
                          <div style={{ gridColumn: '2', gridRow: '3', display: 'flex', justifyContent: 'center' }}>
                            <SeatButton
                              seat={table.seats.nan}
                              isSelected={isSelectedTable && selectedSeat === 'nan'}
                              onClick={() => handleSelectSeat(table.id, 'nan')}
                            />
                          </div>
                        </div>

                        {/* Footer Subtext per Table */}
                        <div style={{
                          fontSize: '11.5px',
                          color: '#5A675E',
                          textAlign: 'center',
                          paddingTop: '8px',
                          borderTop: '1px solid #F1F5F9'
                        }}>
                          {isSelectedTable && selectedSeat ? (
                            <span style={{ color: '#004F27', fontWeight: 700 }}>
                              ✓ Terpilih: {WIND_DETAILS[selectedSeat].name}
                            </span>
                          ) : table.status === 'penuh' ? (
                            <span>Sesi meja terisi penuh (4 pemain)</span>
                          ) : (
                            <span>Kursi mata angin tersedia</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Box Pilihan Durasi & Waktu Bermain */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E4E0D8',
                padding: '24px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 800, color: '#183629', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Timer size={18} color="#004F27" />
                  <span>Durasi &amp; Jadwal Sesi Bermain</span>
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  {/* Tanggal */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                      Tanggal Main
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        color: '#183629',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {/* Waktu Mulai */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                      Waktu Mulai Sesi
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        color: '#183629',
                        fontWeight: 600,
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      <option value="10:00">10:00 WIB (Sesi Pagi)</option>
                      <option value="14:00">14:00 WIB (Sesi Siang)</option>
                      <option value="18:00">18:00 WIB (Sesi Sore/Malam)</option>
                      <option value="20:00">20:00 WIB (Sesi Larut)</option>
                    </select>
                  </div>
                </div>

                {/* Pilihan Jam Durasi */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '8px' }}>
                    Pilih Durasi Bermain (Tarif Rp {ratePerHour.toLocaleString('id-ID')} / jam)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {[1, 2, 3, 4, 6].map((hrs) => (
                      <button
                        key={`duration-btn-${hrs}`}
                        type="button"
                        onClick={() => setDurationHours(hrs)}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 700,
                          border: durationHours === hrs ? '2px solid #183629' : '1px solid #CBD5E1',
                          backgroundColor: durationHours === hrs ? '#183629' : '#FFFFFF',
                          color: durationHours === hrs ? '#FAF8F5' : '#183629',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {hrs} Jam
                        <span style={{
                          display: 'block',
                          fontSize: '10.5px',
                          fontWeight: 500,
                          color: durationHours === hrs ? '#A3E6B4' : '#64748B',
                          marginTop: '2px'
                        }}>
                          Rp {(hrs * ratePerHour).toLocaleString('id-ID')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box Data & Kualifikasi Pemain (Standar Kemahiran MahjongYuks HK Style) */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E4E0D8',
                padding: '24px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#DCF1E3',
                    color: '#004F27',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#183629' }}>
                      Data &amp; Kualifikasi Pemain
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#5A675E' }}>
                      Identitas resmi pemain yang akan tercatat pada lembar skor resmi Hong Kong Mahjong Style.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                      Nama Lengkap Pemesan *
                    </label>
                    <input
                      type="text"
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                      Email Aktif *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                      No. WhatsApp / Ponsel *
                    </label>
                    <input
                      type="tel"
                      value={noTelp}
                      onChange={(e) => setNoTelp(e.target.value)}
                      placeholder="08123456789"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                      ID Lisensi Mahjongyuks
                    </label>
                    <input
                      type="text"
                      value={licenseId}
                      onChange={(e) => setLicenseId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        fontWeight: 700,
                        backgroundColor: '#F8FAF9'
                      }}
                    />
                  </div>
                </div>

                {/* Dropdown Tingkat Kemahiran Resmi (Beginner, Intermediate, Advance) */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                    Tingkat Kemahiran (Standar Hong Kong Mahjong) *
                  </label>
                  <select
                    value={tingkatKemahiran}
                    onChange={(e) => setTingkatKemahiran(e.target.value as KemahiranLevel)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      backgroundColor: '#FFFFFF',
                      fontWeight: 600,
                      color: '#183629'
                    }}
                  >
                    <option value="Beginner">
                      Beginner — Pemula (Baru mempelajari aturan dasar Hong Kong Mahjong: Chow, Pung, Kong)
                    </option>
                    <option value="Intermediate">
                      Intermediate — Menengah (Memahami aturan Fan dasar, pembentukan kombinasi, dan strategi buang ubin)
                    </option>
                    <option value="Advance">
                      Advance — Mahir (Menguasai strategi Fan tingkat lanjut, membaca tangan lawan, dan siap kompetisi)
                    </option>
                  </select>
                  <div style={{
                    fontSize: '11.5px',
                    color: '#5A675E',
                    marginTop: '6px',
                    backgroundColor: KEMAHIRAN_MAP[tingkatKemahiran]?.badgeBg || '#F8FAF9',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${KEMAHIRAN_MAP[tingkatKemahiran]?.badgeColor || '#004F27'}`
                  }}>
                    {KEMAHIRAN_MAP[tingkatKemahiran]?.deskripsi}
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: '#183629' }}
                  />
                  <span>
                    Saya menyetujui seluruh regulasi permainan Hong Kong Style, pedoman fair play, dan etika meja resmi selama sesi berlangsung.
                  </span>
                </label>
              </div>
            </div>

            {/* RIGHT COLUMN: Sticky Summary Sidebar */}
            <aside style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Timer Countdown Card */}
              <div style={{
                backgroundColor: '#FEF9EE',
                border: '1px solid #FCD34D',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#92400E'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                  <Clock size={16} color="#B45309" />
                  <span>Selesaikan reservasi:</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace' }}>
                  {formatCountdown(timeLeft)}
                </div>
              </div>

              {/* Ringkasan Pemesanan Card */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E4E0D8',
                padding: '24px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#183629' }}>
                    Ringkasan Pemesanan
                  </h3>
                  <span style={{
                    backgroundColor: '#DCF1E3',
                    color: '#004F27',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    1 Seat
                  </span>
                </div>

                <div style={{ fontSize: '11.5px', color: '#8DA79B', fontWeight: 700, marginBottom: '14px', textTransform: 'uppercase' }}>
                  BOOKING #MJY-NOV-882
                </div>

                {/* Details list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: '#5A675E' }}>Format Aturan:</span>
                    <span style={{ fontWeight: 700, color: '#183629' }}>Hong Kong Style</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: '#5A675E' }}>Mode Sesi:</span>
                    <span style={{ fontWeight: 700, color: '#183629' }}>{mode}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: '#5A675E' }}>Venue:</span>
                    <span style={{ fontWeight: 600, color: '#183629', textAlign: 'right' }}>Game House Sedayu City</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: '#5A675E' }}>Meja Terpilih:</span>
                    <span style={{ fontWeight: 700, color: '#183629' }}>{selectedTable?.nomor}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: '#5A675E' }}>Posisi Kursi:</span>
                    <span style={{
                      fontWeight: 800,
                      color: '#004F27',
                      backgroundColor: '#EBF6EE',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {selectedWindInfo?.kanji} {selectedWindInfo?.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: '#5A675E' }}>Jadwal Main:</span>
                    <span style={{ fontWeight: 600, color: '#183629', textAlign: 'right' }}>
                      {selectedDate} | {selectedTime} WIB
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: '#5A675E' }}>Durasi:</span>
                    <span style={{ fontWeight: 700, color: '#183629' }}>{durationHours} Jam Bermain</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#5A675E' }}>Sewa Meja ({durationHours} Jam)</span>
                    <span style={{ fontWeight: 600, color: '#183629' }}>Rp {tableRentalPrice.toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#5A675E' }}>Biaya Layanan &amp; Pemeliharaan</span>
                    <span style={{ fontWeight: 600, color: '#183629' }}>Rp {platformFee.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Grand Total */}
                <div style={{
                  backgroundColor: '#F8FAF9',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '20px',
                  border: '1px solid #EBF1ED'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#5A675E', textTransform: 'uppercase' }}>
                        TOTAL PEMBAYARAN
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: '#004F27', marginTop: '2px' }}>
                        Rp {totalPrice.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <span style={{
                      backgroundColor: '#DCF1E3',
                      color: '#004F27',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}>
                      IDR NETT
                    </span>
                  </div>
                </div>

                {/* Proceed Button */}
                <button
                  type="button"
                  onClick={handleProceedPayment}
                  style={{
                    width: '100%',
                    backgroundColor: '#183629',
                    color: '#FAF8F5',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(24, 54, 41, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>Lanjut ke Pembayaran Simulasi</span>
                  <ArrowRight size={16} />
                </button>

                {/* Trust Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '16px', fontSize: '11px', color: '#64748B' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} color="#16A34A" />
                    <span>Garansi Meja 100%</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={13} color="#64748B" />
                    <span>Enkripsi SSL 256-Bit</span>
                  </span>
                </div>
              </div>

              {/* Fasilitas Meja Box (Sesuai AGENTS.md Toko Utama Sedayu City) */}
              <div style={{
                backgroundColor: '#F8FAF9',
                border: '1px solid #E4E0D8',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                gap: '12px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#004F27',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                }}>
                  <Coffee size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#183629' }}>
                    Fasilitas Meja Termasuk
                  </div>
                  <div style={{ fontSize: '12px', color: '#5A675E', marginTop: '4px', lineHeight: 1.4 }}>
                    Meja otomatis pengocokan empat sisi otomatis, set ubin Mahjong Hong Kong Style ukuran standar, USB fast charging di tiap kursi, dan minuman teh dingin gratis.
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      )}

      {/* =========================================================================
          VIEW TAB 2: RIWAYAT PEMESANAN & TIKET SAYA (Daftar tiket & booking)
         ========================================================================= */}
      {viewTab === 'riwayat' && (
        <main className="ev-container" style={{ flex: 1, padding: '32px 0 64px 0' }}>
          {/* Stat Badges Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E4E0D8',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase' }}>
                Total Reservasi
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#183629', marginTop: '6px' }}>
                {registrations.length + localBookings.length} Sesi
              </div>
              <div style={{ fontSize: '12px', color: '#004F27', marginTop: '4px', fontWeight: 600 }}>
                Aktif &amp; Terkonfirmasi
              </div>
            </div>

            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E4E0D8',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase' }}>
                Pendaftaran Event
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#004F27', marginTop: '6px' }}>
                {registrations.length} Tiket
              </div>
              <div style={{ fontSize: '12px', color: '#5A675E', marginTop: '4px' }}>
                Komunitas Hong Kong Style
              </div>
            </div>

            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E4E0D8',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase' }}>
                Meja Reguler &amp; Sparing
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#111E18', marginTop: '6px' }}>
                {localBookings.length} Sesi
              </div>
              <div style={{ fontSize: '12px', color: '#B8860B', marginTop: '4px', fontWeight: 600 }}>
                Game House Sedayu City
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeFilter === 'all' ? '1px solid #183629' : '1px solid #D7E6DB',
                  backgroundColor: activeFilter === 'all' ? '#183629' : '#FFFFFF',
                  color: activeFilter === 'all' ? '#FFFFFF' : '#2B3830',
                }}
              >
                Semua ({registrations.length + localBookings.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('event')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeFilter === 'event' ? '1px solid #183629' : '1px solid #D7E6DB',
                  backgroundColor: activeFilter === 'event' ? '#183629' : '#FFFFFF',
                  color: activeFilter === 'event' ? '#FFFFFF' : '#2B3830',
                }}
              >
                Tiket Event ({registrations.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('meja')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeFilter === 'meja' ? '1px solid #183629' : '1px solid #D7E6DB',
                  backgroundColor: activeFilter === 'meja' ? '#183629' : '#FFFFFF',
                  color: activeFilter === 'meja' ? '#FFFFFF' : '#2B3830',
                }}
              >
                Meja Bermain ({localBookings.length})
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setViewTab('booking')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#183629',
                  color: '#FAF8F5',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Compass size={15} />
                <span>Pesan Meja / Kursi Baru</span>
              </button>
            </div>
          </div>

          {/* Bookings List (dengan unique key prop) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Local Bookings */}
            {(activeFilter === 'all' || activeFilter === 'meja') &&
              localBookings.map((b, idx) => {
                const uniqueKey = `booking-item-${b.id || 'b'}-${idx}`;
                return (
                  <div
                    key={uniqueKey}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E4E0D8',
                      padding: '24px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '20px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: '1 1 340px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        backgroundColor: '#FEF9EE',
                        color: '#B8860B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Layers size={24} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            backgroundColor: '#FEF3C7',
                            color: '#B45309',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            RESERVASI MEJA BERMAIN
                          </span>
                          <span style={{ fontSize: '11px', color: '#7A897F' }}>
                            #{b.id}
                          </span>
                          {b.seatKanji && (
                            <span style={{
                              backgroundColor: '#EBF6EE',
                              color: '#004F27',
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              {b.seatKanji} {b.seatName}
                            </span>
                          )}
                        </div>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#111E18' }}>
                          {b.title}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12.5px', color: '#5A675E' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} color="#004F27" />
                            {b.dateTime}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="#004F27" />
                            {b.venue}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#183629' }}>
                            <Layers size={13} color="#B8860B" />
                            {b.table}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#7A897F' }}>Biaya Sewa</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#004F27', marginTop: '2px' }}>
                          {b.price}
                        </div>
                      </div>

                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#DCF1E3',
                        color: '#004F27',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}>
                        <CheckCircle size={14} color="#16A34A" />
                        <span>{b.statusLabel || 'Terkonfirmasi'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setConfirmedData(b);
                          setShowSuccessTicket(true);
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: '1px solid #D7E6DB',
                          color: '#183629',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: '#FAF8F5',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <QrCode size={14} />
                        <span>E-Tiket</span>
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* Event registrations (dengan unique key prop) */}
            {(activeFilter === 'all' || activeFilter === 'event') &&
              registrations.map((reg, idx) => {
                const uniqueKey = `reg-item-${reg.pendaftaran_id || 'reg'}-${idx}`;
                return (
                  <div
                    key={uniqueKey}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E4E0D8',
                      padding: '24px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '20px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: '1 1 340px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        backgroundColor: '#EBF6EE',
                        color: '#004F27',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Ticket size={24} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            backgroundColor: '#DCF1E3',
                            color: '#004F27',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            TIKET EVENT HONG KONG STYLE
                          </span>
                          <span style={{ fontSize: '11px', color: '#7A897F' }}>
                            #{reg.pendaftaran_id}
                          </span>
                        </div>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#111E18' }}>
                          {reg.event?.nama_event || 'Pertandingan Hong Kong Mahjong'}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12.5px', color: '#5A675E' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} color="#004F27" />
                            {reg.event?.tanggal_formatted || reg.event?.tanggal_event || 'Jadwal Pertandingan'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="#004F27" />
                            {reg.event?.venue || 'Game House MahjongYuks Sedayu City'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#7A897F' }}>Status Pendaftaran</div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: '#004F27',
                          fontWeight: 700,
                          fontSize: '13px',
                          marginTop: '2px'
                        }}>
                          <CheckCircle size={14} color="#16A34A" />
                          <span>Terkonfirmasi</span>
                        </div>
                      </div>

                      <Link
                        href={`/events/${reg.event?.id || 1}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: '1px solid #D7E6DB',
                          color: '#183629',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          backgroundColor: '#FAF8F5'
                        }}
                      >
                        <span>Detail Event</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}

            {/* Empty state if nothing */}
            {localBookings.length === 0 && registrations.length === 0 && !loadingRiwayat && (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px dashed #CBD5E1',
                padding: '48px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🀄</div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: '#183629' }}>
                  Belum Ada Reservasi Meja Aktif
                </h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#5A675E' }}>
                  Anda belum memesan meja sesi santai atau tiket event Hong Kong Style. Silakan pesan meja sekarang.
                </p>
                <button
                  type="button"
                  onClick={() => setViewTab('booking')}
                  style={{
                    backgroundColor: '#183629',
                    color: '#FAF8F5',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Pesan Meja Sekarang
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* =========================================================================
          MODAL 1: SIMULASI PEMBAYARAN (RF-04)
         ========================================================================= */}
      {isPayModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#183629',
              color: '#FAF8F5',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A3E6B4', fontWeight: 700 }}>
                  SIMULASI PEMBAYARAN (SPRINT 4)
                </div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800 }}>
                  Konfirmasi Sesi Meja
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FAF8F5',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Total amount highlight */}
              <div style={{
                backgroundColor: '#F8FAF9',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '1px solid #EBF1ED',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '12px', color: '#5A675E' }}>Total Tagihan Sesi ({durationHours} Jam Bermain)</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#004F27', marginTop: '4px' }}>
                  Rp {totalPrice.toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600, marginTop: '2px' }}>
                  {selectedTable?.nomor} • {selectedWindInfo?.kanji} {selectedWindInfo?.name}
                </div>
              </div>

              {/* Payment Methods */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#183629', marginBottom: '8px' }}>
                  Pilih Metode Pembayaran Simulasi
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: paymentMethod === 'qris' ? '2px solid #183629' : '1px solid #E2E8F0',
                    backgroundColor: paymentMethod === 'qris' ? '#F4F9F5' : '#FFFFFF',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="payMethod"
                      value="qris"
                      checked={paymentMethod === 'qris'}
                      onChange={() => setPaymentMethod('qris')}
                      style={{ accentColor: '#183629' }}
                    />
                    <QrCode size={20} color="#004F27" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#183629' }}>QRIS Instant (GoPay / OVO / Dana / BCA)</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Scan kode QR langsung dari e-wallet / mobile banking</div>
                    </div>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: paymentMethod === 'bca_va' ? '2px solid #183629' : '1px solid #E2E8F0',
                    backgroundColor: paymentMethod === 'bca_va' ? '#F4F9F5' : '#FFFFFF',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="payMethod"
                      value="bca_va"
                      checked={paymentMethod === 'bca_va'}
                      onChange={() => setPaymentMethod('bca_va')}
                      style={{ accentColor: '#183629' }}
                    />
                    <CreditCard size={20} color="#004F27" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#183629' }}>BCA / Mandiri Virtual Account</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Nomor akun virtual otomatis terkonfirmasi</div>
                    </div>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: paymentMethod === 'cash' ? '2px solid #183629' : '1px solid #E2E8F0',
                    backgroundColor: paymentMethod === 'cash' ? '#F4F9F5' : '#FFFFFF',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="payMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      style={{ accentColor: '#183629' }}
                    />
                    <Wallet size={20} color="#004F27" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#183629' }}>Bayar Tunai di Resepsionis Game House</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Check-in &amp; bayar langsung sebelum sesi dimulai</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* QR / VA Graphic display */}
              {paymentMethod === 'qris' && (
                <div style={{
                  textAlign: 'center',
                  padding: '14px',
                  backgroundColor: '#F8FAF9',
                  borderRadius: '10px',
                  border: '1px dashed #CBD5E1',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '10px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                    <QrCode size={110} color="#183629" />
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '8px' }}>
                    NMID: ID102042300070 • MahjongYuks Sedayu City
                  </div>
                </div>
              )}

              {paymentMethod === 'bca_va' && (
                <div style={{
                  padding: '14px',
                  backgroundColor: '#F8FAF9',
                  borderRadius: '10px',
                  border: '1px dashed #CBD5E1',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Nomor Virtual Account:</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#183629', fontFamily: 'monospace', letterSpacing: '2px', marginTop: '4px' }}>
                    80777 0812 3456 7890
                  </div>
                </div>
              )}

              {/* Submit simulation */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmSimulation}
                style={{
                  width: '100%',
                  backgroundColor: '#183629',
                  color: '#FAF8F5',
                  padding: '14px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(24, 54, 41, 0.25)'
                }}
              >
                {isProcessing ? (
                  <span>Memproses Pembayaran Simulasi...</span>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Konfirmasi Pembayaran (Simulasi Berhasil)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: E-TIKET RESMI & CHECK-IN (RF-05)
         ========================================================================= */}
      {showSuccessTicket && confirmedData && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            border: '2px solid #183629'
          }}>
            {/* Ticket Header */}
            <div style={{
              backgroundColor: '#183629',
              color: '#FAF8F5',
              padding: '22px 24px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <span style={{
                backgroundColor: '#DCF1E3',
                color: '#004F27',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '8px'
              }}>
                LUNAS &amp; SIAP CHECK-IN
              </span>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 900 }}>
                E-Tiket Reservasi Meja
              </h3>
              <div style={{ fontSize: '12px', color: '#A3E6B4' }}>
                Tunjukkan QR Code ini ke petugas meja otomatis di Game House Sedayu City
              </div>
            </div>

            {/* Ticket Body */}
            <div style={{ padding: '24px' }}>
              {/* QR Code Card */}
              <div style={{
                textAlign: 'center',
                backgroundColor: '#F8FAF9',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #EBF1ED',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '12px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
                }}>
                  <QrCode size={130} color="#183629" />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#183629', letterSpacing: '1px', marginTop: '10px' }}>
                  {confirmedData.id}
                </div>
                <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                  ✓ Terdaftar di Meja Otomatis Game House
                </div>
              </div>

              {/* Table & Seat Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px',
                fontSize: '12.5px'
              }}>
                <div style={{ backgroundColor: '#F8FAF9', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Meja Terpilih:</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#183629', marginTop: '2px' }}>
                    {confirmedData.table}
                  </div>
                </div>

                <div style={{ backgroundColor: '#EBF6EE', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#004F27' }}>Alokasi Kursi:</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#004F27', marginTop: '2px' }}>
                    {confirmedData.seatKanji} {confirmedData.seatName}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAF9', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Nama Pemain:</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#183629', marginTop: '2px' }}>
                    {confirmedData.playerName}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAF9', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Durasi Bermain:</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#183629', marginTop: '2px' }}>
                    {confirmedData.duration} Jam ({confirmedData.price})
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessTicket(false);
                    setViewTab('riwayat');
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#183629',
                    color: '#FAF8F5',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Lihat di Riwayat Tiket
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccessTicket(false)}
                  style={{
                    padding: '12px 18px',
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Tombol Kursi Mata Angin
function SeatButton({
  seat,
  isSelected,
  onClick,
}: {
  seat: SeatInfo;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isTaken = seat.status === 'taken';

  return (
    <button
      type="button"
      disabled={isTaken}
      onClick={onClick}
      style={{
        width: '56px',
        height: '42px',
        borderRadius: '6px',
        border: isSelected
          ? '2px solid #183629'
          : isTaken
          ? '1px solid #FECACA'
          : '1px dashed #16A34A',
        backgroundColor: isSelected
          ? '#183629'
          : isTaken
          ? '#FEE2E2'
          : '#DCFCE7',
        color: isSelected
          ? '#FAF8F5'
          : isTaken
          ? '#B91C1C'
          : '#15803D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px',
        cursor: isTaken ? 'not-allowed' : 'pointer',
        boxShadow: isSelected ? '0 2px 8px rgba(24, 54, 41, 0.3)' : 'none',
        transition: 'all 0.15s ease'
      }}
      title={isTaken ? `Kursi ${seat.direction} terisi oleh ${seat.occupant}` : `Pilih Kursi ${seat.direction}`}
    >
      <div style={{ fontSize: '13px', fontWeight: 900, lineHeight: 1 }}>
        {seat.kanji}
      </div>
      <div style={{
        fontSize: '9px',
        fontWeight: 700,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '50px'
      }}>
        {isSelected ? 'Anda' : isTaken ? seat.occupant : 'Pilih'}
      </div>
    </button>
  );
}
