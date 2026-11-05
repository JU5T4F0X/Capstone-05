'use client';

import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import ApiClient from '@/lib/api';
import { normalizeKemahiran } from '@/lib/kemahiran';

interface LeaderboardPreviewProps {
  onViewFullLeaderboard: () => void;
}

export default function LeaderboardPreview({ onViewFullLeaderboard }: LeaderboardPreviewProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    ApiClient.getLeaderboard({ limit: 6 })
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data)) {
          setPlayers(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const topPlayer = players[0] || null;

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
              Peringkat resmi dihitung berdasarkan akumulasi poin Hong Kong Mahjong Style dari seluruh pertandingan resmi terakreditasi.
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
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E4E0D8' }}>
            <Loader2 size={30} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px', display: 'block', color: '#183629' }} />
            <p style={{ margin: 0, fontSize: '13px', color: '#5A675E' }}>Memuat peringkat atlet resmi...</p>
          </div>
        ) : players.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E4E0D8' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#183629' }}>Belum ada pertandingan resmi yang selesai tercatat.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
            {/* Left: Spotlight Card for #1 National Leader */}
            {topPlayer && (
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
                    Musim 2025/2026
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
                    {topPlayer.initials || topPlayer.name?.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#141A17', letterSpacing: '-0.01em' }}>
                      {topPlayer.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#78807B', marginTop: '2px' }}>
                      Pemain Terdaftar
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
                    {normalizeKemahiran(topPlayer.danRank || topPlayer.tingkat_kemahiran)}
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
                      Poin Akumulasi
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#183629', marginTop: '2px' }}>
                      {Number(topPlayer.eloRating ?? topPlayer.points ?? 0).toLocaleString('id-ID')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#78807B' }}>pts</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#78807B', fontWeight: 500, textTransform: 'uppercase' }}>
                      Tingkat Kemenangan
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#141A17', marginTop: '2px' }}>
                      {topPlayer.winRate || '0.0%'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#78807B' }}>{topPlayer.totalMatches || 0} Ronde</div>
                  </div>
                </div>
              </div>
            )}

            {/* Right: Clean High-Density Table */}
            <div
              style={{
                gridColumn: topPlayer ? 'span 12' : 'span 12',
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
                        Poin
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => (
                      <tr
                        key={player.player_id || player.rank}
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
                          {player.club || 'MahjongYuks Sedayu City'}
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
                            {normalizeKemahiran(player.danRank || player.tingkat_kemahiran)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: '#183629', textAlign: 'right' }}>
                          {Number(player.eloRating ?? player.points ?? 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
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
