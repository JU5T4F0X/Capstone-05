'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Bell,
  LogOut,
  Shield,
  Home,
  User as UserIcon,
  Menu,
  X,
  ArrowRight
} from 'lucide-react';
import '@/components/landing/landing.css';
import '@/app/(app)/dashboard/dashboard.css';
import { normalizeKemahiran, KEMAHIRAN_MAP } from '@/lib/kemahiran';

interface DashboardNavbarProps {
  activeItem?: 'dashboard' | 'events' | 'jadwal' | 'pemesanan' | 'leaderboard' | 'profil' | string;
  activeNav?: string;
  setActiveNav?: (item: string) => void;
  onOpenBooking?: () => void;
  onScrollToLeaderboard?: () => void;
}

export default function DashboardNavbar({
  activeItem,
  activeNav,
  setActiveNav,
  onOpenBooking,
  onScrollToLeaderboard,
}: DashboardNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-detect active navigation based on pathname if not explicitly passed
  const detectActive = (): string => {
    if (activeItem) return activeItem;
    if (activeNav) return activeNav;
    if (!pathname) return 'dashboard';
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname.startsWith('/events')) return 'events';
    if (pathname.startsWith('/jadwal')) return 'jadwal';
    if (pathname.startsWith('/pemesanan')) return 'pemesanan';
    if (pathname.startsWith('/leaderboard')) return 'leaderboard';
    if (pathname.startsWith('/profil')) return 'profil';
    return 'dashboard';
  };

  const currentActive = detectActive();

  const userName = user?.nama || 'Pemain';
  const kemahiranLevel = normalizeKemahiran(user?.kemahiran || user?.tingkat_kemahiran || user?.dan_rank);
  const kemahiranDetail = KEMAHIRAN_MAP[kemahiranLevel];

  // Close user dropdown when clicking outside
  useEffect(() => {
    if (!userDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.db-user-profile-wrap')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userDropdownOpen]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { id: 'events', label: 'Event', href: '/events' },
    { id: 'jadwal', label: 'Jadwal', href: '/jadwal' },
    { id: 'pemesanan', label: 'Pemesanan', href: '/pemesanan' },
    { id: 'leaderboard', label: 'Leaderboard', href: '/leaderboard' },
    { id: 'profil', label: 'Profil', href: '/profil' },
  ];

  return (
    <header className="landing-header">
      <div className="db-container">
        <div className="db-header-inner">
          {/* 1. Kiri: Logo Brand & Mode Switcher (HANYA jika user memiliki role admin) */}
          <div className="db-header-left">
            <Link href="/" className="landing-brand" title="Mahjongyuks Beranda">
              <Image
                src="/assets/mahjongyuks_logo.png"
                alt="Mahjongyuks Logo"
                width={60}
                height={44}
                priority
                className="landing-logo-img"
              />
            </Link>

            {user?.role === 'admin' && (
              <div className="db-header-mode-toggle" title="Pilihan Mode Tampilan">
                <button
                  type="button"
                  className="db-mode-pill-btn active"
                  disabled
                >
                  <span className="db-mode-dot" /> Mode Pemain
                </button>
                <Link
                  href="/admin/dashboard"
                  className="db-mode-pill-btn"
                  title="Beralih ke Dashboard Admin"
                >
                  Mode Admin
                </Link>
              </div>
            )}
          </div>

          {/* 2. Tengah: Navigasi Khusus Player (Dashboard, Event, Jadwal, Pemesanan, Leaderboard, Profil) */}
          <nav className="landing-header-center" aria-label="Navigasi Dashboard Player">
            <ul className="landing-nav-menu">
              {navItems.map((item) => {
                const isActive = currentActive === item.id;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`landing-nav-link ${isActive ? 'active' : ''}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* 3. Kanan: Search, Notifikasi, Identitas Player & Tombol Logout */}
          <div className="db-header-right">
            {/* Search Box */}
            <div className="db-search-box">
              <Search size={14} color="#8DA79B" />
              <input
                type="text"
                placeholder="Cari sesi, meja..."
                className="db-search-input"
                aria-label="Cari"
              />
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="db-header-icon-btn"
              title="Notifikasi"
              aria-label="Notifikasi"
            >
              <Bell size={16} />
              <span className="db-header-notif-dot" />
            </button>

            {/* User Profile Pill & Dropdown */}
            <div className="db-user-profile-wrap">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="db-user-pill-btn"
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
                title="Menu Profil Akun"
              >
                <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
                  <Image
                    src={user?.avatar_url || '/assets/avatar_kevin.jpg'}
                    alt={userName}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <span style={{ fontWeight: 600 }}>
                  {userName.split(' ')[0]}
                </span>
                <span className="db-user-pill-rank" style={{ backgroundColor: kemahiranDetail.badgeBg, color: kemahiranDetail.badgeColor, border: 'none' }}>
                  {kemahiranDetail.level}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="db-user-dropdown-menu">
                  <div className="db-dropdown-header">
                    <div className="db-dropdown-user-name">{userName}</div>
                    <div className="db-dropdown-user-email">{user?.email || 'player@mahjongyuks.id'}</div>
                    <div className="db-dropdown-role-tag" style={{ backgroundColor: kemahiranDetail.badgeBg, color: kemahiranDetail.badgeColor }}>
                      Kemahiran: {kemahiranDetail.level}
                    </div>
                  </div>

                  <div className="db-dropdown-divider" />

                  <Link
                    href="/profil"
                    onClick={() => setUserDropdownOpen(false)}
                    className="db-dropdown-item"
                  >
                    <UserIcon size={14} />
                    <span>Pengaturan Profil</span>
                  </Link>

                  {user?.role === 'admin' && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="db-dropdown-item admin-switch"
                    >
                      <Shield size={14} />
                      <span>Beralih ke Mode Admin</span>
                    </Link>
                  )}

                  <Link
                    href="/"
                    onClick={() => setUserDropdownOpen(false)}
                    className="db-dropdown-item"
                  >
                    <Home size={14} />
                    <span>Halaman Utama (Landing)</span>
                  </Link>

                  <div className="db-dropdown-divider" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="db-dropdown-item logout"
                  >
                    <LogOut size={14} />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dedicated Logout Icon Action */}
            <button
              type="button"
              onClick={handleLogout}
              className="db-header-icon-btn"
              title="Keluar dari akun"
              aria-label="Logout"
            >
              <LogOut size={16} color="#D3DFD8" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="landing-mobile-menu-btn db-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`landing-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = currentActive === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`landing-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{item.label}</span>
                <ArrowRight size={16} color="#8DA79B" />
              </Link>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden' }}>
              <Image
                src={user?.avatar_url || '/assets/avatar_kevin.jpg'}
                alt={userName}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FAF8F5' }}>{userName}</div>
              <div style={{ fontSize: '10.5px', color: '#8DA79B' }}>Kemahiran: {kemahiranDetail.level}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="db-dropdown-item logout"
            style={{ padding: '10px 12px', justifyContent: 'center' }}
          >
            <LogOut size={15} />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>
    </header>
  );
}
