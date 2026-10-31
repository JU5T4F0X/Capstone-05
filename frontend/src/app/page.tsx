'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { EventSession } from '@/types/mahjong';
import '@/components/landing/landing.css';

import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingHero from '@/components/landing/LandingHero';
import FeaturedEvents from '@/components/landing/FeaturedEvents';
import VenueShowcase from '@/components/landing/VenueShowcase';
import LeaderboardPreview from '@/components/landing/LeaderboardPreview';
import HowItWorks from '@/components/landing/HowItWorks';
import CtaBanner from '@/components/landing/CtaBanner';
import LandingModals from '@/components/landing/LandingModals';

export default function LandingPage() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [showRulebookModal, setShowRulebookModal] = useState(false);
  const [showPartnershipModal, setShowPartnershipModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingTarget, setPendingTarget] = useState('Pemesanan Meja');

  const handleSecureBooking = (targetName: string = 'Pemesanan Meja') => {
    if (!token || !user) {
      setPendingTarget(targetName);
      setShowAuthModal(true);
      return;
    }

    if (user.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSelectEvent = (event: EventSession) => {
    handleSecureBooking(`Sesi ${event.title}`);
  };

  const handleSelectBranch = (branchName: string) => {
    handleSecureBooking(`Venue ${branchName}`);
  };

  const handleViewFullLeaderboard = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      handleSecureBooking('Klasemen Penuh');
    }
  };

  return (
    <div className="landing-root">
      {/* 1. Main Sticky Header (Navbar directly at the top) */}
      <LandingNavbar onSecureBooking={handleSecureBooking} />

      {/* 3. Hero Layout with 4 Info Cards & Call to Action */}
      <LandingHero
        onSecureBooking={handleSecureBooking}
        onShowRulebook={() => setShowRulebookModal(true)}
      />

      {/* 4. Structured 3-Column Catalog Grid */}
      <FeaturedEvents onSelectEvent={handleSelectEvent} />

      {/* 6. Magazine-Style Split Feature with Branch Switcher */}
      <VenueShowcase
        onOpenPartnership={() => setShowPartnershipModal(true)}
        onSelectBranch={handleSelectBranch}
      />

      {/* 7. National Leaderboard: Spotlight Card + High-Density Table */}
      <LeaderboardPreview onViewFullLeaderboard={handleViewFullLeaderboard} />

      {/* 8. Minimalist Horizontal Timeline / Process Strip */}
      <HowItWorks />

      {/* 9. Final Call to Action Banner */}
      <CtaBanner onSecureBooking={handleSecureBooking} />

      {/* Modals: Rulebook, Partnership, and Auth Redirection */}
      <LandingModals
        showRulebook={showRulebookModal}
        onCloseRulebook={() => setShowRulebookModal(false)}
        showPartnership={showPartnershipModal}
        onClosePartnership={() => setShowPartnershipModal(false)}
        showAuth={showAuthModal}
        onCloseAuth={() => setShowAuthModal(false)}
        pendingTarget={pendingTarget}
      />
    </div>
  );
}
