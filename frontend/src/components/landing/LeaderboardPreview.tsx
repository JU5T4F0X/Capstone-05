'use client';

import React from 'react';
import { Award, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';
import { LEADERBOARD_PLAYERS } from '@/lib/mock-data';
import { normalizeKemahiran } from '@/lib/kemahiran';

interface LeaderboardPreviewProps {
  onViewFullLeaderboard: () => void;
}

export default function LeaderboardPreview({ onViewFullLeaderboard }: LeaderboardPreviewProps) {
  const topPlayer = LEADERBOARD_PLAYERS[0];

  return (
    <section id="leaderboard" className="landing-section">
      <div className="landing-container">
        {/* Section Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
          <div>
            <div className="landing-section-subtitle">
              Sirkuit Nasional 2025
            </div>
            <h2 className="landing-section-title">
              Leaderboard Resmi Atlet
            </h2>
            <p className="landing-section-desc">
              Peringkat resmi dihitung berdasarkan regulasi World Riichi Championship dari seluruh turnamen resmi terakreditasi.
            </p>
          </div>

          <button
            type="button"
            onClick={onViewFullLeaderboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#183629',
              fontSize: '13px',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>Lihat Leaderboard Lengkap</span>
            <ArrowRight size={14} strokeWidth={1.75} />
          </button>
        </div>

        {/* 2-Part Competitive View */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
          {/* Left: Spotlight Card for #1 National Leader */}
          <div
            style={{
              gridColumn: 'span 12',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E4E0D8',
              borderRadius: '12px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 10px rgba(20, 26, 23, 0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}
            className="leaderboard-spotlight-col"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#F9F5EA',
                  border: '1px solid #C59B27',
                  color: '#B8860B',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '4px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <Award size={13} strokeWidth={2} color="#B8860B" />
                Peringkat 1 Nasional
              </span>

              <span style={{ fontSize: '11px', color: '#78807B', fontWeight: 500 }}>
                Musim 2025
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '10px',
                  backgroundColor: '#183629',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              >
                {topPlayer.initials}
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#141A17', letterSpacing: '-0.01em' }}>
                  {topPlayer.name}
                </h3>
                <div style={{ fontSize: '13px', color: '#78807B', marginTop: '2px' }}>
                  {topPlayer.club}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: '#F2EFE9',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#183629',
                marginBottom: '24px',
                width: 'fit-content',
              }}
            >
              <ShieldCheck size={14} color="#183629" />
              <span>
                {normalizeKemahiran(topPlayer.danRank)}
              </span>
            </div>

            {/* Performance Metrics Box */}
            <div
              style={{
                marginTop: 'auto',
                backgroundColor: '#FAF8F5',
                border: '1px solid #E4E0D8',
                borderRadius: '8px',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#78807B', fontWeight: 500, textTransform: 'uppercase' }}>
                  Rating Elo
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#183629', marginTop: '2px' }}>
                  {topPlayer.eloRating.toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: '11px', color: '#78807B' }}>pts</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#78807B', fontWeight: 500, textTransform: 'uppercase' }}>
                  Tingkat Kemenangan
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#141A17', marginTop: '2px' }}>
                  {topPlayer.winRate}
                </div>
                <div style={{ fontSize: '11px', color: '#78807B' }}>{topPlayer.totalMatches} Ronde</div>
              </div>
            </div>
          </div>

          {/* Right: Clean High-Density Table */}
          <div
            style={{
              gridColumn: 'span 12',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E4E0D8',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(20, 26, 23, 0.04)',
            }}
            className="leaderboard-table-col"
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FAF8F5', borderBottom: '1px solid #E4E0D8' }}>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#78807B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Pos
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#78807B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Atlet
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#78807B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Klub / Afiliasi
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#78807B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Tingkat
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#78807B', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>
                      Poin Elo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {LEADERBOARD_PLAYERS.map((player) => (
                    <tr
                      key={player.rank}
                      style={{
                        borderBottom: '1px solid #E4E0D8',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: player.rank <= 3 ? '#B8860B' : '#78807B' }}>
                        #{player.rank}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#141A17' }}>
                          {player.name}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#4A524D' }}>
                        {player.club}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#F2EFE9',
                            color: '#183629',
                          }}
                        >
                          {normalizeKemahiran(player.danRank)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: '#183629', textAlign: 'right' }}>
                        {player.eloRating.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 992px) {
          :global(.leaderboard-spotlight-col) {
            grid-column: span 4 !important;
          }
          :global(.leaderboard-table-col) {
            grid-column: span 8 !important;
          }
        }
      `}</style>
    </section>
  );
}
