/**
 * Standar Tingkat Kemahiran Pemain MahjongYuks
 * Berdasarkan spesifikasi: Hanya 3 kategori resmi.
 */

export type KemahiranLevel = 'Beginner' | 'Intermediate' | 'Advance';

export interface KemahiranDetail {
  level: KemahiranLevel;
  deskripsi: string;
  badgeBg: string;
  badgeColor: string;
}

export const KEMAHIRAN_MAP: Record<KemahiranLevel, KemahiranDetail> = {
  Beginner: {
    level: 'Beginner',
    deskripsi:
      'Pemain yang benar-benar pemula, belum memahami aturan Mahjong, atau baru bermain beberapa kali dan masih dalam tahap belajar.',
    badgeBg: '#EBF4F0',
    badgeColor: '#183629',
  },
  Intermediate: {
    level: 'Intermediate',
    deskripsi:
      'Pemain yang sudah memahami aturan Mahjong, mampu bermain dengan sistem poin, dan mulai memahami strategi permainan.',
    badgeBg: '#FEF9EE',
    badgeColor: '#B8860B',
  },
  Advance: {
    level: 'Advance',
    deskripsi:
      'Pemain yang sudah mahir, memahami strategi serta perhitungan poin, dan siap mengikuti sesi permainan yang lebih kompetitif.',
    badgeBg: '#DCF1E3',
    badgeColor: '#004F27',
  },
};

/**
 * Normalisasi nilai tingkat kemahiran dari database/session agar selalu menghasilkan
 * salah satu dari 3 kategori resmi: Beginner, Intermediate, Advance.
 */
export function normalizeKemahiran(val?: string | null): KemahiranLevel {
  if (!val) return 'Intermediate';
  const v = val.trim().toLowerCase();

  // Beginner patterns
  if (
    v === 'beginner' ||
    v.includes('belajar') ||
    v.includes('pemula') ||
    v.includes('novice') ||
    v.includes('kyu') ||
    v.includes('dan 1') ||
    v.includes('dan 2')
  ) {
    return 'Beginner';
  }

  // Advance patterns
  if (
    v === 'advance' ||
    v.includes('advanced') ||
    v.includes('kompetitif') ||
    v.includes('expert') ||
    v.includes('pro') ||
    v.includes('dan 5') ||
    v.includes('dan 6') ||
    v.includes('dan 7') ||
    v.includes('dan 8') ||
    v.includes('dan 9')
  ) {
    return 'Advance';
  }

  // Intermediate patterns (default)
  return 'Intermediate';
}

