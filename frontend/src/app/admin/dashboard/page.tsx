'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  RefreshCw,
  PlusCircle,
  Calendar,
  Building,
  TrendingUp,
  Hourglass,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  ChevronDown,
  Check,
  Award,
  CreditCard,
  Scale,
  QrCode,
  Sliders,
  Trophy,
  Phone,
  Bell,
  LogOut,
  ExternalLink,
  ChevronRight,
  Eye,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  X
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // State management
  const [activeModuleTab, setActiveModuleTab] = useState<'overview' | 'event' | 'venue' | 'payment' | 'score'>('overview');
  const [activeSidebarNav, setActiveSidebarNav] = useState('verifikasi-skor');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'success' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Wasit & Score Desk states
  const [selectedEvent, setSelectedEvent] = useState('Jakarta Riichi Masters Autumn (Season 4)');
  const [selectedPlayer, setSelectedPlayer] = useState('Kevin Sanjaya (#MJY-9201) - 4-Dan');
  const [selectedRank, setSelectedRank] = useState('Juara 1 Meja 03');
  const [umaScore, setUmaScore] = useState('+35.2');
  const [addedPoints, setAddedPoints] = useState('+1,250');
  const [wasitNotes, setWasitNotes] = useState('Hanchan #2 Selesai tanpa penalti (Agari bersih. Dora validasi OK)');
  const [scoreSyncSuccess, setScoreSyncSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [showReceiptModal, setShowReceiptModal] = useState<Transaction | null>(null);
  const [showNewTournamentModal, setShowNewTournamentModal] = useState(false);
  const [actionSuccessToast, setActionSuccessToast] = useState('');

  // Transactions data
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-1',
      code: '#MJK-8821',
      playerName: 'Kevin Sanjaya',
      playerId: 'MJY-9201',
      eventName: 'Jakarta Riichi Masters',
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
      eventName: 'Friday Casual PIK Salon',
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
      eventName: 'Sunday Beginners Bootcamp',
      amount: 'Rp 75.000',
      paymentMethod: 'TRANSFER BANK BCA',
      time: '24 Okt. 08:12 WIB',
      proofType: 'Struk mutasi buram',
      isProofBlur: true,
      status: 'rejected',
      statusLabel: 'Ditolak (Bukti Tidak Sesuai)'
    }
  ]);

  // Handle Verify Transaction
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
    setActionSuccessToast('Pembayaran berhasil diverifikasi! Tiket otomatis diterbitkan ke pemain.');
    setTimeout(() => setActionSuccessToast(''), 3000);
    if (showReceiptModal) setShowReceiptModal(null);
  };

  // Handle Reject Transaction
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
    setActionSuccessToast('Transaksi ditolak. Notifikasi perbaikan dikirim ke pemain.');
    setTimeout(() => setActionSuccessToast(''), 3000);
    if (showReceiptModal) setShowReceiptModal(null);
  };

  // Handle Score Sync
  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScoreSyncSuccess(true);
    setActionSuccessToast(`Skor ${selectedPlayer} berhasil disinkronkan ke Leaderboard & TV Arena!`);
    setTimeout(() => {
      setScoreSyncSuccess(false);
      setActionSuccessToast('');
    }, 3000);
  };

  // Handle Automatic Sync
  const handleAutoSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setActionSuccessToast('Sinkronisasi 8 Venue & 74 Meja Magnetik Berhasil.');
      setTimeout(() => setActionSuccessToast(''), 3000);
    }, 1000);
  };

  const filteredTransactions = transactions.filter(t => {
    if (paymentFilter === 'pending' && t.status !== 'pending') return false;
    if (paymentFilter === 'success' && t.status !== 'success') return false;
    if (paymentFilter === 'rejected' && t.status !== 'rejected') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.code.toLowerCase().includes(q) ||
        t.playerName.toLowerCase().includes(q) ||
        t.eventName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F1FCF4' }}>
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside style={{
        width: '260px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #D7E6DB',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        gap: '24px',
        flexShrink: 0
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 4px' }}>
          <Image
            src="/assets/mahjongyuks_logo.png"
            alt="Mahjongyuks"
            width={54}
            height={42}
            priority
            style={{ objectFit: 'contain' }}
          />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#004F27', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
              Mahjongyuks
            </div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#5A675E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Salon & Arena
            </div>
          </div>
        </div>

        {/* Mode Switcher Pill */}
        <div style={{
          backgroundColor: '#EBF6EE',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          gap: '4px'
        }}>
          <Link
            href="/dashboard"
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '8px',
              color: '#5A675E',
              fontSize: '11px',
              fontWeight: 600,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            Mode Pemain
          </Link>
          <div
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '8px',
              backgroundColor: '#004F27',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,79,39,0.2)'
            }}
          >
            ● Mode Admin
          </div>
        </div>

        {/* Sidebar Nav Menus */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
          
          {/* Section: MANAJEMEN ARENA */}
          <div>
            <div style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#7A897F',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              paddingLeft: '12px'
            }}>
              MANAJEMEN ARENA
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveSidebarNav('ringkasan')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeSidebarNav === 'ringkasan' ? '#EBF6EE' : 'transparent',
                  color: activeSidebarNav === 'ringkasan' ? '#004F27' : '#5A675E',
                  fontWeight: activeSidebarNav === 'ringkasan' ? 700 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Layers size={17} />
                <span>Ringkasan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarNav('reservasi-meja')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeSidebarNav === 'reservasi-meja' ? '#EBF6EE' : 'transparent',
                  color: activeSidebarNav === 'reservasi-meja' ? '#004F27' : '#5A675E',
                  fontWeight: activeSidebarNav === 'reservasi-meja' ? 700 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Calendar size={17} />
                <span>Reservasi Meja</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarNav('turnamen-venue')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeSidebarNav === 'turnamen-venue' ? '#EBF6EE' : 'transparent',
                  color: activeSidebarNav === 'turnamen-venue' ? '#004F27' : '#5A675E',
                  fontWeight: activeSidebarNav === 'turnamen-venue' ? 700 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Trophy size={17} />
                <span>Turnamen & Venue</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarNav('jadwal-sesi')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeSidebarNav === 'jadwal-sesi' ? '#EBF6EE' : 'transparent',
                  color: activeSidebarNav === 'jadwal-sesi' ? '#004F27' : '#5A675E',
                  fontWeight: activeSidebarNav === 'jadwal-sesi' ? 700 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <ClockIcon size={17} />
                <span>Jadwal Sesi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarNav('peringkat-skor')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeSidebarNav === 'peringkat-skor' ? '#EBF6EE' : 'transparent',
                  color: activeSidebarNav === 'peringkat-skor' ? '#004F27' : '#5A675E',
                  fontWeight: activeSidebarNav === 'peringkat-skor' ? 700 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Award size={17} />
                <span>Peringkat & Skor</span>
              </button>
            </nav>
          </div>

          {/* Section: PANEL ADMIN */}
          <div>
            <div style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#7A897F',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              paddingLeft: '12px'
            }}>
              PANEL ADMIN
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveSidebarNav('konfigurasi-meja')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeSidebarNav === 'konfigurasi-meja' ? '#EBF6EE' : 'transparent',
                  color: activeSidebarNav === 'konfigurasi-meja' ? '#004F27' : '#5A675E',
                  fontWeight: activeSidebarNav === 'konfigurasi-meja' ? 700 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Sliders size={17} />
                <span>Konfigurasi Meja</span>
              </button>

              {/* Active Tab: Verifikasi Skor */}
              <button
                type="button"
                onClick={() => setActiveSidebarNav('verifikasi-skor')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeSidebarNav === 'verifikasi-skor' ? '#004F27' : 'transparent',
                  color: activeSidebarNav === 'verifikasi-skor' ? '#FFFFFF' : '#5A675E',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  boxShadow: activeSidebarNav === 'verifikasi-skor' ? '0 2px 8px rgba(0,79,39,0.2)' : 'none'
                }}
              >
                <CheckCircle2 size={17} />
                <span>Verifikasi Skor</span>
              </button>
            </nav>
          </div>

        </div>

        {/* Bottom VIP Badge & Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            backgroundColor: '#DCF1E3',
            border: '1px solid #BDDFCA',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              backgroundColor: '#FFDF94',
              color: '#584300',
              padding: '3px 8px',
              borderRadius: '6px'
            }}>
              VIP Gold
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#004F27' }}>
              Salon Jakarta ⭐
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/admin/login');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              color: '#DC2626',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} />
            <span>Keluar Backoffice</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* TOP NAVBAR */}
        <header style={{
          height: '68px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E4ECE6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          gap: '20px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          {/* Quick Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '22px', fontSize: '13px', fontWeight: 600 }}>
            <Link href="/admin/dashboard" style={{ color: '#004F27', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Dashboard
            </Link>
            <Link href="#" style={{ color: '#5A675E' }}>Event & Venue</Link>
            <Link href="#" style={{ color: '#5A675E' }}>Pemesanan</Link>
            <Link href="#" style={{ color: '#5A675E' }}>Leaderboard</Link>
            <Link href="#" style={{ color: '#5A675E' }}>Jadwal</Link>
          </nav>

          {/* Search, Notifications & Admin Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#F8FAF8',
              border: '1px solid #D7E6DB',
              borderRadius: 'var(--radius-full)',
              padding: '8px 16px',
              width: '260px'
            }}>
              <Search size={15} color="#7A897F" />
              <input
                type="text"
                placeholder="Cari meja, event, pemain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  outline: 'none',
                  fontSize: '12px',
                  color: '#111E18',
                  width: '100%'
                }}
              />
            </div>

            {/* Notification Bell */}
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#F1F5F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2B3830'
              }}>
                <Bell size={18} />
              </div>
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                2
              </span>
            </div>

            {/* User Profile Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#004F27',
                color: '#98F6C2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '13px'
              }}>
                OP
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#111E18', lineHeight: '1.2' }}>
                  {user?.nama || 'Operator Sedayu'}
                </div>
                <div style={{ fontSize: '11px', color: '#7A897F' }}>
                  {user?.email || 'admin@mahjongyuks.id'}
                </div>
              </div>
              <ChevronDown size={14} color="#7A897F" />
            </div>

          </div>
        </header>

        {/* TOAST SUCCESS NOTIFICATION */}
        {actionSuccessToast && (
          <div style={{
            backgroundColor: '#004F27',
            color: '#FFFFFF',
            padding: '12px 24px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-md)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <CheckCircle2 size={18} color="#98F6C2" />
            <span>{actionSuccessToast}</span>
          </div>
        )}

        {/* MAIN BODY CONTAINER */}
        <main style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* HEADER HERO CARD */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px 28px',
            border: '1px solid var(--border-card)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {/* Title & Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                backgroundColor: '#EBF6EE',
                color: '#004F27',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Shield size={26} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111E18' }}>
                    Panel Manajemen Pusat Admin Mahjongyuks
                  </h1>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    backgroundColor: '#98F6C2',
                    color: '#004F27',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    letterSpacing: '0.4px'
                  }}>
                    SUPERADMIN
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#5A675E', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                  <span>Status: Sistem Aktif & Terhubung ke 8 Venue Mitra Riichi & Arena Jakarta-Bandung</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={handleAutoSync}
                disabled={isSyncing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#2B3830',
                  border: '1px solid #D7E6DB',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Otomatis'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewTournamentModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#004F27',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <PlusCircle size={16} />
                <span>Buat Turnamen Baru</span>
              </button>
            </div>
          </div>

          {/* HORIZONTAL MODULE NAVIGATION TABS */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}>
            {[
              { id: 'overview', label: 'Overview & Transaksi', icon: Layers },
              { id: 'event', label: 'Kelola Event', icon: Trophy },
              { id: 'venue', label: 'Kelola Venue', icon: Building },
              { id: 'payment', label: 'Verifikasi Pembayaran', icon: CheckCircle2, hasBadge: true },
              { id: 'score', label: 'Input Poin Turnamen', icon: Award }
            ].map((tab) => {
              const isActive = activeModuleTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveModuleTab(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-full)',
                    border: isActive ? '1px solid #004F27' : '1px solid #D7E6DB',
                    backgroundColor: isActive ? '#004F27' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#2B3830',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  <Icon size={15} color={isActive ? '#98F6C2' : '#5A675E'} />
                  <span>{tab.label}</span>
                  {tab.hasBadge && (
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#EF4444'
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* 4 STAT METRICS CARDS ROW */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '18px'
          }}>
            {/* Card 1: Total Event Aktif */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#7A897F', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  TOTAL EVENT AKTIF
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EBF6EE', color: '#004F27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={16} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#111E18' }}>
                18 <span style={{ fontSize: '14px', fontWeight: 600, color: '#5A675E' }}>Sesi</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                <span style={{ backgroundColor: '#DCF1E3', color: '#004F27', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  12 Competitive
                </span>
                <span style={{ backgroundColor: '#F1F5F2', color: '#5A675E', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  6 Casual
                </span>
              </div>
            </div>

            {/* Card 2: Venue Terdaftar */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#7A897F', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  VENUE TERDAFTAR
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EBF6EE', color: '#004F27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building size={16} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#111E18' }}>
                8 <span style={{ fontSize: '14px', fontWeight: 600, color: '#5A675E' }}>Lokasi</span>
              </div>
              <div style={{ fontSize: '11px', color: '#5A675E' }}>
                Kapasitas Meja: <strong style={{ color: '#004F27' }}>74 Meja Aktif</strong>
              </div>
            </div>

            {/* Card 3: Total Pemesanan Bulan Ini */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#7A897F', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  TOTAL PEMESANAN BULAN INI
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EBF6EE', color: '#004F27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#111E18' }}>
                642 <span style={{ fontSize: '14px', fontWeight: 600, color: '#5A675E' }}>Booking</span>
              </div>
              <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>↑ +18.4% dari bulan lalu (MoM)</span>
              </div>
            </div>

            {/* Card 4: Perlu Tindakan */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#7A897F', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  PERLU TINDAKAN
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Hourglass size={16} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#111E18' }}>
                7 <span style={{ fontSize: '14px', fontWeight: 600, color: '#5A675E' }}>Transaksi</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ color: '#5A675E' }}>Status Transfer:</span>
                <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                  Menunggu Verifikasi
                </span>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN WORKSPACE: LEFT TABLE & RIGHT DESK FORM */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1fr',
            gap: '24px',
            alignItems: 'start'
          }}>
            
            {/* LEFT COLUMN: Verifikasi Pembayaran & Riwayat Transaksi */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '26px',
              border: '1px solid var(--border-card)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              
              {/* Card Header & Filter Tabs */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '4px', height: '18px', backgroundColor: '#004F27', borderRadius: '2px' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18' }}>
                      Verifikasi Pembayaran & Riwayat Transaksi
                    </h2>
                  </div>
                  <p style={{ fontSize: '12px', color: '#5A675E', marginTop: '4px' }}>
                    Validasi bukti mutasi perbankan/QRIS peserta meja turnamen
                  </p>
                </div>

                {/* Filter Tabs: Semua / Menunggu / Berhasil / Ditolak */}
                <div style={{
                  display: 'flex',
                  backgroundColor: '#EBF3EE',
                  borderRadius: '10px',
                  padding: '3px',
                  gap: '2px'
                }}>
                  {(['all', 'pending', 'success', 'rejected'] as const).map((filterKey) => {
                    const isActive = paymentFilter === filterKey;
                    const labels: Record<string, string> = {
                      all: 'Semua',
                      pending: 'Menunggu (7)',
                      success: 'Berhasil',
                      rejected: 'Ditolak'
                    };
                    return (
                      <button
                        key={filterKey}
                        type="button"
                        onClick={() => setPaymentFilter(filterKey)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: isActive ? 800 : 600,
                          backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                          color: isActive ? '#004F27' : '#5A675E',
                          boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {labels[filterKey]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search & Sort Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#F8FAF8',
                  border: '1px solid #D7E6DB',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  flex: 1,
                  maxWidth: '380px'
                }}>
                  <Search size={14} color="#7A897F" />
                  <input
                    type="text"
                    placeholder="Cari Kode Booking (#MJK), Nama, atau Event"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      outline: 'none',
                      fontSize: '12px',
                      color: '#111E18',
                      width: '100%'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#5A675E' }}>
                  <span>URUTKAN:</span>
                  <div style={{
                    backgroundColor: '#F1F5F2',
                    border: '1px solid #D7E6DB',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontWeight: 700,
                    color: '#111E18',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}>
                    <span>Terbaru (Live)</span>
                    <ChevronDown size={12} />
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2EDE5', color: '#7A897F', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 8px' }}>KODE & PEMESAN</th>
                      <th style={{ padding: '10px 8px' }}>EVENT & NOMINAL</th>
                      <th style={{ padding: '10px 8px' }}>WAKTU & BUKTI</th>
                      <th style={{ padding: '10px 8px' }}>STATUS</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>TINDAKAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F2' }}>
                        
                        {/* Kode & Pemesan */}
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ fontWeight: 800, color: '#004F27', fontSize: '13px' }}>
                            {tx.code}
                          </div>
                          <div style={{ fontWeight: 700, color: '#111E18', marginTop: '2px' }}>
                            {tx.playerName}
                          </div>
                          <div style={{ fontSize: '10px', color: '#7A897F' }}>
                            ID Anggota: {tx.playerId}
                          </div>
                        </td>

                        {/* Event & Nominal */}
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ fontWeight: 600, color: '#2B3830' }}>
                            {tx.eventName}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#004F27', marginTop: '2px' }}>
                            {tx.amount}
                          </div>
                          <div style={{ fontSize: '10px', color: '#7A897F' }}>
                            {tx.paymentMethod}
                          </div>
                        </td>

                        {/* Waktu & Bukti */}
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ color: '#2B3830', fontWeight: 600 }}>
                            {tx.time}
                          </div>
                          {tx.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => setShowReceiptModal(tx)}
                              style={{
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#004F27',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: 0
                              }}
                            >
                              <FileText size={13} />
                              <span>{tx.proofType}</span>
                            </button>
                          ) : (
                            <div style={{
                              fontSize: '11px',
                              color: tx.isProofBlur ? '#DC2626' : '#5A675E',
                              marginTop: '4px',
                              fontWeight: tx.isProofBlur ? 700 : 500
                            }}>
                              {tx.proofType}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 8px' }}>
                          {tx.status === 'pending' && (
                            <span style={{
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '11px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706' }} />
                              {tx.statusLabel}
                            </span>
                          )}
                          {tx.status === 'success' && (
                            <span style={{
                              backgroundColor: '#DCF1E3',
                              color: '#004F27',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '11px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <CheckCircle2 size={12} />
                              {tx.statusLabel}
                            </span>
                          )}
                          {tx.status === 'rejected' && (
                            <span style={{
                              backgroundColor: '#FEF2F2',
                              color: '#991B1B',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '11px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <XCircle size={12} />
                              {tx.statusLabel}
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                          {tx.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => handleVerifyTransaction(tx.id)}
                              style={{
                                backgroundColor: '#004F27',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 14px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: 'var(--shadow-sm)'
                              }}
                            >
                              <Check size={12} />
                              <span>Verifikasi</span>
                            </button>
                          ) : (
                            <span style={{ color: '#9CA3AF' }}>—</span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid #E2EDE5',
                fontSize: '12px',
                color: '#7A897F'
              }}>
                <div>
                  Menampilkan <strong>1 - {filteredTransactions.length}</strong> dari <strong>148 transaksi</strong> hari ini
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button type="button" style={{ border: '1px solid #D7E6DB', backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>‹</button>
                  <button type="button" style={{ border: '1px solid #004F27', backgroundColor: '#004F27', color: '#FFFFFF', padding: '4px 8px', borderRadius: '6px', fontWeight: 800 }}>1</button>
                  <button type="button" style={{ border: '1px solid #D7E6DB', backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>2</button>
                  <button type="button" style={{ border: '1px solid #D7E6DB', backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>3</button>
                  <button type="button" style={{ border: '1px solid #D7E6DB', backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>›</button>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Wasit & Tournament Desk Form */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '26px',
              border: '1px solid var(--border-card)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              
              {/* Desk Header */}
              <div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#004F27',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginBottom: '4px'
                }}>
                  <Scale size={12} /> WASIT & TOURNAMENT DESK
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18' }}>
                  Form Input & Koreksi Skor Uma
                </h3>
                <p style={{ fontSize: '12px', color: '#5A675E', marginTop: '2px', lineHeight: '1.4' }}>
                  Input hasil sesi pertandingan Riichi resmi untuk sinkronisasi leaderboard live.
                </p>
              </div>

              {/* Form Input Skor */}
              <form onSubmit={handleScoreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Event Turnamen Dropdown */}
                <div className="form-group">
                  <label className="form-label">Pilih Event Turnamen</label>
                  <select
                    className="form-input"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    style={{ fontSize: '12px', fontWeight: 600, paddingRight: '28px' }}
                  >
                    <option value="Jakarta Riichi Masters Autumn (Season 4)">Jakarta Riichi Masters Autumn (Season 4)</option>
                    <option value="Friday Night Casual Mahjong PIK">Friday Night Casual Mahjong PIK</option>
                    <option value="Sedayu Open Q2 Championship">Sedayu Open Q2 Championship</option>
                  </select>
                </div>

                {/* Pemain Dropdown */}
                <div className="form-group">
                  <label className="form-label">Pilih Pemain (Nama / ID)</label>
                  <select
                    className="form-input"
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    style={{ fontSize: '12px', fontWeight: 600, paddingRight: '28px' }}
                  >
                    <option value="Kevin Sanjaya (#MJY-9201) - 4-Dan">Kevin Sanjaya (#MJY-9201) - 4-Dan</option>
                    <option value="Budi Pratama (#MJY-3042) - 5-Dan">Budi Pratama (#MJY-3042) - 5-Dan</option>
                    <option value="Amanda Wijaya (#MJY-8812) - 3-Dan">Amanda Wijaya (#MJY-8812) - 3-Dan</option>
                    <option value="Rendy Tanaka (#MJY-4401) - 2-Dan">Rendy Tanaka (#MJY-4401) - 2-Dan</option>
                  </select>
                </div>

                {/* 2 Mini Cards: Hasil Meja & Nilai Uma */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{
                    backgroundColor: '#EBF6EE',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    border: '1px solid #D2E7D8'
                  }}>
                    <div style={{ fontSize: '11px', color: '#5A675E', fontWeight: 600 }}>Hasil & Posisi Meja</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#004F27', marginTop: '2px' }}>
                      {selectedRank}
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#EBF6EE',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    border: '1px solid #D2E7D8'
                  }}>
                    <div style={{ fontSize: '11px', color: '#5A675E', fontWeight: 600 }}>Nilai Uma / Oka</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#004F27', marginTop: '2px' }}>
                      {umaScore} Uma
                    </div>
                  </div>
                </div>

                {/* Highlight Point Box */}
                <div style={{
                  backgroundColor: '#DCF1E3',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  border: '1px solid #BDDFCA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#004F27' }}>
                      Poin Akumulasi Ditambahkan
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#004F27', letterSpacing: '-0.5px' }}>
                      {addedPoints} <span style={{ fontSize: '14px', fontWeight: 700 }}>Pts</span>
                    </div>
                  </div>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#004F27',
                    color: '#98F6C2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Sparkles size={18} />
                  </div>
                </div>

                {/* Catatan Wasit Textarea */}
                <div className="form-group">
                  <label className="form-label">Catatan Wasit & Validasi Hanchan</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    value={wasitNotes}
                    onChange={(e) => setWasitNotes(e.target.value)}
                    style={{ fontSize: '11.5px', resize: 'none', lineHeight: '1.4' }}
                  />
                </div>

                {/* Submit Score Button */}
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    backgroundColor: '#004F27',
                    height: '46px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Check size={16} />
                  <span>Simpan & Sinkronkan ke Leaderboard</span>
                </button>
              </form>

              {/* Notice info */}
              <div style={{
                backgroundColor: '#F8FAF8',
                border: '1px solid #E2EDE5',
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '11px',
                color: '#5A675E',
                lineHeight: '1.45',
                display: 'flex',
                gap: '8px'
              }}>
                <span style={{ color: '#004F27', fontWeight: 800 }}>ⓘ</span>
                <span>Setiap pembaruan nilai Uma akan memicu kalkulasi rating ELO pemain secara instan di layar proyektor arena dan aplikasi pemain.</span>
              </div>

            </div>

          </div>

          {/* BOTTOM SECTION: Realtime Table Utilization & Logistics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px',
            alignItems: 'stretch'
          }}>
            
            {/* Left Box: Monitoring Utilisasi Meja Venue Realtime */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={18} color="#004F27" />
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111E18' }}>
                    Monitoring Utilisasi Meja Venue Realtime
                  </h3>
                </div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  backgroundColor: '#DCF1E3',
                  color: '#004F27',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                  LIVE FEED
                </span>
              </div>

              {/* 3 Venue Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                
                {/* Venue 1: Senopati */}
                <div style={{
                  backgroundColor: '#F8FAF8',
                  borderRadius: '14px',
                  padding: '16px 14px',
                  border: '1px solid #E2EDE5',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#111E18' }}>
                      Mahjongyuks Senopati
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#004F27' }}>
                      88%
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#5A675E' }}>
                    22 / 25 Meja Terpakai
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#E2EDE5', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '88%', height: '100%', backgroundColor: '#004F27', borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#16A34A', fontWeight: 700 }}>
                    3 Meja Tersedia (Sesi Siang)
                  </div>
                </div>

                {/* Venue 2: Salon PIK */}
                <div style={{
                  backgroundColor: '#F8FAF8',
                  borderRadius: '14px',
                  padding: '16px 14px',
                  border: '1px solid #E2EDE5',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#111E18' }}>
                      Mahjongyuks Salon PIK
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#004F27' }}>
                      75%
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#5A675E' }}>
                    15 / 20 Meja Terpakai
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#E2EDE5', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '75%', height: '100%', backgroundColor: '#004F27', borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#16A34A', fontWeight: 700 }}>
                    5 Meja Tersedia
                  </div>
                </div>

                {/* Venue 3: Arena Dago */}
                <div style={{
                  backgroundColor: '#F8FAF8',
                  borderRadius: '14px',
                  padding: '16px 14px',
                  border: '1px solid #E2EDE5',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#111E18' }}>
                      Mahjongyuks Arena Dago
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#D97706' }}>
                      60%
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#5A675E' }}>
                    6 / 10 Meja Terpakai
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#E2EDE5', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '60%', height: '100%', backgroundColor: '#D97706', borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#5A675E', fontWeight: 600 }}>
                    4 Meja Tersedia
                  </div>
                </div>

              </div>
            </div>

            {/* Right Box: Logistics Hotline */}
            <div style={{
              backgroundColor: '#E8F5EC',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid #C8E6D2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 900,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}>
                  中
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#004F27' }}>
                    Butuh Meja Otomatis Tambahan?
                  </div>
                  <div style={{ fontSize: '11px', color: '#455A4C', marginTop: '2px' }}>
                    Hubungi tim logistik Mahjongyuks
                  </div>
                </div>
              </div>

              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  color: '#004F27',
                  border: '1px solid #C8E6D2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                <Phone size={18} />
              </a>
            </div>

          </div>

        </main>
      </div>

      {/* MODAL: LIHAT BUKTI BAYAR */}
      {showReceiptModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
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
            maxWidth: '460px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setShowReceiptModal(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', color: '#7A897F' }}
            >
              <X size={20} />
            </button>

            <div>
              <span className="badge-pill badge-mint" style={{ fontSize: '10px' }}>
                AUDIT BUKTI BAYAR
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', marginTop: '4px' }}>
                Verifikasi Pembayaran {showReceiptModal.code}
              </h3>
              <p style={{ fontSize: '12px', color: '#5A675E' }}>
                Peserta: <strong>{showReceiptModal.playerName}</strong> ({showReceiptModal.playerId})
              </p>
            </div>

            {/* Simulated Receipt Display */}
            <div style={{
              backgroundColor: '#F8FAF8',
              border: '2px dashed #BDDFCA',
              borderRadius: '14px',
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#DCF1E3', color: '#004F27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={24} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#111E18' }}>
                {showReceiptModal.amount}
              </div>
              <div style={{ fontSize: '11px', color: '#7A897F' }}>
                Metode: {showReceiptModal.paymentMethod}
              </div>
              <div style={{ fontSize: '11px', color: '#5A675E' }}>
                Waktu Transaksi: {showReceiptModal.time}
              </div>
              <div style={{ fontSize: '10px', backgroundColor: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #E2EDE5', color: '#004F27', fontWeight: 700 }}>
                Trace ID: QRIS-BCA-98124018512
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleRejectTransaction(showReceiptModal.id)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Tolak Bukti
              </button>

              <button
                type="button"
                onClick={() => handleVerifyTransaction(showReceiptModal.id)}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  backgroundColor: '#004F27'
                }}
              >
                ✓ Verifikasi Valid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUAT TURNAMEN BARU */}
      {showNewTournamentModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
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
            maxWidth: '480px',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setShowNewTournamentModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', color: '#7A897F' }}
            >
              <X size={20} />
            </button>

            <div>
              <span className="badge-pill badge-gold" style={{ fontSize: '10px' }}>
                SPV & TOURNAMENT DESK
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', marginTop: '4px' }}>
                Buat Turnamen / Sesi Baru
              </h3>
              <p style={{ fontSize: '12px', color: '#5A675E' }}>
                Jadwalkan turnamen resmi dengan sinkronisasi Leaderboard otomatis.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Nama Turnamen</label>
              <input type="text" className="form-input" placeholder="Contoh: Sedayu Riichi Open Q3" defaultValue="Sedayu Open Q3 Championship" />
            </div>

            <div className="form-group">
              <label className="form-label">Lokasi Venue Mitra</label>
              <select className="form-input">
                <option>Alicia Bakery Sedayu City (Hub 01)</option>
                <option>Mahjong Lounge Senopati</option>
                <option>Green Bamboo Club PIK</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Tanggal Sesi</label>
                <input type="date" className="form-input" defaultValue="2025-11-01" />
              </div>
              <div className="form-group">
                <label className="form-label">Biaya / Tiket</label>
                <input type="text" className="form-input" defaultValue="Rp 150.000" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowNewTournamentModal(false);
                setActionSuccessToast('Turnamen baru berhasil dijadwalkan!');
                setTimeout(() => setActionSuccessToast(''), 3000);
              }}
              className="btn-primary"
              style={{ backgroundColor: '#004F27', marginTop: '8px' }}
            >
              Publikasikan Turnamen →
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple clock icon component helper
function ClockIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
