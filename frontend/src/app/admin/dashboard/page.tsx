'use client';

import '@/app/admin/admin.css';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AdminEventManager from '@/components/admin/AdminEventManager';
import AdminVenueManager from '@/components/admin/AdminVenueManager';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ApiClient, { ApiEvent, ApiVenue } from '@/lib/api';
import { LEADERBOARD_PLAYERS } from '@/lib/mock-data';
import {
  ShieldCheck,
  Calendar,
  Building,
  CreditCard,
  Ticket,
  Award,
  User as UserIcon,
  Search,
  ChevronDown,
  Check,
  LogOut,
  FileText,
  X,
  Menu,
  RotateCcw,
  Plus,
  Eye,
  CheckCircle2,
  ExternalLink,
  Layers,
  MapPin,
  Clock,
  Save,
  Phone,
  Mail,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

interface Transaction {
  id: string;
  code: string;
  playerName: string;
  playerId: string;
  eventName: string;
  amount: string;
  paymentMethod: string;
  time: string;
  proofType: string;
  isProofBlur?: boolean;
  status: 'pending' | 'success' | 'rejected';
  statusLabel: string;
}

interface Booking {
  id: string;
  code: string;
  playerName: string;
  playerId: string;
  phone: string;
  eventName: string;
  venueName: string;
  tableNumber: string;
  seatName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  statusLabel: string;
  amount: string;
}

type AdminTab = 'overview' | 'event' | 'venue' | 'pemesanan' | 'pembayaran' | 'skor' | 'profil';

function formatIndonesianEventDate(dateStr?: string | null, fallbackFormatted?: string | null): string {
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const dayName = dayNames[d.getDay()];
        const dateNum = d.getDate();
        const monthName = monthNames[d.getMonth()];
        const yearNum = d.getFullYear();
        return `${dayName}, ${dateNum} ${monthName} ${yearNum}`;
      }
    } catch {
      // ignore
    }
  }
  if (fallbackFormatted) {
    let s = fallbackFormatted;
    const dayMap: Record<string, string> = {
      Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu', Thursday: 'Kamis',
      Friday: 'Jumat', Saturday: 'Sabtu', Sunday: 'Minggu'
    };
    const monthMap: Record<string, string> = {
      January: 'Januari', February: 'Februari', March: 'Maret', April: 'April',
      May: 'Mei', June: 'Juni', July: 'Juli', August: 'Agustus',
      September: 'September', October: 'Oktober', November: 'November', December: 'Desember'
    };
    for (const [en, id] of Object.entries(dayMap)) {
      s = s.replace(new RegExp(`\\b${en}\\b`, 'gi'), id);
    }
    for (const [en, id] of Object.entries(monthMap)) {
      s = s.replace(new RegExp(`\\b${en}\\b`, 'gi'), id);
    }
    return s;
  }
  return 'Jadwal Menyusul';
}

function mapEventStatus(status?: string, fallbackLabel?: string): { label: string; badgeClass: string } {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'aktif' || s === 'open') {
    return { label: 'Aktif', badgeClass: 'adm-badge-active' };
  }
  if (s === 'completed' || s === 'finished' || s === 'selesai') {
    return { label: 'Selesai', badgeClass: 'adm-badge-finished' };
  }
  if (s === 'draft') {
    return { label: 'Draft', badgeClass: 'adm-badge-upcoming' };
  }
  if (s === 'cancelled' || s === 'dibatalkan') {
    return { label: 'Dibatalkan', badgeClass: 'adm-badge-cancelled' };
  }
  return { label: fallbackLabel || status || 'Aktif', badgeClass: 'adm-badge-active' };
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();

  // Active module tab synced with search param 'tab'
  const tabParam = searchParams.get('tab') as AdminTab | null;
  const [activeTab, setActiveTab] = useState<AdminTab>(
    tabParam && ['overview', 'event', 'venue', 'pemesanan', 'pembayaran', 'skor', 'profil'].includes(tabParam)
      ? tabParam
      : 'overview'
  );

  useEffect(() => {
    if (tabParam && ['overview', 'event', 'venue', 'pemesanan', 'pembayaran', 'skor', 'profil'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('overview');
    }
  }, [tabParam]);

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      router.push('/admin/dashboard');
    } else {
      router.push(`/admin/dashboard?tab=${tab}`);
    }
  };

  // Header Dropdown & Mobile Drawer states
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real data counts from API
  const [realEvents, setRealEvents] = useState<ApiEvent[]>([]);
  const [realVenues, setRealVenues] = useState<ApiVenue[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!adminDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.adm-admin-pill-wrap')) {
        setAdminDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [adminDropdownOpen]);

  // Fetch real events & venues from backend API
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [eventsRes, venuesRes] = await Promise.all([
        ApiClient.getEvents(),
        ApiClient.getVenues()
      ]);
      if (eventsRes.success && eventsRes.data) {
        setRealEvents(eventsRes.data);
      }
      if (venuesRes.success && venuesRes.data) {
        setRealVenues(venuesRes.data);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // ── 1. TRANSACTIONS & PEMBAYARAN DATA (Preserved) ──
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-1',
      code: '#MJK-8821',
      playerName: 'Kevin Sanjaya',
      playerId: 'MJY-9201',
      eventName: 'Grand Riichi Jakarta Open 2025',
      amount: 'Rp 155.000',
      paymentMethod: 'QRIS BCA AUTO-MATCH',
      time: '24 Okt. 10:15 WIB',
      proofType: 'Lihat Bukti Bayar',
      status: 'pending',
      statusLabel: 'Menunggu Verifikasi'
    },
    {
      id: 'tx-2',
      code: '#MJK-8820',
      playerName: 'Rian Hidayat',
      playerId: 'MJY-1102',
      eventName: 'Friday Casual Gathering & Dimsum',
      amount: 'Rp 95.000',
      paymentMethod: 'MANDIRI VIRTUAL ACC',
      time: '24 Okt. 09:40 WIB',
      proofType: 'Terverifikasi Auto-Bot',
      status: 'success',
      statusLabel: 'Berhasil (Terverifikasi)'
    },
    {
      id: 'tx-3',
      code: '#MJK-8819',
      playerName: 'Jessica Lim',
      playerId: 'MJY-7489',
      eventName: 'Sunday Riichi Bootcamp: Suji & Kabe',
      amount: 'Rp 75.000',
      paymentMethod: 'TRANSFER BANK BCA',
      time: '24 Okt. 08:12 WIB',
      proofType: 'Struk mutasi buram',
      isProofBlur: true,
      status: 'rejected',
      statusLabel: 'Ditolak (Bukti Tidak Sesuai)'
    }
  ]);

  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'success' | 'rejected'>('all');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState<Transaction | null>(null);

  const handleVerifyTransaction = (id: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'success',
          statusLabel: 'Berhasil (Terverifikasi)'
        };
      }
      return t;
    }));
    showToast('Pembayaran berhasil diverifikasi! Tiket otomatis diterbitkan.');
    if (showReceiptModal) setShowReceiptModal(null);
  };

  const handleRejectTransaction = (id: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'rejected',
          statusLabel: 'Ditolak (Bukti Tidak Sesuai)'
        };
      }
      return t;
    }));
    showToast('Transaksi ditolak. Notifikasi perbaikan dikirim ke pemain.');
    if (showReceiptModal) setShowReceiptModal(null);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (paymentFilter === 'pending' && t.status !== 'pending') return false;
      if (paymentFilter === 'success' && t.status !== 'success') return false;
      if (paymentFilter === 'rejected' && t.status !== 'rejected') return false;
      if (paymentSearch) {
        const q = paymentSearch.toLowerCase();
        return (
          t.code.toLowerCase().includes(q) ||
          t.playerName.toLowerCase().includes(q) ||
          t.eventName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, paymentFilter, paymentSearch]);

  // ── 2. BOOKINGS & PEMESANAN DATA ──
  const [bookings] = useState<Booking[]>([
    {
      id: 'bk-1',
      code: '#MJK-8821',
      playerName: 'Kevin Sanjaya',
      playerId: 'MJY-9201',
      phone: '081234567890',
      eventName: 'Grand Riichi Jakarta Open 2025',
      venueName: 'Game House',
      tableNumber: 'Meja 03 (Amos Rexx III)',
      seatName: 'Kursi Selatan (Nan)',
      date: '25 Okt 2025',
      time: '19:00 - 22:00 WIB',
      status: 'confirmed',
      statusLabel: 'Terkonfirmasi',
      amount: 'Rp 155.000'
    },
    {
      id: 'bk-2',
      code: '#MJK-8820',
      playerName: 'Rian Hidayat',
      playerId: 'MJY-1102',
      phone: '081398765432',
      eventName: 'Friday Casual Gathering & Dimsum',
      venueName: 'Game House',
      tableNumber: 'Meja 01 (Otoma-Lite)',
      seatName: 'Kursi Timur (Ton)',
      date: '24 Okt 2025',
      time: '19:00 - 23:00 WIB',
      status: 'confirmed',
      statusLabel: 'Terkonfirmasi',
      amount: 'Rp 95.000'
    },
    {
      id: 'bk-3',
      code: '#MJK-8819',
      playerName: 'Jessica Lim',
      playerId: 'MJY-7489',
      phone: '081122334455',
      eventName: 'Sunday Riichi Bootcamp: Suji & Kabe',
      venueName: 'Game House',
      tableNumber: 'Meja 02 (Rexx II)',
      seatName: 'Kursi Barat (Shaa)',
      date: '26 Okt 2025',
      time: '10:00 - 15:00 WIB',
      status: 'pending',
      statusLabel: 'Menunggu Verifikasi',
      amount: 'Rp 75.000'
    }
  ]);

  const [bookingFilter, setBookingFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [selectedBookingModal, setSelectedBookingModal] = useState<Booking | null>(null);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (bookingFilter === 'confirmed' && b.status !== 'confirmed') return false;
      if (bookingFilter === 'pending' && b.status !== 'pending') return false;
      if (bookingFilter === 'cancelled' && b.status !== 'cancelled') return false;
      if (bookingSearch) {
        const q = bookingSearch.toLowerCase();
        return (
          b.code.toLowerCase().includes(q) ||
          b.playerName.toLowerCase().includes(q) ||
          b.eventName.toLowerCase().includes(q) ||
          b.venueName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, bookingFilter, bookingSearch]);

  // ── 3. SKOR & LEADERBOARD DATA (Real API Integration) ──
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedRank, setSelectedRank] = useState('1');
  const [umaScore, setUmaScore] = useState('');
  const [wasitNotes, setWasitNotes] = useState('');
  const [liveLeaderboard, setLiveLeaderboard] = useState<any[]>([]);
  const [livePlayers, setLivePlayers] = useState<any[]>([]);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  // Load players list + leaderboard for Desk Wasit tab
  useEffect(() => {
    async function loadSkorData() {
      try {
        const [playersRes, lbRes] = await Promise.all([
          ApiClient.getPlayersList(),
          ApiClient.getLeaderboard({ limit: 10 }),
        ]);
        if (playersRes.success && playersRes.data) setLivePlayers(playersRes.data);
        if (lbRes.success && lbRes.data) setLiveLeaderboard(lbRes.data);
      } catch {
        // Gagal load data skor, gunakan fallback
      }
    }
    loadSkorData();
  }, []);

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !umaScore) {
      showToast('Pilih pemain dan isi skor Uma/Oka terlebih dahulu.');
      return;
    }
    setIsSubmittingScore(true);
    try {
      const res = await ApiClient.recordScore({
        player_id: Number(selectedPlayerId),
        skor: parseFloat(umaScore),
        peringkat: Number(selectedRank),
        event_id: selectedEventId || undefined,
        catatan_wasit: wasitNotes,
      });
      if (res.success) {
        showToast('Skor berhasil divalidasi dan disinkronkan ke Leaderboard!');
        setUmaScore('');
        setWasitNotes('');
        setSelectedPlayerId('');
        // Refresh leaderboard setelah input skor
        const lb = await ApiClient.getLeaderboard({ limit: 10 });
        if (lb.success && lb.data) setLiveLeaderboard(lb.data);
      } else {
        showToast(res.message || 'Gagal menyimpan skor ke database.');
      }
    } catch {
      showToast('Error: Tidak dapat terhubung ke server. Pastikan backend aktif.');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const [isResettingScore, setIsResettingScore] = useState(false);

  const handleResetLeaderboard = async () => {
    if (!confirm('Apakah Anda yakin ingin me-reset seluruh poin atlet menjadi 0? Tindakan ini akan mengosongkan riwayat skor.')) {
      return;
    }
    setIsResettingScore(true);
    try {
      const res = await ApiClient.resetLeaderboardScores();
      if (res.success) {
        showToast('Seluruh poin atlet berhasil di-reset menjadi 0.');
        const lb = await ApiClient.getLeaderboard({ limit: 10 });
        if (lb.success && lb.data) setLiveLeaderboard(lb.data);
      } else {
        showToast(res.message || 'Gagal me-reset poin.');
      }
    } catch {
      showToast('Error koneksi ke server saat me-reset poin.');
    } finally {
      setIsResettingScore(false);
    }
  };

  // ── 4. PROFIL ADMIN STATE ──
  const [adminName, setAdminName] = useState(user?.nama || 'Staf Operasional Sedayu');
  const [adminEmail, setAdminEmail] = useState(user?.email || 'admin.sedayu@mahjongyuks.id');
  const [adminPhone, setAdminPhone] = useState(user?.no_telepon || '081987654321');
  const adminHandle = user?.handle || 'ADM-JKT-042';
  const adminInitial = adminName.substring(0, 2).toUpperCase();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profil Administrator berhasil diperbarui.');
  };

  // Real stats counts
  const activeEventsCount = realEvents.filter(e => e.status === 'active').length;
  const finishedEventsCount = realEvents.filter(e => e.status === 'selesai' || e.status === 'finished').length;
  const totalMejaCount = realVenues.reduce((acc, v) => acc + (Number(v.jumlah_meja) || 0), 0);
  const pendingTxCount = transactions.filter(t => t.status === 'pending').length;
  const successTxCount = transactions.filter(t => t.status === 'success').length;
  const confirmedBookingCount = bookings.filter(b => b.status === 'confirmed').length;

  return (
    <div className="adm-root">

      {/* ── 1. TOP HORIZONTAL NAVIGATION HEADER (NO LEFT SIDEBAR) ── */}
      <header className="adm-header">
        <div className="adm-container">
          <div className="adm-header-inner">
            
            {/* Left: Brand Logo & Title */}
            <div className="adm-header-left">
              <Link href="/admin/dashboard" onClick={() => switchTab('overview')} className="adm-brand" title="Mahjongyuks Administrator">
                <Image
                  src="/assets/mahjongyuks_logo.png"
                  alt="Mahjongyuks Logo"
                  width={50}
                  height={36}
                  priority
                  className="adm-brand-logo"
                />
                <div>
                  <div className="adm-brand-title">Mahjongyuks</div>
                  <div className="adm-brand-badge">Mode Admin</div>
                </div>
              </Link>
            </div>

            {/* Center: 7 Horizontal Navigation Menus */}
            <nav className="adm-header-nav" aria-label="Menu Navigasi Administrator">
              <button
                type="button"
                onClick={() => switchTab('overview')}
                className={`adm-nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              >
                <Layers size={15} />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => switchTab('event')}
                className={`adm-nav-link ${activeTab === 'event' ? 'active' : ''}`}
              >
                <Calendar size={15} />
                <span>Kelola Event</span>
                {realEvents.length > 0 && <span className="adm-nav-badge">{realEvents.length}</span>}
              </button>

              <button
                type="button"
                onClick={() => switchTab('venue')}
                className={`adm-nav-link ${activeTab === 'venue' ? 'active' : ''}`}
              >
                <Building size={15} />
                <span>Kelola Venue</span>
                {realVenues.length > 0 && <span className="adm-nav-badge">{realVenues.length}</span>}
              </button>

              <button
                type="button"
                onClick={() => switchTab('pemesanan')}
                className={`adm-nav-link ${activeTab === 'pemesanan' ? 'active' : ''}`}
              >
                <Ticket size={15} />
                <span>Kelola Pemesanan</span>
                <span className="adm-nav-badge">{bookings.length}</span>
              </button>

              <button
                type="button"
                onClick={() => switchTab('pembayaran')}
                className={`adm-nav-link ${activeTab === 'pembayaran' ? 'active' : ''}`}
              >
                <CreditCard size={15} />
                <span>Kelola Pembayaran</span>
                {pendingTxCount > 0 && (
                  <span className="adm-nav-badge" style={{ backgroundColor: '#D97706' }}>
                    {pendingTxCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => switchTab('skor')}
                className={`adm-nav-link ${activeTab === 'skor' ? 'active' : ''}`}
              >
                <Award size={15} />
                <span>Kelola Skor</span>
              </button>
            </nav>

            {/* Right: Mode Switcher & Admin Dropdown */}
            <div className="adm-header-right">
              
              <Link
                href="/dashboard"
                className="adm-mode-btn"
                title="Beralih ke Dashboard Pemain"
              >
                <ExternalLink size={13} color="#E2BC55" />
                <span>Mode Pemain</span>
              </Link>

              <div className="adm-admin-pill-wrap" style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className="adm-admin-pill"
                  aria-expanded={adminDropdownOpen}
                  aria-haspopup="true"
                  title="Menu Profil Akun"
                >
                  <div className="adm-admin-avatar">
                    {adminInitial}
                  </div>
                  <div className="adm-admin-info">
                    <span className="adm-admin-name">{adminName}</span>
                    <span className="adm-admin-role">Administrator</span>
                  </div>
                  <ChevronDown size={14} color="#C3D4CA" />
                </button>

                {adminDropdownOpen && (
                  <div className="adm-dropdown">
                    <div className="adm-dropdown-header">
                      <div className="adm-dropdown-user-name">{adminName}</div>
                      <div className="adm-dropdown-user-email">{adminEmail}</div>
                      <div style={{ marginTop: '6px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          backgroundColor: '#DCF1E3',
                          color: '#004F27',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          Peran: Admin Sistem
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAdminDropdownOpen(false);
                        switchTab('profil');
                      }}
                      className="adm-dropdown-item"
                    >
                      <UserIcon size={14} color="#004F27" />
                      <span>Buka Profil Admin</span>
                    </button>

                    <Link
                      href="/dashboard"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="adm-dropdown-item"
                    >
                      <ExternalLink size={14} color="#004F27" />
                      <span>Masuk Mode Pemain</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setAdminDropdownOpen(false);
                        logout();
                        router.push('/admin/login');
                      }}
                      className="adm-dropdown-item adm-dropdown-logout"
                    >
                      <LogOut size={14} />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                className="adm-mobile-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Buka navigasi menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>

            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="adm-mobile-drawer">
            {[
              { id: 'overview', label: 'Dashboard', icon: Layers },
              { id: 'event', label: 'Kelola Event', icon: Calendar, badge: realEvents.length },
              { id: 'venue', label: 'Kelola Venue', icon: Building, badge: realVenues.length },
              { id: 'pemesanan', label: 'Kelola Pemesanan', icon: Ticket, badge: bookings.length },
              { id: 'pembayaran', label: 'Kelola Pembayaran', icon: CreditCard, badge: pendingTxCount },
              { id: 'skor', label: 'Kelola Skor', icon: Award },
              { id: 'profil', label: 'Profil Admin', icon: UserIcon },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    switchTab(item.id as AdminTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`adm-nav-link ${activeTab === item.id ? 'active' : ''}`}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="adm-nav-badge">{item.badge}</span>
                  )}
                </button>
              );
            })}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '8px', paddingTop: '8px' }}>
              <Link
                href="/dashboard"
                className="adm-nav-link"
                style={{ justifyContent: 'flex-start' }}
              >
                <ExternalLink size={15} color="#E2BC55" />
                <span>Buka Dashboard Pemain</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push('/admin/login');
                }}
                className="adm-nav-link"
                style={{ justifyContent: 'flex-start', color: '#F87171' }}
              >
                <LogOut size={15} />
                <span>Keluar Akun Admin</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#183629',
          color: '#FAF8F5',
          border: '1px solid #E2BC55',
          padding: '12px 20px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'admFadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={18} color="#E2BC55" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 3. MAIN DASHBOARD CONTENT (Same edge-to-edge container as Dashboard Pemain) ── */}
      <main className="adm-page-content">
        <div className="adm-container">
          <div className="adm-content-stack">

            {/* ════ TAB 1: DASHBOARD OVERVIEW ════ */}
            {activeTab === 'overview' && (
              <div>
                
                {/* Header Section */}
                <div className="adm-page-header">
                  <div className="adm-page-title-wrap">
                    <div className="adm-page-badge">
                      <ShieldCheck size={14} color="#004F27" />
                      <span>PUSAT KONTROL ADMINISTRASI</span>
                    </div>
                    <h1 className="adm-page-title">Dashboard Administrator</h1>
                    <p className="adm-page-desc">
                      Ringkasan operasional turnamen, ketersediaan meja dan venue, pemesanan tiket, dan verifikasi pembayaran.
                    </p>
                  </div>

                  <div className="adm-header-actions">
                    <button
                      type="button"
                      onClick={() => switchTab('event')}
                      className="adm-btn-primary"
                    >
                      <Plus size={15} />
                      <span>Tambah Event</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => switchTab('venue')}
                      className="adm-btn-secondary"
                    >
                      <Building size={15} />
                      <span>Tambah Venue</span>
                    </button>

                    <button
                      type="button"
                      onClick={fetchStats}
                      className="adm-btn-refresh"
                      title="Sinkronkan data dengan sistem"
                    >
                      <RotateCcw size={14} className={loadingStats ? 'animate-spin' : ''} />
                      <span>{loadingStats ? 'Memuat...' : 'Segarkan'}</span>
                    </button>
                  </div>
                </div>

                {/* 4 Professional Stat Cards (Strictly Real Data, No Decorative Cards) */}
                <div className="adm-stat-grid">
                  
                  {/* Card 1: Total Event */}
                  <div className="adm-stat-card">
                    <div className="adm-stat-card-header">
                      <span className="adm-stat-label">Total Event</span>
                      <div className="adm-stat-icon-wrap">
                        <Calendar size={18} />
                      </div>
                    </div>
                    <div className="adm-stat-number">
                      {loadingStats ? '...' : realEvents.length}{' '}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Turnamen</span>
                    </div>
                    <div className="adm-stat-meta">
                      <span className="adm-stat-pill adm-stat-pill-green">
                        {loadingStats ? '-' : activeEventsCount} Aktif
                      </span>
                      <span style={{ color: '#7A897F' }}>•</span>
                      <span>{loadingStats ? '-' : finishedEventsCount} Selesai</span>
                    </div>
                  </div>

                  {/* Card 2: Total Venue */}
                  <div className="adm-stat-card">
                    <div className="adm-stat-card-header">
                      <span className="adm-stat-label">Total Venue</span>
                      <div className="adm-stat-icon-wrap">
                        <Building size={18} />
                      </div>
                    </div>
                    <div className="adm-stat-number">
                      {loadingStats ? '...' : realVenues.length}{' '}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Venue Aktif</span>
                    </div>
                    <div className="adm-stat-meta">
                      <span className="adm-stat-pill adm-stat-pill-green">
                        {loadingStats ? '-' : totalMejaCount} Meja Otomatis
                      </span>
                      <span style={{ color: '#7A897F' }}>•</span>
                      <span>Game House Sedayu City</span>
                    </div>
                  </div>

                  {/* Card 3: Total Pemesanan */}
                  <div className="adm-stat-card">
                    <div className="adm-stat-card-header">
                      <span className="adm-stat-label">Total Pemesanan</span>
                      <div className="adm-stat-icon-wrap">
                        <Ticket size={18} />
                      </div>
                    </div>
                    <div className="adm-stat-number">
                      {bookings.length}{' '}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Reservasi</span>
                    </div>
                    <div className="adm-stat-meta">
                      <span className="adm-stat-pill adm-stat-pill-green">
                        {confirmedBookingCount} Terkonfirmasi
                      </span>
                      <span style={{ color: '#7A897F' }}>•</span>
                      <span>{bookings.length - confirmedBookingCount} Menunggu</span>
                    </div>
                  </div>

                  {/* Card 4: Total Pembayaran */}
                  <div className="adm-stat-card">
                    <div className="adm-stat-card-header">
                      <span className="adm-stat-label">Total Pembayaran</span>
                      <div className="adm-stat-icon-wrap" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                        <CreditCard size={18} />
                      </div>
                    </div>
                    <div className="adm-stat-number">
                      {transactions.length}{' '}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Transaksi</span>
                    </div>
                    <div className="adm-stat-meta">
                      <span className="adm-stat-pill adm-stat-pill-amber">
                        {pendingTxCount} Perlu Verifikasi
                      </span>
                      <span style={{ color: '#7A897F' }}>•</span>
                      <span>{successTxCount} Berhasil</span>
                    </div>
                  </div>

                </div>

                {/* Main Overview Workspace: Dua Kolom (Verifikasi Pembayaran & Event Mendatang) */}
                <div className="adm-dashboard-grid">
                  
                  {/* Left Column: Tabel Verifikasi Transaksi Terbaru */}
                  <div className="adm-dashboard-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="adm-section-accent-bar" />
                          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111E18', margin: 0 }}>
                            Verifikasi Pembayaran Terbaru
                          </h2>
                        </div>
                        <p style={{ fontSize: '12.5px', color: '#5A675E', marginTop: '3px', margin: 0 }}>
                          Daftar mutasi transfer peserta turnamen yang menunggu tindakan
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => switchTab('pembayaran')}
                        className="adm-btn-secondary"
                        style={{ fontSize: '12px', padding: '0 14px', height: '34px' }}
                        title="Buka seluruh riwayat transaksi"
                      >
                        Buka Semua Transaksi →
                      </button>
                    </div>

                    {/* Desktop View Table */}
                    <div className="adm-table-container adm-table-desktop-view">
                      <div className="adm-table-scroll">
                        <table className="adm-table" style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ width: '15%', minWidth: '95px' }}>PEMESAN</th>
                              <th style={{ width: '23%', minWidth: '125px' }}>EVENT</th>
                              <th style={{ width: '14%', textAlign: 'right', minWidth: '85px' }}>NOMINAL</th>
                              <th style={{ width: '11%', minWidth: '70px' }}>WAKTU</th>
                              <th style={{ width: '12%', minWidth: '85px' }}>BUKTI</th>
                              <th style={{ width: '14%', minWidth: '100px' }}>STATUS</th>
                              <th style={{ width: '11%', textAlign: 'right', minWidth: '90px' }}>AKSI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((tx) => {
                              const parts = tx.time.split(/\s+(?=\d{1,2}:\d{2})/);
                              const datePart = parts[0] ? parts[0].replace(/\.$/, '') : tx.time;
                              const timePart = parts[1] || '';
                              return (
                                <tr key={tx.id}>
                                  {/* 1. PEMESAN */}
                                  <td>
                                    <div style={{
                                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      color: '#5A675E',
                                      letterSpacing: '0.2px'
                                    }}>
                                      {tx.code}
                                    </div>
                                    <div style={{ fontWeight: 700, color: '#111E18', fontSize: '13px', marginTop: '2px', whiteSpace: 'nowrap' }}>
                                      {tx.playerName}
                                    </div>
                                  </td>

                                  {/* 2. EVENT */}
                                  <td style={{ minWidth: '120px' }}>
                                    <div
                                      title={tx.eventName}
                                      style={{
                                        fontSize: '12.5px',
                                        fontWeight: 600,
                                        color: '#111E18',
                                        lineHeight: 1.35,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                    >
                                      {tx.eventName}
                                    </div>
                                  </td>

                                  {/* 3. NOMINAL */}
                                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    <div style={{
                                      fontWeight: 800,
                                      color: '#004F27',
                                      fontSize: '13px',
                                      fontVariantNumeric: 'tabular-nums'
                                    }}>
                                      {tx.amount}
                                    </div>
                                  </td>

                                  {/* 4. WAKTU */}
                                  <td style={{ whiteSpace: 'nowrap' }}>
                                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#2B3830' }}>
                                      {datePart}
                                    </div>
                                    {timePart && (
                                      <div style={{ fontSize: '11px', color: '#5A675E', marginTop: '1px' }}>
                                        {timePart}
                                      </div>
                                    )}
                                  </td>

                                  {/* 5. BUKTI */}
                                  <td style={{ whiteSpace: 'nowrap' }}>
                                    <button
                                      type="button"
                                      onClick={() => setShowReceiptModal(tx)}
                                      className="adm-btn-proof"
                                      title={`Lampiran: ${tx.proofType}`}
                                      aria-label={`Lihat bukti bayar ${tx.code}`}
                                    >
                                      <FileText size={11} />
                                      <span>Lihat Bukti</span>
                                    </button>
                                    {(tx.isProofBlur || tx.proofType.toLowerCase().includes('buram')) && (
                                      <div>
                                        <span className="adm-proof-blur-badge" title="Struk mutasi buram / tidak jelas">
                                          <AlertTriangle size={10} />
                                          <span>Bukti Buram</span>
                                        </span>
                                      </div>
                                    )}
                                  </td>

                                  {/* 6. STATUS */}
                                  <td style={{ whiteSpace: 'nowrap' }}>
                                    <span className={`adm-badge ${
                                      tx.status === 'pending' ? 'adm-badge-pending' :
                                      tx.status === 'success' ? 'adm-badge-active' :
                                      'adm-badge-cancelled'
                                    }`}>
                                      <span className="adm-badge-dot" />
                                      <span>
                                        {tx.status === 'pending' ? 'Menunggu Verifikasi' :
                                         tx.status === 'success' ? 'Berhasil' :
                                         'Ditolak'}
                                      </span>
                                    </span>
                                    {tx.status === 'success' && tx.proofType.toLowerCase().includes('auto') && (
                                      <div style={{ fontSize: '10.5px', color: '#5A675E', marginTop: '2px', paddingLeft: '4px' }}>
                                        Terverifikasi Otomatis
                                      </div>
                                    )}
                                    {tx.status === 'rejected' && (
                                      <div style={{ fontSize: '10.5px', color: '#DC2626', marginTop: '2px', paddingLeft: '4px' }}>
                                        {tx.isProofBlur ? 'Struk mutasi buram' : 'Bukti tidak sesuai'}
                                      </div>
                                    )}
                                  </td>

                                  {/* 7. AKSI */}
                                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    {tx.status === 'pending' ? (
                                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                                        <button
                                          type="button"
                                          onClick={() => handleVerifyTransaction(tx.id)}
                                          className="adm-btn-verify"
                                          title="Verifikasi pembayaran"
                                          aria-label="Verifikasi pembayaran"
                                        >
                                          <Check size={12} />
                                          <span>Verifikasi</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRejectTransaction(tx.id)}
                                          className="adm-btn-reject"
                                          title="Tolak pembayaran"
                                          aria-label="Tolak pembayaran"
                                        >
                                          <X size={12} />
                                          <span>Tolak</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <button
                                          type="button"
                                          onClick={() => setShowReceiptModal(tx)}
                                          className="adm-btn-detail"
                                          title="Lihat detail pembayaran"
                                          aria-label="Lihat detail pembayaran"
                                        >
                                          <Eye size={12} />
                                          <span>Detail</span>
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile View: Stacked Transaction Cards (<= 768px) */}
                    <div className="adm-table-mobile-view">
                      {transactions.map((tx) => {
                        const parts = tx.time.split(/\s+(?=\d{1,2}:\d{2})/);
                        const datePart = parts[0] ? parts[0].replace(/\.$/, '') : tx.time;
                        const timePart = parts[1] || '';
                        return (
                          <div key={tx.id} className="adm-tx-mobile-card">
                            <div className="adm-tx-mobile-header">
                              <div>
                                <div style={{
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#5A675E'
                                }}>
                                  {tx.code}
                                </div>
                                <div style={{ fontWeight: 700, color: '#111E18', fontSize: '13.5px', marginTop: '2px' }}>
                                  {tx.playerName}
                                </div>
                              </div>
                              <span className={`adm-badge ${
                                tx.status === 'pending' ? 'adm-badge-pending' :
                                tx.status === 'success' ? 'adm-badge-active' :
                                'adm-badge-cancelled'
                              }`}>
                                <span className="adm-badge-dot" />
                                <span>
                                  {tx.status === 'pending' ? 'Menunggu Verifikasi' :
                                   tx.status === 'success' ? 'Berhasil' :
                                   'Ditolak'}
                                </span>
                              </span>
                            </div>

                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111E18', lineHeight: 1.35 }}>
                                {tx.eventName}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#004F27', fontVariantNumeric: 'tabular-nums' }}>
                                  {tx.amount}
                                </span>
                                <span style={{ fontSize: '12px', color: '#5A675E' }}>
                                  {datePart} {timePart}
                                </span>
                              </div>
                            </div>

                            <div className="adm-tx-mobile-actions">
                              <button
                                type="button"
                                onClick={() => setShowReceiptModal(tx)}
                                className="adm-btn-proof"
                                title={`Lampiran: ${tx.proofType}`}
                                aria-label={`Lihat bukti bayar ${tx.code}`}
                              >
                                <FileText size={12} />
                                <span>Lihat Bukti</span>
                              </button>
                              {tx.status === 'pending' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectTransaction(tx.id)}
                                    className="adm-btn-reject"
                                    title="Tolak pembayaran"
                                    aria-label="Tolak pembayaran"
                                  >
                                    <X size={13} />
                                    <span>Tolak</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyTransaction(tx.id)}
                                    className="adm-btn-verify"
                                    title="Verifikasi pembayaran"
                                    aria-label="Verifikasi pembayaran"
                                  >
                                    <Check size={13} />
                                    <span>Verifikasi</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowReceiptModal(tx)}
                                  className="adm-btn-detail"
                                  title="Lihat detail pembayaran"
                                  aria-label="Lihat detail pembayaran"
                                >
                                  <Eye size={13} />
                                  <span>Detail</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Event Mendatang */}
                  <div className="adm-dashboard-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="adm-section-accent-bar" />
                          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111E18', margin: 0 }}>
                            Event Mendatang
                          </h2>
                        </div>
                        <p style={{ fontSize: '12.5px', color: '#5A675E', marginTop: '3px', margin: 0 }}>
                          Jadwal event yang akan berlangsung
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => switchTab('event')}
                        className="adm-btn-secondary"
                        style={{ fontSize: '12px', padding: '0 14px', height: '34px' }}
                        title="Kelola seluruh event"
                      >
                        Kelola Event →
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                      {realEvents.length === 0 ? (
                        <div style={{
                          padding: '36px 20px',
                          textAlign: 'center',
                          backgroundColor: '#FAF8F5',
                          borderRadius: '10px',
                          border: '1px dashed #D7E6DB',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          height: '100%',
                          minHeight: '180px'
                        }}>
                          <Calendar size={32} color="#7A897F" />
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#111E18' }}>
                              Belum ada event mendatang
                            </div>
                            <p style={{ fontSize: '12px', color: '#5A675E', margin: '4px 0 0 0' }}>
                              Buat event baru untuk membuka pendaftaran turnamen.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => switchTab('event')}
                            className="adm-btn-primary"
                            style={{ fontSize: '12px', padding: '6px 14px', height: '32px', marginTop: '4px' }}
                          >
                            <Plus size={13} />
                            <span>Tambah Event</span>
                          </button>
                        </div>
                      ) : (
                        realEvents.slice(0, 3).map((ev) => {
                          const { label: statusLabel, badgeClass } = mapEventStatus(ev.status, ev.status_label);
                          const formattedDate = formatIndonesianEventDate(ev.tanggal_event, ev.tanggal_formatted);
                          return (
                            <div
                              key={ev.id}
                              onClick={() => switchTab('event')}
                              className="adm-upcoming-event-card"
                              title="Klik untuk mengelola event"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  switchTab('event');
                                }
                              }}
                            >
                              <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '10px',
                                backgroundColor: '#EBF6EE',
                                color: '#004F27',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <Calendar size={18} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  title={ev.nama_event}
                                  style={{
                                    fontSize: '13.5px',
                                    fontWeight: 700,
                                    color: '#111E18',
                                    lineHeight: 1.35,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {ev.nama_event}
                                </div>
                                <div style={{
                                  fontSize: '12px',
                                  color: '#5A675E',
                                  marginTop: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  <span>{formattedDate}</span>
                                  <span style={{ color: '#A0ACA4' }}>•</span>
                                  <span>{ev.venue || 'Game House'}</span>
                                </div>
                              </div>
                              <span className={`adm-badge ${badgeClass}`} style={{ flexShrink: 0 }}>
                                <span className="adm-badge-dot" />
                                <span>{statusLabel}</span>
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ════ TAB 2: KELOLA EVENT ════ */}
            {activeTab === 'event' && (
              <AdminEventManager />
            )}

            {/* ════ TAB 3: KELOLA VENUE ════ */}
            {activeTab === 'venue' && (
              <AdminVenueManager />
            )}

            {/* ════ TAB 4: KELOLA PEMESANAN ════ */}
            {activeTab === 'pemesanan' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Header */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  border: '1px solid #D7E6DB',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#004F27', textTransform: 'uppercase', letterSpacing: '0.6px', backgroundColor: '#EBF6EE', padding: '3px 8px', borderRadius: '4px' }}>
                        MODUL RESERVASI RESMI
                      </span>
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111E18', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Ticket size={22} color="#004F27" />
                      <span>Manajemen Pemesanan &amp; Meja</span>
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5A675E' }}>
                      Pantau seluruh reservasi meja pemain, slot kursi turnamen, status tiket QR, dan data kontak pemesan.
                    </p>
                  </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="adm-filter-bar">
                  <div className="adm-search-wrap">
                    <Search size={15} color="#78807B" />
                    <input
                      type="text"
                      placeholder="Cari Kode Booking (#MJK), Nama Pemesan, atau Venue..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="adm-search-input"
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <select
                      value={bookingFilter}
                      onChange={(e) => setBookingFilter(e.target.value as any)}
                      className="adm-select"
                    >
                      <option value="all">Semua Status Pemesanan</option>
                      <option value="confirmed">Terkonfirmasi</option>
                      <option value="pending">Menunggu Verifikasi</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setBookingSearch('');
                        setBookingFilter('all');
                      }}
                      className="adm-btn-refresh"
                    >
                      <RotateCcw size={14} />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Table Pemesanan */}
                <div className="adm-table-container">
                  <div className="adm-table-scroll">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>KODE BOOKING</th>
                          <th>PEMESAN / ATLET</th>
                          <th>EVENT &amp; VENUE</th>
                          <th>MEJA &amp; KURSI</th>
                          <th>WAKTU SESI</th>
                          <th>BIAYA</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'right' }}>DETAIL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <div style={{ fontWeight: 800, color: '#183629', fontSize: '13px' }}>
                                {b.code}
                              </div>
                              <div style={{ fontSize: '11px', color: '#7A897F' }}>
                                ID #{b.id}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: '#111E18' }}>
                                {b.playerName}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#5A675E' }}>
                                {b.phone}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#2B3830' }}>
                                {b.eventName}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#7A897F', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <MapPin size={12} color="#004F27" />
                                <span>{b.venueName}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: '#004F27', fontSize: '12.5px' }}>
                                {b.tableNumber}
                              </div>
                              <div style={{ fontSize: '11px', color: '#5A675E' }}>
                                {b.seatName}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#111E18' }}>{b.date}</div>
                              <div style={{ fontSize: '11.5px', color: '#7A897F' }}>{b.time}</div>
                            </td>
                            <td>
                              <strong style={{ color: '#004F27' }}>{b.amount}</strong>
                            </td>
                            <td>
                              <span className={`adm-badge ${
                                b.status === 'confirmed' ? 'adm-badge-active' :
                                b.status === 'pending' ? 'adm-badge-pending' :
                                'adm-badge-cancelled'
                              }`}>
                                <span className="adm-badge-dot" />
                                <span>{b.statusLabel}</span>
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedBookingModal(b)}
                                className="adm-action-btn adm-action-btn-view"
                                title="Lihat Detail Pemesanan"
                              >
                                <Eye size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ════ TAB 5: KELOLA PEMBAYARAN ════ */}
            {activeTab === 'pembayaran' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Header */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  border: '1px solid #D7E6DB',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#004F27', textTransform: 'uppercase', letterSpacing: '0.6px', backgroundColor: '#EBF6EE', padding: '3px 8px', borderRadius: '4px' }}>
                        MODUL KEUANGAN &amp; MUTASI
                      </span>
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111E18', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CreditCard size={22} color="#004F27" />
                      <span>Manajemen &amp; Verifikasi Pembayaran</span>
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5A675E' }}>
                      Validasi bukti transfer bank, QRIS BCA, dan mutasi pembayaran tiket turnamen riichi secara sah.
                    </p>
                  </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="adm-filter-bar">
                  <div className="adm-search-wrap">
                    <Search size={15} color="#78807B" />
                    <input
                      type="text"
                      placeholder="Cari Kode Booking (#MJK), Nama, atau Event..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      className="adm-search-input"
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value as any)}
                      className="adm-select"
                    >
                      <option value="all">Semua Status Mutasi</option>
                      <option value="pending">Menunggu Verifikasi ({pendingTxCount})</option>
                      <option value="success">Berhasil (Sah)</option>
                      <option value="rejected">Ditolak</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentSearch('');
                        setPaymentFilter('all');
                      }}
                      className="adm-btn-refresh"
                    >
                      <RotateCcw size={14} />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Main Table Pembayaran (Synchronized Layout) */}
                <div className="adm-table-container adm-table-desktop-view">
                  <div className="adm-table-scroll">
                    <table className="adm-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '16%', minWidth: '130px' }}>PEMESAN</th>
                          <th style={{ width: '22%', minWidth: '160px' }}>EVENT</th>
                          <th style={{ width: '13%', textAlign: 'right', minWidth: '95px' }}>NOMINAL</th>
                          <th style={{ width: '16%', minWidth: '130px' }}>METODE &amp; WAKTU</th>
                          <th style={{ width: '11%', minWidth: '95px' }}>BUKTI</th>
                          <th style={{ width: '12%', minWidth: '115px' }}>STATUS</th>
                          <th style={{ width: '10%', textAlign: 'right', minWidth: '110px' }}>AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#5A675E' }}>
                              <CreditCard size={28} color="#7A897F" style={{ margin: '0 auto 8px' }} />
                              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#111E18' }}>
                                Tidak ada transaksi yang sesuai filter
                              </div>
                              <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>
                                Ubah filter atau kata kunci pencarian Anda.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          filteredTransactions.map((tx) => (
                            <tr key={tx.id}>
                              {/* 1. PEMESAN */}
                              <td>
                                <div style={{
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#5A675E',
                                  letterSpacing: '0.2px'
                                }}>
                                  {tx.code}
                                </div>
                                <div style={{ fontWeight: 700, color: '#111E18', fontSize: '13px', marginTop: '2px', whiteSpace: 'nowrap' }}>
                                  {tx.playerName}
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#7A897F' }}>
                                  ID: {tx.playerId}
                                </div>
                              </td>

                              {/* 2. EVENT */}
                              <td>
                                <div
                                  title={tx.eventName}
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#111E18',
                                    lineHeight: 1.35,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {tx.eventName}
                                </div>
                              </td>

                              {/* 3. NOMINAL */}
                              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <div style={{
                                  fontSize: '13.5px',
                                  fontWeight: 800,
                                  color: '#004F27',
                                  fontVariantNumeric: 'tabular-nums'
                                }}>
                                  {tx.amount}
                                </div>
                              </td>

                              {/* 4. METODE & WAKTU */}
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <div style={{ fontWeight: 600, color: '#111E18', fontSize: '12px' }}>
                                  {tx.paymentMethod}
                                </div>
                                <div style={{ fontSize: '11px', color: '#5A675E', marginTop: '1px' }}>
                                  {tx.time}
                                </div>
                              </td>

                              {/* 5. BUKTI */}
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <button
                                  type="button"
                                  onClick={() => setShowReceiptModal(tx)}
                                  className="adm-btn-proof"
                                  title={`Lampiran: ${tx.proofType}`}
                                  aria-label={`Lihat bukti bayar ${tx.code}`}
                                >
                                  <FileText size={11} />
                                  <span>Lihat Bukti</span>
                                </button>
                                {(tx.isProofBlur || tx.proofType.toLowerCase().includes('buram')) && (
                                  <div>
                                    <span className="adm-proof-blur-badge" title="Struk mutasi buram / tidak jelas">
                                      <AlertTriangle size={10} />
                                      <span>Bukti Buram</span>
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* 6. STATUS */}
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <span className={`adm-badge ${
                                  tx.status === 'pending' ? 'adm-badge-pending' :
                                  tx.status === 'success' ? 'adm-badge-active' :
                                  'adm-badge-cancelled'
                                }`}>
                                  <span className="adm-badge-dot" />
                                  <span>
                                    {tx.status === 'pending' ? 'Menunggu Verifikasi' :
                                     tx.status === 'success' ? 'Berhasil' :
                                     'Ditolak'}
                                  </span>
                                </span>
                                {tx.status === 'success' && tx.proofType.toLowerCase().includes('auto') && (
                                  <div style={{ fontSize: '10.5px', color: '#5A675E', marginTop: '2px', paddingLeft: '4px' }}>
                                    Terverifikasi Otomatis
                                  </div>
                                )}
                                {tx.status === 'rejected' && (
                                  <div style={{ fontSize: '10.5px', color: '#DC2626', marginTop: '2px', paddingLeft: '4px' }}>
                                    {tx.isProofBlur ? 'Struk mutasi buram' : 'Bukti tidak sesuai'}
                                  </div>
                                )}
                              </td>

                              {/* 7. AKSI */}
                              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {tx.status === 'pending' ? (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyTransaction(tx.id)}
                                      className="adm-btn-verify"
                                      title="Verifikasi pembayaran"
                                      aria-label="Verifikasi pembayaran"
                                    >
                                      <Check size={12} />
                                      <span>Verifikasi</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectTransaction(tx.id)}
                                      className="adm-btn-reject"
                                      title="Tolak pembayaran"
                                      aria-label="Tolak pembayaran"
                                    >
                                      <X size={12} />
                                      <span>Tolak</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      onClick={() => setShowReceiptModal(tx)}
                                      className="adm-btn-detail"
                                      title="Lihat detail pembayaran"
                                      aria-label="Lihat detail pembayaran"
                                    >
                                      <Eye size={12} />
                                      <span>Detail</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View: Stacked Transaction Cards (<= 768px) */}
                <div className="adm-table-mobile-view">
                  {filteredTransactions.map((tx) => (
                    <div key={tx.id} className="adm-tx-mobile-card">
                      <div className="adm-tx-mobile-header">
                        <div>
                          <div style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#5A675E'
                          }}>
                            {tx.code}
                          </div>
                          <div style={{ fontWeight: 700, color: '#111E18', fontSize: '13.5px', marginTop: '2px' }}>
                            {tx.playerName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#7A897F' }}>
                            ID: {tx.playerId}
                          </div>
                        </div>
                        <span className={`adm-badge ${
                          tx.status === 'pending' ? 'adm-badge-pending' :
                          tx.status === 'success' ? 'adm-badge-active' :
                          'adm-badge-cancelled'
                        }`}>
                          <span className="adm-badge-dot" />
                          <span>
                            {tx.status === 'pending' ? 'Menunggu Verifikasi' :
                             tx.status === 'success' ? 'Berhasil' :
                             'Ditolak'}
                          </span>
                        </span>
                      </div>

                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111E18', lineHeight: 1.35 }}>
                          {tx.eventName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#004F27', fontVariantNumeric: 'tabular-nums' }}>
                            {tx.amount}
                          </span>
                          <span style={{ fontSize: '11.5px', color: '#5A675E' }}>
                            {tx.paymentMethod} • {tx.time}
                          </span>
                        </div>
                      </div>

                      <div className="adm-tx-mobile-actions">
                        <button
                          type="button"
                          onClick={() => setShowReceiptModal(tx)}
                          className="adm-btn-proof"
                          title={`Lampiran: ${tx.proofType}`}
                          aria-label={`Lihat bukti bayar ${tx.code}`}
                        >
                          <FileText size={12} />
                          <span>Lihat Bukti</span>
                        </button>
                        {tx.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRejectTransaction(tx.id)}
                              className="adm-btn-reject"
                              title="Tolak pembayaran"
                              aria-label="Tolak pembayaran"
                            >
                              <X size={12} />
                              <span>Tolak</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVerifyTransaction(tx.id)}
                              className="adm-btn-verify"
                              title="Verifikasi pembayaran"
                              aria-label="Verifikasi pembayaran"
                            >
                              <Check size={12} />
                              <span>Verifikasi</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowReceiptModal(tx)}
                            className="adm-btn-detail"
                            title="Lihat detail pembayaran"
                            aria-label="Lihat detail pembayaran"
                          >
                            <Eye size={12} />
                            <span>Detail</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* ════ TAB 6: KELOLA SKOR / LEADERBOARD ════ */}
            {activeTab === 'skor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Header */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  border: '1px solid #D7E6DB',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#004F27', textTransform: 'uppercase', letterSpacing: '0.6px', backgroundColor: '#EBF6EE', padding: '3px 8px', borderRadius: '4px' }}>
                        MODUL PERWASITAN &amp; KLASEMEN
                      </span>
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111E18', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={22} color="#004F27" />
                      <span>Manajemen Skor &amp; Leaderboard Atlet</span>
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5A675E' }}>
                      Pantau klasemen resmi WRC, rating ELO atlet riichi, dan input verifikasi skor hanchan turnamen.
                    </p>
                  </div>
                </div>

                {/* Two Column Layout: Table Leaderboard & Score Desk */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '24px',
                  alignItems: 'start'
                }}>
                  
                  {/* Left Column: Official Leaderboard Table */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '24px',
                    border: '1px solid #D7E6DB',
                    boxShadow: '0 2px 8px rgba(0, 79, 39, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '4px', height: '18px', backgroundColor: '#183629', borderRadius: '2px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111E18', margin: 0 }}>
                          Klasemen Atlet Riichi Teratas (Season 2025/2026)
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetLeaderboard}
                        disabled={isResettingScore}
                        className="adm-btn-secondary"
                        style={{
                          fontSize: '11.5px',
                          padding: '5px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#DC2626',
                          borderColor: '#FECACA',
                          backgroundColor: '#FEF2F2',
                          cursor: isResettingScore ? 'not-allowed' : 'pointer'
                        }}
                        title="Reset seluruh poin atlet ke 0"
                      >
                        <RotateCcw size={12} />
                        <span>{isResettingScore ? 'Mereset...' : 'Reset Poin (0 PTS)'}</span>
                      </button>
                    </div>

                    <div className="adm-table-container">
                      <div className="adm-table-scroll">
                        <table className="adm-table">
                          <thead>
                            <tr>
                              <th>PERINGKAT</th>
                              <th>ATLET RIICHI</th>
                              <th>KLUB / AFILIASI</th>
                              <th>RATING ELO</th>
                              <th>WIN RATE</th>
                              <th>TOTAL MATCH</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(liveLeaderboard.length > 0 ? liveLeaderboard : LEADERBOARD_PLAYERS).map((player) => (
                              <tr key={player.rank}>
                                <td>
                                  <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    fontWeight: 800,
                                    fontSize: '12px',
                                    backgroundColor: player.rank === 1 ? '#FEF3C7' : player.rank === 2 ? '#E0F2FE' : '#F3F4F6',
                                    color: player.rank === 1 ? '#B45309' : player.rank === 2 ? '#0369A1' : '#374151'
                                  }}>
                                    #{player.rank}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 700, color: '#111E18' }}>
                                    {player.name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#004F27', fontWeight: 600 }}>
                                    {player.danRank} • {player.rankTitle}
                                  </div>
                                </td>
                                <td>
                                  <span style={{ fontSize: '12px', color: '#5A675E' }}>{player.club}</span>
                                </td>
                                <td>
                                  <strong style={{ color: '#004F27', fontSize: '13px' }}>
                                    {player.eloRating.toLocaleString()} PTS
                                  </strong>
                                </td>
                                <td>
                                  <span style={{ fontWeight: 700, color: '#16A34A' }}>{player.winRate}</span>
                                </td>
                                <td>
                                  <span style={{ color: '#5A675E' }}>{player.totalMatches} Hanchan</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Desk Wasit Form (Preserved) */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '24px',
                    border: '1px solid #D7E6DB',
                    boxShadow: '0 2px 8px rgba(0, 79, 39, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '4px', height: '18px', backgroundColor: '#E2BC55', borderRadius: '2px' }} />
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111E18', margin: 0 }}>
                        Desk Wasit &amp; Validasi Skor Match
                      </h3>
                    </div>
                    <p style={{ fontSize: '12px', color: '#5A675E', margin: 0 }}>
                      Kalkulasi Uma/Oka resmi WRC untuk dicatat ke dalam database klasemen.
                    </p>

                    <form onSubmit={handleScoreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#2B3830', marginBottom: '4px' }}>
                          Turnamen Berjalan
                        </label>
                        <select
                          value={selectedEventId}
                          onChange={(e) => setSelectedEventId(e.target.value)}
                          className="adm-select"
                          style={{ width: '100%' }}
                        >
                          <option value="">-- Pilih Event (Opsional) --</option>
                          {realEvents.map((ev) => (
                            <option key={ev.id} value={String(ev.id)}>{ev.nama_event}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#2B3830', marginBottom: '4px' }}>
                          Pemain Terpilih
                        </label>
                        <select
                          value={selectedPlayerId}
                          onChange={(e) => setSelectedPlayerId(e.target.value)}
                          className="adm-select"
                          style={{ width: '100%' }}
                          required
                        >
                          <option value="">-- Pilih Pemain --</option>
                          {livePlayers.map((p) => (
                            <option key={p.id} value={String(p.id)}>{p.nama} ({p.handle || p.email})</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#2B3830', marginBottom: '4px' }}>
                            Posisi Meja
                          </label>
                          <select
                            value={selectedRank}
                            onChange={(e) => setSelectedRank(e.target.value)}
                            className="adm-select"
                            style={{ width: '100%' }}
                          >
                                                        <option value="1">Juara 1 (Top)</option>
                            <option value="2">Peringkat 2</option>
                            <option value="3">Peringkat 3</option>
                            <option value="4">Peringkat 4 (Last)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#2B3830', marginBottom: '4px' }}>
                            Kalkulasi Uma/Oka
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="e.g. +35.2"
                            value={umaScore}
                            onChange={(e) => setUmaScore(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #D7E6DB',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              color: '#004F27',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#2B3830', marginBottom: '4px' }}>
                          Catatan Wasit / Validasi Dora
                        </label>
                        <textarea
                          rows={2}
                          value={wasitNotes}
                          onChange={(e) => setWasitNotes(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #D7E6DB',
                            fontSize: '12px',
                            outline: 'none',
                            resize: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        className="adm-btn-primary"
                        disabled={isSubmittingScore}
                        style={{ justifyContent: 'center', marginTop: '4px', opacity: isSubmittingScore ? 0.7 : 1 }}
                      >
                        <Award size={15} color="#E2BC55" />
                        <span>{isSubmittingScore ? 'Menyimpan...' : 'Validasi & Sinkronkan Skor'}</span>
                      </button>
                    </form>
                  </div>

                </div>

              </div>
            )}

            {/* ════ TAB 7: PROFIL ADMIN ════ */}
            {activeTab === 'profil' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Header */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  border: '1px solid #D7E6DB',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#004F27', textTransform: 'uppercase', letterSpacing: '0.6px', backgroundColor: '#EBF6EE', padding: '3px 8px', borderRadius: '4px' }}>
                        IDENTITAS &amp; HAK AKSES SISTEM
                      </span>
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111E18', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserIcon size={22} color="#004F27" />
                      <span>Profil Administrator MahjongYuks</span>
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5A675E' }}>
                      Informasi akun staf operasional, wewenang backoffice, dan pengaturan kontak resmi.
                    </p>
                  </div>
                </div>

                {/* Profile Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: '24px',
                  alignItems: 'start'
                }}>
                  
                  {/* Profile Summary Card */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '28px',
                    border: '1px solid #D7E6DB',
                    boxShadow: '0 2px 8px rgba(0, 79, 39, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      backgroundColor: '#183629',
                      color: '#E2BC55',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: 800,
                      border: '3px solid #E2BC55',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                    }}>
                      {adminInitial}
                    </div>

                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111E18' }}>
                        {adminName}
                      </h3>
                      <div style={{ fontSize: '12px', color: '#5A675E', marginTop: '3px' }}>
                        ID Akun: <strong>{adminHandle}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <span className="adm-badge adm-badge-active">
                        <span className="adm-badge-dot" />
                        <span>Administrator Resmi</span>
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        padding: '4px 10px',
                        borderRadius: '9999px'
                      }}>
                        Akses Penuh Backoffice
                      </span>
                    </div>

                    <div style={{
                      width: '100%',
                      borderTop: '1px solid #EEF4F0',
                      paddingTop: '16px',
                      marginTop: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      textAlign: 'left',
                      fontSize: '12.5px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Mail size={15} color="#004F27" />
                        <span style={{ color: '#5A675E' }}>Email:</span>
                        <strong style={{ color: '#111E18', marginLeft: 'auto' }}>{adminEmail}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Phone size={15} color="#004F27" />
                        <span style={{ color: '#5A675E' }}>Telepon:</span>
                        <strong style={{ color: '#111E18', marginLeft: 'auto' }}>{adminPhone}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <UserCheck size={15} color="#004F27" />
                        <span style={{ color: '#5A675E' }}>Status Autentikasi:</span>
                        <strong style={{ color: '#16A34A', marginLeft: 'auto' }}>Aktif &amp; Terverifikasi</strong>
                      </div>
                    </div>
                  </div>

                  {/* Profile Edit Form */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '24px',
                    border: '1px solid #D7E6DB',
                    boxShadow: '0 2px 8px rgba(0, 79, 39, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '4px', height: '18px', backgroundColor: '#183629', borderRadius: '2px' }} />
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111E18', margin: 0 }}>
                        Perbarui Informasi Profil
                      </h3>
                    </div>
                    <p style={{ fontSize: '12px', color: '#5A675E', margin: 0 }}>
                      Pastikan email dan kontak selalu aktif untuk menerima pemberitahuan sistem dan notifikasi pendaftaran.
                    </p>

                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                          Nama Lengkap Administrator *
                        </label>
                        <input
                          type="text"
                          required
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1px solid #D7E6DB',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                          Alamat Email Resmi *
                        </label>
                        <input
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1px solid #D7E6DB',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                          Nomor Telepon / WhatsApp Operasional *
                        </label>
                        <input
                          type="text"
                          required
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1px solid #D7E6DB',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                          ID Handle Administrator (Read-Only)
                        </label>
                        <input
                          type="text"
                          disabled
                          value={adminHandle}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1px solid #E4ECE6',
                            backgroundColor: '#FAF8F5',
                            color: '#7A897F',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        className="adm-btn-primary"
                        style={{ marginTop: '6px' }}
                      >
                        <Save size={15} />
                        <span>Simpan Perubahan Profil</span>
                      </button>
                    </form>
                  </div>

                </div>

              </div>
            )}

          </div>
        </div>
      </main>

      {/* ── MODAL: DETAIL PEMBAYARAN & BUKTI MUTASI ── */}
      {showReceiptModal && (
        <div className="adm-modal-overlay">
          <div className="adm-modal-container" style={{ maxWidth: '580px' }}>
            <div className="adm-modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid #EEF4F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#EBF6EE',
                  color: '#004F27',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800, color: '#111E18' }}>
                      Detail Pembayaran {showReceiptModal.code}
                    </h3>
                    <span className={`adm-badge ${
                      showReceiptModal.status === 'pending' ? 'adm-badge-pending' :
                      showReceiptModal.status === 'success' ? 'adm-badge-active' :
                      'adm-badge-cancelled'
                    }`}>
                      <span className="adm-badge-dot" />
                      <span>
                        {showReceiptModal.status === 'pending' ? 'Menunggu Verifikasi' :
                         showReceiptModal.status === 'success' ? 'Berhasil' :
                         'Ditolak'}
                      </span>
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#5A675E' }}>
                    Pemesan: <strong style={{ color: '#111E18' }}>{showReceiptModal.playerName}</strong> ({showReceiptModal.playerId})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReceiptModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  color: '#5A675E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Tutup Modal"
                aria-label="Tutup Modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="adm-modal-body" style={{ padding: '22px 24px', gap: '16px' }}>
              {/* Status Alert Banner */}
              {showReceiptModal.status === 'pending' && (
                <div style={{
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FCD34D',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Clock size={18} color="#D97706" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>
                      Menunggu Tindakan Verifikasi
                    </div>
                    <div style={{ fontSize: '12px', color: '#B45309', marginTop: '1px' }}>
                      Periksa kecocokan nominal dan bukti mutasi sebelum menyetujui transaksi tiket turnamen.
                    </div>
                  </div>
                </div>
              )}

              {showReceiptModal.status === 'success' && (
                <div style={{
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #86EFAC',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                      Pembayaran Berhasil &amp; Terverifikasi Sah
                    </div>
                    <div style={{ fontSize: '12px', color: '#15803D', marginTop: '1px' }}>
                      Pemain telah terdaftar resmi dan kursi turnamen otomatis dikonfirmasi.
                    </div>
                  </div>
                </div>
              )}

              {showReceiptModal.status === 'rejected' && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#991B1B' }}>
                      Pembayaran Ditolak
                    </div>
                    <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '1px' }}>
                      {showReceiptModal.isProofBlur || showReceiptModal.proofType.toLowerCase().includes('buram')
                        ? 'Struk mutasi buram atau tidak terbaca dengan jelas oleh sistem.'
                        : 'Bukti transfer tidak sesuai dengan ketentuan turnamen atau nominal biaya.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Metadata Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px'
              }}>
                <div style={{
                  backgroundColor: '#FAF8F5',
                  border: '1px solid #E4ECE6',
                  borderRadius: '10px',
                  padding: '12px 14px'
                }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Turnamen / Event
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111E18', marginTop: '3px', lineHeight: 1.35 }}>
                    {showReceiptModal.eventName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7A897F', marginTop: '2px' }}>
                    Lokasi: Game House Sedayu City
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#FAF8F5',
                  border: '1px solid #E4ECE6',
                  borderRadius: '10px',
                  padding: '12px 14px'
                }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Total Nominal
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#004F27', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                    {showReceiptModal.amount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#5A675E', marginTop: '2px' }}>
                    Biaya Pendaftaran Turnamen
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#FAF8F5',
                  border: '1px solid #E4ECE6',
                  borderRadius: '10px',
                  padding: '12px 14px'
                }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Kanal Pembayaran
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#111E18', marginTop: '3px' }}>
                    {showReceiptModal.paymentMethod}
                  </div>
                  <div style={{ fontSize: '11px', color: '#5A675E', marginTop: '2px' }}>
                    Auto-Match Gateway
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#FAF8F5',
                  border: '1px solid #E4ECE6',
                  borderRadius: '10px',
                  padding: '12px 14px'
                }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Waktu Mutasi
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#111E18', marginTop: '3px' }}>
                    {showReceiptModal.time}
                  </div>
                  <div style={{ fontSize: '11px', color: '#5A675E', marginTop: '2px' }}>
                    WIB (Waktu Indonesia Barat)
                  </div>
                </div>
              </div>

              {/* Digital Receipt / Proof Box */}
              <div style={{
                border: '1px solid #D7E6DB',
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(0, 79, 39, 0.03)',
                overflow: 'hidden'
              }}>
                <div style={{
                  backgroundColor: '#F4FAF6',
                  borderBottom: '1px solid #D7E6DB',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px'
                }}>
                  <span style={{ fontWeight: 800, color: '#004F27', letterSpacing: '0.4px' }}>
                    BERKAS BUKTI MUTASI
                  </span>
                  <span style={{ color: '#5A675E', fontFamily: 'monospace', fontSize: '11px' }}>
                    REF-{showReceiptModal.code.replace('#', '')}
                  </span>
                </div>

                <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    backgroundColor: (showReceiptModal.isProofBlur || showReceiptModal.proofType.toLowerCase().includes('buram')) ? '#FEF2F2' : '#EBF6EE',
                    color: (showReceiptModal.isProofBlur || showReceiptModal.proofType.toLowerCase().includes('buram')) ? '#DC2626' : '#004F27',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px'
                  }}>
                    {(showReceiptModal.isProofBlur || showReceiptModal.proofType.toLowerCase().includes('buram')) ? (
                      <AlertTriangle size={26} />
                    ) : (
                      <FileText size={26} />
                    )}
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#111E18' }}>
                    {showReceiptModal.proofType}
                  </div>

                  <p style={{ fontSize: '12px', color: '#5A675E', margin: '4px auto 0', maxWidth: '360px' }}>
                    Bukti transfer terdeteksi dari channel mutasi perbankan / QRIS resmi MahjongYuks.
                  </p>

                  {(showReceiptModal.isProofBlur || showReceiptModal.proofType.toLowerCase().includes('buram')) && (
                    <div style={{
                      marginTop: '12px',
                      padding: '7px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      fontSize: '11.5px',
                      color: '#DC2626',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <AlertTriangle size={13} />
                      <span>Kualitas struk mutasi buram / resolusi rendah</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="adm-modal-footer">
              <button
                type="button"
                onClick={() => setShowReceiptModal(null)}
                className="adm-btn-secondary"
                style={{ height: '36px', padding: '0 16px', fontSize: '12px' }}
              >
                Tutup
              </button>
              {showReceiptModal.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleRejectTransaction(showReceiptModal.id)}
                    className="adm-btn-reject"
                    style={{ height: '36px', padding: '0 16px', fontSize: '12px' }}
                    title="Tolak pembayaran ini"
                  >
                    <X size={13} />
                    <span>Tolak Pembayaran</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyTransaction(showReceiptModal.id)}
                    className="adm-btn-verify"
                    style={{ height: '36px', padding: '0 16px', fontSize: '12px' }}
                    title="Verifikasi dan sahkan pembayaran"
                  >
                    <Check size={13} />
                    <span>Verifikasi &amp; Sahkan</span>
                  </button>
                </>
              ) : showReceiptModal.status === 'rejected' ? (
                <button
                  type="button"
                  onClick={() => handleVerifyTransaction(showReceiptModal.id)}
                  className="adm-btn-verify"
                  style={{ height: '36px', padding: '0 16px', fontSize: '12px' }}
                  title="Ubah keputusan dan sahkan pembayaran"
                >
                  <Check size={13} />
                  <span>Ubah &amp; Sahkan Pembayaran</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRejectTransaction(showReceiptModal.id)}
                  className="adm-btn-reject"
                  style={{ height: '36px', padding: '0 16px', fontSize: '12px' }}
                  title="Batalkan verifikasi pembayaran ini"
                >
                  <X size={13} />
                  <span>Batalkan / Tolak Pembayaran</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DETAIL PEMESANAN ── */}
      {selectedBookingModal && (
        <div className="adm-modal-overlay">
          <div className="adm-modal-container" style={{ maxWidth: '520px' }}>
            <div className="adm-modal-header">
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#004F27', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  RINCIAN TIKET &amp; RESERVASI MEJA
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 800, color: '#111E18' }}>
                  {selectedBookingModal.code} - {selectedBookingModal.playerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#5A675E' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="adm-modal-body">
              <div style={{
                backgroundColor: '#FAF8F5',
                border: '1px solid #D7E6DB',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#5A675E' }}>Turnamen / Event:</span>
                  <strong style={{ color: '#111E18' }}>{selectedBookingModal.eventName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#5A675E' }}>Lokasi Venue:</span>
                  <span style={{ color: '#111E18' }}>{selectedBookingModal.venueName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#5A675E' }}>Nomor Meja:</span>
                  <strong style={{ color: '#004F27' }}>{selectedBookingModal.tableNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#5A675E' }}>Alokasi Kursi:</span>
                  <strong style={{ color: '#004F27' }}>{selectedBookingModal.seatName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#5A675E' }}>Jadwal &amp; Waktu:</span>
                  <span>{selectedBookingModal.date} ({selectedBookingModal.time})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#5A675E' }}>Biaya Tiket:</span>
                  <strong style={{ color: '#004F27' }}>{selectedBookingModal.amount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#5A675E' }}>Kontak Pemesan:</span>
                  <span>{selectedBookingModal.phone}</span>
                </div>
              </div>
            </div>

            <div className="adm-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedBookingModal(null)}
                className="adm-btn-primary"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAF8F5',
        color: '#183629',
        fontWeight: 700,
        fontSize: '14px'
      }}>
        Memuat Dashboard Administrator...
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
