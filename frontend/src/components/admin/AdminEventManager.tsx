'use client';

import '@/app/admin/admin.css';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Trophy,
  Plus,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  X,
  Upload,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  Ticket,
  Award,
  FileText,
  Users
} from 'lucide-react';
import ApiClient, { ApiEvent, ApiVenue, ApiEventPeserta } from '@/lib/api';

const PRESET_EVENT_IMAGES = [
  { label: 'Turnamen Clash (Default)', url: '/assets/event_1.jpg' },
  { label: 'Casual Dimsum PIK', url: '/assets/event_2.jpg' },
  { label: 'Workshop & Taktik Bandung', url: '/assets/event_3.jpg' },
  { label: 'Arena Pertandingan Resmi', url: '/landing/event-clash.jpg' },
  { label: 'Meja Otomatis Game House', url: '/landing/hero-parlor.jpg' },
];

const formatIndonesianEventDate = (dateStr?: string | null, formattedStr?: string | null) => {
  if (formattedStr) return formattedStr;
  if (!dateStr) return 'Jadwal Reguler';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const getEventStatusConfig = (status?: string | null) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return {
        label: 'Aktif (Pendaftaran Dibuka)',
        shortLabel: 'Pendaftaran Dibuka',
        badgeClass: 'adm-badge-active',
        color: '#004F27',
        bg: '#EBF6EE',
        border: '#B5D4C2'
      };
    case 'upcoming':
    case 'draft':
      return {
        label: 'Draft (Akan Datang)',
        shortLabel: 'Draft (Akan Datang)',
        badgeClass: 'adm-badge-upcoming',
        color: '#854D0E',
        bg: '#FEF9C3',
        border: '#FDE047'
      };
    case 'selesai':
    case 'completed':
    case 'finished':
      return {
        label: 'Selesai',
        shortLabel: 'Selesai',
        badgeClass: 'adm-badge-finished',
        color: '#374151',
        bg: '#F3F4F6',
        border: '#D1D5DB'
      };
    case 'cancelled':
    case 'dibatalkan':
      return {
        label: 'Dibatalkan',
        shortLabel: 'Dibatalkan',
        badgeClass: 'adm-badge-cancelled',
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FECACA'
      };
    default:
      return {
        label: status || 'Aktif',
        shortLabel: status || 'Aktif',
        badgeClass: 'adm-badge-active',
        color: '#004F27',
        bg: '#EBF6EE',
        border: '#B5D4C2'
      };
  }
};

export default function AdminEventManager() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [venues, setVenues] = useState<ApiVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nama_event: '',
    venue_id: '',
    tanggal_event: '',
    waktu_mulai: '13:00',
    waktu_selesai: '18:00',
    status: 'active',
    jenis_event: 'Event',
    biaya: 'Rp 150.000 /kursi',
    kuota: 'Sisa 4 Kursi (1 Meja)',
    deskripsi: '',
    foto_preset: '/assets/event_1.jpg',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, venuesRes] = await Promise.all([
        ApiClient.getEvents(),
        ApiClient.getVenues()
      ]);

      if (eventsRes.success && eventsRes.data) {
        setEvents(eventsRes.data);
      }
      if (venuesRes.success && venuesRes.data) {
        setVenues(venuesRes.data);
      }
    } catch (err: any) {
      setError('Gagal memuat data dari server backend Laravel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchSearch =
        searchQuery === '' ||
        ev.nama_event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.venue && ev.venue.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' || ev.status === statusFilter;

      const matchCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'ranked' && (ev.kategori?.toLowerCase().includes('compet') || ev.nama_event.toLowerCase().includes('open') || ev.nama_event.toLowerCase().includes('master'))) ||
        (categoryFilter === 'casual' && (ev.kategori?.toLowerCase().includes('casual') || ev.nama_event.toLowerCase().includes('casual'))) ||
        (categoryFilter === 'workshop' && (ev.kategori?.toLowerCase().includes('workshop') || ev.nama_event.toLowerCase().includes('bootcamp')));

      return matchSearch && matchStatus && matchCategory;
    });
  }, [events, searchQuery, statusFilter, categoryFilter]);

  // Handle open create modal
  const handleOpenCreate = () => {
    const firstVenueId = venues.length > 0 ? String(venues[0].id) : '1';
    setFormData({
      nama_event: '',
      venue_id: firstVenueId,
      tanggal_event: new Date().toISOString().split('T')[0],
      waktu_mulai: '13:00',
      waktu_selesai: '18:00',
      status: 'active',
      jenis_event: 'Event',
      biaya: 'Rp 150.000 /kursi',
      kuota: 'Sisa 4 Kursi (1 Meja)',
      deskripsi: '',
      foto_preset: '/assets/event_1.jpg',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormErrors({});
    setShowCreateModal(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (ev: ApiEvent) => {
    setSelectedEvent(ev);
    setFormData({
      nama_event: ev.nama_event,
      venue_id: String(ev.venue_id || (venues[0]?.id || 1)),
      tanggal_event: ev.tanggal_event || '',
      waktu_mulai: ev.waktu_mulai ? ev.waktu_mulai.slice(0, 5) : '13:00',
      waktu_selesai: ev.waktu_selesai ? ev.waktu_selesai.slice(0, 5) : '18:00',
      status: ev.status || 'active',
      jenis_event: ev.jenis_event || 'Event',
      biaya: ev.biaya || 'Rp 150.000 /kursi',
      kuota: ev.kuota || 'Sisa 4 Kursi (1 Meja)',
      deskripsi: ev.deskripsi || '',
      foto_preset: ev.foto || '/assets/event_1.jpg',
    });
    setPhotoFile(null);
    setPhotoPreview(ev.foto || null);
    setFormErrors({});
    setShowEditModal(true);
  };

  // Handle open detail modal
  const [detailLoading, setDetailLoading] = useState(false);
  const [pesertaList, setPesertaList] = useState<ApiEventPeserta[]>([]);
  const [pesertaLoading, setPesertaLoading] = useState(false);

  const handleOpenDetail = async (ev: ApiEvent) => {
    setSelectedEvent(ev);
    setShowDetailModal(true);
    setDetailLoading(true);
    setPesertaLoading(true);
    setPesertaList([]);

    try {
      const [res, pesertaRes] = await Promise.all([
        ApiClient.getEventById(ev.id),
        ApiClient.getEventPeserta(ev.id),
      ]);
      if (res.success && res.data) {
        setSelectedEvent(res.data);
      }
      if (pesertaRes.success && pesertaRes.data) {
        setPesertaList(pesertaRes.data.peserta || []);
      }
    } catch {
      // Fallback to existing ev
    } finally {
      setDetailLoading(false);
      setPesertaLoading(false);
    }
  };

  // Handle open delete modal
  const handleOpenDelete = (ev: ApiEvent) => {
    setSelectedEvent(ev);
    setShowDeleteModal(true);
  };

  // File change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Create Event
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormErrors({});

    try {
      const postData = new FormData();
      postData.append('nama_event', formData.nama_event);
      postData.append('venue_id', formData.venue_id);
      postData.append('tanggal_event', formData.tanggal_event);
      postData.append('waktu_mulai', formData.waktu_mulai);
      postData.append('waktu_selesai', formData.waktu_selesai);
      postData.append('status', formData.status);
      postData.append('jenis_event', formData.jenis_event);
      postData.append('biaya', formData.biaya);
      postData.append('kuota', formData.kuota);
      postData.append('deskripsi', formData.deskripsi);

      if (photoFile) {
        postData.append('foto', photoFile);
      } else if (formData.foto_preset) {
        postData.append('foto', formData.foto_preset);
      }

      const res = await ApiClient.createEvent(postData);

      if (res.success) {
        showToast(res.message || 'Event baru berhasil ditambahkan ke database!');
        setShowCreateModal(false);
        loadData();
      } else {
        if (res.errors) {
          setFormErrors(res.errors);
        }
        showToast(res.message || 'Gagal menambahkan event.', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat menghubungi API Laravel.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Update Event
  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setFormSubmitting(true);
    setFormErrors({});

    try {
      const postData = new FormData();
      postData.append('nama_event', formData.nama_event);
      postData.append('venue_id', formData.venue_id);
      postData.append('tanggal_event', formData.tanggal_event);
      postData.append('waktu_mulai', formData.waktu_mulai);
      postData.append('waktu_selesai', formData.waktu_selesai);
      postData.append('status', formData.status);
      postData.append('jenis_event', formData.jenis_event);
      postData.append('biaya', formData.biaya);
      postData.append('kuota', formData.kuota);
      postData.append('deskripsi', formData.deskripsi);

      if (photoFile) {
        postData.append('foto', photoFile);
      } else if (formData.foto_preset) {
        postData.append('foto', formData.foto_preset);
      }

      const res = await ApiClient.updateEvent(selectedEvent.id, postData);

      if (res.success) {
        showToast(res.message || 'Data event berhasil diperbarui di database!');
        setShowEditModal(false);
        loadData();
      } else {
        if (res.errors) {
          setFormErrors(res.errors);
        }
        showToast(res.message || 'Gagal memperbarui event.', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat menghubungi API Laravel.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Delete Event
  const handleConfirmDelete = async () => {
    if (!selectedEvent) return;
    setFormSubmitting(true);

    try {
      const res = await ApiClient.deleteEvent(selectedEvent.id);

      if (res.success) {
        showToast(res.message || 'Event berhasil dihapus dari database.');
        setShowDeleteModal(false);
        loadData();
      } else {
        showToast(res.message || 'Gagal menghapus event.', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat menghapus event.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Computed metrics
  const activeEventsCount = events.filter(e => e.status === 'active').length;
  const upcomingEventsCount = events.filter(e => e.status === 'upcoming').length;
  const finishedEventsCount = events.filter(e => e.status === 'selesai' || e.status === 'finished').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: toastMessage.type === 'success' ? '#183629' : '#DC2626',
          color: '#FFFFFF',
          border: '1px solid #E2BC55',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 700,
          animation: 'admFadeIn 0.2s ease-out'
        }}>
          {toastMessage.type === 'success' ? <CheckCircle size={18} color="#E2BC55" /> : <AlertCircle size={18} color="#FCA5A5" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── 1. PAGE HEADER BAR ── */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        padding: '20px 24px',
        border: '1px solid #D7E6DB',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0, 79, 39, 0.03)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#004F27', textTransform: 'uppercase', letterSpacing: '0.6px', backgroundColor: '#EBF6EE', padding: '3px 8px', borderRadius: '4px' }}>
              TURNAMEN &amp; KOMPETISI RESMI
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111E18', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.3px' }}>
            <Trophy size={22} color="#004F27" />
            <span>Manajemen Event &amp; Turnamen Mahjong</span>
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5A675E' }}>
            Kelola jadwal turnamen resmi WRC, sesi gathering santai, alokasi kuota meja, dan penetapan venue acara.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="adm-btn-primary"
        >
          <Plus size={16} />
          <span>+ Tambah Event Baru</span>
        </button>
      </div>

      {/* ── 2. STATISTIK EVENT METRICS GRID ── */}
      <div className="adm-stat-grid" style={{ marginBottom: 0 }}>
        {/* Card 1: Total Event */}
        <div className="adm-stat-card">
          <div className="adm-stat-card-header">
            <span className="adm-stat-label">Total Turnamen</span>
            <div className="adm-stat-icon-wrap">
              <Trophy size={18} />
            </div>
          </div>
          <div className="adm-stat-number">
            {events.length} <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Sesi</span>
          </div>
          <div className="adm-stat-meta">
            <span className="adm-stat-pill adm-stat-pill-green">
              {activeEventsCount} Dibuka
            </span>
            <span style={{ color: '#7A897F' }}>•</span>
            <span>{venues.length} Venue Terdaftar</span>
          </div>
        </div>

        {/* Card 2: Pendaftaran Aktif */}
        <div className="adm-stat-card">
          <div className="adm-stat-card-header">
            <span className="adm-stat-label">Pendaftaran Aktif</span>
            <div className="adm-stat-icon-wrap" style={{ backgroundColor: '#DCF1E3', color: '#004F27' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div className="adm-stat-number" style={{ color: '#004F27' }}>
            {activeEventsCount} <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Turnamen</span>
          </div>
          <div className="adm-stat-meta">
            <span style={{ color: '#16A34A', fontWeight: 700 }}>● Registrasi Sedang Berlangsung</span>
          </div>
        </div>

        {/* Card 3: Akan Datang */}
        <div className="adm-stat-card">
          <div className="adm-stat-card-header">
            <span className="adm-stat-label">Akan Datang (Upcoming)</span>
            <div className="adm-stat-icon-wrap" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="adm-stat-number">
            {upcomingEventsCount} <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Terjadwal</span>
          </div>
          <div className="adm-stat-meta">
            <span style={{ color: '#0369A1', fontWeight: 600 }}>Siap Rilis Sesi Berikutnya</span>
          </div>
        </div>

        {/* Card 4: Selesai */}
        <div className="adm-stat-card">
          <div className="adm-stat-card-header">
            <span className="adm-stat-label">Turnamen Selesai</span>
            <div className="adm-stat-icon-wrap" style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="adm-stat-number">
            {finishedEventsCount} <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Kejuaraan</span>
          </div>
          <div className="adm-stat-meta">
            <span style={{ color: '#5A675E' }}>Arsip Riichi &amp; Skor Valid</span>
          </div>
        </div>
      </div>

      {/* ── 3. CATEGORY PILLS & SEARCH CONTROLS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Category Pills Bar */}
        <div className="adm-filter-pills-bar">
          {[
            { id: 'all', label: 'Semua Kategori' },
            { id: 'ranked', label: 'Competitive (WRC Rule)' },
            { id: 'casual', label: 'Casual Fun Gathering' },
            { id: 'workshop', label: 'Workshop & Taktik' },
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`adm-pill-btn ${categoryFilter === cat.id ? 'active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Bar & Status Filter */}
        <div className="adm-filter-bar">
          <div className="adm-search-wrap">
            <Search size={16} color="#78807B" />
            <input
              type="text"
              placeholder="Cari nama event, deskripsi, atau venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="adm-search-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="adm-select"
            >
              <option value="all">Semua Status Pendaftaran</option>
              <option value="active">Pendaftaran Aktif</option>
              <option value="upcoming">Akan Datang (Upcoming)</option>
              <option value="selesai">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>

            <button
              type="button"
              onClick={loadData}
              title="Muat ulang data dari database"
              className="adm-btn-refresh"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Memuat...' : 'Segarkan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. MAIN EVENT TABLE (PRESERVED 100%) ── */}
      <div className="adm-table-container">
        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#5A675E' }}>
            <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #EBF6EE', borderTop: '3px solid #004F27', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '12px', fontSize: '13px' }}>Memuat data event dari database...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <AlertCircle size={36} color="#DC2626" style={{ margin: '0 auto 8px' }} />
            <h4 style={{ margin: 0, color: '#111E18', fontSize: '15px' }}>Gagal Mengambil Data</h4>
            <p style={{ margin: '6px 0 16px', color: '#5A675E', fontSize: '13px' }}>{error}</p>
            <button type="button" onClick={loadData} className="adm-btn-primary">
              Coba Lagi
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Trophy size={40} color="#D7E6DB" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: 0, color: '#111E18', fontSize: '15px' }}>Tidak Ada Event yang Sesuai</h4>
            <p style={{ margin: '6px 0 16px', color: '#5A675E', fontSize: '13px' }}>
              Belum ada data event atau tidak ditemukan kecocokan dengan filter saat ini.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="adm-btn-primary"
            >
              + Tambah Event Pertama
            </button>
          </div>
        ) : (
          <>
            <div className="adm-table-scroll">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>EVENT &amp; TURNAMEN</th>
                    <th>TANGGAL &amp; WAKTU</th>
                    <th>VENUE LOKASI</th>
                    <th>BIAYA &amp; KUOTA</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'right' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((ev) => {
                    const isFinished = ev.status === 'selesai' || ev.status === 'finished';
                    const isCancelled = ev.status === 'cancelled';
                    const isUpcoming = ev.status === 'upcoming';

                    return (
                      <tr key={ev.id}>
                        {/* Event Banner & Info */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              position: 'relative',
                              width: '56px',
                              height: '42px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: '#EBF6EE',
                              flexShrink: 0,
                              border: '1px solid #D7E6DB'
                            }}>
                              <Image
                                src={ev.foto || '/assets/event_1.jpg'}
                                alt={ev.nama_event}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#111E18', lineHeight: 1.3 }}>
                                {ev.nama_event}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#5A675E', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 600, color: '#004F27' }}>#{ev.id}</span>
                                <span>•</span>
                                <span>{ev.kategori || 'Turnamen WRC'}</span>
                                <span>•</span>
                                <span style={{
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  backgroundColor: ev.jenis_event === 'Non-Event' ? '#FEF3C7' : '#EBF6EE',
                                  color: ev.jenis_event === 'Non-Event' ? '#92400E' : '#004F27',
                                  border: ev.jenis_event === 'Non-Event' ? '1px solid #FDE68A' : '1px solid #B5D4C2'
                                }}>
                                  {ev.jenis_event || 'Event'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td style={{ color: '#2B3830' }}>
                          <div style={{ fontWeight: 600 }}>{ev.tanggal_formatted || ev.tanggal_event}</div>
                          <div style={{ fontSize: '12px', color: '#5A675E', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} color="#004F27" />
                            <span>{ev.waktu_formatted || `${ev.waktu_mulai} - ${ev.waktu_selesai} WIB`}</span>
                          </div>
                        </td>

                        {/* Venue */}
                        <td style={{ color: '#2B3830' }}>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MapPin size={13} color="#004F27" />
                            <span>{ev.venue || 'Game House'}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#7A897F', marginTop: '2px' }}>
                            {ev.standar_aturan || 'World Riichi Championship (WRC)'}
                          </div>
                        </td>

                        {/* Biaya & Kuota */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#004F27', fontSize: '13px' }}>
                            {ev.biaya || 'Rp 150.000 /kursi'}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#5A675E', marginTop: '2px' }}>
                            {ev.kuota || 'Sisa 4 Kursi'}
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`adm-badge ${
                            isCancelled ? 'adm-badge-cancelled' :
                            isFinished ? 'adm-badge-finished' :
                            isUpcoming ? 'adm-badge-upcoming' :
                            'adm-badge-active'
                          }`}>
                            <span className="adm-badge-dot" />
                            <span>{ev.status_label || ev.status}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="adm-btn-group">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(ev)}
                              title="Lihat Detail Event"
                              className="adm-action-btn adm-action-btn-view"
                            >
                              <Eye size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(ev)}
                              title="Edit Event"
                              className="adm-action-btn adm-action-btn-edit"
                            >
                              <Edit2 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDelete(ev)}
                              title="Hapus Event"
                              className="adm-action-btn adm-action-btn-delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer & Pagination Counter */}
            <div className="adm-table-footer">
              <div className="adm-table-counter">
                Menampilkan <strong>{filteredEvents.length}</strong> dari <strong>{events.length}</strong> turnamen terdaftar
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#7A897F' }}>
                <span className="adm-badge-dot" style={{ backgroundColor: '#10B981' }} />
                <span>Tersinkronisasi dengan Database Laravel MySQL</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── MODAL 1: TAMBAH EVENT BARU (PRESERVED) ── */}
      {showCreateModal && (
        <div className="adm-modal-overlay">
          <div className="adm-modal-container">
            <div className="adm-modal-header">
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#004F27', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  FORMULIR PENDAFTARAN TURNAMEN
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#111E18' }}>
                  Tambah Event / Turnamen Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#5A675E' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="adm-modal-body">
                {/* Nama Event */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Nama Event / Turnamen *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Grand Riichi Jakarta Winter Open 2026"
                    value={formData.nama_event}
                    onChange={(e) => setFormData({ ...formData, nama_event: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {formErrors.nama_event && (
                    <span style={{ fontSize: '11px', color: '#DC2626' }}>{formErrors.nama_event[0]}</span>
                  )}
                </div>

                {/* Venue & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Lokasi Venue Mitra *
                    </label>
                    <select
                      value={formData.venue_id}
                      onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      {venues.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nama_venue} ({v.alamat.split(',')[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Status Pendaftaran *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="active">Aktif (Pendaftaran Dibuka)</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="selesai">Selesai</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </div>
                </div>

                {/* Tanggal & Waktu */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Tanggal Pelaksanaan *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.tanggal_event}
                      onChange={(e) => setFormData({ ...formData, tanggal_event: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Mulai *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.waktu_mulai}
                      onChange={(e) => setFormData({ ...formData, waktu_mulai: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Selesai *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.waktu_selesai}
                      onChange={(e) => setFormData({ ...formData, waktu_selesai: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Biaya Registrasi, Alokasi Kuota / Kursi, & Jenis Event */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Biaya Registrasi
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Rp 150.000 /kursi"
                      value={formData.biaya}
                      onChange={(e) => setFormData({ ...formData, biaya: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Alokasi Kuota / Kursi
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Sisa 4 Kursi (1 Meja)"
                      value={formData.kuota}
                      onChange={(e) => setFormData({ ...formData, kuota: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Jenis Event *
                    </label>
                    <select
                      value={formData.jenis_event}
                      onChange={(e) => setFormData({ ...formData, jenis_event: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#FFFFFF',
                        fontWeight: 600,
                        color: formData.jenis_event === 'Event' ? '#004F27' : '#92400E'
                      }}
                    >
                      <option value="Event">Event</option>
                      <option value="Non-Event">Non-Event</option>
                    </select>
                  </div>
                </div>

                {/* Deskripsi */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Deskripsi &amp; Aturan Turnamen
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Informasi mengenai babak penyisihan, wasit terlisensi, format WRC..."
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Pilihan Gambar Event */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '6px' }}>
                    Foto / Banner Event
                  </label>
                  
                  {/* Preset Photos Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                    {PRESET_EVENT_IMAGES.map((preset) => {
                      const isSelected = !photoFile && formData.foto_preset === preset.url;
                      return (
                        <div
                          key={preset.url}
                          onClick={() => {
                            setFormData({ ...formData, foto_preset: preset.url });
                            setPhotoFile(null);
                            setPhotoPreview(preset.url);
                          }}
                          style={{
                            border: isSelected ? '2px solid #004F27' : '1px solid #D7E6DB',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            backgroundColor: '#FAF8F5'
                          }}
                        >
                          <div style={{ position: 'relative', width: '100%', height: '54px' }}>
                            <Image src={preset.url} alt={preset.label} fill style={{ objectFit: 'cover' }} />
                          </div>
                          <div style={{ padding: '4px', fontSize: '10px', textAlign: 'center', color: isSelected ? '#004F27' : '#5A675E', fontWeight: isSelected ? 700 : 500 }}>
                            {preset.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Upload Custom File */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px dashed #004F27',
                        backgroundColor: '#EBF6EE',
                        color: '#004F27',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Upload size={14} />
                      <span>{photoFile ? photoFile.name : 'Unggah Foto Kustom'}</span>
                    </button>
                    {photoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(formData.foto_preset);
                        }}
                        style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Hapus File
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="adm-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="adm-btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="adm-btn-primary"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Simpan & Publikasikan Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT EVENT ── */}
      {showEditModal && selectedEvent && (
        <div className="adm-modal-overlay">
          <div className="adm-modal-container" style={{ maxWidth: '740px' }}>
            <div className="adm-modal-header" style={{ padding: '18px 26px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#004F27', textTransform: 'uppercase', letterSpacing: '0.6px', backgroundColor: '#EBF6EE', padding: '3px 8px', borderRadius: '4px' }}>
                    PERBARUI EVENT #{selectedEvent.id}
                  </span>
                  <span style={{ fontSize: '11px', color: '#7A897F', fontWeight: 600 }}>
                    {selectedEvent.kategori || 'Turnamen Riichi'}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111E18', lineHeight: 1.3 }}>
                  Edit Event: {selectedEvent.nama_event}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                title="Tutup Modal"
                className="adm-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitUpdate} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="adm-modal-body" style={{ padding: '22px 26px', gap: '18px' }}>
                
                {/* 1. INFORMASI UTAMA */}
                <div>
                  <div className="adm-form-subheading">
                    <Trophy size={13} />
                    <span>Informasi Utama</span>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <label className="adm-form-label">
                      <span>Nama Event / Turnamen</span>
                      <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nama_event}
                      onChange={(e) => setFormData({ ...formData, nama_event: e.target.value })}
                      placeholder="Masukkan nama turnamen..."
                      className="adm-form-input"
                    />
                  </div>
                </div>

                {/* 2. LOKASI & STATUS */}
                <div>
                  <div className="adm-form-subheading">
                    <MapPin size={13} />
                    <span>Lokasi &amp; Status Pendaftaran</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '8px' }}>
                    <div>
                      <label className="adm-form-label">
                        <span>Lokasi Venue Mitra</span>
                        <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <select
                        value={formData.venue_id}
                        onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                        className="adm-form-select"
                      >
                        {venues.map((v) => (
                          <option key={v.id} value={v.id} title={v.nama_venue}>
                            {v.nama_venue} • {v.alamat.split(',')[0]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="adm-form-label">
                        <span>Status Pendaftaran</span>
                        <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="adm-form-select"
                      >
                        <option value="active">Aktif (Pendaftaran Dibuka)</option>
                        <option value="upcoming">Draft (Akan Datang)</option>
                        <option value="selesai">Selesai</option>
                        <option value="cancelled">Dibatalkan</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. JADWAL PELAKSANAAN */}
                <div>
                  <div className="adm-form-subheading">
                    <Calendar size={13} />
                    <span>Jadwal Pelaksanaan</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginTop: '8px' }}>
                    <div>
                      <label className="adm-form-label">
                        <span>Tanggal Pelaksanaan</span>
                        <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.tanggal_event}
                        onChange={(e) => setFormData({ ...formData, tanggal_event: e.target.value })}
                        className="adm-form-input"
                      />
                    </div>

                    <div>
                      <label className="adm-form-label">
                        <span>Mulai</span>
                        <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.waktu_mulai}
                        onChange={(e) => setFormData({ ...formData, waktu_mulai: e.target.value })}
                        className="adm-form-input"
                      />
                    </div>

                    <div>
                      <label className="adm-form-label">
                        <span>Selesai</span>
                        <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.waktu_selesai}
                        onChange={(e) => setFormData({ ...formData, waktu_selesai: e.target.value })}
                        className="adm-form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. BIAYA, ALOKASI KUOTA, & JENIS EVENT */}
                <div>
                  <div className="adm-form-subheading">
                    <Ticket size={13} />
                    <span>Biaya Registrasi, Alokasi Kuota, &amp; Jenis Event</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '8px' }}>
                    <div>
                      <label className="adm-form-label">
                        <span>Biaya Registrasi</span>
                      </label>
                      <input
                        type="text"
                        value={formData.biaya}
                        onChange={(e) => setFormData({ ...formData, biaya: e.target.value })}
                        placeholder="contoh: Rp 95.000 /kursi"
                        className="adm-form-input"
                      />
                    </div>

                    <div>
                      <label className="adm-form-label">
                        <span>Alokasi Kuota</span>
                      </label>
                      <input
                        type="text"
                        value={formData.kuota}
                        onChange={(e) => setFormData({ ...formData, kuota: e.target.value })}
                        placeholder="contoh: Sisa 4 Kursi (Kapasitas 4)"
                        className="adm-form-input"
                      />
                    </div>

                    <div>
                      <label className="adm-form-label">
                        <span>Jenis Event</span>
                        <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <select
                        value={formData.jenis_event}
                        onChange={(e) => setFormData({ ...formData, jenis_event: e.target.value })}
                        className="adm-form-input"
                        style={{
                          backgroundColor: '#FFFFFF',
                          fontWeight: 600,
                          color: formData.jenis_event === 'Event' ? '#004F27' : '#92400E'
                        }}
                      >
                        <option value="Event">Event</option>
                        <option value="Non-Event">Non-Event</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 5. DESKRIPSI & ATURAN TURNAMEN */}
                <div>
                  <div className="adm-form-subheading">
                    <FileText size={13} />
                    <span>Deskripsi &amp; Aturan Turnamen</span>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <textarea
                      rows={4}
                      value={formData.deskripsi}
                      onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                      placeholder="Tuliskan format turnamen, aturan, dan fasilitas yang didapatkan peserta..."
                      className="adm-form-textarea"
                      style={{ minHeight: '100px' }}
                    />
                  </div>
                </div>

              </div>

              <div className="adm-modal-footer" style={{ padding: '16px 26px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="adm-btn-secondary"
                  style={{ height: '42px', padding: '0 20px', minWidth: '90px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="adm-btn-primary"
                  style={{ height: '42px', padding: '0 22px', backgroundColor: '#004F27' }}
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: DETAIL EVENT LENGKAP & TERSTRUKTUR ── */}
      {showDetailModal && selectedEvent && (() => {
        const statusConfig = getEventStatusConfig(selectedEvent.status);
        return (
          <div className="adm-modal-overlay">
            <div className="adm-detail-modal-container" style={{ maxWidth: '740px' }}>
              {/* Header */}
              <div className="adm-modal-header" style={{ padding: '18px 26px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#183629', textTransform: 'uppercase', letterSpacing: '0.6px', backgroundColor: '#EBF6EE', padding: '3px 8px', borderRadius: '4px' }}>
                      INFORMASI DETAIL TURNAMEN
                    </span>
                    <span style={{ fontSize: '11px', color: '#7A897F', fontWeight: 600 }}>
                      ID #{selectedEvent.id}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111E18', lineHeight: 1.3 }}>
                    {selectedEvent.nama_event}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  title="Tutup Modal"
                  className="adm-modal-close-btn"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="adm-modal-body" style={{ padding: '22px 26px', gap: '18px' }}>
                {/* Event Image Banner with Overlay Badges */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '210px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #D7E6DB',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
                }}>
                  <Image
                    src={selectedEvent.foto || '/assets/event_1.jpg'}
                    alt={selectedEvent.nama_event}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  {/* Status Badge Top Right */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <span className={`adm-badge ${statusConfig.badgeClass}`} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                      <span className="adm-badge-dot" />
                      <span>{statusConfig.shortLabel}</span>
                    </span>
                  </div>
                  {/* Category Rule Bottom Left */}
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                    <span style={{
                      backgroundColor: 'rgba(24, 54, 41, 0.85)',
                      color: '#FAF8F5',
                      backdropFilter: 'blur(4px)',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(226, 188, 85, 0.5)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Award size={13} color="#E2BC55" />
                      <span>{selectedEvent.standar_aturan || selectedEvent.kategori || 'Standar Turnamen WRC'}</span>
                    </span>
                  </div>
                </div>

                {/* ── BAGIAN 1: JADWAL & WAKTU SESI ── */}
                <div className="adm-detail-section">
                  <div className="adm-detail-section-header">
                    <Calendar size={14} color="#183629" />
                    <span>JADWAL &amp; WAKTU PELAKSANAAN</span>
                  </div>
                  <div className="adm-detail-grid">
                    <div className="adm-detail-card">
                      <span className="adm-detail-card-label">Tanggal Pelaksanaan</span>
                      <span className="adm-detail-card-val">
                        {formatIndonesianEventDate(selectedEvent.tanggal_event, selectedEvent.tanggal_formatted)}
                      </span>
                      <span className="adm-detail-card-sub">Sesi Resmi MahjongYuks</span>
                    </div>

                    <div className="adm-detail-card">
                      <span className="adm-detail-card-label">Waktu Sesi Pertandingan</span>
                      <span className="adm-detail-card-val" style={{ color: '#004F27' }}>
                        {selectedEvent.waktu_formatted || `${selectedEvent.waktu_mulai || '13:00'} - ${selectedEvent.waktu_selesai || '18:00'} WIB`}
                      </span>
                      <span className="adm-detail-card-sub">Waktu Indonesia Barat (WIB)</span>
                    </div>
                  </div>
                </div>

                {/* ── BAGIAN 2: LOKASI & VENUE PENYELENGGARA ── */}
                <div className="adm-detail-section">
                  <div className="adm-detail-section-header">
                    <MapPin size={14} color="#183629" />
                    <span>LOKASI &amp; VENUE PENYELENGGARA</span>
                  </div>
                  <div className="adm-detail-grid">
                    <div className="adm-detail-card">
                      <span className="adm-detail-card-label">Venue Penyelenggara</span>
                      <span className="adm-detail-card-val">
                        {selectedEvent.venue || 'Game House'}
                      </span>
                      <span className="adm-detail-card-sub">Sedayu City Kelapa Gading</span>
                    </div>

                    <div className="adm-detail-card">
                      <span className="adm-detail-card-label">Aturan &amp; Regulasi Meja</span>
                      <span className="adm-detail-card-val">
                        {selectedEvent.standar_aturan || 'WRC (World Riichi Rules)'}
                      </span>
                      <span className="adm-detail-card-sub">Standar Wasit &amp; Meja Otomatis</span>
                    </div>
                  </div>
                </div>

                {/* ── BAGIAN 3: BIAYA & ALOKASI KUOTA ── */}
                <div className="adm-detail-section">
                  <div className="adm-detail-section-header">
                    <Ticket size={14} color="#183629" />
                    <span>BIAYA TIKET &amp; ALOKASI MEJA</span>
                  </div>
                  <div className="adm-detail-grid">
                    <div className="adm-detail-card">
                      <span className="adm-detail-card-label">Biaya Pendaftaran</span>
                      <span className="adm-detail-card-val" style={{ color: '#183629', fontSize: '15px' }}>
                        {selectedEvent.biaya || 'Rp 150.000 /kursi'}
                      </span>
                      <span className="adm-detail-card-sub">Termasuk Meja Otomatis &amp; Free Flow Drink</span>
                    </div>

                    <div className="adm-detail-card">
                      <span className="adm-detail-card-label">Ketersediaan Kuota Kursi</span>
                      <span className="adm-detail-card-val">
                        {selectedEvent.kuota || selectedEvent.kapasitas_meja || 'Sisa 4 Kursi (1 Meja)'}
                      </span>
                      <span className="adm-detail-card-sub">Format: 4 Pemain per Meja Otomatis</span>
                      {/* Capacity Mini Progress Bar */}
                      <div style={{ width: '100%', height: '5px', backgroundColor: '#E4ECE6', borderRadius: '999px', marginTop: '6px', overflow: 'hidden' }}>
                        <div style={{ width: '75%', height: '100%', backgroundColor: '#004F27', borderRadius: '999px' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── BAGIAN 4: DESKRIPSI & KETENTUAN ── */}
                <div className="adm-detail-section">
                  <div className="adm-detail-section-header">
                    <FileText size={14} color="#183629" />
                    <span>DESKRIPSI &amp; PETUNJUK PERTANDINGAN</span>
                  </div>
                  <div style={{
                    backgroundColor: '#FAF8F5',
                    border: '1px solid #E4ECE6',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    fontSize: '13px',
                    color: '#2B3830',
                    lineHeight: 1.6
                  }}>
                    {selectedEvent.deskripsi || 'Tidak ada catatan atau instruksi khusus untuk turnamen ini.'}
                  </div>
                </div>

                {/* ── BAGIAN 5: DAFTAR PESERTA TERDAFTAR (REAL PARTICIPANTS) ── */}
                <div className="adm-detail-section">
                  <div className="adm-detail-section-header" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="#183629" />
                      <span>DAFTAR PESERTA TERDAFTAR</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#EBF6EE', color: '#004F27', padding: '2px 8px', borderRadius: '4px' }}>
                      {pesertaList.filter(p => p.status_pendaftaran !== 'batal').length} Peserta Terkonfirmasi
                    </span>
                  </div>

                  {pesertaLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#5A675E', fontSize: '12.5px' }}>
                      Memuat daftar peserta dari database...
                    </div>
                  ) : pesertaList.length === 0 ? (
                    <div style={{
                      padding: '24px',
                      textAlign: 'center',
                      backgroundColor: '#FAF8F5',
                      borderRadius: '10px',
                      border: '1px dashed #D7E6DB',
                      color: '#7A897F',
                      fontSize: '12.5px'
                    }}>
                      Belum ada pemain yang mendaftar pada turnamen ini.
                    </div>
                  ) : (
                    <div className="adm-table-container" style={{ border: '1px solid #E4ECE6', borderRadius: '10px', overflow: 'hidden' }}>
                      <div className="adm-table-scroll">
                        <table className="adm-table" style={{ fontSize: '12px' }}>
                          <thead>
                            <tr>
                              <th>NAMA PESERTA</th>
                              <th>KONTAK (EMAIL / TELEPON)</th>
                              <th>TANGGAL DAFTAR</th>
                              <th>STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pesertaList.map((p, idx) => (
                              <tr key={p.id || idx}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '50%',
                                      backgroundColor: '#EBF6EE',
                                      color: '#004F27',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 800,
                                      fontSize: '11px'
                                    }}>
                                      {p.nama_peserta.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 700, color: '#111E18' }}>{p.nama_peserta}</div>
                                      <div style={{ fontSize: '10.5px', color: '#7A897F' }}>ID: #{p.player_id}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ color: '#2B3830' }}>{p.email}</div>
                                  <div style={{ fontSize: '11px', color: '#5A675E' }}>{p.no_telepon}</div>
                                </td>
                                <td>
                                  <div style={{ color: '#2B3830' }}>{p.tanggal_daftar_formatted || p.tanggal_daftar || '-'}</div>
                                </td>
                                <td>
                                  <span className={`adm-badge ${
                                    p.status_pendaftaran === 'terdaftar' ? 'adm-badge-active' :
                                    p.status_pendaftaran === 'hadir' ? 'adm-badge-upcoming' :
                                    'adm-badge-cancelled'
                                  }`}>
                                    <span className="adm-badge-dot" />
                                    <span>{p.status_pendaftaran.toUpperCase()}</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="adm-modal-footer" style={{ padding: '16px 26px', backgroundColor: '#FAF8F5', justifyContent: 'space-between' }}>
                <Link
                  href={`/events/${selectedEvent.id}`}
                  target="_blank"
                  className="adm-btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    height: '42px',
                    padding: '0 16px'
                  }}
                >
                  <span>Buka Halaman Publik Event</span>
                  <ExternalLink size={14} />
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenEdit(selectedEvent);
                    }}
                    className="adm-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', height: '42px', padding: '0 18px' }}
                  >
                    <Edit2 size={14} />
                    <span>Ubah Event Ini</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(false)}
                    className="adm-btn-primary"
                    style={{ minWidth: '95px', fontSize: '12.5px', height: '42px', padding: '0 22px', backgroundColor: '#004F27' }}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 4: HAPUS EVENT ── */}
      {showDeleteModal && selectedEvent && (
        <div className="adm-modal-overlay">
          <div className="adm-modal-container" style={{ maxWidth: '460px' }}>
            <div className="adm-modal-header" style={{ padding: '18px 26px', borderBottom: '1px solid #EEF4F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.6px', backgroundColor: '#FEF2F2', padding: '3px 8px', borderRadius: '4px', border: '1px solid #FECACA' }}>
                  KONFIRMASI TINDAKAN
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                title="Tutup Modal"
                className="adm-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="adm-modal-body" style={{ padding: '26px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              {/* Red Warning Circle Icon */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#FEF2F2',
                border: '1.5px solid #FECACA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: '#DC2626'
              }}>
                <AlertTriangle size={28} />
              </div>

              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 800, color: '#111E18' }}>
                Hapus Event?
              </h3>

              <p style={{ margin: 0, fontSize: '13.5px', color: '#4B5563', lineHeight: 1.6 }}>
                Apakah Anda yakin ingin menghapus event <strong style={{ color: '#111E18' }}>"{selectedEvent.nama_event}"</strong> dari sistem? Tindakan ini <span style={{ color: '#DC2626', fontWeight: 700 }}>tidak dapat dibatalkan</span> dan seluruh data pendaftaran terkait akan terhapus secara permanen.
              </p>
            </div>

            <div className="adm-modal-footer" style={{ padding: '16px 26px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="adm-btn-secondary"
                style={{ height: '42px', padding: '0 20px', minWidth: '85px' }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleConfirmDelete}
                style={{
                  height: '42px',
                  padding: '0 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: formSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                {formSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>Ya, Hapus Event</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
