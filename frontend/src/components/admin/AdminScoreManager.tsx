'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ApiClient from '@/lib/api';
import {
  Award,
  RotateCcw,
  Clock,
  CheckCircle,
  AlertTriangle,
  History,
  X,
  ChevronRight,
  Sparkles,
  Zap,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Trophy,
  Users,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  HK_HANDS_LIST,
  HK_POINTS_TABLE,
  calculateHkScore,
  HkHandDefinition,
} from '@/lib/hk-mahjong';

interface SessionData {
  id: number;
  nama_sesi: string;
  tanggal_formatted?: string;
  waktu_mulai?: string;
  waktu_selesai?: string;
  status: string;
  is_playable: boolean;
  total_tables: number;
  total_active_wins: number;
}

interface TablePlayerData {
  player_id: number;
  user_id?: number;
  nama: string;
  email: string;
  seat_wind: string;
  tingkat_kemahiran: string;
  wins_count: number;
  points_won: number;
}

interface GameTableData {
  id: number;
  nomor_meja: string;
  status: string;
  current_round: {
    id: number;
    round_number: number;
    status: string;
  };
  players: TablePlayerData[];
}

interface WinRecordHistoryItem {
  id: number;
  round_number: number;
  table_name: string;
  winner_name: string;
  winner_id: number;
  win_method: string;
  win_method_label: string;
  discarder_name: string | null;
  discarder_id: number | null;
  fan: number;
  points_awarded: number;
  hand_codes: string[];
  hands: Array<{ code: string; name: string; name_id?: string; fan: number }>;
  is_voided: boolean;
  void_reason?: string | null;
  created_at: string;
}

interface UndoToastData {
  recordId: number;
  roundNumber: number;
  tableName: string;
  winnerName: string;
  points: number;
  fan: number;
  expiresAt: number;
}

export default function AdminScoreManager() {
  // ── SESSIONS & TABLES ──────────────────────────────────────────────────
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [tables, setTables] = useState<GameTableData[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);

  // ── WINNER & METHOD ────────────────────────────────────────────────────
  const [selectedWinnerId, setSelectedWinnerId] = useState<number | null>(null);
  const [winMethod, setWinMethod] = useState<'self_draw' | 'discard'>('self_draw');
  const [selectedDiscarderId, setSelectedDiscarderId] = useState<number | null>(null);

  // ── HAND SELECTION ─────────────────────────────────────────────────────
  const [handMode, setHandMode] = useState<'combination' | 'fast'>('combination');
  const [selectedHandCodes, setSelectedHandCodes] = useState<string[]>(['all_triplets']);
  const [showPointsTable, setShowPointsTable] = useState(false);

  // ── LEADERBOARD STATE ──────────────────────────────────────────────────
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [seasonName, setSeasonName] = useState('Season 2025/2026');

  // ── UNDO TOAST (7 DETIK) ───────────────────────────────────────────────
  const [undoToast, setUndoToast] = useState<UndoToastData | null>(null);
  const [toastProgress, setToastProgress] = useState(100);
  const [isUndoing, setIsUndoing] = useState(false);

  // ── SESSION HISTORY MODAL ──────────────────────────────────────────────
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<WinRecordHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [voidingRecordId, setVoidingRecordId] = useState<number | null>(null);

  // ── RESET SEASON MODAL ─────────────────────────────────────────────────
  const [showResetModal, setShowResetModal] = useState(false);
  const [newSeasonInput, setNewSeasonInput] = useState('');
  const [isResettingSeason, setIsResettingSeason] = useState(false);

  // ── SUBMITTING STATE ───────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ── FETCH SESSIONS ─────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    try {
      const res = await ApiClient.getHkSessions('active');
      if (res.success && Array.isArray(res.data)) {
        setSessions(res.data);
        if (res.data.length > 0) {
          const urlParamSession = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('session_id') : null;
          const targetSessionId = urlParamSession ? Number(urlParamSession) : selectedSessionId;
          const currentValid = res.data.find((s: SessionData) => s.id === targetSessionId && s.is_playable);
          if (currentValid) {
            setSelectedSessionId(currentValid.id);
          } else {
            const playable = res.data.find((s: SessionData) => s.is_playable) || res.data[0];
            setSelectedSessionId(playable.id);
          }
        } else {
          setSelectedSessionId(null);
        }
      }
    } catch (e) {
      console.error('Error fetching HK sessions:', e);
    } finally {
      setLoadingSessions(false);
    }
  }, [selectedSessionId]);

  // ── FETCH TABLES FOR SELECTED SESSION ─────────────────────────────────
  const fetchTables = useCallback(async (sessionId: number) => {
    setLoadingTables(true);
    try {
      const res = await ApiClient.getHkTables(sessionId);
      if (res.success && res.data && Array.isArray(res.data)) {
        setTables(res.data);
        // Default pilih meja 1 jika belum ada yang terpilih
        if (!selectedTableId || !res.data.some((t: GameTableData) => t.id === selectedTableId)) {
          setSelectedTableId(res.data[0]?.id || null);
        }
      }
    } catch (e) {
      console.error('Error fetching HK tables:', e);
    } finally {
      setLoadingTables(false);
    }
  }, [selectedTableId]);

  // ── FETCH LEADERBOARD (REALTIME POLLING) ────────────────────────────────
  const fetchLeaderboard = useCallback(async (silent = false) => {
    if (!silent) setLoadingLeaderboard(true);
    try {
      const res = await ApiClient.getLeaderboard({
        tier: tierFilter !== 'all' ? tierFilter : undefined,
        q: searchQuery || undefined,
      });
      if (res.success && Array.isArray(res.data)) {
        setLeaderboard(res.data);
        if ((res as any).season) setSeasonName((res as any).season);
      }
    } catch (e) {
      console.error('Error fetching HK leaderboard:', e);
    } finally {
      if (!silent) setLoadingLeaderboard(false);
    }
  }, [tierFilter, searchQuery]);

  // Initial load
  useEffect(() => {
    fetchSessions();
    fetchLeaderboard();
  }, [fetchSessions, fetchLeaderboard]);

  // Saat selectedSessionId berubah, muat mejanya
  useEffect(() => {
    if (selectedSessionId) {
      fetchTables(selectedSessionId);
    }
  }, [selectedSessionId, fetchTables]);

  // Realtime Polling: Ambil leaderboard setiap 3 detik secara silent di background
  useEffect(() => {
    const timer = setInterval(() => {
      fetchLeaderboard(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [fetchLeaderboard]);

  // ── SELECTED TABLE & PLAYERS ───────────────────────────────────────────
  const currentTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || tables[0] || null;
  }, [tables, selectedTableId]);

  // Auto-set winner & discarder jika meja atau daftar pemain berganti
  useEffect(() => {
    if (currentTable && currentTable.players && currentTable.players.length > 0) {
      if (!selectedWinnerId || !currentTable.players.some((p) => p.player_id === selectedWinnerId)) {
        setSelectedWinnerId(currentTable.players[0].player_id);
      }
      if (
        !selectedDiscarderId ||
        selectedDiscarderId === selectedWinnerId ||
        !currentTable.players.some((p) => p.player_id === selectedDiscarderId)
      ) {
        const other = currentTable.players.find((p) => p.player_id !== (selectedWinnerId || currentTable.players[0].player_id));
        setSelectedDiscarderId(other?.player_id || null);
      }
    }
  }, [currentTable, selectedWinnerId, selectedDiscarderId]);

  // ── LIVE CALCULATION PREVIEW ───────────────────────────────────────────
  const liveCalculation = useMemo(() => {
    return calculateHkScore(selectedHandCodes, winMethod);
  }, [selectedHandCodes, winMethod]);

  // ── FAST MODE HANDS & COMBINATION HANDS ─────────────────────────────────
  const fastModeHands = useMemo(() => {
    return HK_HANDS_LIST.filter((h) => h.isLimit);
  }, []);

  const standardHands = useMemo(() => {
    return HK_HANDS_LIST.filter((h) => !h.isLimit);
  }, []);

  // Toggle hand code
  const toggleHandCode = (code: string) => {
    if (handMode === 'fast') {
      // Fast mode hanya 1 limit hand
      setSelectedHandCodes([code]);
      return;
    }

    // Bersihkan kartu limit jika ada saat di mode kombinasi
    const currentStandards = selectedHandCodes.filter((c) =>
      standardHands.some((h) => h.code === c)
    );

    if (currentStandards.includes(code)) {
      if (currentStandards.length === 1) {
        // Jangan biarkan kosong sama sekali
        return;
      }
      setSelectedHandCodes(currentStandards.filter((c) => c !== code));
    } else {
      setSelectedHandCodes([...currentStandards, code]);
    }
  };

  // ── SUBMIT WIN RECORD (DESK WASIT) ────────────────────────────────────
  const handleRecordWin = async () => {
    if (!selectedSessionId || !currentTable || !selectedWinnerId) {
      setFeedbackMsg({ text: 'Lengkapi pilihan sesi, meja, dan pemain pemenang di Langkah 3.', type: 'error' });
      return;
    }

    let finalDiscarderId = selectedDiscarderId;
    if (winMethod === 'discard') {
      if (!finalDiscarderId || finalDiscarderId === selectedWinnerId) {
        const fallback = currentTable.players?.find((p) => p.player_id !== selectedWinnerId);
        if (fallback) {
          finalDiscarderId = fallback.player_id;
          setSelectedDiscarderId(fallback.player_id);
        } else {
          setFeedbackMsg({ text: 'Pilih pemain yang membuang tile (Discarder).', type: 'error' });
          return;
        }
      }
    }

    if (!liveCalculation.isValid) {
      setFeedbackMsg({
        text: liveCalculation.errorMessage || 'Kombinasi belum memenuhi syarat 3 Fan (Chicken Hand).',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    // Buat idempotency key unik client-side
    const idempotencyKey = `hk-${selectedSessionId}-${currentTable.id}-r${currentTable.current_round?.round_number}-${Date.now()}`;

    try {
      const res = await ApiClient.recordHkWin({
        sesi_id: selectedSessionId,
        game_table_id: currentTable.id,
        winner_id: selectedWinnerId,
        win_method: winMethod,
        discarder_id: winMethod === 'discard' ? finalDiscarderId : null,
        hand_codes: selectedHandCodes,
        idempotency_key: idempotencyKey,
      });

      if (res.success && res.data) {
        const record = res.data;
        setFeedbackMsg({
          text: `Kemenangan Ronde #${record.round_number} (${record.winner_name} +${record.points_awarded} PTS) berhasil dicatat!`,
          type: 'success',
        });

        // Setup Undo Toast (7 Detik)
        setUndoToast({
          recordId: record.id,
          roundNumber: record.round_number,
          tableName: record.table_name || currentTable.nomor_meja,
          winnerName: record.winner_name,
          points: record.points_awarded,
          fan: record.fan,
          expiresAt: Date.now() + 7000,
        });
        setToastProgress(100);

        // Langsung refresh meja & leaderboard tanpa reload halaman
        await Promise.all([
          fetchTables(selectedSessionId),
          fetchLeaderboard(true),
        ]);
      } else {
        setFeedbackMsg({ text: res.message || 'Gagal menyimpan kemenangan ronde.', type: 'error' });
      }
    } catch (e: any) {
      setFeedbackMsg({ text: e?.message || 'Terjadi kesalahan sistem saat menghubungi server.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── UNDO COUNTDOWN TIMER (7 DETIK) ─────────────────────────────────────
  useEffect(() => {
    if (!undoToast) return;

    const interval = 100;
    const timer = setInterval(() => {
      const remaining = undoToast.expiresAt - Date.now();
      if (remaining <= 0) {
        setUndoToast(null);
        clearInterval(timer);
      } else {
        setToastProgress(Math.max(0, (remaining / 7000) * 100));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [undoToast]);

  // ── EXECUTE UNDO ACTION ────────────────────────────────────────────────
  const handleUndoWin = async () => {
    if (!undoToast) return;
    setIsUndoing(true);
    try {
      const res = await ApiClient.voidHkWin(undoToast.recordId, 'Dibatalkan langsung oleh wasit via Undo (7 detik)');
      if (res.success) {
        setFeedbackMsg({
          text: `Kemenangan Ronde #${undoToast.roundNumber} berhasil di-undo! Poin telah dikurangi dari leaderboard.`,
          type: 'success',
        });
        setUndoToast(null);
        if (selectedSessionId) fetchTables(selectedSessionId);
        fetchLeaderboard(true);
      } else {
        setFeedbackMsg({ text: res.message || 'Gagal membatalkan kemenangan.', type: 'error' });
      }
    } catch (e: any) {
      setFeedbackMsg({ text: e?.message || 'Error saat membatalkan kemenangan.', type: 'error' });
    } finally {
      setIsUndoing(false);
    }
  };

  // ── SESSION HISTORY MODAL ──────────────────────────────────────────────
  const openHistoryModal = async () => {
    if (!selectedSessionId) return;
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await ApiClient.getHkSessionHistory(selectedSessionId);
      if (res.success && Array.isArray(res.data)) {
        setSessionHistory(res.data);
      }
    } catch (e) {
      console.error('Error fetching history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleVoidFromHistory = async (recordId: number) => {
    const reason = prompt('Masukkan alasan pembatalan / koreksi kemenangan ini:', 'Koreksi kesalahan input wasit');
    if (!reason) return;

    setVoidingRecordId(recordId);
    try {
      const res = await ApiClient.voidHkWin(recordId, reason);
      if (res.success) {
        setFeedbackMsg({ text: res.message || 'Kemenangan berhasil dibatalkan.', type: 'success' });
        // Refresh modal history, meja, & leaderboard
        if (selectedSessionId) {
          const hist = await ApiClient.getHkSessionHistory(selectedSessionId);
          if (hist.success && Array.isArray(hist.data)) setSessionHistory(hist.data);
          fetchTables(selectedSessionId);
        }
        fetchLeaderboard(true);
      } else {
        setFeedbackMsg({ text: res.message || 'Gagal membatalkan kemenangan.', type: 'error' });
      }
    } catch (e: any) {
      setFeedbackMsg({ text: e?.message || 'Error saat membatalkan kemenangan.', type: 'error' });
    } finally {
      setVoidingRecordId(null);
    }
  };

  // ── RESET LEADERBOARD (NON-DESTRUCTIVE SEASON ROLLOVER) ────────────────
  const handleResetSeason = async () => {
    setIsResettingSeason(true);
    try {
      const targetSeason = newSeasonInput.trim() || undefined;
      const res = await ApiClient.resetHkLeaderboard(targetSeason);
      if (res.success) {
        setFeedbackMsg({ text: res.message || 'Musim baru berhasil dibuka!', type: 'success' });
        setShowResetModal(false);
        fetchLeaderboard(true);
      } else {
        setFeedbackMsg({ text: res.message || 'Gagal membuka musim baru.', type: 'error' });
      }
    } catch (e: any) {
      setFeedbackMsg({ text: e?.message || 'Error saat me-reset musim.', type: 'error' });
    } finally {
      setIsResettingSeason(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── HEADER PANEL ──────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #D7E6DB',
        boxShadow: '0 2px 10px rgba(0, 79, 39, 0.04)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#004F27',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              backgroundColor: '#EBF6EE',
              padding: '4px 10px',
              borderRadius: '6px'
            }}>
              MODUL PERWASITAN HONG KONG STYLE
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11.5px',
              color: '#16A34A',
              fontWeight: 700,
              backgroundColor: '#F0FDF4',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #BBF7D0'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
              Realtime Synced
            </span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111E18', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={24} color="#004F27" />
            <span>Manajemen Skor &amp; Leaderboard Atlet</span>
          </h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#5A675E' }}>
            Sistem penilaian resmi Hong Kong Mahjong (skala 3–10 Fan) dengan alur wasit terverifikasi, nomor ronde otomatis, dan kalkulasi dinamis.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={openHistoryModal}
            className="adm-btn-secondary"
            style={{
              fontSize: '12.5px',
              padding: '8px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#004F27',
              borderColor: '#D7E6DB',
              cursor: 'pointer'
            }}
          >
            <History size={14} />
            <span>Riwayat Ronde Sesi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewSeasonInput(`Season ${new Date().getFullYear() + 1}/${new Date().getFullYear() + 2}`);
              setShowResetModal(true);
            }}
            className="adm-btn-secondary"
            style={{
              fontSize: '12.5px',
              padding: '8px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#DC2626',
              borderColor: '#FECACA',
              backgroundColor: '#FEF2F2',
              cursor: 'pointer'
            }}
            title="Buka musim baru secara non-destructive"
          >
            <RotateCcw size={13} />
            <span>Rollover Musim Baru</span>
          </button>
        </div>
      </div>

      {/* ── FEEDBACK ALERT ────────────────────────────────────────────────── */}
      {feedbackMsg && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: feedbackMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          color: feedbackMsg.type === 'success' ? '#166534' : '#991B1B',
          border: `1px solid ${feedbackMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedbackMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── TWO COLUMN MAIN WORKSPACE ────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(460px, 1.25fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* ════ LEFT COLUMN: LEADERBOARD ATLET RESMI (HK STYLE) ════ */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #D7E6DB',
          boxShadow: '0 2px 10px rgba(0, 79, 39, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '4px', height: '20px', backgroundColor: '#004F27', borderRadius: '2px' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111E18', margin: 0 }}>
                  Klasemen Atlet MahjongYuks
                </h3>
                <span style={{ fontSize: '11.5px', color: '#5A675E' }}>
                  {seasonName} • Agregasi Poin Hong Kong Mahjong
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchLeaderboard(false)}
              className="adm-btn-secondary"
              style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Perbarui leaderboard sekarang"
            >
              <RefreshCw size={12} className={loadingLeaderboard ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Search & Tier Filter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#7A897F" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Cari atlet atau klub..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: '8px',
                  border: '1px solid #D7E6DB',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="adm-select"
              style={{ fontSize: '12px', padding: '7px 10px' }}
            >
              <option value="all">Semua Tingkat</option>
              <option value="beginner">Pemula (Novice)</option>
              <option value="intermediate">Menengah (Skilled)</option>
              <option value="advance">Lanjutan (Master)</option>
            </select>
          </div>

          {/* Leaderboard Table */}
          <div className="adm-table-container" style={{ maxHeight: '560px', overflowY: 'auto' }}>
            <table className="adm-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '48px', textAlign: 'center' }}>POS</th>
                  <th>ATLET</th>
                  <th>DAN / GELAR</th>
                  <th style={{ textAlign: 'right' }}>TOTAL POIN</th>
                  <th style={{ textAlign: 'center' }}>MENANG</th>
                </tr>
              </thead>
              <tbody>
                {loadingLeaderboard && leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#7A897F' }}>
                      Memuat data klasemen atlet...
                    </td>
                  </tr>
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#7A897F' }}>
                      Belum ada poin kemenangan pada musim ini.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((player) => (
                    <tr key={player.player_id}>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          backgroundColor: player.rank === 1 ? '#FEF3C7' : player.rank === 2 ? '#E0F2FE' : player.rank === 3 ? '#FEE2E2' : '#F3F4F6',
                          color: player.rank === 1 ? '#B45309' : player.rank === 2 ? '#0369A1' : player.rank === 3 ? '#B91C1C' : '#374151'
                        }}>
                          {player.rank}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#111E18', fontSize: '13px' }}>
                          {player.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#5A675E' }}>
                          {player.club}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#004F27',
                          backgroundColor: '#EBF6EE',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'capitalize'
                        }}>
                          {player.tingkat_kemahiran || player.kemahiran || 'Intermediate'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#004F27', fontSize: '14px', fontWeight: 800 }}>
                          +{player.points.toLocaleString()}
                        </strong>
                        <span style={{ fontSize: '10.5px', color: '#7A897F', marginLeft: '3px' }}>PTS</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#16A34A' }}>
                          {player.totalWins}x
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ════ RIGHT COLUMN: STEPPER DESK WASIT HONG KONG STYLE ════ */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #D7E6DB',
          boxShadow: '0 2px 10px rgba(0, 79, 39, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Stepper Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5EBE7', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '4px', height: '20px', backgroundColor: '#E2BC55', borderRadius: '2px' }} />
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111E18', margin: 0 }}>
                  Desk Wasit — Input Kemenangan (Hu)
                </h3>
                <span style={{ fontSize: '11.5px', color: '#5A675E' }}>
                  Alur terstruktur: Sesi &rarr; Meja &rarr; Pemenang &rarr; Pola Kartu
                </span>
              </div>
            </div>

            {currentTable && (
              <div style={{
                backgroundColor: '#004F27',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Sparkles size={12} color="#E2BC55" />
                <span>Ronde #{currentTable.current_round?.round_number ?? 1}</span>
              </div>
            )}
          </div>

          {/* ── STEP 1: PILIH SESI PERTANDINGAN ── */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#111E18', marginBottom: '6px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#004F27', color: '#FFF', fontSize: '10px' }}>1</span>
              <span>PILIH SESI JADWAL / JAM PERTANDINGAN</span>
            </label>

            {loadingSessions ? (
              <div style={{ fontSize: '12px', color: '#7A897F', padding: '8px 0' }}>Memuat sesi aktif...</div>
            ) : sessions.length === 0 ? (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                fontSize: '12px',
                border: '1px solid #FECACA'
              }}>
                Tidak ada sesi aktif saat ini. Sesi harus dalam status dijadwalkan/berlangsung dan belum melewati jam selesai.
              </div>
            ) : (
              <select
                value={selectedSessionId || ''}
                onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                className="adm-select"
                style={{ width: '100%', fontSize: '12.5px', fontWeight: 600 }}
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id} disabled={!s.is_playable}>
                    {s.nama_sesi} • {s.tanggal_formatted || 'Hari ini'} ({s.waktu_mulai ?? '09:00'} - {s.waktu_selesai ?? '23:59'}){!s.is_playable ? ' — [WAKTU HABIS]' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ── STEP 2: PILIH MEJA (BERJALAN PARALEL & INDEPENDEN) ── */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#111E18', marginBottom: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#004F27', color: '#FFF', fontSize: '10px' }}>2</span>
              <span>PILIH MEJA PERTANDINGAN (RONDE OTOMATIS BERJALAN PARALEL)</span>
            </label>

            {loadingTables ? (
              <div style={{ fontSize: '12px', color: '#7A897F' }}>Memuat meja...</div>
            ) : tables.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#7A897F', padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                Belum ada meja yang terdaftar pada sesi ini.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {tables.map((tbl) => {
                  const isSelected = tbl.id === selectedTableId;
                  return (
                    <div
                      key={tbl.id}
                      onClick={() => setSelectedTableId(tbl.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: `2px solid ${isSelected ? '#004F27' : '#D7E6DB'}`,
                        backgroundColor: isSelected ? '#F0F9F3' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: isSelected ? '#004F27' : '#111E18' }}>
                          {tbl.nomor_meja}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: isSelected ? '#004F27' : '#E5EBE7',
                          color: isSelected ? '#FFFFFF' : '#2B3830',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          Ronde #{tbl.current_round?.round_number ?? 1}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#5A675E' }}>
                        {tbl.players?.length || 0} Atlet Terdaftar
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── STEP 3: PILIH PEMENANG & CARA MENANG ── */}
          {currentTable && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#F9FBFA', padding: '16px', borderRadius: '12px', border: '1px solid #E5EBE7' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#111E18', marginBottom: '8px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#004F27', color: '#FFF', fontSize: '10px' }}>3</span>
                  <span>PEMAIN PEMENANG DI MEJA INI</span>
                </label>

                {/* Grid 4 Kursi Meja Mahjong (East, South, West, North) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {(['East', 'South', 'West', 'North'] as const).map((wind, windIdx) => {
                    const tp = currentTable.players?.find(
                      (p) => (p.seat_wind || '').toLowerCase() === wind.toLowerCase()
                    ) || (currentTable.players && currentTable.players.length > windIdx && !currentTable.players.some(p => (p.seat_wind || '').toLowerCase() === wind.toLowerCase()) ? currentTable.players[windIdx] : null);

                    if (tp) {
                      const isWinner = selectedWinnerId === tp.player_id;
                      const isTablePlayable = (currentTable.players?.length || 0) >= 2;
                      return (
                        <div
                          key={tp.player_id}
                          onClick={() => {
                            if (!isTablePlayable) return;
                            setSelectedWinnerId(tp.player_id);
                            if (selectedDiscarderId === tp.player_id) {
                              const other = currentTable.players.find((p) => p.player_id !== tp.player_id);
                              setSelectedDiscarderId(other?.player_id || null);
                            }
                          }}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: `2px solid ${isWinner ? '#004F27' : '#D7E6DB'}`,
                            backgroundColor: isWinner ? '#004F27' : '#FFFFFF',
                            color: isWinner ? '#FFFFFF' : '#111E18',
                            cursor: isTablePlayable ? 'pointer' : 'default',
                            textAlign: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, opacity: isWinner ? 0.8 : 0.6, letterSpacing: '0.4px' }}>
                            {wind}
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '12.5px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tp.nama}
                          </div>
                          <div style={{ fontSize: '11px', marginTop: '3px', color: isWinner ? '#E2BC55' : '#16A34A', fontWeight: 700 }}>
                            +{tp.points_won} PTS
                          </div>
                        </div>
                      );
                    }

                    // Kursi Kosong (Belum ada pendaftar)
                    return (
                      <div
                        key={wind}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: '2px dashed #D1D5DB',
                          backgroundColor: '#F9FAFB',
                          color: '#9CA3AF',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          minHeight: '74px'
                        }}
                      >
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, opacity: 0.7, letterSpacing: '0.4px' }}>
                          {wind}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '12px', marginTop: '2px', color: '#6B7280' }}>
                          Kursi Kosong
                        </div>
                        <div style={{ fontSize: '10px', marginTop: '2px', color: '#9CA3AF' }}>
                          (Belum Terdaftar)
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Banner Status Kesiapan Meja */}
                {(currentTable.players?.length || 0) < 2 ? (
                  <div style={{
                    fontSize: '12px',
                    color: '#991B1B',
                    backgroundColor: '#FEF2F2',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #FECACA',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '10px',
                  }}>
                    <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Permainan Belum Dapat Dimulai:</strong> Meja ini baru memiliki {currentTable.players?.length || 0} pemain terdaftar{currentTable.players?.[0] ? ` (${currentTable.players[0].nama})` : ''}. Pertandingan Mahjong minimal memerlukan 2 pemain di meja untuk dapat memulai ronde dan mencatat skor (tidak bisa hanya 1 pemain).
                    </span>
                  </div>
                ) : (currentTable.players?.length || 0) < 4 ? (
                  <div style={{
                    fontSize: '12px',
                    color: '#065F46',
                    backgroundColor: '#ECFDF5',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '10px',
                  }}>
                    <CheckCircle size={15} color="#059669" style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Meja Siap Dimainkan:</strong> Meja ini memiliki {currentTable.players?.length} pemain terdaftar ({currentTable.players?.map(p => p.nama).join(', ')}). Skor ronde sudah dapat dicatat oleh wasit.
                    </span>
                  </div>
                ) : null}
              </div>

              {/* CARA MENANG: TARIK SENDIRI VS BUANG LAWAN */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                  Cara Kemenangan
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setWinMethod('self_draw')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: `2px solid ${winMethod === 'self_draw' ? '#004F27' : '#D7E6DB'}`,
                      backgroundColor: winMethod === 'self_draw' ? '#EBF6EE' : '#FFFFFF',
                      color: winMethod === 'self_draw' ? '#004F27' : '#2B3830',
                      fontWeight: 800,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span>Tarik Sendiri (Zi Mo)</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#16A34A' }}>+1 Fan Bonus • Poin dari 3 Lawan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWinMethod('discard')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: `2px solid ${winMethod === 'discard' ? '#004F27' : '#D7E6DB'}`,
                      backgroundColor: winMethod === 'discard' ? '#EBF6EE' : '#FFFFFF',
                      color: winMethod === 'discard' ? '#004F27' : '#2B3830',
                      fontWeight: 800,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span>Buang Lawan (Rong / Discard)</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#5A675E' }}>Poin dari 1 Pembuang</span>
                  </button>
                </div>
              </div>

              {/* JIKA BUANG LAWAN: PILIH PEMBUANG TILE (DISCARDER) */}
              {winMethod === 'discard' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                    Pemain yang Membuang Tile Kemenangan (Discarder):
                  </label>
                  {currentTable.players.filter((p) => p.player_id !== selectedWinnerId).length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#7A897F', fontStyle: 'italic', padding: '6px 0' }}>
                      Belum ada pemain lawan di meja ini untuk dipilih sebagai pembuang tile.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                      {currentTable.players
                        .filter((p) => p.player_id !== selectedWinnerId)
                        .map((dp) => {
                          const isDiscarder = selectedDiscarderId === dp.player_id;
                          return (
                            <div
                              key={dp.player_id}
                              onClick={() => setSelectedDiscarderId(dp.player_id)}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: `1.5px solid ${isDiscarder ? '#DC2626' : '#D7E6DB'}`,
                                backgroundColor: isDiscarder ? '#FEF2F2' : '#FFFFFF',
                                color: isDiscarder ? '#991B1B' : '#111E18',
                                cursor: 'pointer',
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: '12px'
                              }}
                            >
                              <span style={{ fontSize: '10px', opacity: 0.7 }}>{dp.seat_wind}</span>
                              <div style={{ marginTop: '2px' }}>{dp.nama}</div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: PILIH POLA KARTU HONG KONG (FAST MODE VS KOMBINASI) ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#111E18', margin: 0 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#004F27', color: '#FFF', fontSize: '10px' }}>4</span>
                <span>PILIH POLA TANGAN KEMENANGAN (HONG KONG STYLE)</span>
              </label>

              {/* Mode Toggle Tabs */}
              <div style={{ display: 'inline-flex', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '2px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setHandMode('combination');
                    // Reset ke kombinasi kartu standar jika ada kartu limit
                    if (selectedHandCodes.some((c) => fastModeHands.some((f) => f.code === c))) {
                      setSelectedHandCodes(['all_triplets']);
                    }
                  }}
                  style={{
                    padding: '5px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: handMode === 'combination' ? '#004F27' : 'transparent',
                    color: handMode === 'combination' ? '#FFFFFF' : '#5A675E',
                    boxShadow: handMode === 'combination' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Layers size={11} style={{ display: 'inline', marginRight: '4px' }} />
                  Mode Kombinasi (3–8 Fan)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHandMode('fast');
                    setSelectedHandCodes(['thirteen_orphans']);
                  }}
                  style={{
                    padding: '5px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: handMode === 'fast' ? '#B45309' : 'transparent',
                    color: handMode === 'fast' ? '#FFFFFF' : '#5A675E',
                    boxShadow: handMode === 'fast' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Zap size={11} style={{ display: 'inline', marginRight: '4px' }} />
                  Tangan Spesial (Limit 10 Fan)
                </button>
              </div>
            </div>

            {/* HAND BUTTONS GRID */}
            {handMode === 'combination' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11.5px', color: '#5A675E' }}>
                  Pilih satu atau lebih kombinasi kartu untuk digabungkan (minimal akumulasi 3 Fan):
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '8px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {standardHands.map((hand) => {
                    const isSelected = selectedHandCodes.includes(hand.code);
                    return (
                      <div
                        key={hand.code}
                        onClick={() => toggleHandCode(hand.code)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: `1.5px solid ${isSelected ? '#004F27' : '#D7E6DB'}`,
                          backgroundColor: isSelected ? '#F0F9F3' : '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          transition: 'all 0.1s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 800, fontSize: '11.5px', color: isSelected ? '#004F27' : '#111E18' }}>
                            {hand.nameId}
                          </span>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            backgroundColor: isSelected ? '#004F27' : '#E5EBE7',
                            color: isSelected ? '#FFFFFF' : '#2B3830',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            {hand.fan} Fan
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#7A897F', lineHeight: '1.2' }}>
                          {hand.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11.5px', color: '#92400E', backgroundColor: '#FEF3C7', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Limit Hands</strong> adalah kartu langka/tertinggi dalam Hong Kong Mahjong. Setiap kartu di tab ini bernilai <strong>maksimal 10 Fan</strong> (128 PTS jika Discard, atau 192 PTS jika Tarik Sendiri).</span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '8px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {fastModeHands.map((hand) => {
                    const isSelected = selectedHandCodes.includes(hand.code);
                    return (
                      <div
                        key={hand.code}
                        onClick={() => toggleHandCode(hand.code)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: `1.5px solid ${isSelected ? '#B45309' : '#D7E6DB'}`,
                          backgroundColor: isSelected ? '#FEF3C7' : '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          transition: 'all 0.1s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 800, fontSize: '11.5px', color: isSelected ? '#92400E' : '#111E18' }}>
                            {hand.nameId}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            backgroundColor: isSelected ? '#D97706' : '#E5EBE7',
                            color: isSelected ? '#FFFFFF' : '#2B3830',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            10 FAN
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#7A897F', lineHeight: '1.2' }}>
                          {hand.description}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── LIVE PREVIEW FAN & POIN ── */}
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: liveCalculation.isValid ? '#F0F9F3' : '#FEF2F2',
            border: `1.5px solid ${liveCalculation.isValid ? '#BBF7D0' : '#FECACA'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: liveCalculation.isValid ? '#166534' : '#991B1B', letterSpacing: '0.5px' }}>
                  {liveCalculation.isValid ? 'PREVIEW KALKULASI POIN WASIT' : 'PERINGATAN ATURAN (CHICKEN HAND)'}
                </span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#111E18', marginTop: '2px' }}>
                  {liveCalculation.rawFan} Fan {winMethod === 'self_draw' && !liveCalculation.isLimit ? '+ 1 Zi Mo' : ''}{' '}
                  &rarr;{' '}
                  <span style={{ color: liveCalculation.isValid ? '#004F27' : '#DC2626' }}>
                    {liveCalculation.finalFan} Fan {liveCalculation.isLimit ? '(LIMIT)' : ''}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#5A675E', fontWeight: 600 }}>Poin Pemenang:</span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: liveCalculation.isValid ? '#004F27' : '#DC2626' }}>
                  +{liveCalculation.pointsAwarded}{' '}
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>PTS</span>
                </div>
              </div>
            </div>

            {/* Breakdown detail */}
            <div style={{ fontSize: '12px', color: '#2B3830', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '6px' }}>
              {liveCalculation.isValid ? (
                winMethod === 'self_draw' ? (
                  <span>
                    Metode Tarik Sendiri (Zi Mo): Poin atlet bertambah <strong>+{liveCalculation.pointsAwarded} PTS</strong> (termasuk bonus +1 Fan Tarik Sendiri).
                  </span>
                ) : (
                  <span>
                    Metode Buang Lawan (Discard): Poin atlet bertambah <strong>+{liveCalculation.pointsAwarded} PTS</strong> dari kemenangan ronde ini.
                  </span>
                )
              ) : (
                <span style={{ color: '#991B1B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <AlertTriangle size={14} /> {liveCalculation.errorMessage}
                </span>
              )}
            </div>

            {/* Toggle Tabel Konversi Fan ke Poin HK */}
            <div style={{ borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setShowPointsTable(!showPointsTable)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#004F27',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{showPointsTable ? '▼ Sembunyikan' : '▶ Buka'} Tabel Resmi Poin Hong Kong Style (Half-Spicy / 半辣)</span>
              </button>

              {showPointsTable && (
                <div style={{ marginTop: '8px', overflowX: 'auto', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #D7E6DB', padding: '8px' }}>
                  <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F3F4F6', color: '#2B3830', fontWeight: 800 }}>
                        <th style={{ padding: '6px 8px' }}>Jumlah Fan</th>
                        <th style={{ padding: '6px 8px' }}>Buang Lawan (Discard)</th>
                        <th style={{ padding: '6px 8px' }}>Zi Mo (Tiap Lawan)</th>
                        <th style={{ padding: '6px 8px' }}>Total Pemenang (Zi Mo)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(HK_POINTS_TABLE).map((row) => {
                        const isCurrent = liveCalculation.isValid && liveCalculation.finalFan === row.fan;
                        return (
                          <tr
                            key={row.fan}
                            style={{
                              backgroundColor: isCurrent ? '#EBF6EE' : 'transparent',
                              fontWeight: isCurrent ? 800 : 500,
                              color: isCurrent ? '#004F27' : '#111E18',
                              borderBottom: '1px solid #F3F4F6'
                            }}
                          >
                            <td style={{ padding: '5px 8px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                <span>{row.fan} Fan</span>
                                {row.fan === 10 && (
                                  <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>LIMIT</span>
                                )}
                              </span>
                            </td>
                            <td style={{ padding: '5px 8px' }}>
                              <strong>+{row.discard} PTS</strong>
                            </td>
                            <td style={{ padding: '5px 8px', color: '#5A675E' }}>
                              +{row.selfDrawEach} PTS / orang
                            </td>
                            <td style={{ padding: '5px 8px', color: '#004F27' }}>
                              <strong>+{row.selfDrawTotal} PTS</strong> (1.5x)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ fontSize: '10.5px', color: '#5A675E', marginTop: '6px', textAlign: 'left' }}>
                    * Standar Resmi Turnamen Hong Kong Old Style (Half-Spicy / 半辣). Tarik Sendiri (Zi Mo) mengakumulasi poin dari ketiga posisi lawan sehingga total skor ronde pemenang 1.5x lebih tinggi. Sistem penilaian murni olahraga prestasi asah otak (Mind Sport / Non-Judi).
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── INLINE FEEDBACK NOTIFICATION (LANGSUNG DI ATAS TOMBOL SUBMIT) ── */}
          {feedbackMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: feedbackMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
              color: feedbackMsg.type === 'success' ? '#166534' : '#991B1B',
              border: `1.5px solid ${feedbackMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {feedbackMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                <span>{feedbackMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px', fontSize: '13px', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ── SUBMIT BUTTON ── */}
          <button
            type="button"
            onClick={handleRecordWin}
            disabled={
              isSubmitting ||
              !liveCalculation.isValid ||
              (currentTable?.players?.length ?? 0) < 2 ||
              !selectedWinnerId ||
              (winMethod === 'discard' && !selectedDiscarderId)
            }
            className="adm-btn-primary"
            style={{
              justifyContent: 'center',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 800,
              opacity:
                isSubmitting ||
                !liveCalculation.isValid ||
                (currentTable?.players?.length ?? 0) < 2 ||
                !selectedWinnerId ||
                (winMethod === 'discard' && !selectedDiscarderId)
                  ? 0.6
                  : 1,
              cursor:
                isSubmitting ||
                !liveCalculation.isValid ||
                (currentTable?.players?.length ?? 0) < 2 ||
                !selectedWinnerId ||
                (winMethod === 'discard' && !selectedDiscarderId)
                  ? 'not-allowed'
                  : 'pointer'
            }}
          >
            <Award size={18} color="#E2BC55" />
            <span>
              {isSubmitting
                ? 'Menyimpan & Menyinkronkan...'
                : (currentTable?.players?.length ?? 0) < 2
                ? `Minimal 2 Pemain Diperlukan (${currentTable?.players?.length ?? 0}/2)`
                : !selectedWinnerId
                ? 'Pilih Pemain Pemenang di Langkah #3'
                : winMethod === 'discard' && !selectedDiscarderId
                ? 'Pilih Pemain Pembuang Tile (Discarder) di Langkah #3'
                : !liveCalculation.isValid
                ? (liveCalculation.errorMessage || 'Kombinasi Kartu Belum Sah (Min 3 Fan)')
                : `Catat Kemenangan Ronde #${currentTable?.current_round?.round_number ?? 1} (+${liveCalculation.pointsAwarded} PTS)`}
            </span>
          </button>
        </div>
      </div>

      {/* ── FLOATING UNDO TOAST (7 DETIK) ─────────────────────────────────── */}
      {undoToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#111E18',
          color: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={18} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>
                  Kemenangan Ronde #{undoToast.roundNumber} Tersimpan
                </div>
                <div style={{ fontSize: '11.5px', color: '#A3B8AD' }}>
                  {undoToast.tableName} • {undoToast.winnerName} (+{undoToast.points} PTS)
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUndoWin}
              disabled={isUndoing}
              style={{
                backgroundColor: '#E2BC55',
                color: '#111E18',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: isUndoing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <RotateCcw size={13} />
              <span>{isUndoing ? 'Membatalkan...' : 'Urungkan (Undo)'}</span>
            </button>
          </div>

          {/* Progress bar 7s */}
          <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: `${toastProgress}%`,
              height: '100%',
              backgroundColor: '#E2BC55',
              transition: 'width 0.1s linear'
            }} />
          </div>
        </div>
      )}

      {/* ── MODAL: RIWAYAT KEMENANGAN SESI & VOID ─────────────────────────── */}
      {showHistoryModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #D7E6DB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="#004F27" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#111E18' }}>
                  Riwayat Kemenangan Sesi Ini
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A897F' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#7A897F' }}>
                  Memuat riwayat kemenangan sesi...
                </div>
              ) : sessionHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#7A897F' }}>
                  Belum ada catatan kemenangan pada sesi ini.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sessionHistory.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: `1px solid ${item.is_voided ? '#E5E7EB' : '#D7E6DB'}`,
                        backgroundColor: item.is_voided ? '#F9FAFB' : '#FFFFFF',
                        opacity: item.is_voided ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: item.is_voided ? '#6B7280' : '#004F27',
                            backgroundColor: item.is_voided ? '#E5E7EB' : '#EBF6EE',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            Ronde #{item.round_number} • {item.table_name}
                          </span>
                          <span style={{ fontSize: '11px', color: '#7A897F' }}>
                            {item.created_at}
                          </span>
                          {item.is_voided && (
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#DC2626', backgroundColor: '#FEF2F2', padding: '2px 6px', borderRadius: '4px' }}>
                              DIBATALKAN (VOID)
                            </span>
                          )}
                        </div>

                        <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 700, color: '#111E18', textDecoration: item.is_voided ? 'line-through' : 'none' }}>
                          {item.winner_name}{' '}
                          <span style={{ color: '#004F27', fontWeight: 800 }}>
                            +{item.points_awarded} PTS ({item.fan} Fan)
                          </span>
                        </div>

                        <div style={{ fontSize: '11.5px', color: '#5A675E', marginTop: '2px' }}>
                          {item.win_method_label}
                          {item.discarder_name ? ` (Discarder: ${item.discarder_name})` : ''}
                        </div>

                        {item.is_voided && item.void_reason && (
                          <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '3px' }}>
                            Alasan: {item.void_reason}
                          </div>
                        )}
                      </div>

                      {!item.is_voided && (
                        <button
                          type="button"
                          onClick={() => handleVoidFromHistory(item.id)}
                          disabled={voidingRecordId === item.id}
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: '#DC2626',
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: voidingRecordId === item.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {voidingRecordId === item.id ? 'Memproses...' : 'Batalkan (Void)'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #D7E6DB', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="adm-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '12.5px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RESET SEASON ROLLOVER ─────────────────────────────────── */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#FEF2F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldAlert size={20} color="#DC2626" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#111E18' }}>
                  Rollover Musim Baru (Non-Destructive)
                </h3>
                <span style={{ fontSize: '11.5px', color: '#5A675E' }}>
                  Musim saat ini: {seasonName}
                </span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '12.5px', color: '#4B5563', lineHeight: '1.5' }}>
              Tindakan ini akan membuka musim turnamen baru. Poin atlet untuk musim baru akan dimulai dari 0 PTS secara bersih, namun seluruh riwayat pertandingan musim sebelumnya tetap tersimpan aman di database dan dapat dilihat sewaktu-waktu.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#111E18', marginBottom: '4px' }}>
                Nama Musim Baru:
              </label>
              <input
                type="text"
                value={newSeasonInput}
                onChange={(e) => setNewSeasonInput(e.target.value)}
                placeholder="misal: Season 2026/2027"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #D7E6DB',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="adm-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12px' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetSeason}
                disabled={isResettingSeason}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: isResettingSeason ? 'not-allowed' : 'pointer'
                }}
              >
                {isResettingSeason ? 'Memproses...' : 'Buka Musim Baru'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
