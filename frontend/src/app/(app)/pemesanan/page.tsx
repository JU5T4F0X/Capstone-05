'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Loader2,
  AlertTriangle,
  Check,
  X,
  CalendarX2,
  Flame,
  Sparkles,
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
  playerId?: number;
  userId?: number;
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
  isLocked?: boolean;
  lockReason?: string | null;
  seats: Record<WindPosition, SeatInfo>;
}

const WIND_DETAILS: Record<WindPosition, { name: string; kanji: string; dir: string }> = {
  ton: { name: 'Angin Timur (Ton)', kanji: '東', dir: 'Timur' },
  nan: { name: 'Angin Selatan (Nan)', kanji: '南', dir: 'Selatan' },
  sha: { name: 'Angin Barat (Sha)', kanji: '西', dir: 'Barat' },
  pei: { name: 'Angin Utara (Pei)', kanji: '北', dir: 'Utara' },
};

function PemesananContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Parameter dari Portal Sesi Terjadwal / Event (Bila ada)
  const portalParam = searchParams.get('portal'); // 'jadwal' | 'event' | 'reguler' | null
  const scheduleIdParam = searchParams.get('schedule_id');
  const eventIdParam = searchParams.get('event_id');
  const titleParam = searchParams.get('title');
  const priceParam = searchParams.get('price');
  const dateParam = searchParams.get('date');
  const timeParam = searchParams.get('time');
  const venueParam = searchParams.get('venue');
  const typeParam = searchParams.get('type');

  // Deteksi apakah pemesanan ini berasal dari jadwal khusus / turnamen event
  const isScheduledPortal = Boolean(
    portalParam === 'jadwal' ||
    portalParam === 'event' ||
    scheduleIdParam ||
    eventIdParam
  );

  const scheduleTitle = titleParam || (portalParam === 'event' ? 'Event Resmi MahjongYuks' : 'Sesi Game House Terjadwal');
  const packagePrice = Number(priceParam) || (portalParam === 'event' ? 150000 : 90000);
  const sessionTimeString = timeParam || '13:00 - 18:00 WIB';

  // Tab utama: 'booking' (wizard baru) atau 'riwayat' (daftar pemesanan & tiket)
  const [viewTab, setViewTab] = useState<'booking' | 'riwayat'>('booking');

  // State konfigurasi booking
  const [mode, setMode] = useState<'Casual' | 'Competitive'>('Competitive');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [durationHours, setDurationHours] = useState(4);

  // Sinkronkan jadwal & durasi jika reservasi berasal dari Jadwal / Event (Harga Tetap & Jam Terkunci)
  useEffect(() => {
    if (isScheduledPortal) {
      if (dateParam) {
        setSelectedDate(dateParam);
      }
      if (timeParam) {
        const timeRangeMatch = timeParam.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (timeRangeMatch) {
          const startH = parseInt(timeRangeMatch[1], 10);
          const endH = parseInt(timeRangeMatch[3], 10);
          setSelectedTime(`${startH.toString().padStart(2, '0')}:00`);
          setDurationHours(Math.max(1, endH - startH));
        } else {
          const singleMatch = timeParam.match(/(\d{1,2}:\d{2})/);
          if (singleMatch) {
            setSelectedTime(singleMatch[1]);
          }
        }
      }
      if (portalParam === 'event') {
        setMode('Competitive');
      }
    }
  }, [isScheduledPortal, dateParam, timeParam, portalParam]);

  // State Venue & Meja Real-time (Dinon-hardcode, bersumber dari database)
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | string>(1);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [tables, setTables] = useState<TableArena[]>([]);
  const [loadingTables, setLoadingTables] = useState<boolean>(true);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<WindPosition | null>(null);

  // Form identitas pemain (Hong Kong Style)
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [tingkatKemahiran, setTingkatKemahiran] = useState<KemahiranLevel>('Intermediate');
  const [agreed, setAgreed] = useState(true);

  // Simulasi & Konfirmasi Pembayaran
  const [isConfirmSeatOpen, setIsConfirmSeatOpen] = useState(false);
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

  // In-App Notice Dialog State (Clean Modal replacing browser window.alert)
  const [noticeDialog, setNoticeDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subtext?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showAlertModal = (message: string, title = 'Regulasi Pemesanan Meja', subtext?: string) => {
    setNoticeDialog({
      isOpen: true,
      title,
      message,
      subtext,
    });
  };

  // Set default identitas dari session user
  useEffect(() => {
    if (user) {
      if (user.nama) setNamaLengkap(user.nama);
      if (user.email) setEmail(user.email);
      if (user.no_telepon) setNoTelp(user.no_telepon);
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

  // ── 1. Fetch Venues Asli dari Database ──
  useEffect(() => {
    ApiClient.getVenues().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setVenues(res.data);
        const sedayu = res.data.find((v: any) => v.nama_venue?.toLowerCase().includes('sedayu')) || res.data[0];
        setSelectedVenueId(sedayu.id);
        setSelectedVenue(sedayu);
      }
    }).catch(() => {});
  }, []);

  // Sinkronkan selectedVenue saat selectedVenueId berubah
  useEffect(() => {
    if (venues.length > 0 && selectedVenueId) {
      const v = venues.find((item: any) => String(item.id) === String(selectedVenueId));
      if (v) setSelectedVenue(v);
    }
  }, [selectedVenueId, venues]);

  // ── 2. Fetch Meja Asli & Status Kursi Terisi dari Backend (Bukan Hardcode) ──
  useEffect(() => {
    if (!selectedVenueId) return;
    setLoadingTables(true);

    ApiClient.getMejas({
      venue_id: selectedVenueId,
      tanggal_main: selectedDate,
      waktu_mulai: selectedTime,
      durasi_jam: durationHours,
    }).then((res) => {
      if (res.success && res.data) {
        const isSedayu = selectedVenue?.nama_venue?.toLowerCase().includes('sedayu');
        const mappedTables: TableArena[] = res.data.map((m: any, idx: number) => {
          const occupiedList: string[] = m.occupied_seats || [];
          const seatDetails: Record<string, any> = m.seat_details || {};
          const isAuto = isSedayu || m.nomor_meja?.toLowerCase().includes('otomatis');
          const tipe = isAuto ? 'Meja Otomatis Empat Sisi' : 'Set Mahjong Manual & Mat Standar';
          const badgeTipe = isAuto ? 'Meja Otomatis' : 'Meja Manual';

          const centerNum = String(idx + 1).padStart(2, '0');
          let centerSub = 'TERSEDIA';
          if (m.is_full) {
            centerSub = 'LENGKAP';
          } else if (m.is_locked) {
            centerSub = 'KUNCI';
          } else if (m.is_partial) {
            centerSub = `SISA ${m.kapasitas - m.occupied_count}`;
          }

          const seats: Record<WindPosition, SeatInfo> = {
            pei: {
              position: 'pei',
              label: 'Pei',
              kanji: '北',
              direction: 'Utara',
              status: occupiedList.includes('pei') ? 'taken' : 'available',
              occupant: seatDetails['pei']?.occupant,
              playerId: seatDetails['pei']?.player_id,
              userId: seatDetails['pei']?.user_id,
            },
            ton: {
              position: 'ton',
              label: 'Ton',
              kanji: '東',
              direction: 'Timur',
              status: occupiedList.includes('ton') ? 'taken' : 'available',
              occupant: seatDetails['ton']?.occupant,
              playerId: seatDetails['ton']?.player_id,
              userId: seatDetails['ton']?.user_id,
            },
            nan: {
              position: 'nan',
              label: 'Nan',
              kanji: '南',
              direction: 'Selatan',
              status: occupiedList.includes('nan') ? 'taken' : 'available',
              occupant: seatDetails['nan']?.occupant,
              playerId: seatDetails['nan']?.player_id,
              userId: seatDetails['nan']?.user_id,
            },
            sha: {
              position: 'sha',
              label: 'Sha',
              kanji: '西',
              direction: 'Barat',
              status: occupiedList.includes('sha') ? 'taken' : 'available',
              occupant: seatDetails['sha']?.occupant,
              playerId: seatDetails['sha']?.player_id,
              userId: seatDetails['sha']?.user_id,
            },
          };

          return {
            id: m.id,
            nomor: m.nomor_meja || `Meja ${centerNum}`,
            tipe,
            badgeTipe,
            status: m.is_full ? 'penuh' : (m.is_partial ? 'terisi_sebagian' : 'tersedia'),
            statusLabel: m.status_label || (m.is_full ? 'Penuh (4/4)' : 'Tersedia'),
            centerText: centerNum,
            centerSub,
            isLocked: m.is_locked,
            lockReason: m.lock_reason,
            seats,
          };
        });

        setTables(mappedTables);

        // Pilih otomatis meja pertama yang tidak terkunci
        setSelectedTableId((prev) => {
          const currentValid = mappedTables.find((t) => t.id === prev && !t.isLocked);
          if (currentValid) return prev;
          const firstUnlocked = mappedTables.find((t) => !t.isLocked && Object.values(t.seats).some((s) => s.status === 'available'));
          return firstUnlocked ? firstUnlocked.id : null;
        });
      }
    }).catch(() => {}).finally(() => {
      setLoadingTables(false);
    });
  }, [selectedVenueId, selectedDate, selectedTime, durationHours, selectedVenue]);

  // Deteksi apakah user yang sedang login sudah memiliki kursi aktif pada jadwal/slot ini
  const userActiveBooking = useMemo(() => {
    if (!user) return null;
    const userNameLower = (user.nama || (user as any).name || '').toLowerCase().trim();

    for (const table of tables) {
      for (const [pos, seat] of Object.entries(table.seats)) {
        if (seat.status === 'taken') {
          const occLower = (seat.occupant || '').toLowerCase().trim();
          const isMatch =
            (seat.userId && seat.userId === user.id) ||
            (seat.playerId && (seat.playerId === (user as any).player_id || seat.playerId === (user as any).player?.id)) ||
            (userNameLower && occLower && userNameLower === occLower);

          if (isMatch) {
            return {
              tableId: table.id,
              tableName: table.nomor,
              seatPosition: pos as WindPosition,
              seatName: WIND_DETAILS[pos as WindPosition]?.name,
              seatKanji: WIND_DETAILS[pos as WindPosition]?.kanji,
            };
          }
        }
      }
    }
    return null;
  }, [tables, user]);

  // Pastikan selectedSeat memilih kursi yang tersedia pada selectedTableId
  useEffect(() => {
    if (!selectedTableId || tables.length === 0) return;
    const currentTable = tables.find((t) => t.id === selectedTableId);
    if (!currentTable) return;
    // Jika user sudah memiliki kursi terdaftar di sesi ini, jangan pilih kursi baru
    if (userActiveBooking) {
      setSelectedSeat(null);
      return;
    }
    if (selectedSeat && currentTable.seats[selectedSeat]?.status === 'available') {
      return;
    }
    const firstAvail = (['ton', 'nan', 'sha', 'pei'] as WindPosition[]).find(
      (pos) => currentTable.seats[pos]?.status === 'available'
    );
    setSelectedSeat(firstAvail || null);
  }, [selectedTableId, tables, selectedSeat, userActiveBooking]);

  // Load saved bookings dari localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mahjongyuks_bookings');
      if (stored) {
        setLocalBookings(JSON.parse(stored));
      }
    } catch {
      // fallback
    }
  }, []);

  // Fetch riwayat event & pemesanan meja dari API
  const fetchBookings = async () => {
    setLoadingRiwayat(true);
    try {
      const [resEvent, resBookings] = await Promise.allSettled([
        ApiClient.getMyEventRegistrations(),
        ApiClient.getMyBookings(),
      ]);

      if (resEvent.status === 'fulfilled' && resEvent.value.success && resEvent.value.data) {
        setRegistrations(resEvent.value.data);
      }

      if (resBookings.status === 'fulfilled' && resBookings.value.success && resBookings.value.data) {
        const rawList = Array.isArray(resBookings.value.data)
          ? resBookings.value.data
          : (resBookings.value.data as any).data || [];

        if (Array.isArray(rawList) && rawList.length > 0) {
          const apiBookings = rawList.map((p: any) => {
            const detail = p.detail_pemesanans?.[0] || p.detailPemesanans?.[0] || {};
            const kursi = (detail.kursi || 'ton') as WindPosition;
            const windInfo = WIND_DETAILS[kursi] || WIND_DETAILS['ton'];
            const durasi = p.durasi_jam || 3;
            const total = p.pembayaran?.total_bayar || (p.jenis_pemesanan === 'Competitive' ? 125000 : 95000);

            return {
              id: p.kode_booking || `MJY-BOK-${String(p.id).padStart(5, '0')}`,
              type: 'meja' as const,
              title: p.jenis_pemesanan === 'Competitive'
                ? 'Sesi Pertandingan Kompetitif Hong Kong Style'
                : 'Sesi Sparing Casual Hong Kong Style',
              venue: p.meja?.venue?.nama_venue || 'Alicia Bakery Sedayu City (Game House MahjongYuks)',
              address: p.meja?.venue?.alamat || 'Sedayu City Kelapa Gading SCBRC Blok C No. 18, Jakarta Utara',
              table: `${p.meja?.nomor_meja || 'Meja 01'} (Meja Otomatis Empat Sisi)`,
              seatKanji: windInfo.kanji,
              seatName: windInfo.name,
              seatPosition: kursi,
              dateTime: `${p.tanggal_main} • ${p.waktu_mulai ? p.waktu_mulai.slice(0, 5) : '14:00'} WIB (${durasi} Jam)`,
              duration: durasi,
              price: `Rp ${Number(total).toLocaleString('id-ID')}`,
              mode: p.jenis_pemesanan || 'Competitive',
              playerName: p.player?.user?.nama || 'Kevin Sanjaya',
              playerEmail: p.player?.user?.email || 'kevin@example.com',
              playerPhone: p.player?.user?.no_telepon || '08123456789',
              tingkatKemahiran: 'Intermediate',
              status: p.status_pemesanan || 'confirmed',
              statusLabel: p.status_pemesanan === 'confirmed' ? 'Terkonfirmasi & Lunas' : 'Menunggu',
              createdAt: p.created_at || p.tanggal_pemesanan,
            };
          });

          setLocalBookings((prev) => {
            const map = new Map<string, any>();
            apiBookings.forEach((ab: any) => map.set(String(ab.id), ab));
            prev.forEach((lb: any) => {
              const k = String(lb.id);
              if (map.has(k)) {
                map.set(k, { ...map.get(k), ...lb });
              } else {
                map.set(k, lb);
              }
            });
            const merged = Array.from(map.values());
            try {
              localStorage.setItem('mahjongyuks_bookings', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
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

  // Kalkulasi harga: Portal Terjadwal / Event menggunakan tarif paket tetap; Sewa Reguler menggunakan per-jam
  const ratePerHour = mode === 'Competitive' ? 30000 : 25000;
  const tableRentalPrice = ratePerHour * durationHours;
  const platformFee = 5000;
  const regularTotalPrice = tableRentalPrice + platformFee;
  const totalPrice = isScheduledPortal ? packagePrice : regularTotalPrice;

  // Handler pemilihan kursi dengan validasi regulasi penguncian meja
  const handleSelectSeat = (tableId: number, pos: WindPosition) => {
    if (userActiveBooking) {
      showAlertModal(
        `Anda sudah memiliki reservasi terdaftar di ${userActiveBooking.tableName} (Kursi ${userActiveBooking.seatKanji} ${userActiveBooking.seatName}) pada sesi ini. Sesuai regulasi MahjongYuks, setiap pemain hanya diperbolehkan memesan 1 kursi per sesi.`,
        'Sudah Memiliki Kursi Terdaftar',
        'Silakan cek tab Tiket & Riwayat untuk melihat detail e-tiket Anda.'
      );
      return;
    }

    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable) return;
    if (targetTable.isLocked) {
      showAlertModal(
        targetTable.lockReason || 'Terkunci: Silakan pilih meja nomor awal yang tersedia terlebih dahulu.',
        'Regulasi Meja MahjongYuks',
        'Sesuai regulasi MahjongYuks, meja baru baru dapat dibuka setelah meja yang sedang terisi sebagian terisi penuh 4 pemain.'
      );
      return;
    }
    const seat = targetTable.seats[pos];
    if (seat.status === 'taken') {
      showAlertModal(
        `Kursi ${pos.toUpperCase()} (${WIND_DETAILS[pos].name}) sudah terisi oleh ${seat.occupant || 'pemain lain'}.`,
        'Kursi Telah Terisi',
        'Silakan pilih kursi mata angin lain yang masih berstatus tersedia pada meja ini.'
      );
      return;
    }

    setSelectedTableId(tableId);
    setSelectedSeat(pos);
  };

  // Tahap 1: Validasi awal dan buka modal konfirmasi kunci kursi
  const handleInitiatePayment = () => {
    if (user?.role === 'admin') {
      showAlertModal(
        'Akun Administrator tidak dapat melakukan pemesanan meja permainan. Silakan gunakan akun Pemain untuk reservasi kursi.',
        'Akses Khusus Pemain'
      );
      return;
    }
    if (userActiveBooking) {
      showAlertModal(
        `Anda sudah terdaftar di ${userActiveBooking.tableName} (${userActiveBooking.seatName}) pada jadwal ini. Anda tidak dapat memesan kursi ganda.`,
        'Reservasi Sudah Aktif'
      );
      return;
    }
    if (!selectedTableId || !selectedSeat) {
      showAlertModal('Silakan pilih salah satu meja dan kursi mata angin yang tersedia terlebih dahulu.', 'Pilihan Kursi Diperlukan');
      return;
    }
    if (!agreed) {
      showAlertModal('Harap centang persetujuan regulasi dan etika permainan sebelum melanjutkan.', 'Persetujuan Diperlukan');
      return;
    }
    setIsConfirmSeatOpen(true);
  };

  // Tahap 2: Eksekusi kunci pesanan di backend, lalu buka popup pembayaran Midtrans
  const handleProceedPayment = async () => {
    setIsConfirmSeatOpen(false);
    if (user?.role === 'admin') {
      showAlertModal(
        'Akun Administrator tidak dapat melakukan pemesanan meja permainan. Silakan gunakan akun Pemain untuk reservasi kursi.',
        'Akses Khusus Pemain'
      );
      return;
    }
    if (userActiveBooking) {
      showAlertModal(
        `Anda sudah terdaftar di ${userActiveBooking.tableName} (${userActiveBooking.seatName}) pada jadwal ini. Anda tidak dapat memesan kursi ganda.`,
        'Reservasi Sudah Aktif'
      );
      return;
    }
    if (!selectedTableId || !selectedSeat) {
      showAlertModal('Silakan pilih salah satu meja dan kursi mata angin yang tersedia terlebih dahulu.', 'Pilihan Kursi Diperlukan');
      return;
    }
    if (!agreed) {
      showAlertModal('Harap centang persetujuan regulasi dan etika permainan sebelum melanjutkan.', 'Persetujuan Diperlukan');
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
        total_biaya: totalPrice,
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
        const total = hasil.tiket?.total_bayar ?? pesanan.total_bayar ?? totalPrice;

        const newBooking = {
          id: hasil.kode_booking,
          type: 'meja' as const,
          title: isScheduledPortal
            ? `${scheduleTitle} (${portalParam === 'event' ? 'Event' : 'Sesi Terjadwal'})`
            : (mode === 'Competitive' ? 'Sesi Pertandingan Kompetitif Hong Kong Style' : 'Sesi Sparing Casual Hong Kong Style'),
          venue: venueParam || 'Alicia Bakery Sedayu City (Game House MahjongYuks)',
          address: 'Sedayu City Kelapa Gading SCBRC Blok C No. 18, Jakarta Utara',
          table: `${currentTable?.nomor} (${currentTable?.tipe})`,
          seatKanji: windInfo.kanji,
          seatName: windInfo.name,
          seatPosition: selectedSeat,
          dateTime: `${selectedDate} \u2022 ${isScheduledPortal ? sessionTimeString : `${selectedTime} WIB`} (${durationHours} Jam)`,
          duration: durationHours,
          price: `Rp ${total.toLocaleString('id-ID')}`,
          mode,
          playerName: namaLengkap || 'Kevin Sanjaya',
          playerEmail: email || 'kevin@example.com',
          playerPhone: noTelp || '08123456789',
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
        showAlertModal('Pembayaran belum selesai. Klik tombol bayar lagi untuk melanjutkan transaksi Anda.', 'Status Transaksi Pending');
      } else if (hasil.status === 'expired') {
        showAlertModal('Batas waktu pembayaran telah habis. Silakan lakukan reservasi ulang.', 'Waktu Pembayaran Habis');
      } else {
        showAlertModal('Pembayaran dibatalkan atau belum berhasil diselesaikan. Silakan coba kembali.', 'Pembayaran Belum Berhasil');
      }
    } catch (e) {
      showAlertModal(e instanceof Error ? e.message : 'Terjadi kendala saat memproses pembayaran.', 'Gagal Memproses Transaksi');
    } finally {
      setIsProcessing(false);
    }
  };

  // Eksekusi simulasi bayar
  const handleConfirmSimulation = async () => {
    if (userActiveBooking) {
      showAlertModal(
        `Anda sudah terdaftar di ${userActiveBooking.tableName} (${userActiveBooking.seatName}) pada jadwal ini. Anda tidak dapat memesan kursi ganda.`,
        'Reservasi Sudah Aktif'
      );
      return;
    }
    if (!selectedTableId || !selectedSeat) {
      showAlertModal('Silakan pilih salah satu meja dan kursi mata angin yang tersedia.', 'Pilihan Kursi Diperlukan');
      return;
    }
    setIsProcessing(true);

    const bookingCode = `MJY-BOK-${Math.floor(1000 + Math.random() * 9000)}`;
    const currentTable = tables.find((t) => t.id === selectedTableId);
    const windInfo = WIND_DETAILS[selectedSeat];

    const newBooking = {
      id: bookingCode,
      type: 'meja' as const,
      title: isScheduledPortal
        ? `${scheduleTitle} (${portalParam === 'event' ? 'Event' : 'Sesi Terjadwal'})`
        : (mode === 'Competitive' ? 'Sesi Pertandingan Kompetitif Hong Kong Style' : 'Sesi Sparing Casual Hong Kong Style'),
      venue: venueParam || 'Alicia Bakery Sedayu City (Game House MahjongYuks)',
      address: 'Sedayu City Kelapa Gading SCBRC Blok C No. 18, Jakarta Utara',
      table: `${currentTable?.nomor} (${currentTable?.tipe})`,
      seatKanji: windInfo.kanji,
      seatName: windInfo.name,
      seatPosition: selectedSeat,
      dateTime: `${selectedDate} • ${isScheduledPortal ? sessionTimeString : `${selectedTime} WIB`} (${durationHours} Jam)`,
      duration: durationHours,
      price: `Rp ${totalPrice.toLocaleString('id-ID')}`,
      mode,
      playerName: namaLengkap || 'Kevin Sanjaya',
      playerEmail: email || 'kevin@example.com',
      playerPhone: noTelp || '08123456789',
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
        total_biaya: totalPrice,
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

  // ── Unified History: Menggabungkan Reservasi Meja & Tiket Event (Terbaru Paling Atas) ──
  const unifiedHistory = useMemo(() => {
    type UnifiedHistoryItem =
      | { kind: 'meja'; id: string | number; sortTime: number; sortId: number; data: any }
      | { kind: 'event'; id: string | number; sortTime: number; sortId: number; data: ApiMyEventRegistration };

    const list: UnifiedHistoryItem[] = [];

    // 1. Masukkan Reservasi Meja Bermain
    localBookings.forEach((b, idx) => {
      let time = 0;
      if (b.createdAt) {
        const t = new Date(b.createdAt).getTime();
        if (!isNaN(t) && t > 0) time = t;
      }
      if (!time && b.dateTime) {
        const dateMatch = String(b.dateTime).match(/(\d{4}-\d{2}-\d{2})/);
        const timeMatch = String(b.dateTime).match(/(\d{2}:\d{2})/);
        if (dateMatch) {
          const d = dateMatch[1];
          const tm = timeMatch ? timeMatch[1] : '00:00';
          const parsed = new Date(`${d}T${tm}:00`).getTime();
          if (!isNaN(parsed)) time = parsed;
        }
      }
      const numId = typeof b.id === 'string' ? parseInt(b.id.replace(/\D/g, ''), 10) : Number(b.id) || 0;

      list.push({
        kind: 'meja',
        id: b.id || `meja-${idx}`,
        sortTime: time,
        sortId: numId,
        data: b,
      });
    });

    // 2. Masukkan Tiket Pendaftaran Event
    registrations.forEach((reg, idx) => {
      let time = 0;
      if (reg.created_at) {
        const t = new Date(reg.created_at).getTime();
        if (!isNaN(t) && t > 0) time = t;
      }
      if (!time && reg.tanggal_daftar) {
        const parsed = new Date(String(reg.tanggal_daftar).replace(' ', 'T')).getTime();
        if (!isNaN(parsed) && parsed > 0) time = parsed;
      }
      if (!time && reg.event?.tanggal_event) {
        const d = reg.event.tanggal_event;
        const tm = reg.event.waktu_mulai ? reg.event.waktu_mulai.slice(0, 5) : '00:00';
        const parsed = new Date(`${d}T${tm}:00`).getTime();
        if (!isNaN(parsed)) time = parsed;
      }
      const numId = Number(reg.pendaftaran_id) || 0;

      list.push({
        kind: 'event',
        id: reg.pendaftaran_id || `event-${idx}`,
        sortTime: time,
        sortId: numId,
        data: reg,
      });
    });

    // 3. Urutkan DESCENDING: Paling baru (terbaru) PALING ATAS
    list.sort((a, b) => {
      if (b.sortTime !== a.sortTime) {
        return b.sortTime - a.sortTime;
      }
      return b.sortId - a.sortId;
    });

    return list;
  }, [localBookings, registrations]);

  // Filter berdasarkan pill yang dipilih: 'all' | 'event' | 'meja'
  const filteredHistory = useMemo(() => {
    if (activeFilter === 'all') return unifiedHistory;
    return unifiedHistory.filter((item) => item.kind === activeFilter);
  }, [unifiedHistory, activeFilter]);

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const selectedWindInfo = selectedSeat ? WIND_DETAILS[selectedSeat] : WIND_DETAILS['ton'];

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

          {/* ── PORTAL SESI TERJADWAL & EVENT BANNER ── */}
          {isScheduledPortal && (
            <div style={{
              backgroundColor: '#0F261C',
              color: '#FAF8F5',
              borderRadius: '14px',
              padding: '22px 26px',
              marginBottom: '24px',
              border: '1px solid #1E4634',
              boxShadow: '0 6px 20px rgba(15, 38, 28, 0.18)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#E2BC55',
                  color: '#183629',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(226, 188, 85, 0.3)'
                }}>
                  <Ticket size={24} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#1E4634',
                      color: '#A3E6B4',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      border: '1px solid #2D6A4F'
                    }}>
                      {portalParam === 'event' ? '🏆 Portal Reservasi Event Resmi' : '📅 Portal Sesi Terjadwal Game House'}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#E2BC55',
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}>
                      Tarif Paket Sesi Tetap
                    </span>
                  </div>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '19px', fontWeight: 800, color: '#FFFFFF' }}>
                    {scheduleTitle}
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', fontSize: '12.5px', color: '#CBD5E1' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} color="#E2BC55" />
                      <span>{selectedDate}</span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} color="#E2BC55" />
                      <span>{sessionTimeString} ({durationHours} Jam Sesi)</span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={14} color="#E2BC55" />
                      <span>{venueParam || 'Game House (Sedayu City Kelapa Gading SCBRC)'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '10.5px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Biaya Kursi Sesi
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#E2BC55', marginTop: '2px' }}>
                    Rp {packagePrice.toLocaleString('id-ID')} <span style={{ fontSize: '12px', fontWeight: 500, color: '#FAF8F5' }}>/kursi</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/pemesanan')}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#FAF8F5',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Kembali ke format pemesanan per-jam reguler"
                >
                  Beralih ke Sewa Reguler Per-Jam
                </button>
              </div>
            </div>
          )}

          {/* Venue Info Header (Clean Architectural Layout, Zero AI Buzzwords) */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            {/* Row 1: Badges & Venue Selector aligned */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              paddingBottom: '14px',
              marginBottom: '16px',
              borderBottom: '1px solid #F1F5F9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  backgroundColor: mode === 'Competitive' ? '#FEF3C7' : '#F1F5F9',
                  color: mode === 'Competitive' ? '#92400E' : '#334155',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em'
                }}>
                  {mode === 'Competitive' ? 'KOMPETISI HONG KONG STYLE' : 'SESI SPARING REGULER'}
                </span>
                <span style={{
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  {selectedVenue?.nama_venue?.toLowerCase().includes('sedayu') ? 'Meja Otomatis Empat Sisi' : 'Set Mahjong Manual & Standar'}
                </span>
              </div>

              {/* Selector Venue */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Lokasi Venue:</label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nama_venue}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Venue Detail & Stats */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: '#183629',
                  color: '#86EFAC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Layers size={24} strokeWidth={2} />
                </div>
                <div>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: '#111E18' }}>
                    {selectedVenue?.nama_venue || 'Alicia Bakery Sedayu City'}
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', fontSize: '12.5px', color: '#64748B' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={14} color="#183629" />
                      <span>{selectedVenue?.alamat || 'Alicia Bakery Sedayu City, Kelapa Gading'}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} color="#183629" />
                      <span>{selectedDate}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} color="#183629" />
                      <span>{selectedTime} WIB ({durationHours} Jam)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Sisa Kuota Badge */}
              <div style={{
                textAlign: 'right',
                backgroundColor: '#F8FAF9',
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                flexShrink: 0
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Sisa Kuota Kursi
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#183629', marginTop: '2px' }}>
                  {loadingTables
                    ? '...'
                    : `${Math.max(0, tables.length * 4 - tables.reduce((acc, t) => acc + Object.values(t.seats).filter((s) => s.status === 'taken').length, 0))} / ${tables.length * 4} Kursi`}
                </div>
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

                {/* Banner Regulasi Pengisian Meja MahjongYuks */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  backgroundColor: '#FEF9EC',
                  border: '1px solid #FDE68A',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontSize: '12.5px',
                  color: '#92400E',
                  lineHeight: 1.5,
                }}>
                  <ShieldCheck size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Regulasi Pengisian Meja:</strong> Pemain wajib memenuhi kursi di meja yang sedang terisi sebagian terlebih dahulu agar sesi permainan dapat segera dimulai (minimal 4 pemain per meja). Meja kosong berikutnya otomatis dikunci jika ada meja aktif yang belum penuh.
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
                    <span style={{ fontWeight: 600, color: '#183629' }}>Pilihan Anda (Dipilih)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#DCF1E3', border: '1.5px solid #004F27' }} />
                    <span>Kursi Anda (Lunas)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#DCFCE7', border: '1px dashed #16A34A' }} />
                    <span>Tersedia (Kosong)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }} />
                    <span>Terisi Pemain Lain</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#FEF3C7', border: '1px dashed #F59E0B' }} />
                    <span>Terkunci Regulasi</span>
                  </div>
                </div>

                {/* Banner Jika Pengguna Sudah Memiliki Kursi Terkonfirmasi */}
                {userActiveBooking && (
                  <div style={{
                    backgroundColor: '#DCF1E3',
                    border: '1.5px solid #86EFAC',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(0, 79, 39, 0.08)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CheckCircle size={22} color="#004F27" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#004F27' }}>
                          Anda Sudah Terdaftar di Sesi Ini
                        </div>
                        <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                          Kursi Anda: <strong>{userActiveBooking.tableName} — {userActiveBooking.seatKanji} {userActiveBooking.seatName}</strong>. Setiap pemain hanya dapat memesan 1 kursi per sesi.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewTab('riwayat')}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#004F27',
                        color: '#FAF8F5',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Buka E-Tiket
                    </button>
                  </div>
                )}

                {/* The Tables Grid (Realtime dari Database) */}
                {loadingTables ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#5A675E' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>Memuat status meja dan kursi dari server...</p>
                  </div>
                ) : tables.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#78807B' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Belum ada meja yang terdaftar untuk venue ini.</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '20px'
                  }}>
                    {tables.map((table) => {
                      const isSelectedTable = selectedTableId === table.id;
                      const isLocked = !!table.isLocked;

                      const isUserSeat = (pos: WindPosition) => {
                        if (!user) return false;
                        const s = table.seats[pos];
                        if (s.status !== 'taken') return false;
                        if (s.userId && s.userId === user.id) return true;
                        if (s.playerId && (s.playerId === (user as any).player_id || s.playerId === (user as any).player?.id)) return true;
                        const userNameLower = (user.nama || (user as any).name || '').toLowerCase().trim();
                        const occLower = (s.occupant || '').toLowerCase().trim();
                        return Boolean(userNameLower && occLower && userNameLower === occLower);
                      };

                      return (
                        <div
                          key={`table-arena-${table.id}`}
                          onClick={() => {
                            if (isLocked) {
                              showAlertModal(
                                table.lockReason || 'Terkunci: Silakan pilih meja nomor awal yang tersedia terlebih dahulu.',
                                'Regulasi Meja MahjongYuks',
                                'Sesuai regulasi MahjongYuks, meja baru baru dapat dibuka setelah meja yang sedang terisi sebagian terisi penuh 4 pemain.'
                              );
                            }
                          }}
                          style={{
                            backgroundColor: isLocked ? '#F9FAFB' : (isSelectedTable ? '#FCFDFC' : '#FFFFFF'),
                            borderRadius: '12px',
                            border: isLocked
                              ? '1px dashed #D1D5DB'
                              : isSelectedTable
                              ? '2px solid #183629'
                              : '1px solid #E4E0D8',
                            padding: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: isSelectedTable ? '0 4px 14px rgba(24, 54, 41, 0.12)' : 'none',
                            opacity: isLocked ? 0.72 : 1,
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            cursor: isLocked ? 'not-allowed' : 'default',
                          }}
                        >
                          {/* Table Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: isLocked ? '#6B7280' : '#183629' }}>
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
                              backgroundColor: isLocked
                                ? '#FEF3C7'
                                : table.status === 'penuh'
                                ? '#FEE2E2'
                                : table.status === 'terisi_sebagian'
                                ? '#DCFCE7'
                                : isSelectedTable
                                ? '#183629'
                                : '#E5E7EB',
                              color: isLocked
                                ? '#B45309'
                                : table.status === 'penuh'
                                ? '#B91C1C'
                                : table.status === 'terisi_sebagian'
                                ? '#15803D'
                                : isSelectedTable
                                ? '#FFFFFF'
                                : '#374151',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}>
                              {isLocked && <Lock size={11} />}
                              {isLocked ? 'Terkunci' : isSelectedTable ? 'Pilihan Aktif' : table.statusLabel}
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
                            backgroundColor: isLocked ? '#F3F4F6' : '#F8FAF9',
                            borderRadius: '10px'
                          }}>
                            {/* TOP: PEI (North) */}
                            <div style={{ gridColumn: '2', gridRow: '1', display: 'flex', justifyContent: 'center' }}>
                              <SeatButton
                                seat={table.seats.pei}
                                isSelected={isSelectedTable && selectedSeat === 'pei'}
                                isTableLocked={isLocked}
                                isUserSeat={isUserSeat('pei')}
                                onClick={() => handleSelectSeat(table.id, 'pei')}
                              />
                            </div>

                            {/* LEFT: SHA (West) */}
                            <div style={{ gridColumn: '1', gridRow: '2', display: 'flex', justifyContent: 'center' }}>
                              <SeatButton
                                seat={table.seats.sha}
                                isSelected={isSelectedTable && selectedSeat === 'sha'}
                                isTableLocked={isLocked}
                                isUserSeat={isUserSeat('sha')}
                                onClick={() => handleSelectSeat(table.id, 'sha')}
                              />
                            </div>

                            {/* CENTER TABLE BLOCK */}
                            <div style={{
                              gridColumn: '2',
                              gridRow: '2',
                              backgroundColor: isLocked
                                ? '#E5E7EB'
                                : isSelectedTable
                                ? '#183629'
                                : table.status === 'penuh'
                                ? '#E2E8F0'
                                : '#E8F3EB',
                              color: isLocked
                                ? '#9CA3AF'
                                : isSelectedTable
                                ? '#FAF8F5'
                                : table.status === 'penuh'
                                ? '#64748B'
                                : '#004F27',
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
                                {isLocked ? 'KUNCI' : table.centerSub}
                              </div>
                            </div>

                            {/* RIGHT: TON (East) */}
                            <div style={{ gridColumn: '3', gridRow: '2', display: 'flex', justifyContent: 'center' }}>
                              <SeatButton
                                seat={table.seats.ton}
                                isSelected={isSelectedTable && selectedSeat === 'ton'}
                                isTableLocked={isLocked}
                                isUserSeat={isUserSeat('ton')}
                                onClick={() => handleSelectSeat(table.id, 'ton')}
                              />
                            </div>

                            {/* BOTTOM: NAN (South) */}
                            <div style={{ gridColumn: '2', gridRow: '3', display: 'flex', justifyContent: 'center' }}>
                              <SeatButton
                                seat={table.seats.nan}
                                isSelected={isSelectedTable && selectedSeat === 'nan'}
                                isTableLocked={isLocked}
                                isUserSeat={isUserSeat('nan')}
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
                            {isLocked ? (
                              <span style={{ color: '#B45309', fontWeight: 700, fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <Lock size={12} strokeWidth={2.4} /> Penuhi Meja Terisi Sebelumnya
                              </span>
                            ) : isSelectedTable && selectedSeat ? (
                              <span style={{ color: '#004F27', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <Check size={13} strokeWidth={2.5} /> Terpilih: {WIND_DETAILS[selectedSeat].name}
                              </span>
                            ) : table.status === 'penuh' ? (
                              <span>Sesi meja terisi penuh (4 pemain)</span>
                            ) : table.status === 'terisi_sebagian' ? (
                              <span style={{ color: '#15803D', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <Flame size={12} strokeWidth={2.4} /> {table.statusLabel}
                              </span>
                            ) : (
                              <span>Kursi mata angin tersedia (Kosong)</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

                {isScheduledPortal ? (
                  <div style={{
                    backgroundColor: '#F8FAF9',
                    borderRadius: '10px',
                    padding: '18px 20px',
                    border: '1px solid #D1E5D9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          backgroundColor: '#DCF1E3',
                          color: '#004F27',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckCircle size={22} />
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#004F27', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Jadwal &amp; Jam Sesi Terkunci
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#183629', marginTop: '2px' }}>
                            {selectedDate} • {sessionTimeString}
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#5A675E', marginTop: '2px' }}>
                            Durasi resmi {durationHours} Jam Permainan Hong Kong Mahjong Style
                          </div>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        backgroundColor: '#DCF1E3',
                        color: '#004F27',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #BBF7D0'
                      }}>
                        Tarif Paket: Rp {packagePrice.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div style={{
                      padding: '12px 14px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                      color: '#475569',
                      lineHeight: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
                      <span>
                        Jadwal dan tarif sesi ini telah ditetapkan oleh pihak Game House/Penyelenggara. <strong>Anda tetap memiliki hak penuh memilih nomor meja dan posisi kursi mata angin (东・南・西・北)</strong> pada denah meja di atas.
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
                    <span style={{ color: '#5A675E' }}>Tipe Sesi:</span>
                    <span style={{ fontWeight: 700, color: '#183629', textAlign: 'right' }}>
                      {isScheduledPortal ? scheduleTitle : `${mode} (Reguler Per-Jam)`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: '#5A675E' }}>Format Aturan:</span>
                    <span style={{ fontWeight: 700, color: '#183629' }}>Hong Kong Style</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: '#5A675E' }}>Venue:</span>
                    <span style={{ fontWeight: 600, color: '#183629', textAlign: 'right' }}>
                      {venueParam || selectedVenue?.nama_venue || 'Game House Sedayu City'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: '#5A675E' }}>Meja Terpilih:</span>
                    <span style={{ fontWeight: 700, color: '#183629' }}>{selectedTable?.nomor || '-'}</span>
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
                      {selectedWindInfo ? `${selectedWindInfo.kanji} ${selectedWindInfo.name}` : '-'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: '#5A675E' }}>Jadwal Main:</span>
                    <span style={{ fontWeight: 600, color: '#183629', textAlign: 'right' }}>
                      {selectedDate} | {isScheduledPortal ? sessionTimeString : `${selectedTime} WIB`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: '#5A675E' }}>Durasi:</span>
                    <span style={{ fontWeight: 700, color: '#183629' }}>{durationHours} Jam Bermain</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                {isScheduledPortal ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#5A675E' }}>Biaya Kursi Sesi ({portalParam === 'event' ? 'Event' : 'Game House'})</span>
                      <span style={{ fontWeight: 700, color: '#183629' }}>Rp {packagePrice.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#5A675E' }}>Standar Tarif:</span>
                      <span style={{ fontWeight: 700, color: '#059669', fontSize: '12px' }}>Tarif Khusus {portalParam === 'event' ? 'Event' : 'Terjadwal'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#5A675E' }}>Biaya Layanan &amp; Pemeliharaan</span>
                      <span style={{ fontWeight: 700, color: '#059669', fontSize: '12px' }}>Termasuk (Rp 0)</span>
                    </div>
                  </div>
                ) : (
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
                )}

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
                {userActiveBooking ? (
                  <button
                    type="button"
                    onClick={() => setViewTab('riwayat')}
                    style={{
                      width: '100%',
                      backgroundColor: '#004F27',
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
                      boxShadow: '0 4px 14px rgba(0, 79, 39, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <CheckCircle size={16} />
                    <span>Anda Sudah Terdaftar (Buka E-Tiket)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleInitiatePayment}
                    disabled={isProcessing}
                    style={{
                      width: '100%',
                      backgroundColor: isProcessing ? '#94A3B8' : '#183629',
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
                      boxShadow: '0 4px 14px rgba(24, 54, 41, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{isProcessing ? 'Memproses Transaksi...' : 'Kunci Kursi & Lanjut Bayar'}</span>
                    <ArrowRight size={16} />
                  </button>
                )}

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
            {/* Unified History List (Meja & Event Bersatu, Diurutkan Terbaru Paling Atas) */}
            {filteredHistory.map((item, idx) => {
              if (item.kind === 'meja') {
                const b = item.data;
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
              }

              if (item.kind === 'event') {
                const reg = item.data;
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
              }

              return null;
            })}

            {/* Empty state if nothing */}
            {filteredHistory.length === 0 && !loadingRiwayat && (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px dashed #CBD5E1',
                padding: '48px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  color: '#183629'
                }}>
                  <CalendarX2 size={28} strokeWidth={1.8} />
                </div>
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
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="Tutup modal pembayaran"
              >
                <X size={20} />
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
                <div style={{ fontSize: '12px', color: '#5A675E' }}>
                  {isScheduledPortal
                    ? `Total Tagihan Tiket Kursi (${scheduleTitle})`
                    : `Total Tagihan Sesi (${durationHours} Jam Bermain)`}
                </div>
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
          MODAL 2: E-TIKET RESMI & CHECK-IN (RF-05) - Compact & Anti-Cutoff
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
          padding: '16px',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '430px',
            width: '100%',
            maxHeight: 'calc(100vh - 32px)',
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            border: '2px solid #183629'
          }}>
            {/* Ticket Header */}
            <div style={{
              backgroundColor: '#183629',
              color: '#FAF8F5',
              padding: '14px 18px',
              textAlign: 'center',
              position: 'relative',
              flexShrink: 0
            }}>
              <span style={{
                backgroundColor: '#DCF1E3',
                color: '#004F27',
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '4px'
              }}>
                LUNAS &amp; SIAP CHECK-IN
              </span>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '17px', fontWeight: 900 }}>
                E-Tiket Reservasi Meja
              </h3>
              <div style={{ fontSize: '11px', color: '#A3E6B4' }}>
                Tunjukkan QR Code ini ke petugas meja di Game House Sedayu City
              </div>
            </div>

            {/* Ticket Body */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: '1 1 auto' }}>
              {/* QR Code Card */}
              <div style={{
                textAlign: 'center',
                backgroundColor: '#F8FAF9',
                borderRadius: '10px',
                padding: '12px 14px',
                border: '1px solid #EBF1ED',
                marginBottom: '12px'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '8px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <QrCode size={96} color="#183629" />
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 900, color: '#183629', letterSpacing: '0.8px', marginTop: '6px' }}>
                  {confirmedData.id}
                </div>
                <div style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Check size={11} strokeWidth={2.5} /> Terdaftar di Meja Otomatis Game House
                </div>
              </div>

              {/* Table & Seat Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '14px',
                fontSize: '12px'
              }}>
                <div style={{ backgroundColor: '#F8FAF9', padding: '8px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748B' }}>Meja Terpilih:</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#183629', marginTop: '2px' }}>
                    {confirmedData.table}
                  </div>
                </div>

                <div style={{ backgroundColor: '#EBF6EE', padding: '8px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10.5px', color: '#004F27' }}>Alokasi Kursi:</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#004F27', marginTop: '2px' }}>
                    {confirmedData.seatKanji} {confirmedData.seatName}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAF9', padding: '8px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748B' }}>Nama Pemain:</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#183629', marginTop: '2px' }}>
                    {confirmedData.playerName}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAF9', padding: '8px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748B' }}>Durasi Bermain:</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#183629', marginTop: '2px' }}>
                    {confirmedData.duration} Jam ({confirmedData.price})
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
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
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
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
                    padding: '10px 16px',
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    borderRadius: '8px',
                    fontSize: '12.5px',
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

      {/* =========================================================================
          MODAL KONFIRMASI & KUNCI KURSI SEBELUM PEMBAYARAN
         ========================================================================= */}
      {isConfirmSeatOpen && selectedTableId && selectedSeat && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '2px solid #183629',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#183629',
              color: '#FAF8F5',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Lock size={18} color="#86EFAC" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#FAF8F5' }}>
                    Konfirmasi &amp; Kunci Kursi Anda
                  </h3>
                  <div style={{ fontSize: '11px', color: '#A3E6B4' }}>
                    Pastikan pilihan kursi sudah sesuai sebelum pembayaran
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmSeatOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#C5D2CB',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '22px 24px' }}>
              {/* Highlight Pilihan Kursi */}
              <div style={{
                backgroundColor: '#F8FAF9',
                borderRadius: '12px',
                padding: '16px',
                border: '1.5px solid #EBF1ED',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Posisi Kursi Dipilih:</span>
                  <span style={{
                    backgroundColor: '#183629',
                    color: '#FFFFFF',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '15px' }}>{WIND_DETAILS[selectedSeat]?.kanji}</span>
                    <span>{WIND_DETAILS[selectedSeat]?.name}</span>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Meja Permainan:</span>
                  <span style={{ fontWeight: 700, color: '#183629' }}>
                    {tables.find((t) => t.id === selectedTableId)?.nomor || 'Meja Terpilih'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Sesi / Jadwal:</span>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>
                    {selectedDate} • {isScheduledPortal ? sessionTimeString : `${selectedTime} WIB`}
                  </span>
                </div>

                <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#004F27', fontWeight: 700, fontSize: '13px' }}>Total Biaya Kursi:</span>
                  <span style={{ fontWeight: 900, color: '#004F27', fontSize: '18px' }}>
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Notice text */}
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12px',
                color: '#1E40AF',
                lineHeight: 1.5,
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                marginBottom: '20px'
              }}>
                <ShieldCheck size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Setelah menekan <strong>Kunci Kursi &amp; Bayar</strong>, kursi ini akan dikunci dan transaksi siap diselesaikan.
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsConfirmSeatOpen(false)}
                  style={{
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    padding: '11px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: '1px solid #CBD5E1',
                    cursor: 'pointer'
                  }}
                >
                  Ganti Kursi
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleProceedPayment}
                  style={{
                    backgroundColor: isProcessing ? '#94A3B8' : '#183629',
                    color: '#FAF8F5',
                    padding: '11px 22px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 800,
                    border: 'none',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(24, 54, 41, 0.25)'
                  }}
                >
                  <Lock size={14} />
                  <span>{isProcessing ? 'Memproses...' : 'Kunci Kursi & Lanjut Bayar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          IN-APP REGULATION & ALERT MODAL (Replaces ugly browser window.alert)
         ========================================================================= */}
      {noticeDialog.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#183629',
              color: '#FAF8F5',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Lock size={16} color="#86EFAC" />
                </div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#FAF8F5' }}>
                  {noticeDialog.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNoticeDialog({ ...noticeDialog, isOpen: false })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#C5D2CB',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '22px 24px' }}>
              <div style={{
                fontSize: '14.5px',
                fontWeight: 700,
                color: '#111E18',
                lineHeight: 1.5,
                marginBottom: '10px'
              }}>
                {noticeDialog.message}
              </div>

              {noticeDialog.subtext && (
                <div style={{
                  fontSize: '12.5px',
                  color: '#475569',
                  lineHeight: 1.55,
                  backgroundColor: '#F8FAF9',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  marginTop: '12px'
                }}>
                  {noticeDialog.subtext}
                </div>
              )}

              <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setNoticeDialog({ ...noticeDialog, isOpen: false })}
                  style={{
                    backgroundColor: '#183629',
                    color: '#FAF8F5',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  Mengerti &amp; Lanjutkan
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
  isTableLocked,
  isUserSeat,
  onClick,
}: {
  seat: SeatInfo;
  isSelected: boolean;
  isTableLocked?: boolean;
  isUserSeat?: boolean;
  onClick: () => void;
}) {
  const isTaken = seat.status === 'taken';
  const isDisabled = isTaken || isTableLocked || isUserSeat;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      style={{
        width: '56px',
        height: '42px',
        borderRadius: '6px',
        border: isSelected
          ? '2px solid #183629'
          : isUserSeat
          ? '2px solid #004F27'
          : isTaken
          ? '1px solid #FECACA'
          : isTableLocked
          ? '1px dashed #D1D5DB'
          : '1px dashed #16A34A',
        backgroundColor: isSelected
          ? '#183629'
          : isUserSeat
          ? '#DCF1E3'
          : isTaken
          ? '#FEE2E2'
          : isTableLocked
          ? '#F3F4F6'
          : '#DCFCE7',
        color: isSelected
          ? '#FAF8F5'
          : isUserSeat
          ? '#004F27'
          : isTaken
          ? '#B91C1C'
          : isTableLocked
          ? '#9CA3AF'
          : '#15803D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        boxShadow: isSelected ? '0 2px 8px rgba(24, 54, 41, 0.3)' : 'none',
        transition: 'all 0.15s ease'
      }}
      title={isUserSeat ? `Kursi ${seat.direction} telah Anda pesan` : isTaken ? `Kursi ${seat.direction} terisi oleh ${seat.occupant}` : isTableLocked ? 'Meja ini terkunci regulasi' : `Pilih Kursi ${seat.direction}`}
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
        {isSelected ? 'Dipilih' : isUserSeat ? 'Anda' : isTaken ? seat.occupant : isTableLocked ? 'Kunci' : 'Pilih'}
      </div>
    </button>
  );
}

export default function PemesananPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '80px 20px', textAlign: 'center', color: '#183629', fontWeight: 700, fontSize: '15px' }}>
          Memuat Portal Pemesanan MahjongYuks...
        </div>
      }
    >
      <PemesananContent />
    </Suspense>
  );
}
