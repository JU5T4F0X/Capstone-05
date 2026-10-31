'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { User as UserIcon, ChevronDown, Calendar, LogOut, Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LandingNavbarProps {
  onSecureBooking?: (target?: string) => void;
  activeItem?: string;
}

export default function LandingNavbar({ activeItem }: LandingNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(activeItem || 'beranda');
  const [isScrolled, setIsScrolled] = useState(false);

  // Sync active section with activeItem prop or pathname
  useEffect(() => {
    if (activeItem) {
      setActiveSection(activeItem);
      return;
    }
    if (pathname?.startsWith('/events')) {
      setActiveSection('events');
    } else if (pathname?.startsWith('/jadwal')) {
      setActiveSection('jadwal');
    } else if (pathname?.startsWith('/venues')) {
      setActiveSection('venues');
    } else if (pathname === '/') {
      setActiveSection('beranda');
    }
  }, [activeItem, pathname]);

  // Navigasi informasi publik: Beranda, Event, Jadwal, Venue
  const navItems = [
    { id: 'beranda', label: 'Beranda', href: '/' },
    { id: 'events', label: 'Event', href: '/events' },
    { id: 'jadwal', label: 'Jadwal', href: '/jadwal' },
    { id: 'venues', label: 'Venue', href: '/venues' },
  ];

  // Scroll effect on public pages to toggle scrolled style (subtle shadow & elevated background)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.landing-header-right')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen]);

  return (
    <header className={`landing-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="landing-container">
        <div className="landing-header-inner">
          {/* 1. Kiri: Logo Mahjongyuks */}
          <div className="landing-header-left">
            <Link href="/" className="landing-brand" onClick={() => setActiveSection('beranda')}>
              <Image
                src="/assets/mahjongyuks_logo.png"
                alt="Mahjongyuks Logo"
                width={60}
                height={44}
                priority
                className="landing-logo-img"
              />
            </Link>
          </div>

          {/* 2. Tengah: Menu Informasi Publik (Beranda, Event, Jadwal, Venue) */}
          <nav className="landing-header-center" aria-label="Navigasi Informasi Publik">
            <ul className="landing-nav-menu">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`landing-nav-link ${isActive ? 'active' : ''}`}
                      onClick={(e) => {
                        if (item.href === '/' && pathname === '/') {
                          e.preventDefault();
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                        setActiveSection(item.id);
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* 3. Kanan: Tombol Login & Tombol Daftar (Atau Profil jika sudah login) */}
          <div className="landing-header-right">
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="landing-btn-user-pill"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  title="Menu Akun"
                >
                  <UserIcon size={15} color="#E2BC55" />
                  <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.nama ? user.nama.split(' ')[0] : user.email?.split('@')[0]}
                  </span>
                  <ChevronDown size={13} color="#8DA79B" />
                </button>

                {userMenuOpen && (
                  <div className="landing-user-dropdown">
                    <Link
                      href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                      onClick={() => setUserMenuOpen(false)}
                      className="landing-user-dropdown-item"
                    >
                      <Calendar size={14} />
                      <span>Buka Dashboard</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="landing-user-dropdown-item landing-user-dropdown-logout"
                    >
                      <LogOut size={14} />
                      <span>Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/login" className="landing-btn-login-outline">
                  <UserIcon size={14} color="#E2BC55" />
                  <span>Login</span>
                </Link>
                <Link href="/register" className="landing-btn-register-solid">
                  <span>Daftar</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="landing-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Buka navigasi menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`landing-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="landing-mobile-link"
              onClick={() => {
                setActiveSection(item.id);
                setMobileMenuOpen(false);
              }}
            >
              <span>{item.label}</span>
              <ArrowRight size={16} color="#8DA79B" />
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
          {user ? (
            <Link
              href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
              className="landing-btn-login-outline"
              style={{ padding: '12px', justifyContent: 'center' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calendar size={15} />
              <span>Buka Dashboard</span>
            </Link>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Link
                href="/login"
                className="landing-btn-login-outline"
                style={{ padding: '10px', justifyContent: 'center' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="landing-btn-register-solid"
                style={{ padding: '10px', justifyContent: 'center' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
