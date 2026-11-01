'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ApiClient from '@/lib/api';
import Link from 'next/link';
import {
  Award,
  TrendingUp,
  ShieldCheck,
  Search,
  Star,
  Users,
  Trophy,
  Flame,
  ChevronRight
} from 'lucide-react';
import { LEADERBOARD_PLAYERS } from '@/lib/mock-data';
import { normalizeKemahiran, KEMAHIRAN_MAP } from '@/lib/kemahiran';
import '@/app/events-venues/events-venues.css';

export default function LeaderboardPage() {
  const [activeTier, setActiveTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [livePlayers, setLivePlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchLeaderboard() {
      try {
        const res = await ApiClient.getLeaderboard();
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setLivePlayers(res.data);
        }
      } catch (e) {
        console.error('Failed to load leaderboard', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchLeaderboard();
    return () => { isMounted = false; };
  }, []);

  const playerList = livePlayers.length > 0 ? livePlayers : LEADERBOARD_PLAYERS;
  const topPlayer = playerList[0];

  const filteredPlayers = useMemo(() => {
    return playerList.filter((player) => {
      const matchSearch =
        searchQuery === '' ||
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.club.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.rankTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const playerKemahiran = normalizeKemahiran(player.danRank);
      const matchTier =
        activeTier === 'all' ||
        playerKemahiran.toLowerCase() === activeTier.toLowerCase();

      return matchSearch && matchTier;
    });
  }, [searchQuery, activeTier]);

  return (
    <div className="ev-page-wrapper">
      {/* Hero Header */}
      <section className="ev-hero-section">
        <div className="ev-container">
          <nav aria-label="Breadcrumb" className="ev-breadcrumbs">
            <Link href="/dashboard">Dashboard</Link>
            <span className="separator">/</span>
            <span className="current">Leaderboard Nasional</span>
          </nav>

          <h1 className="ev-hero-title">Klasemen Resmi Atlet MahjongYuks</h1>
          <p className="ev-hero-subtitle">
            Peringkat kompetitif atlet dihitung secara transparan berdasarkan regulasi World Riichi Championship (WRC) dari seluruh turnamen resmi berlisensi.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="ev-container" style={{ flex: 1, padding: '32px 0 64px 0' }}>
        {/* Spotlight Card: Peringkat #1 Nasional */}
        {topPlayer && (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2BC55',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '32px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            boxShadow: '0 4px 20px rgba(226, 188, 85, 0.12)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              right: '-10px',
              top: '-10px',
              fontSize: '120px',
              fontWeight: 900,
              color: 'rgba(226, 188, 85, 0.06)',
              userSelect: 'none',
              pointerEvents: 'none'
            }}>
              #1
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '1 1 360px', zIndex: 1 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: topPlayer.avatarBg || '#183629',
                  color: '#FAF8F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '24px',
                  border: '3px solid #E2BC55',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {topPlayer.initials}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  backgroundColor: '#E2BC55',
                  color: '#183629',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '11px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  👑
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    backgroundColor: '#FEF9EE',
                    color: '#B8860B',
                    border: '1px solid #E2BC55',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    PERINGKAT #1 NASIONAL
                  </span>
                  <span style={{ fontSize: '12px', color: '#7A897F' }}>
                    {topPlayer.danRank}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#111E18' }}>
                  {topPlayer.name}
                </h2>
                <div style={{ fontSize: '12.5px', color: '#5A675E', marginTop: '4px' }}>
                  Club: <strong style={{ color: '#183629' }}>{topPlayer.club}</strong> • Gelar: <strong>{topPlayer.rankTitle}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '28px', zIndex: 1 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#7A897F', textTransform: 'uppercase' }}>Rating Sirkuit</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#004F27', lineHeight: 1.2 }}>
                  {topPlayer.eloRating.toLocaleString()} <span style={{ fontSize: '13px' }}>PTS</span>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#7A897F', textTransform: 'uppercase' }}>Win Rate</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#183629', lineHeight: 1.2 }}>
                  {topPlayer.winRate}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#7A897F', textTransform: 'uppercase' }}>Total Hanchan</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#B8860B', lineHeight: 1.2 }}>
                  {topPlayer.totalMatches}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Tier Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTier('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeTier === 'all' ? '1px solid #183629' : '1px solid #D7E6DB',
                backgroundColor: activeTier === 'all' ? '#183629' : '#FFFFFF',
                color: activeTier === 'all' ? '#FFFFFF' : '#2B3830',
              }}
            >
              Semua Atlet ({playerList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTier('advance')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeTier === 'advance' ? '1px solid #183629' : '1px solid #D7E6DB',
                backgroundColor: activeTier === 'advance' ? '#183629' : '#FFFFFF',
                color: activeTier === 'advance' ? '#FFFFFF' : '#2B3830',
              }}
            >
              Tingkat Advance
            </button>
            <button
              type="button"
              onClick={() => setActiveTier('intermediate')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeTier === 'intermediate' ? '1px solid #183629' : '1px solid #D7E6DB',
                backgroundColor: activeTier === 'intermediate' ? '#183629' : '#FFFFFF',
                color: activeTier === 'intermediate' ? '#FFFFFF' : '#2B3830',
              }}
            >
              Tingkat Intermediate
            </button>
            <button
              type="button"
              onClick={() => setActiveTier('beginner')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeTier === 'beginner' ? '1px solid #183629' : '1px solid #D7E6DB',
                backgroundColor: activeTier === 'beginner' ? '#183629' : '#FFFFFF',
                color: activeTier === 'beginner' ? '#FFFFFF' : '#2B3830',
              }}
            >
              Tingkat Beginner
            </button>
          </div>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #D7E6DB',
            borderRadius: '8px',
            padding: '8px 14px',
            width: '280px'
          }}>
            <Search size={15} color="#78807B" />
            <input
              type="text"
              placeholder="Cari nama atau club atlet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '13px',
                color: '#111E18'
              }}
            />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E4E0D8',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAF8F5', borderBottom: '1px solid #E4E0D8', color: '#5A675E', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 20px', width: '80px' }}>PERINGKAT</th>
                  <th style={{ padding: '14px 20px' }}>ATLET / PEMAIN</th>
                  <th style={{ padding: '14px 20px' }}>KEMAHIRAN</th>
                  <th style={{ padding: '14px 20px' }}>TOTAL POIN</th>
                  <th style={{ padding: '14px 20px' }}>WIN RATE</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>HANCHAN</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => {
                  const kemahiran = normalizeKemahiran(player.danRank);
                  const detail = KEMAHIRAN_MAP[kemahiran];
                  const isTop3 = player.rank <= 3;

                  return (
                    <tr
                      key={player.rank}
                      style={{
                        borderBottom: '1px solid #F0ECE4',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          fontWeight: 800,
                          fontSize: '12px',
                          backgroundColor: player.rank === 1 ? '#FEF3C7' : player.rank === 2 ? '#E5E7EB' : player.rank === 3 ? '#FED7AA' : '#FAF8F5',
                          color: player.rank === 1 ? '#B45309' : player.rank === 2 ? '#374151' : player.rank === 3 ? '#9A3412' : '#5A675E',
                          border: isTop3 ? '1px solid rgba(0,0,0,0.1)' : '1px solid #E4E0D8'
                        }}>
                          {player.rank}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: player.avatarBg || '#183629',
                            color: '#FAF8F5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '14px',
                            flexShrink: 0
                          }}>
                            {player.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#111E18' }}>
                              {player.name}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#7A897F' }}>
                              {player.club} • {player.rankTitle}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          backgroundColor: detail.badgeBg,
                          color: detail.badgeColor,
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}>
                          {detail.level}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <strong style={{ color: '#004F27', fontSize: '14px' }}>
                          {player.eloRating.toLocaleString()}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#7A897F', marginLeft: '4px' }}>PTS</span>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontWeight: 600, color: '#183629' }}>
                          {player.winRate}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <span style={{ color: '#5A675E', fontWeight: 600 }}>
                          {player.totalMatches} Sesi
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

    </div>
  );
}
