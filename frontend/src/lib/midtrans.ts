// Pembayaran Midtrans Snap (Sandbox).
// File terpisah supaya tidak bentrok dengan api.ts yang juga diubah anggota tim lain.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const SNAP_URL = 'https://app.sandbox.midtrans.com/snap/snap.js';

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export type StatusBayar = 'pending' | 'paid' | 'expired' | 'failed';

export interface PesananBaru {
  pemesanan_id: number;
  kode_booking: string;
  snap_token: string;
  total_bayar: number;
}

export interface HasilStatus {
  pemesanan_id: number;
  status: StatusBayar;
  kode_booking: string;
  tiket: { total_bayar: number } | null;
}

function ambilToken(): string | null {
  try {
    return localStorage.getItem('mahjongyuks_token');
  } catch {
    return null;
  }
}

async function panggil<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = ambilToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // bukan JSON
  }

  if (!res.ok || !json || json.success === false) {
    const daftarError = json?.errors ? (Object.values(json.errors) as string[][]).flat().join(' ') : '';
    throw new Error(json?.message || daftarError || `Permintaan gagal (${res.status})`);
  }
  return json.data as T;
}

let snapPromise: Promise<void> | null = null;

export function muatSnap(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Hanya bisa dipakai di browser'));
  if (window.snap) return Promise.resolve();
  if (snapPromise) return snapPromise;

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  if (!clientKey) {
    return Promise.reject(new Error('NEXT_PUBLIC_MIDTRANS_CLIENT_KEY belum diisi di frontend/.env.local'));
  }

  snapPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SNAP_URL;
    s.setAttribute('data-client-key', clientKey);
    s.onload = () => resolve();
    s.onerror = () => {
      snapPromise = null;
      reject(new Error('Gagal memuat Midtrans Snap. Periksa koneksi internet.'));
    };
    document.body.appendChild(s);
  });
  return snapPromise;
}

export function buatPesanan(payload: {
  meja_id: number;
  tanggal_main: string;
  waktu_mulai: string;
  durasi_jam: number;
  jenis_pemesanan: 'Casual' | 'Competitive';
  kursi_pilihan: 'ton' | 'nan' | 'sha' | 'pei';
}): Promise<PesananBaru> {
  return panggil<PesananBaru>('/pemesanans', { method: 'POST', body: JSON.stringify(payload) });
}

export function cekStatus(id: number): Promise<HasilStatus> {
  return panggil<HasilStatus>(`/pemesanans/${id}/status`);
}

export function bukaPopupBayar(snapToken: string): Promise<'success' | 'pending' | 'closed' | 'error'> {
  return new Promise((resolve) => {
    if (!window.snap) {
      resolve('error');
      return;
    }
    window.snap.pay(snapToken, {
      onSuccess: () => resolve('success'),
      onPending: () => resolve('pending'),
      onError: () => resolve('error'),
      onClose: () => resolve('closed'),
    });
  });
}

// Cek status tiap beberapa detik sampai tidak "pending" lagi (atau waktu habis).
export async function tungguStatus(id: number, maksMs = 2 * 60 * 1000, jedaMs = 3000): Promise<HasilStatus> {
  const batas = Date.now() + maksMs;
  let terakhir = await cekStatus(id);
  while (terakhir.status === 'pending' && Date.now() < batas) {
    await new Promise((r) => setTimeout(r, jedaMs));
    terakhir = await cekStatus(id);
  }
  return terakhir;
}