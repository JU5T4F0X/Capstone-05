'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import LandingNavbar from '@/components/landing/LandingNavbar';
import '@/components/landing/landing.css';
import '@/app/(app)/dashboard/dashboard.css';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine whether this route is publicly viewable without authentication
  const isPublicRoute =
    pathname?.startsWith('/events') ||
    pathname?.startsWith('/jadwal');

  // Check if user session exists (either in React state or localStorage)
  const hasSession = Boolean(
    user || (typeof window !== 'undefined' && localStorage.getItem('mahjongyuks_user'))
  );

  // Header Selection Rule:
  // 1. If user is logged in (hasSession) -> ALWAYS use DashboardNavbar across ALL player pages
  // 2. If user is NOT logged in:
  //    - On public routes (/events, /jadwal) -> use LandingNavbar (public visitor view)
  //    - On player-only routes (/dashboard, /pemesanan, /leaderboard, /profil) -> use DashboardNavbar
  const showPublicNavbar = isPublicRoute && !hasSession;

  return (
    <div className="player-app-shell">
      {showPublicNavbar ? (
        <LandingNavbar />
      ) : (
        <DashboardNavbar />
      )}
      {children}
    </div>
  );
}

