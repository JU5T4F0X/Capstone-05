/**
 * MahjongYuks API Client
 * Mengacu pada AGENTS.md (Single API Client for Laravel Backend)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface User {
  id: number;
  nama: string;
  email: string;
  no_telepon?: string;
  role: 'admin' | 'player';
  handle?: string;
  dan_rank?: string;
  points?: number;
  avatar_url?: string;
  kemahiran?: string;
  tingkat_kemahiran?: string;
}

export interface ApiEvent {
  id: number | string;
  nama_event: string;
  deskripsi: string;
  tanggal_event: string | null;
  tanggal_formatted?: string | null;
  waktu_mulai?: string;
  waktu_selesai?: string;
  waktu_formatted?: string;
  status: string;
  status_label?: string;
  jenis_event?: 'Event' | 'Non-Event' | string;
  venue?: string;
  venue_id?: number | string;
  biaya?: string;
  kuota?: string;
  max_kuota?: number;
  sisa_kuota?: number;
  pendaftarans_count?: number;
  is_registered?: boolean;
  registration_status?: string | null;
  kategori?: string;
  badge_class?: string;
  foto?: string;
  standar_aturan?: string;
  kapasitas_meja?: string;
}

export interface ApiEventPeserta {
  id: number;
  player_id: number;
  nama_peserta: string;
  email: string;
  no_telepon: string;
  tanggal_daftar: string | null;
  tanggal_daftar_formatted?: string | null;
  status_pendaftaran: string;
  catatan?: string | null;
}

export interface ApiMyEventRegistration {
  pendaftaran_id: number;
  status_pendaftaran: string;
  tanggal_daftar: string | null;
  catatan?: string | null;
  event: ApiEvent | null;
}

export interface ApiVenue {
  id: number | string;
  nama_venue: string;
  alamat: string;
  kota_kecamatan?: string;
  telepon?: string | null;
  email?: string | null;
  deskripsi: string;
  status: string;
  foto?: string;
  jumlah_meja?: number;
  kapasitas?: string;
  rating?: number;
  jam_buka?: string;
  jam_buka_raw?: string;
  jam_tutup_raw?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  maps_url?: string;
  fasilitas?: string[];
  fasilitas_text?: string;
  tipe_meja?: string;
  mejas?: Array<{
    id: number;
    nomor_meja: string;
    kapasitas: number;
    status: string;
  }>;
  events?: Array<{
    id: number | string;
    nama_event: string;
    tanggal_formatted?: string | null;
    waktu_formatted?: string;
    biaya?: string;
    status?: string;
  }>;
}

export interface ApiJadwalItem {
  id: string;
  event_id?: number | string;
  tipe: 'event' | 'sesi_permainan' | 'non_event' | string;
  jenis_event?: 'Event' | 'Non-Event' | string;
  judul: string;
  deskripsi: string;
  tanggal: string | null;
  tanggal_formatted?: string | null;
  waktu: string;
  venue: string;
  venue_id?: number | string;
  alamat?: string;
  status: string;
  status_code?: string;
  biaya: string;
  aturan?: string;
  kapasitas?: string;
  fasilitas?: string;
}

export interface ApiJadwalData {
  events: ApiJadwalItem[];
  sesi_permainan: ApiJadwalItem[];
}

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('mahjongyuks_token');
  }

  public static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mahjongyuks_token', token);
    }
  }

  public static clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mahjongyuks_token');
      localStorage.removeItem('mahjongyuks_user');
    }
  }

  public static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('mahjongyuks_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public static setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mahjongyuks_user', JSON.stringify(user));
    }
  }

  public static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getToken();

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          message: json?.message || `HTTP error ${res.status}: ${res.statusText}`,
          errors: json?.errors,
        };
      }

      return json || { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Koneksi ke server gagal (offline/unreachable).',
      };
    }
  }

  // Auth Endpoints
  public static async login(credentials: Record<string, any>) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  public static async register(data: {
    nama: string;
    email: string;
    password: string;
    no_telepon?: string;
    handle?: string;
    kemahiran?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: 'player' }),
    });
  }

  public static async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  public static async me() {
    return this.request<User>('/auth/me');
  }

  public static async updateProfile(data: {
    nama?: string;
    no_telepon?: string;
    tingkat_kemahiran?: string;
    kemahiran?: string;
  }): Promise<ApiResponse<User>> {
    const res = await this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (res.success && res.data) {
      this.setUser(res.data);
    }

    return res;
  }

  // Event Endpoints (User & Admin)
  public static async getEvents(params?: { q?: string; status?: string }): Promise<ApiResponse<ApiEvent[]>> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<ApiEvent[]>(`/events${qs}`);
  }

  public static async getEventById(id: string | number): Promise<ApiResponse<ApiEvent>> {
    return this.request<ApiEvent>(`/events/${id}`);
  }

  public static async createEvent(data: FormData | Record<string, any>): Promise<ApiResponse<ApiEvent>> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request<ApiEvent>('/events', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  public static async updateEvent(id: string | number, data: FormData | Record<string, any>): Promise<ApiResponse<ApiEvent>> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    // Gunakan POST untuk FormData agar file upload Laravel bekerja optimal
    return this.request<ApiEvent>(`/events/${id}`, {
      method: isFormData ? 'POST' : 'PUT',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  public static async deleteEvent(id: string | number): Promise<ApiResponse> {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Pendaftaran Event (Wajib Login Player)
  public static async daftarEvent(id: string | number, catatan?: string): Promise<ApiResponse> {
    return this.request(`/events/${id}/daftar`, {
      method: 'POST',
      body: JSON.stringify({ catatan: catatan || '' }),
    });
  }

  public static async batalDaftarEvent(id: string | number): Promise<ApiResponse> {
    return this.request(`/events/${id}/batal`, {
      method: 'POST',
    });
  }

  public static async getEventPeserta(id: string | number): Promise<ApiResponse<{
    event_id: number;
    nama_event: string;
    total_peserta: number;
    peserta: ApiEventPeserta[];
  }>> {
    return this.request(`/events/${id}/peserta`);
  }

  public static async getMyEventRegistrations(): Promise<ApiResponse<ApiMyEventRegistration[]>> {
    return this.request<ApiMyEventRegistration[]>('/user/event-registrations');
  }

  // Venue Endpoints (User & Admin)
  public static async getVenues(params?: { q?: string; status?: string }): Promise<ApiResponse<ApiVenue[]>> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<ApiVenue[]>(`/venues${qs}`);
  }

  public static async getVenueById(id: string | number): Promise<ApiResponse<ApiVenue>> {
    return this.request<ApiVenue>(`/venues/${id}`);
  }

  public static async createVenue(data: FormData | Record<string, any>): Promise<ApiResponse<ApiVenue>> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request<ApiVenue>('/venues', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  public static async updateVenue(id: string | number, data: FormData | Record<string, any>): Promise<ApiResponse<ApiVenue>> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request<ApiVenue>(`/venues/${id}`, {
      method: isFormData ? 'POST' : 'PUT',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  public static async deleteVenue(id: string | number): Promise<ApiResponse> {
    return this.request(`/venues/${id}`, {
      method: 'DELETE',
    });
  }

  // Jadwal Endpoints
  public static async getJadwal(params?: { venue_id?: string | number; tanggal?: string }): Promise<ApiResponse<ApiJadwalData>> {
    const query = new URLSearchParams();
    if (params?.venue_id) query.append('venue_id', String(params.venue_id));
    if (params?.tanggal) query.append('tanggal', params.tanggal);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<ApiJadwalData>(`/jadwal${qs}`);
  }

  // ── Pemesanan Endpoints (Sprint 3) ─────────────────────────────────────────
  public static async getMyBookings(): Promise<ApiResponse<any[]>> {
    return this.request('/pemesanans');
  }

  public static async createBooking(payload: {
    meja_id: number;
    tanggal_main: string;
    waktu_mulai: string;
    waktu_selesai: string;
    jumlah_pemain: number;
    jenis_pemesanan: 'Casual' | 'Competitive';
    durasi_jam?: number;
    kursi_pilihan?: 'ton' | 'nan' | 'sha' | 'pei';
    metode_pembayaran?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/pemesanans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async cancelBooking(id: number): Promise<ApiResponse> {
    return this.request(`/pemesanans/${id}/cancel`, {
      method: 'PUT',
    });
  }

  // ── Pembayaran Endpoints (Sprint 4) ────────────────────────────────────────
  public static async simulatePayment(
    pemesananId: number,
    metode: string = 'QRIS Instant'
  ): Promise<ApiResponse<any>> {
    return this.request(`/pembayarans/${pemesananId}/simulasi`, {
      method: 'POST',
      body: JSON.stringify({ metode_pembayaran: metode }),
    });
  }

  // ── Meja Endpoints ────────────────────────────────────────────────────────
  public static async getMejas(venueId?: number | string): Promise<ApiResponse<any[]>> {
    const qs = venueId ? `?venue_id=${venueId}` : '';
    return this.request(`/mejas${qs}`);
  }

  // -- Leaderboard & Skor Atlet (RF-07 & RF-08) ------------------------------
  public static async getLeaderboard(params?: { tier?: string; q?: string; limit?: number }): Promise<ApiResponse<any[]>> {
    const query = new URLSearchParams();
    if (params?.tier) query.append('tier', params.tier);
    if (params?.q) query.append('q', params.q);
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/leaderboard${qs}`);
  }

  public static async resetLeaderboardScores(): Promise<ApiResponse<any>> {
    return this.request<any>('/leaderboard/reset', {
      method: 'POST',
    });
  }

  public static async getPlayersList(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/players');
  }

  public static async getSessions(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/sesi-bermain');
  }

  public static async recordScore(payload: {
    player_id: number;
    skor: number;
    peringkat: number;
    event_id?: number | string;
    sesi_id?: number;
    catatan_wasit?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/skor-pemain', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async getMyGameHistory(): Promise<ApiResponse<{
    stats: {
      totalMatches: number;
      totalWins: number;
      winRate: string;
      totalPoints: number;
    };
    history: Array<{
      id: number;
      match_name: string;
      tanggal: string;
      peringkat: number;
      skor: number;
      catatan_wasit?: string | null;
      sesi_id?: number;
      event_name?: string | null;
    }>;
  }>> {
    return this.request('/user/game-history');
  }
}

export default ApiClient;
