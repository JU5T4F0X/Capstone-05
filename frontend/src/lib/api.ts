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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

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
      // In development or when backend is offline, return offline fallback info
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

  // ── Pemesanan Endpoints (Sprint 3) ─────────────────────────────────────────
  public static async getMyBookings() {
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
  }) {
    return this.request('/pemesanans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async cancelBooking(id: number) {
    return this.request(`/pemesanans/${id}/cancel`, {
      method: 'PUT',
    });
  }

  // ── Pembayaran Endpoints (Sprint 4) ────────────────────────────────────────
  public static async simulatePayment(
    pemesananId: number,
    metode: string = 'QRIS Instant'
  ) {
    return this.request(`/pembayarans/${pemesananId}/simulasi`, {
      method: 'POST',
      body: JSON.stringify({ metode_pembayaran: metode }),
    });
  }

  // ── Meja & Venue Endpoints ────────────────────────────────────────────────
  public static async getVenues() {
    return this.request('/venues');
  }

  public static async getMejas(venueId?: number) {
    const qs = venueId ? `?venue_id=${venueId}` : '';
    return this.request(`/mejas${qs}`);
  }
}

export default ApiClient;
