'use client';

import '@/app/admin/admin.css';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Building,
  Plus,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  Eye,
  MapPin,
  Layers,
  Star,
  CheckCircle,
  AlertCircle,
  X,
  Upload,
  ExternalLink,
  Calendar,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Award,
  Filter,
  ChevronDown,
  ChevronUp,
  Minus,
  Loader2
} from 'lucide-react';
import ApiClient, { ApiVenue } from '@/lib/api';

const PRESET_VENUE_IMAGES = [
  { label: 'Game House Sedayu City (Homebase)', url: '/assets/mahjong_parlor_players.jpg' },
  { label: 'Suasana Arena Tokyo Kontemporer', url: '/landing/hero-parlor.jpg' },
  { label: 'Area Kompetisi & Turnamen', url: '/assets/venue_senopati.jpg' },
];

export default function AdminVenueManager() {
  const [venues, setVenues] = useState<ApiVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'amos' | 'vip' | 'jabodetabek' | 'active'>('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<ApiVenue | null>(null);
  const [venueDetail, setVenueDetail] = useState<ApiVenue | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nama_venue: '',
    alamat: '',
    kota_kecamatan: '',
    telepon: '',
    email: '',
    jam_buka: '07:30',
    jam_tutup: '21:30',
    latitude: '',
    longitude: '',
    maps_url: '',
    deskripsi: '',
    jumlah_meja: 34,
    status: 'active',
    fasilitas: 'Meja Otomatis Amos Rexx III, Ruangan Ber-AC Sistem Filtrasi HEPA, Standar Regulasi Turnamen WRC, Area Parkir Luas & Keamanan 24 Jam, Kafe & Refreshment Bar, Wi-Fi Berkecepatan Tinggi',
    foto_preset: '/assets/mahjong_parlor_players.jpg',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Data
  const loadVenues = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getVenues();
      if (res.success && res.data) {
        setVenues(res.data);
      }
    } catch (err: any) {
      setError('Gagal memuat data venue dari backend Laravel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    let displayText = text;
    if (type === 'error') {
      if (
        displayText.includes('Class "') ||
        displayText.includes('SQLSTATE') ||
        displayText.includes('syntax error') ||
        displayText.includes('Exception') ||
        displayText.includes('Call to undefined') ||
        displayText.includes('stack trace') ||
        displayText.includes('Undefined constant')
      ) {
        displayText = 'Terjadi kendala sistem pada server. Silakan coba beberapa saat lagi.';
      }
    }
    setToastMessage({ text: displayText, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Infrastructure & Parlor Statistics
  const stats = useMemo(() => {
    const total = venues.length;
    const active = venues.filter((v) => v.status === 'active').length;
    const maintenance = venues.filter((v) => v.status === 'maintenance').length;
    const totalMeja = venues.reduce((acc, v) => acc + (Number(v.jumlah_meja) || 0), 0);
    return { total, active, maintenance, totalMeja };
  }, [venues]);

  // Filtered Venues
  const filteredVenues = useMemo(() => {
    return venues.filter((vn) => {
      const matchSearch =
        searchQuery === '' ||
        vn.nama_venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vn.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vn.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vn.fasilitas_text && vn.fasilitas_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (Array.isArray(vn.fasilitas) &&
          vn.fasilitas.some((f) => String(f).toLowerCase().includes(searchQuery.toLowerCase())));

      const matchStatus = statusFilter === 'all' || vn.status === statusFilter;

      let matchFacility = true;
      if (facilityFilter === 'amos') {
        const txt = `${vn.tipe_meja || ''} ${vn.fasilitas_text || ''} ${
          Array.isArray(vn.fasilitas) ? vn.fasilitas.join(' ') : ''
        }`.toLowerCase();
        matchFacility = txt.includes('amos') || txt.includes('otomatis');
      } else if (facilityFilter === 'vip') {
        const txt = `${vn.deskripsi || ''} ${vn.fasilitas_text || ''} ${
          Array.isArray(vn.fasilitas) ? vn.fasilitas.join(' ') : ''
        }`.toLowerCase();
        matchFacility = txt.includes('vip') || txt.includes('soundproof') || txt.includes('private');
      } else if (facilityFilter === 'jabodetabek') {
        const txt = `${vn.alamat || ''} ${vn.nama_venue || ''}`.toLowerCase();
        matchFacility =
          txt.includes('jakarta') ||
          txt.includes('bogor') ||
          txt.includes('depok') ||
          txt.includes('tangerang') ||
          txt.includes('bekasi') ||
          txt.includes('pik') ||
          txt.includes('senopati') ||
          txt.includes('sedayu');
      } else if (facilityFilter === 'active') {
        matchFacility = vn.status === 'active';
      }

      return matchSearch && matchStatus && matchFacility;
    });
  }, [venues, searchQuery, statusFilter, facilityFilter]);

  // Additional UI States
  const [showMapAccordion, setShowMapAccordion] = useState(false);
  const [newFacilityInput, setNewFacilityInput] = useState('');

  // Facility chip helpers
  const facilitiesList = useMemo(() => {
    if (!formData.fasilitas) return [];
    return formData.fasilitas.split(',').map((s) => s.trim()).filter(Boolean);
  }, [formData.fasilitas]);

  const handleRemoveFacility = (idxToRemove: number) => {
    const updated = facilitiesList.filter((_, idx) => idx !== idxToRemove);
    setFormData((prev) => ({ ...prev, fasilitas: updated.join(', ') }));
  };

  const handleAddFacility = () => {
    const val = newFacilityInput.trim();
    if (!val) return;
    if (facilitiesList.some((f) => f.toLowerCase() === val.toLowerCase())) {
      setNewFacilityInput('');
      return;
    }
    const updated = [...facilitiesList, val];
    setFormData((prev) => ({ ...prev, fasilitas: updated.join(', ') }));
    setNewFacilityInput('');
  };

  // Time validation helper: jam_tutup must be after jam_buka
  const isTimeInvalid = useMemo(() => {
    if (!formData.jam_buka || !formData.jam_tutup) return false;
    return formData.jam_tutup <= formData.jam_buka;
  }, [formData.jam_buka, formData.jam_tutup]);

  // Check if meja count is reduced in edit mode
  const isTableReduced = useMemo(() => {
    if (!selectedVenue) return false;
    const currentVenueTables = Number(selectedVenue.jumlah_meja) || 0;
    const formTables = Number(formData.jumlah_meja) || 0;
    return formTables < currentVenueTables;
  }, [selectedVenue, formData.jumlah_meja]);

  // Esc key closes modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEditModal) setShowEditModal(false);
        if (showCreateModal) setShowCreateModal(false);
        if (showDetailModal) setShowDetailModal(false);
        if (showDeleteModal) setShowDeleteModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEditModal, showCreateModal, showDetailModal, showDeleteModal]);

  // Handle open create modal
  const handleOpenCreate = () => {
    setFormData({
      nama_venue: '',
      alamat: '',
      kota_kecamatan: 'Kelapa Gading, Jakarta Utara',
      telepon: '',
      email: '',
      jam_buka: '07:30',
      jam_tutup: '21:30',
      latitude: '',
      longitude: '',
      maps_url: '',
      deskripsi: 'Game House MahjongYuks Sedayu City Kelapa Gading.',
      jumlah_meja: 34,
      status: 'active',
      fasilitas: 'Meja Otomatis Amos Rexx III, Ruangan Ber-AC Sistem Filtrasi HEPA, Standar Regulasi Turnamen WRC, Area Parkir Luas & Keamanan 24 Jam, Kafe & Refreshment Bar, Wi-Fi Berkecepatan Tinggi',
      foto_preset: '/assets/mahjong_parlor_players.jpg',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormErrors({});
    setShowMapAccordion(false);
    setNewFacilityInput('');
    setShowCreateModal(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (vn: ApiVenue) => {
    setSelectedVenue(vn);
    setFormData({
      nama_venue: vn.nama_venue,
      alamat: vn.alamat,
      kota_kecamatan: vn.kota_kecamatan || 'Kelapa Gading, Jakarta Utara',
      telepon: vn.telepon || '',
      email: vn.email || '',
      jam_buka: vn.jam_buka_raw || '07:30',
      jam_tutup: vn.jam_tutup_raw || '21:30',
      latitude: vn.latitude !== null && vn.latitude !== undefined ? String(vn.latitude) : '',
      longitude: vn.longitude !== null && vn.longitude !== undefined ? String(vn.longitude) : '',
      maps_url: vn.maps_url || '',
      deskripsi: vn.deskripsi || 'Game House MahjongYuks Sedayu City Kelapa Gading.',
      jumlah_meja: vn.jumlah_meja || 34,
      status: vn.status || 'active',
      fasilitas:
        vn.fasilitas_text ||
        (Array.isArray(vn.fasilitas) ? vn.fasilitas.join(', ') : 'Meja Otomatis Amos Rexx III, Ruangan Ber-AC Sistem Filtrasi HEPA, Standar Regulasi Turnamen WRC, Area Parkir Luas & Keamanan 24 Jam, Kafe & Refreshment Bar, Wi-Fi Berkecepatan Tinggi'),
      foto_preset: vn.foto || '/assets/mahjong_parlor_players.jpg',
    });
    setPhotoFile(null);
    setPhotoPreview(vn.foto || null);
    setFormErrors({});
    setShowMapAccordion(false);
    setNewFacilityInput('');
    setShowEditModal(true);
  };

  // Handle open detail modal
  const handleOpenDetail = async (vn: ApiVenue) => {
    setSelectedVenue(vn);
    setVenueDetail(null);
    setShowDetailModal(true);
    setDetailLoading(true);

    try {
      const res = await ApiClient.getVenueById(vn.id);
      if (res.success && res.data) {
        setVenueDetail(res.data);
      } else {
        setVenueDetail(vn);
      }
    } catch {
      setVenueDetail(vn);
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle open delete modal
  const handleOpenDelete = (vn: ApiVenue) => {
    setSelectedVenue(vn);
    setDeleteErrorMessage(null);
    setShowDeleteModal(true);
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Submit Create Venue
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isTimeInvalid) {
      showToast('Jam tutup operasional venue harus setelah jam buka.', 'error');
      return;
    }
    if ((Number(formData.jumlah_meja) || 0) < 0) {
      showToast('Jumlah meja harus berupa angka minimal 0.', 'error');
      return;
    }

    setFormSubmitting(true);
    setFormErrors({});

    try {
      const postData = new FormData();
      postData.append('nama_venue', formData.nama_venue);
      postData.append('alamat', formData.alamat);
      if (formData.kota_kecamatan) postData.append('kota_kecamatan', formData.kota_kecamatan);
      if (formData.telepon) postData.append('telepon', formData.telepon);
      if (formData.email) postData.append('email', formData.email);
      if (formData.jam_buka) postData.append('jam_buka', formData.jam_buka);
      if (formData.jam_tutup) postData.append('jam_tutup', formData.jam_tutup);
      if (formData.latitude) postData.append('latitude', formData.latitude);
      if (formData.longitude) postData.append('longitude', formData.longitude);
      if (formData.maps_url) postData.append('maps_url', formData.maps_url);
      postData.append('deskripsi', formData.deskripsi);
      postData.append('status', formData.status);
      postData.append('fasilitas', formData.fasilitas);
      postData.append('jumlah_meja', String(formData.jumlah_meja));

      if (photoFile) {
        postData.append('foto', photoFile);
      } else if (formData.foto_preset) {
        postData.append('foto', formData.foto_preset);
      }

      const res = await ApiClient.createVenue(postData);

      if (res.success) {
        showToast(res.message || 'Venue baru berhasil didaftarkan ke sistem!');
        setShowCreateModal(false);
        loadVenues();
      } else {
        if (res.errors) {
          setFormErrors(res.errors);
        }
        showToast(res.message || 'Gagal menyimpan data venue.', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat menghubungi API Laravel.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Edit Venue
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenue) return;

    if (isTimeInvalid) {
      showToast('Jam tutup operasional venue harus setelah jam buka.', 'error');
      return;
    }
    if ((Number(formData.jumlah_meja) || 0) < 0) {
      showToast('Jumlah meja harus berupa angka minimal 0.', 'error');
      return;
    }

    setFormSubmitting(true);
    setFormErrors({});

    try {
      const postData = new FormData();
      postData.append('nama_venue', formData.nama_venue);
      postData.append('alamat', formData.alamat);
      if (formData.kota_kecamatan) postData.append('kota_kecamatan', formData.kota_kecamatan);
      if (formData.telepon) postData.append('telepon', formData.telepon);
      if (formData.email) postData.append('email', formData.email);
      if (formData.jam_buka) postData.append('jam_buka', formData.jam_buka);
      if (formData.jam_tutup) postData.append('jam_tutup', formData.jam_tutup);
      if (formData.latitude) postData.append('latitude', formData.latitude);
      if (formData.longitude) postData.append('longitude', formData.longitude);
      if (formData.maps_url) postData.append('maps_url', formData.maps_url);
      postData.append('deskripsi', formData.deskripsi);
      postData.append('status', formData.status);
      postData.append('fasilitas', formData.fasilitas);
      postData.append('jumlah_meja', String(formData.jumlah_meja));

      if (photoFile) {
        postData.append('foto', photoFile);
      } else if (formData.foto_preset) {
        postData.append('foto', formData.foto_preset);
      }

      const res = await ApiClient.updateVenue(selectedVenue.id, postData);

      if (res.success) {
        showToast(res.message || 'Data venue berhasil diperbarui!');
        setShowEditModal(false);
        loadVenues();
      } else {
        if (res.errors) {
          setFormErrors(res.errors);
        }
        showToast(res.message || 'Gagal memperbarui venue.', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat menghubungi API Laravel.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Delete Venue
  const handleConfirmDelete = async () => {
    if (!selectedVenue) return;
    setFormSubmitting(true);
    setDeleteErrorMessage(null);

    try {
      const res = await ApiClient.deleteVenue(selectedVenue.id);

      if (res.success) {
        showToast(res.message || 'Venue berhasil dihapus dari sistem.');
        setShowDeleteModal(false);
        loadVenues();
      } else {
        setDeleteErrorMessage(res.message || 'Gagal menghapus venue.');
      }
    } catch (err: any) {
      setDeleteErrorMessage('Terjadi kesalahan saat menghubungi server.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toastMessage.type === 'success' ? '#183629' : '#DC2626',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle size={18} color="#E2BC55" />
          ) : (
            <AlertCircle size={18} color="#FCA5A5" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── 1. HERO HEADER: INFRASTRUKTUR & VENUE RESMI ── */}
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
              INFRASTRUKTUR &amp; VENUE RESMI
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111E18', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.3px' }}>
            <Building size={22} color="#004F27" />
            <span>Manajemen Venue Mahjong</span>
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5A675E' }}>
            Kelola data cabang venue resmi MahjongYuks, inventaris meja otomatis Amos Rexx III, kapasitas pemain,
            fasilitas unggulan, dan relasi jadwal turnamen.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="adm-btn-primary"
        >
          <Plus size={16} />
          <span>+ Daftarkan Venue Baru</span>
        </button>
      </div>

      {/* ── 2. STATISTIK INFRASTRUKTUR & MEJA (4 Kolom Rapi & Terstruktur) ── */}
      <div className="adm-stat-grid" style={{ marginBottom: 0 }}>
        {/* Card 1: Total Venue */}
        <div className="adm-stat-card">
          <div className="adm-stat-card-header">
            <span className="adm-stat-label">Total Venue</span>
            <div className="adm-stat-icon-wrap" style={{ backgroundColor: '#EBF6EE', color: '#004F27' }}>
              <Building size={18} />
            </div>
          </div>
          <div className="adm-stat-number">
            {venues.length} <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Venue</span>
          </div>
          <div className="adm-stat-meta">
            <span className="adm-stat-pill adm-stat-pill-green">
              {stats.active} Beroperasi
            </span>
            <span style={{ color: '#7A897F' }}>•</span>
            <span>{stats.maintenance} Maintenance</span>
          </div>
        </div>

        {/* Card 2: Total Meja Otomatis */}
        <div className="adm-stat-card">
          <div className="adm-stat-card-header">
            <span className="adm-stat-label">Total Meja Otomatis</span>
            <div className="adm-stat-icon-wrap" style={{ backgroundColor: '#FEF9EE', color: '#B8860B' }}>
              <Layers size={18} />
            </div>
          </div>
          <div className="adm-stat-number" style={{ color: '#183629' }}>
            {stats.totalMeja} <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Meja</span>
          </div>
          <div className="adm-stat-meta">
            <span style={{ color: '#004F27', fontWeight: 700 }}>
              Kapasitas {stats.totalMeja * 4} Pemain Simultan
            </span>
          </div>
        </div>

        {/* Card 3: Venue Beroperasi */}
        <div className="adm-stat-card">
          <div className="adm-stat-card-header">
            <span className="adm-stat-label">Venue Beroperasi</span>
            <div className="adm-stat-icon-wrap" style={{ backgroundColor: '#DCF1E3', color: '#004F27' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="adm-stat-number" style={{ color: '#004F27' }}>
            {stats.active} <span style={{ fontSize: '13px', fontWeight: 600, color: '#5A675E' }}>Cabang</span>
          </div>
          <div className="adm-stat-meta">
            <span style={{ color: '#16A34A', fontWeight: 700 }}>● Buka &amp; Siap Reservasi</span>
          </div>
        </div>

        {/* Card 4: Standar Fasilitas */}
        <div className="adm-stat-card">
          <div className="adm-stat-card-header">
            <span className="adm-stat-label">Standar Fasilitas</span>
            <div className="adm-stat-icon-wrap" style={{ backgroundColor: '#F3E8FF', color: '#6B21A8' }}>
              <Award size={18} />
            </div>
          </div>
          <div className="adm-stat-number" style={{ fontSize: '20px', paddingTop: '2px' }}>
            Amos Rexx III
          </div>
          <div className="adm-stat-meta">
            <span style={{ color: '#5A675E' }}>Full AC HEPA &amp; Meja Otomatis</span>
          </div>
        </div>
      </div>

      {/* ── 3. CATEGORY & FACILITY FILTER PILLS & SEARCH CONTROLS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Category Pills Bar */}
        <div className="adm-filter-pills-bar">
          <button
            type="button"
            onClick={() => setFacilityFilter('all')}
            className={`adm-pill-btn ${facilityFilter === 'all' ? 'active' : ''}`}
          >
            Semua Venue ({venues.length})
          </button>
          <button
            type="button"
            onClick={() => setFacilityFilter('amos')}
            className={`adm-pill-btn ${facilityFilter === 'amos' ? 'active' : ''}`}
          >
            Meja Otomatis Amos Rexx
          </button>
          <button
            type="button"
            onClick={() => setFacilityFilter('vip')}
            className={`adm-pill-btn ${facilityFilter === 'vip' ? 'active' : ''}`}
          >
            Ruang VIP / Soundproof
          </button>
          <button
            type="button"
            onClick={() => setFacilityFilter('jabodetabek')}
            className={`adm-pill-btn ${facilityFilter === 'jabodetabek' ? 'active' : ''}`}
          >
            Jabodetabek Area
          </button>
          <button
            type="button"
            onClick={() => setFacilityFilter('active')}
            className={`adm-pill-btn ${facilityFilter === 'active' ? 'active' : ''}`}
          >
            Sedang Buka ({stats.active})
          </button>
        </div>

        {/* Search Bar & Status Filter (Setara dengan Kelola Event) */}
        <div className="adm-filter-bar">
          <div className="adm-search-wrap">
            <Search size={16} color="#78807B" />
            <input
              type="text"
              placeholder="Cari nama venue, alamat jalan, atau fasilitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="adm-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#78807B' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="adm-select"
            >
              <option value="all">Semua Status Operasional</option>
              <option value="active">Aktif Beroperasi</option>
              <option value="inactive">Tutup Sementara</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <button
              type="button"
              onClick={loadVenues}
              title="Muat ulang data dari database"
              className="adm-btn-refresh"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Memuat...' : 'Segarkan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 6. MAIN TABLE (MANDATORY: PRESERVED FULL COLUMNS & DATA) ── */}
      <div className="adm-table-container">
        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#5A675E' }}>
            <div
              style={{
                display: 'inline-block',
                width: '32px',
                height: '32px',
                border: '3px solid #EBF6EE',
                borderTop: '3px solid #183629',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ marginTop: '14px', fontSize: '13px', fontWeight: 600 }}>
              Memuat data venue dari database...
            </p>
          </div>
        ) : error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <AlertCircle size={40} color="#DC2626" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: 0, color: '#111E18', fontSize: '16px', fontWeight: 700 }}>
              Gagal Mengambil Data Venue
            </h4>
            <p style={{ margin: '6px 0 16px', color: '#5A675E', fontSize: '13px' }}>{error}</p>
            <button
              type="button"
              onClick={loadVenues}
              className="adm-btn-primary"
              style={{ margin: '0 auto' }}
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Building size={44} color="#D7E6DB" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ margin: 0, color: '#111E18', fontSize: '16px', fontWeight: 700 }}>
              Tidak Ada Venue yang Sesuai
            </h4>
            <p style={{ margin: '6px 0 16px', color: '#5A675E', fontSize: '13px' }}>
              Tidak ditemukan data venue dengan kata kunci atau filter saat ini.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setFacilityFilter('all');
              }}
              className="adm-btn-secondary"
              style={{ margin: '0 auto' }}
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="adm-table-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>VENUE</th>
                  <th style={{ width: '30%' }}>ALAMAT CABANG</th>
                  <th style={{ width: '18%' }}>KAPASITAS MEJA</th>
                  <th style={{ width: '10%' }}>STATUS OPERASIONAL</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredVenues.map((vn) => {
                  const isActive = vn.status === 'active';
                  const isMaintenance = vn.status === 'maintenance';

                  return (
                    <tr key={vn.id}>
                      {/* 1. Venue & Thumbnail */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              position: 'relative',
                              width: '56px',
                              height: '42px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: '#EBF6EE',
                              flexShrink: 0,
                              border: '1px solid #D7E6DB',
                            }}
                          >
                            <Image
                              src={vn.foto || '/assets/mahjong_parlor_players.jpg'}
                              alt={vn.nama_venue}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#111E18', fontSize: '13.5px', lineHeight: 1.3 }}>
                              {vn.nama_venue}
                            </div>
                            <div style={{ fontSize: '11px', color: '#5A675E', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ backgroundColor: '#FAF8F5', border: '1px solid #E4ECE6', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                #{vn.id}
                              </span>
                              <span>•</span>
                              <span>{vn.tipe_meja || 'Amos Rexx III Otomatis'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Alamat Cabang */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <MapPin size={14} color="#183629" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ fontSize: '12.5px', color: '#2B3830', lineHeight: 1.4 }}>
                            {vn.alamat}
                          </span>
                        </div>
                      </td>

                      {/* 3. Kapasitas Meja */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#183629', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                          <Layers size={14} color="#B8860B" />
                          <span>{vn.jumlah_meja || 0} Meja Otomatis</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#5A675E', marginTop: '2px' }}>
                          {vn.kapasitas || `${(vn.jumlah_meja || 0) * 4} Pemain Maksimal`}
                        </div>
                      </td>

                      {/* 4. Status Operasional */}
                      <td>
                        <span
                          className={`adm-badge ${
                            isActive
                              ? 'adm-badge-active'
                              : isMaintenance
                              ? 'adm-badge-upcoming'
                              : 'adm-badge-cancelled'
                          }`}
                        >
                          <span className="adm-badge-dot" />
                          <span>
                            {isActive
                              ? 'Aktif'
                              : isMaintenance
                              ? 'Maintenance'
                              : 'Tutup'}
                          </span>
                        </span>
                      </td>

                      {/* 5. Aksi */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="adm-btn-group">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(vn)}
                            title="Lihat Detail & Relasi Turnamen"
                            className="adm-action-btn adm-action-btn-view"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(vn)}
                            title="Edit Data Venue"
                            className="adm-action-btn adm-action-btn-edit"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(vn)}
                            title="Hapus Venue"
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
        )}

        {/* ── 7. TABLE FOOTER COUNTER ── */}
        {!loading && filteredVenues.length > 0 && (
          <div className="adm-table-footer">
            <span className="adm-table-counter">
              Menampilkan {filteredVenues.length} dari {venues.length} venue mitra
            </span>
            {filteredVenues.length < venues.length && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setFacilityFilter('all');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#183629',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Tampilkan Seluruh Venue
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL 1: TAMBAH VENUE BARU ── */}
      {showCreateModal && (
        <div className="adm-modal-overlay">
          <div
            className="adm-modal-container"
            style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 48px rgba(0,0,0,0.22)',
            }}
          >
            <form
              onSubmit={handleSubmitCreate}
              style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '90vh', overflow: 'hidden' }}
            >
              {/* Header */}
              <div
                className="adm-modal-header"
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      color: '#004F27',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      display: 'block',
                    }}
                  >
                    FORMULIR PENDAFTARAN VENUE
                  </span>
                  <h3 style={{ margin: '3px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#111E18' }}>
                    Daftarkan Venue Baru
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    color: '#5A675E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                  }}
                  title="Tutup (Esc)"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div
                className="adm-modal-body"
                style={{
                  padding: '20px 24px',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Nama Venue *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Game House"
                    value={formData.nama_venue}
                    onChange={(e) => setFormData({ ...formData, nama_venue: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formErrors.nama_venue && (
                    <span style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'block' }}>
                      {formErrors.nama_venue[0]}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Alamat Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sedayu City Kelapa Gading SCBRC, Blok C No. 18, RT 03/RW 09, Kelapa Gading, Jakarta Utara"
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formErrors.alamat && (
                    <span style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'block' }}>
                      {formErrors.alamat[0]}
                    </span>
                  )}
                </div>

                {/* Kota / Kecamatan & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Kota / Kecamatan
                    </label>
                    <input
                      type="text"
                      value={formData.kota_kecamatan}
                      placeholder="Kelapa Gading, Jakarta Utara"
                      onChange={(e) => setFormData({ ...formData, kota_kecamatan: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Status Operasional *
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
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="active">Aktif (Buka / Siap Reservasi)</option>
                      <option value="inactive">Nonaktif (Tutup Sementara)</option>
                      <option value="maintenance">Pemeliharaan (Maintenance)</option>
                    </select>
                  </div>
                </div>

                {/* Jam Operasional */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Jam Buka (WIB) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="07:30"
                      value={formData.jam_buka}
                      onChange={(e) => setFormData({ ...formData, jam_buka: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Jam Tutup (WIB) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="21:30"
                      value={formData.jam_tutup}
                      onChange={(e) => setFormData({ ...formData, jam_tutup: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Kontak: Telepon & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Nomor WhatsApp / Telepon
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 0812xxxxxxxx"
                      value={formData.telepon}
                      onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Email Kontak (Opsional)
                    </label>
                    <input
                      type="email"
                      placeholder="info@mahjongyuks.id"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Pengganti Latitude & Longitude: Pengaturan Jumlah Meja */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Jumlah Meja Tersedia
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, jumlah_meja: Math.max(0, (Number(prev.jumlah_meja) || 0) - 1) }))}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        backgroundColor: '#F3F4F6',
                        color: '#111E18',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                      }}
                      title="Kurangi 1 Meja"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formData.jumlah_meja}
                      onChange={(e) => setFormData({ ...formData, jumlah_meja: Math.max(0, parseInt(e.target.value) || 0) })}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, jumlah_meja: (Number(prev.jumlah_meja) || 0) + 1 }))}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        backgroundColor: '#F3F4F6',
                        color: '#111E18',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                      }}
                      title="Tambah 1 Meja"
                    >
                      +
                    </button>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#7A897F', marginTop: '5px' }}>
                    Kapasitas: {(Number(formData.jumlah_meja) || 0) * 4} pemain
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    URL Google Maps
                  </label>
                  <input
                    type="text"
                    placeholder="https://maps.google.com/?q=..."
                    value={formData.maps_url}
                    onChange={(e) => setFormData({ ...formData, maps_url: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Fasilitas (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Meja Otomatis Amos Rexx III, Full AC HEPA, Ruang VIP, Free Valet, Kopi Artisan"
                    value={formData.fasilitas}
                    onChange={(e) => setFormData({ ...formData, fasilitas: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Foto Venue
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <select
                      value={formData.foto_preset}
                      onChange={(e) => {
                        setFormData({ ...formData, foto_preset: e.target.value });
                        setPhotoPreview(e.target.value);
                        setPhotoFile(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '12.5px',
                        outline: 'none',
                      }}
                    >
                      {PRESET_VENUE_IMAGES.map((preset) => (
                        <option key={preset.url} value={preset.url}>
                          {preset.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#FAF8F5',
                        border: '1px solid #D7E6DB',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Upload size={14} />
                      <span>Upload File</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {photoPreview && (
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '110px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #D7E6DB',
                      }}
                    >
                      <Image src={photoPreview} alt="Preview" fill style={{ objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Deskripsi Lengkap Venue *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Jelaskan atmosfer venue, fasilitas unggulan, jam operasional, dan petunjuk akses..."
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div
                className="adm-modal-footer"
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="adm-btn-secondary"
                  style={{ minWidth: '90px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || isTimeInvalid}
                  className="adm-btn-primary"
                  style={{ minWidth: '160px' }}
                >
                  {formSubmitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </span>
                  ) : (
                    'Simpan & Daftarkan Venue'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT VENUE ── */}
      {showEditModal && selectedVenue && (
        <div className="adm-modal-overlay">
          <div
            className="adm-modal-container"
            style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 48px rgba(0,0,0,0.22)',
            }}
          >
            <form
              onSubmit={handleSubmitEdit}
              style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '90vh', overflow: 'hidden' }}
            >
              {/* Header */}
              <div
                className="adm-modal-header"
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      color: '#004F27',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      display: 'block',
                    }}
                  >
                    PERBARUI VENUE #{selectedVenue.id}
                  </span>
                  <h3 style={{ margin: '3px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#111E18' }}>
                    Edit Data Venue
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    color: '#5A675E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                  }}
                  title="Tutup (Esc)"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div
                className="adm-modal-body"
                style={{
                  padding: '20px 24px',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Nama Venue *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama_venue}
                    onChange={(e) => setFormData({ ...formData, nama_venue: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Alamat Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Kota / Kecamatan & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Kota / Kecamatan
                    </label>
                    <input
                      type="text"
                      value={formData.kota_kecamatan}
                      placeholder="Kelapa Gading, Jakarta Utara"
                      onChange={(e) => setFormData({ ...formData, kota_kecamatan: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Status Operasional *
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
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="active">Aktif (Buka / Siap Reservasi)</option>
                      <option value="inactive">Nonaktif (Tutup Sementara)</option>
                      <option value="maintenance">Pemeliharaan (Maintenance)</option>
                    </select>
                  </div>
                </div>

                {/* Jam Operasional */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Jam Buka (WIB) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="07:30"
                      value={formData.jam_buka}
                      onChange={(e) => setFormData({ ...formData, jam_buka: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Jam Tutup (WIB) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="21:30"
                      value={formData.jam_tutup}
                      onChange={(e) => setFormData({ ...formData, jam_tutup: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Kontak: Telepon & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Nomor WhatsApp / Telepon
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 0812xxxxxxxx"
                      value={formData.telepon}
                      onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                      Email Kontak (Opsional)
                    </label>
                    <input
                      type="email"
                      placeholder="info@mahjongyuks.id"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Pengganti Latitude & Longitude: Pengaturan Jumlah Meja */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Jumlah Meja Tersedia
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, jumlah_meja: Math.max(0, (Number(prev.jumlah_meja) || 0) - 1) }))}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        backgroundColor: '#F3F4F6',
                        color: '#111E18',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                      }}
                      title="Kurangi 1 Meja"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formData.jumlah_meja}
                      onChange={(e) => setFormData({ ...formData, jumlah_meja: Math.max(0, parseInt(e.target.value) || 0) })}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, jumlah_meja: (Number(prev.jumlah_meja) || 0) + 1 }))}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        backgroundColor: '#F3F4F6',
                        color: '#111E18',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                      }}
                      title="Tambah 1 Meja"
                    >
                      +
                    </button>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#7A897F', marginTop: '5px' }}>
                    Kapasitas: {(Number(formData.jumlah_meja) || 0) * 4} pemain
                  </div>
                  {isTableReduced && selectedVenue && (
                    <div
                      style={{
                        backgroundColor: '#FEF3C7',
                        border: '1px solid #F59E0B',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        marginTop: '6px',
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center',
                        fontSize: '11.5px',
                        color: '#92400E',
                      }}
                    >
                      <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0 }} />
                      <span>Mengurangi jumlah meja dapat memengaruhi jadwal dan reservasi.</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    URL Google Maps
                  </label>
                  <input
                    type="text"
                    placeholder="https://maps.google.com/?q=..."
                    value={formData.maps_url}
                    onChange={(e) => setFormData({ ...formData, maps_url: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Fasilitas (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={formData.fasilitas}
                    onChange={(e) => setFormData({ ...formData, fasilitas: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Foto Venue
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <select
                      value={formData.foto_preset}
                      onChange={(e) => {
                        setFormData({ ...formData, foto_preset: e.target.value });
                        setPhotoPreview(e.target.value);
                        setPhotoFile(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D7E6DB',
                        fontSize: '12.5px',
                        outline: 'none',
                      }}
                    >
                      {PRESET_VENUE_IMAGES.map((preset) => (
                        <option key={preset.url} value={preset.url}>
                          {preset.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#FAF8F5',
                        border: '1px solid #D7E6DB',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Upload size={14} />
                      <span>Upload Baru</span>
                    </button>
                  </div>

                  {photoPreview && (
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '110px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #D7E6DB',
                      }}
                    >
                      <Image src={photoPreview} alt="Preview" fill style={{ objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2B3830', marginBottom: '5px' }}>
                    Deskripsi Lengkap *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D7E6DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div
                className="adm-modal-footer"
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="adm-btn-secondary"
                  style={{ minWidth: '90px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || isTimeInvalid}
                  className="adm-btn-primary"
                  style={{ minWidth: '160px' }}
                >
                  {formSubmitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </span>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: DETAIL VENUE LENGKAP & RELASI ── */}
      {showDetailModal && selectedVenue && (
        <div className="adm-modal-overlay">
          <div className="adm-detail-modal-container">
            {/* Header */}
            <div className="adm-modal-header" style={{ padding: '18px 24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#183629', textTransform: 'uppercase', letterSpacing: '0.6px', backgroundColor: '#EBF6EE', padding: '3px 8px', borderRadius: '4px' }}>
                    VENUE RESMI
                  </span>
                  <span style={{ fontSize: '11px', color: '#7A897F', fontWeight: 600 }}>
                    ID #{selectedVenue.id}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#111E18', lineHeight: 1.3 }}>
                  {selectedVenue.nama_venue}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                title="Tutup Modal"
                style={{
                  background: '#FAF8F5',
                  border: '1px solid #D7E6DB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  padding: '6px',
                  color: '#5A675E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="adm-modal-body" style={{ padding: '20px 24px', gap: '18px' }}>
              {/* Venue Image Banner */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '190px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #D7E6DB',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
              }}>
                <Image
                  src={selectedVenue.foto || '/assets/venue_senopati.jpg'}
                  alt={selectedVenue.nama_venue}
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <span className={`adm-badge ${selectedVenue.status === 'active' ? 'adm-badge-active' : 'adm-badge-cancelled'}`} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                    <span className="adm-badge-dot" />
                    <span>{selectedVenue.status === 'active' ? 'Aktif Beroperasi' : selectedVenue.status}</span>
                  </span>
                </div>
              </div>

              {/* Section 1: Alamat Cabang */}
              <div className="adm-detail-section">
                <div className="adm-detail-section-header">
                  <MapPin size={14} color="#183629" />
                  <span>ALAMAT LENGKAP CABANG</span>
                </div>
                <div style={{
                  backgroundColor: '#FAF8F5',
                  border: '1px solid #E4ECE6',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: '#111E18',
                  fontWeight: 600,
                  lineHeight: 1.4
                }}>
                  {selectedVenue.alamat}
                </div>
              </div>

              {/* Section 2: Kapasitas Meja & Spesifikasi */}
              <div className="adm-detail-section">
                <div className="adm-detail-section-header">
                  <Layers size={14} color="#183629" />
                  <span>KAPASITAS MEJA OTOMATIS &amp; PEMAIN</span>
                </div>
                <div className="adm-detail-grid">
                  <div className="adm-detail-card">
                    <span className="adm-detail-card-label">Jumlah Meja Otomatis</span>
                    <span className="adm-detail-card-val" style={{ color: '#004F27' }}>
                      {selectedVenue.jumlah_meja || 0} Meja Resmi
                    </span>
                    <span className="adm-detail-card-sub">Tipe: {selectedVenue.tipe_meja || 'Amos Rexx III Otomatis'}</span>
                  </div>

                  <div className="adm-detail-card">
                    <span className="adm-detail-card-label">Daya Tampung Atlet</span>
                    <span className="adm-detail-card-val">
                      {selectedVenue.kapasitas || `${(selectedVenue.jumlah_meja || 0) * 4} Pemain Maksimal`}
                    </span>
                    <span className="adm-detail-card-sub">Format: 4 Pemain per Meja (Simultan)</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Fasilitas Venue */}
              <div className="adm-detail-section">
                <div className="adm-detail-section-header">
                  <Award size={14} color="#183629" />
                  <span>FASILITAS VENUE TERSEDIA</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(Array.isArray(selectedVenue.fasilitas)
                    ? selectedVenue.fasilitas
                    : selectedVenue.fasilitas_text?.split(',') || ['Meja Otomatis Amos Rexx III', 'Full AC HEPA', 'Free Wi-Fi']
                  ).map((f, i) => (
                    <span
                      key={i}
                      className="adm-facility-tag"
                      style={{ padding: '5px 10px', fontSize: '11.5px', color: '#183629', fontWeight: 600 }}
                    >
                      ✓ {String(f).trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Section 4: Deskripsi */}
              <div className="adm-detail-section">
                <div className="adm-detail-section-header">
                  <Building size={14} color="#183629" />
                  <span>DESKRIPSI &amp; ATMOSFER VENUE</span>
                </div>
                <div style={{
                  backgroundColor: '#FAF8F5',
                  border: '1px solid #E4ECE6',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: '#5A675E',
                  lineHeight: 1.55
                }}>
                  {selectedVenue.deskripsi || 'Tidak ada deskripsi tambahan.'}
                </div>
              </div>

              {/* Section 5: Related Events */}
              <div className="adm-detail-section" style={{ borderTop: '1px solid #EEF4F0', paddingTop: '12px' }}>
                <div className="adm-detail-section-header">
                  <Calendar size={14} color="#183629" />
                  <span>TURNAMEN TERDAFTAR DI VENUE INI</span>
                </div>

                {detailLoading ? (
                  <div style={{ fontSize: '12px', color: '#7A897F' }}>Memuat relasi event...</div>
                ) : venueDetail?.events && venueDetail.events.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {venueDetail.events.map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          padding: '10px 14px',
                          backgroundColor: '#FAF8F5',
                          borderRadius: '8px',
                          border: '1px solid #E4ECE6',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#111E18' }}>
                            {ev.nama_event}
                          </div>
                          <div style={{ fontSize: '11px', color: '#5A675E', marginTop: '2px' }}>
                            {ev.tanggal_formatted} • {ev.waktu_formatted}
                          </div>
                        </div>
                        <Link
                          href={`/events/${ev.id}`}
                          target="_blank"
                          className="adm-btn-secondary"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>Buka Event</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#7A897F', fontStyle: 'italic', padding: '8px 0' }}>
                    Belum ada turnamen terdaftar di venue ini.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="adm-modal-footer" style={{ padding: '16px 24px', backgroundColor: '#FAF8F5' }}>
              <Link
                href={`/venues/${selectedVenue.id}`}
                target="_blank"
                className="adm-btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <span>Buka Halaman Publik Venue</span>
                <ExternalLink size={14} />
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenEdit(selectedVenue);
                  }}
                  className="adm-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                >
                  <Edit2 size={14} />
                  <span>Ubah Venue Ini</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="adm-btn-primary"
                  style={{ minWidth: '100px', fontSize: '12.5px', padding: '9px 18px' }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: KONFIRMASI HAPUS VENUE (DENGAN PROTEKSI RELASI) ── */}
      {showDeleteModal && selectedVenue && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(17, 30, 24, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Trash2 size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#111E18' }}>
              Hapus Venue?
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#5A675E', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus venue <strong>&quot;{selectedVenue.nama_venue}&quot;</strong>?
            </p>

            {/* Error Message when relational constraint triggers */}
            {deleteErrorMessage && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  textAlign: 'left',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                }}
              >
                <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#991B1B', lineHeight: 1.4 }}>
                  <strong>Gagal Menghapus:</strong> {deleteErrorMessage}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="adm-btn-secondary"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleConfirmDelete}
                className="adm-btn"
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  opacity: formSubmitting ? 0.7 : 1,
                  cursor: formSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {formSubmitting ? 'Memproses...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
