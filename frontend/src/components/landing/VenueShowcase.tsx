'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Clock, MapPin, Layers, ArrowRight } from 'lucide-react';
import { VENUE_BRANCHES } from '@/lib/mock-data';

interface VenueShowcaseProps {
  onOpenPartnership: () => void;
  onSelectBranch: (branchName: string) => void;
}

export default function VenueShowcase({ onOpenPartnership, onSelectBranch }: VenueShowcaseProps) {
  const [activeBranchId, setActiveBranchId] = useState(VENUE_BRANCHES[0].id);

  const currentBranch =
    VENUE_BRANCHES.find((b) => b.id === activeBranchId) || VENUE_BRANCHES[0];

  return (
    <section id="venues" className="landing-section landing-section-alt">
      <div className="landing-container">
        {/* Section Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
          <div style={{ maxWidth: '640px' }}>
            <div className="landing-section-subtitle">
              Jaringan Venue Resmi
            </div>
            <h2 className="landing-section-title">
              Suasana Venue Modern, Tenang &amp; Higienis
            </h2>
            <p className="landing-section-desc">
              Setiap cabang dirancang untuk kenyamanan bermain optimal dengan meja otomatis senyap, filter udara HEPA, dan layanan lounge.
            </p>
          </div>

          <Link
            href="/venues"
            className="landing-btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Informasi Lengkap Venue</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Branch Selector Tabs (Hanya ditampilkan jika lebih dari 1 lokasi) */}
        {VENUE_BRANCHES.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {VENUE_BRANCHES.map((branch) => {
              const isActive = branch.id === currentBranch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => setActiveBranchId(branch.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    backgroundColor: isActive ? '#183629' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#4A524D',
                    border: isActive ? '1px solid #183629' : '1px solid #E4E0D8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {branch.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Split 2-Column Feature */}
        <div className="landing-venue-box">
          {/* Left: Photo */}
          <div className="landing-venue-photo-side">
            <Image
              src={currentBranch.image}
              alt={currentBranch.name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 880px) 100vw, 50vw"
            />
            {/* Subtle Location Pill */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                backgroundColor: 'rgba(20, 26, 23, 0.78)',
                backdropFilter: 'blur(6px)',
                color: '#FAF8F5',
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <MapPin size={13} color="#C59B27" />
              <span>{currentBranch.area}</span>
            </div>
          </div>

          {/* Right: Key Details */}
          <div className="landing-venue-info-side">
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#B8860B',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              {currentBranch.city} • {currentBranch.tableCount} Meja {currentBranch.tableType}
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#141A17', marginBottom: '12px', letterSpacing: '-0.01em' }}>
              {currentBranch.name}
            </h3>

            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#4A524D', marginBottom: '20px' }}>
              {currentBranch.description}
            </p>

            {/* Checklist of Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {currentBranch.features.map((feature, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#F9F5EA',
                      color: '#B8860B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  <span style={{ fontSize: '13px', color: '#4A524D' }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Operational Metadata */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#FAF8F5',
                border: '1px solid #E4E0D8',
                borderRadius: '6px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={14} color="#183629" />
                <span style={{ fontSize: '12px', color: '#4A524D' }}>
                  {currentBranch.hours}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} color="#183629" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#141A17' }}>
                  {currentBranch.tableCount} Meja Otomatis
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => onSelectBranch(currentBranch.name)}
                className="landing-btn-reserve"
                style={{ padding: '10px 20px' }}
              >
                <span>Reservasi Kursi di Cabang Ini</span>
                <ArrowRight size={14} strokeWidth={2} />
              </button>

              <Link
                href={`/venues/${currentBranch.id === 'senopati' ? 2 : currentBranch.id === 'pik' ? 3 : 1}`}
                className="landing-btn-secondary"
                style={{ padding: '10px 18px', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Profil Lengkap Lokasi</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Partnership Strip */}
        <div
          style={{
            backgroundColor: '#FAF8F5',
            border: '1px solid #E4E0D8',
            borderRadius: '10px',
            padding: '24px 28px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Program Kemitraan Venue
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#141A17', marginTop: '2px' }}>
              Memiliki Ruang Usaha atau Ingin Membuka Cabang Mahjongyuks?
            </div>
            <div style={{ fontSize: '13px', color: '#4A524D', marginTop: '2px' }}>
              Dukungan pengadaan meja otomatis Amos Rexx, lisensi sistem penilaian WRC, dan akses ke ribuan pemain aktif.
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPartnership}
            className="landing-btn-secondary"
            style={{ padding: '10px 18px', fontSize: '13px', whiteSpace: 'nowrap' }}
          >
            <span>Konsultasi Kemitraan</span>
            <ArrowRight size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </section>
  );
}
