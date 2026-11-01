'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ApiClient from '@/lib/api';
import {
  History,
  Trophy,
  TrendingUp,
  Award,
  ArrowLeft,
  Loader2,
  CalendarDays,
  Hash,
  Star
} from 'lucide-react';
import '@/components/landing/landing.css';
import '../dashboard/dashboard.css';

// ── Types ──────────────────────────────────────────────────────────────────
interface GameHistoryItem {
  id: number;
  sesi_id?: number;
  match_name: string;
  event_name?: string | null;
  tanggal: string;
  peringkat: number;
  skor: number;
  catatan_wasit?: string | null;
}

interface GameStats {
  totalMatches: number;
  totalWins: number;
  winRate: string;
  totalPoints: number;
}

// ── Helper ─────────────────────────────────────────────────────────────────
function getRankIcon(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function getRankColor(rank: number): string {
  if (rank === 1) return '#B45309';
  if (rank === 2) return '#0369A1';
  if (rank === 3) return '#7C3AED';
  return '#5A675E';
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ── Component ──────────────────────────────────────────────────────────────
export default function GameHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await ApiClient.getMyGameHistory();
        if (res.success && res.data) {
          setHistory(res.data.history || []);
          setStats(res.data.stats || null);
        } else {
          setError(res.message || 'Gagal memuat riwayat pertandingan.');
        }
      } catch {
        setError('Tidak dapat terhubung ke server. Pastikan backend aktif.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="db-root">

      {/* ── HEADER ── */}
      <header style={{
        backgroundColor: '#141A17',
        borderBottom: '1px solid #2A3530',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            color: '#A3E6C5',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={20} color="#A3E6C5" />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#E8F0EB' }}>
              Riwayat Pertandingan
            </div>
            <div style={{ fontSize: '11px', color: '#78807B' }}>
              {user?.nama || 'Pemain'} — Semua Sesi Bermain
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 16px' }}>

        {/* ── STATS CARDS ── */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}>
            <div style={statCardStyle}>
              <Hash size={18} color="#004F27" />
              <div style={statValueStyle}>{stats.totalMatches}</div>
              <div style={statLabelStyle}>Total Match</div>
            </div>
            <div style={statCardStyle}>
              <Trophy size={18} color="#B45309" />
              <div style={statValueStyle}>{stats.totalWins}</div>
              <div style={statLabelStyle}>Total Menang</div>
            </div>
            <div style={statCardStyle}>
              <TrendingUp size={18} color="#0369A1" />
              <div style={statValueStyle}>{stats.winRate}</div>
              <div style={statLabelStyle}>Win Rate</div>
            </div>
            <div style={statCardStyle}>
              <Star size={18} color="#7C3AED" />
              <div style={statValueStyle}>{(stats.totalPoints || 0).toLocaleString()}</div>
              <div style={statLabelStyle}>Total Poin</div>
            </div>
          </div>
        )}

        {/* ── MAIN TABLE ── */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #D7E6DB',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #EAEFEC',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Award size={16} color="#004F27" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111E18' }}>
              Log Pertandingan
            </h3>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#78807B' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ margin: 0, fontSize: '13px' }}>Memuat riwayat pertandingan...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#DC2626' }}>
              <p style={{ margin: 0, fontSize: '13px' }}>{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && history.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#78807B' }}>
              <CalendarDays size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Belum ada riwayat pertandingan</p>
              <p style={{ margin: '6px 0 0', fontSize: '12px', opacity: 0.7 }}>
                Skor akan muncul setelah wasit menginput hasil pertandingan Anda.
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && history.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F4F7F5' }}>
                    <th style={thStyle}>SESI / EVENT</th>
                    <th style={thStyle}>TANGGAL</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>POSISI</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>SKOR UMA/OKA</th>
                    <th style={thStyle}>CATATAN WASIT</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((match, i) => (
                    <tr
                      key={match.id}
                      style={{
                        borderBottom: i < history.length - 1 ? '1px solid #EEF1EF' : 'none',
                        backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FAFCFA',
                      }}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700, color: '#111E18' }}>{match.match_name}</div>
                        {match.event_name && (
                          <div style={{ fontSize: '11px', color: '#78807B', marginTop: '2px' }}>{match.event_name}</div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ color: '#5A675E', whiteSpace: 'nowrap' }}>{formatDate(match.tanggal)}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          fontSize: '16px',
                          fontWeight: 800,
                          backgroundColor: match.peringkat <= 3 ? '#FEF9EC' : '#F3F4F6',
                          color: getRankColor(match.peringkat),
                        }}>
                          {getRankIcon(match.peringkat)}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <strong style={{
                          fontSize: '14px',
                          color: match.skor >= 0 ? '#16A34A' : '#DC2626',
                          fontWeight: 800,
                        }}>
                          {match.skor >= 0 ? `+${match.skor}` : match.skor}
                        </strong>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '11.5px', color: '#5A675E', fontStyle: match.catatan_wasit ? 'normal' : 'italic' }}>
                          {match.catatan_wasit || 'Tidak ada catatan'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

// ── Inline Styles ──────────────────────────────────────────────────────────
const statCardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D7E6DB',
  borderRadius: '12px',
  padding: '16px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#111E18',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#78807B',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: '10.5px',
  fontWeight: 700,
  color: '#5A675E',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'middle',
};

