/**
 * Hong Kong Mahjong Rules & Scoring Engine (Frontend)
 * Berdasarkan standar resmi Hong Kong Old Style (HKOS):
 * - Minimal 3 Fan untuk menang (Hu)
 * - Batas Maksimum (Limit / Cap) = 10 Fan
 * - Tarik Sendiri (Self-draw / Zi Mo) menambah +1 Fan (kecuali tangan limit)
 */

export interface HkHandDefinition {
  code: string;
  name: string;
  nameId: string;
  fan: number;
  isLimit: boolean;
  category: 'standard' | 'special';
  description: string;
  badge?: string;
}

export interface FanPointRow {
  fan: number;
  points: number;
  discard: number;
  selfDrawEach: number;
  selfDrawTotal: number;
}

export const HK_POINTS_TABLE: Record<number, FanPointRow> = {
  3: { fan: 3, points: 8, discard: 8, selfDrawEach: 4, selfDrawTotal: 12 },
  4: { fan: 4, points: 16, discard: 16, selfDrawEach: 8, selfDrawTotal: 24 },
  5: { fan: 5, points: 24, discard: 24, selfDrawEach: 12, selfDrawTotal: 36 },
  6: { fan: 6, points: 32, discard: 32, selfDrawEach: 16, selfDrawTotal: 48 },
  7: { fan: 7, points: 48, discard: 48, selfDrawEach: 24, selfDrawTotal: 72 },
  8: { fan: 8, points: 64, discard: 64, selfDrawEach: 32, selfDrawTotal: 96 },
  9: { fan: 9, points: 96, discard: 96, selfDrawEach: 48, selfDrawTotal: 144 },
  10: { fan: 10, points: 128, discard: 128, selfDrawEach: 64, selfDrawTotal: 192 },
  11: { fan: 11, points: 192, discard: 192, selfDrawEach: 96, selfDrawTotal: 288 },
  12: { fan: 12, points: 256, discard: 256, selfDrawEach: 128, selfDrawTotal: 384 },
  13: { fan: 13, points: 384, discard: 384, selfDrawEach: 192, selfDrawTotal: 576 },
};

export const HK_HANDS_LIST: HkHandDefinition[] = [
  // --- TANGAN BIASA / KOMBINASI ---
  {
    code: 'all_sequences',
    name: 'All Sequences (4 Chows)',
    nameId: 'Runtutan Penuh (4 Chow)',
    fan: 1,
    isLimit: false,
    category: 'standard',
    description: 'Seluruh 4 set berupa sekuens (Chow / angka berurutan).',
  },
  {
    code: 'dragon_triplet',
    name: 'Dragon Triplet (Pung)',
    nameId: 'Pung Naga (Merah/Hijau/Putih)',
    fan: 1,
    isLimit: false,
    category: 'standard',
    description: 'Triplet tile naga (per set naga bernilai 1 Fan).',
  },
  {
    code: 'round_seat_wind',
    name: 'Round / Seat Wind',
    nameId: 'Pung Angin Ronde / Kursi',
    fan: 1,
    isLimit: false,
    category: 'standard',
    description: 'Triplet tile angin ronde (East/South/West/North) atau angin kursi pemain.',
  },
  {
    code: 'all_triplets',
    name: 'All Triplets (4 Pongs)',
    nameId: 'Kembar Tiga Penuh (4 Pong)',
    fan: 3,
    isLimit: false,
    category: 'standard',
    description: 'Semua 4 set berupa triplet (Pong / kembar 3) dan 1 pasang (Eye).',
    badge: 'Populer',
  },
  {
    code: 'mixed_flush',
    name: 'Mixed / Semi Flush',
    nameId: 'Satu Corak + Huruf (Semi Flush)',
    fan: 3,
    isLimit: false,
    category: 'standard',
    description: 'Tangan hanya terdiri dari satu corak suit (Karakter/Bambu/Titik) ditambah tile kehormatan.',
    badge: 'Populer',
  },
  {
    code: 'mixed_terminals',
    name: 'Mixed Terminals',
    nameId: 'Campuran Ujung & Kehormatan',
    fan: 4,
    isLimit: false,
    category: 'standard',
    description: 'Semua set dan pasang hanya berisi angka 1, 9, serta tile angin atau naga.',
  },
  {
    code: 'seven_pairs',
    name: 'Seven Pairs (7 Pasang)',
    nameId: 'Tujuh Pasangan (Seven Pairs)',
    fan: 4,
    isLimit: false,
    category: 'standard',
    description: 'Tangan khusus terdiri dari 7 pasangan tile identik tanpa set 3.',
  },
  {
    code: 'small_three_dragons',
    name: 'Small Three Dragons',
    nameId: 'Tiga Naga Kecil',
    fan: 5,
    isLimit: false,
    category: 'standard',
    description: 'Dua triplet naga dan satu pasang tile naga ketiga.',
  },
  {
    code: 'full_flush',
    name: 'Full Flush / Pure One Suit',
    nameId: 'Satu Corak Murni (Full Flush)',
    fan: 7,
    isLimit: false,
    category: 'standard',
    description: 'Seluruh 14 tile berasal dari 1 jenis corak yang sama tanpa huruf kehormatan.',
    badge: 'Tinggi',
  },
  {
    code: 'big_three_dragons',
    name: 'Big 3 Dragons (3 Scholars)',
    nameId: 'Tiga Naga Besar (Big 3 Dragons)',
    fan: 8,
    isLimit: false,
    category: 'standard',
    description: 'Ketiga triplet naga lengkap: Merah (Chun), Hijau (Hatsu), dan Putih (Haku).',
    badge: 'Tinggi',
  },

  // --- TANGAN LIMIT (FAST MODE / LANGSUNG 10 FAN) ---
  {
    code: 'thirteen_orphans',
    name: 'Thirteen Orphans (13 Yao)',
    nameId: 'Tiga Belas Anak Yatim (13 Orphans)',
    fan: 10,
    isLimit: true,
    category: 'special',
    description: 'Satu per satu tiap angka 1 & 9 dari 3 corak, 4 angin, 3 naga, plus 1 pasang kembar.',
    badge: 'LIMIT 10 FAN',
  },
  {
    code: 'nine_gates',
    name: 'Nine Gates (Kyuuren Poutou)',
    nameId: 'Sembilan Gerbang (Nine Gates)',
    fan: 10,
    isLimit: true,
    category: 'special',
    description: '1-1-1-2-3-4-5-6-7-8-9-9-9 dalam 1 corak murni + 1 tile pelengkap corak yang sama.',
    badge: 'LIMIT 10 FAN',
  },
  {
    code: 'small_four_winds',
    name: 'Small Four Winds',
    nameId: 'Empat Angin Kecil',
    fan: 10,
    isLimit: true,
    category: 'special',
    description: 'Tiga triplet angin dan satu pasang tile angin keempat.',
    badge: 'LIMIT 10 FAN',
  },
  {
    code: 'four_winds',
    name: 'Great Four Winds',
    nameId: 'Empat Angin Besar (Big 4 Winds)',
    fan: 10,
    isLimit: true,
    category: 'special',
    description: 'Seluruh 4 triplet angin lengkap (Timur, Selatan, Barat, Utara).',
    badge: 'LIMIT 10 FAN',
  },
  {
    code: 'all_honours',
    name: 'All Honours',
    nameId: 'Semua Huruf Kehormatan (All Honours)',
    fan: 10,
    isLimit: true,
    category: 'special',
    description: 'Tangan hanya tersusun dari tile Angin dan Naga tanpa ada angka suit sama sekali.',
    badge: 'LIMIT 10 FAN',
  },
  {
    code: 'all_terminals',
    name: 'All Terminals',
    nameId: 'Semua Angka Ujung 1 & 9',
    fan: 10,
    isLimit: true,
    category: 'special',
    description: 'Seluruh set hanya berisi angka 1 dan 9 tanpa tile kehormatan.',
    badge: 'LIMIT 10 FAN',
  },
  {
    code: 'all_concealed_triplets',
    name: 'All Concealed Triplets',
    nameId: 'Empat Pong Tertutup (Ankan)',
    fan: 10,
    isLimit: true,
    category: 'special',
    description: 'Semua 4 triplet didapat dari tarikan sendiri tanpa mengambil buangan lawan.',
    badge: 'LIMIT 10 FAN',
  },
  {
    code: 'all_green',
    name: 'All Green (Ryuuiisou)',
    nameId: 'Serba Hijau (All Green)',
    fan: 10,
    isLimit: true,
    category: 'special',
    description: 'Hanya menggunakan tile bambu 2, 3, 4, 6, 8 dan naga hijau.',
    badge: 'LIMIT 10 FAN',
  },
  {
    code: 'four_kongs',
    name: 'Four Kongs (18 Luohan)',
    nameId: 'Empat Kong (Four Kongs)',
    fan: 10,
    isLimit: true,
    category: 'special',
    description: 'Membuat 4 set quadruplet (Kong) dalam satu tangan.',
    badge: 'LIMIT 10 FAN',
  },
  {
    code: 'heavenly_hand',
    name: 'Heavenly Hand (Tian Hu)',
    nameId: 'Kemenangan Surgawi (Tian Hu)',
    fan: 10,
    isLimit: true,
    category: 'special',
    description: 'Dealer menang seketika pada 14 tile awal pembagian tanpa draw tambahan.',
    badge: 'LIMIT 10 FAN',
  },
  {
    code: 'earthly_hand',
    name: 'Earthly Hand (Di Hu)',
    nameId: 'Kemenangan Bumi (Di Hu)',
    fan: 10,
    isLimit: true,
    category: 'special',
    description: 'Non-dealer menang seketika pada buangan pertama dealer.',
    badge: 'LIMIT 10 FAN',
  },
];

export interface CalculationResult {
  rawFan: number;
  finalFan: number;
  bonusFan: number;
  isValid: boolean;
  isLimit: boolean;
  pointsAwarded: number;
  breakdown: {
    discard: number;
    selfDrawEach: number;
    selfDrawTotal: number;
  };
  errorMessage: string | null;
  selectedHands: HkHandDefinition[];
}

/**
 * Kalkulasi live fan & poin di sisi client untuk preview wasit secara instan.
 */
export function calculateHkScore(
  handCodes: string[],
  winMethod: 'self_draw' | 'discard'
): CalculationResult {
  const minFan = 3;
  const maxFanLimit = 10;
  const selfDrawBonusFan = 1;

  if (!handCodes || handCodes.length === 0) {
    const defaultRow = HK_POINTS_TABLE[3];
    return {
      rawFan: 0,
      finalFan: 0,
      bonusFan: 0,
      isValid: false,
      isLimit: false,
      pointsAwarded: 0,
      breakdown: {
        discard: defaultRow.discard,
        selfDrawEach: defaultRow.selfDrawEach,
        selfDrawTotal: defaultRow.selfDrawTotal,
      },
      errorMessage: 'Pilih minimal satu kombinasi kartu menang.',
      selectedHands: [],
    };
  }

  const handsMap = new Map(HK_HANDS_LIST.map((h) => [h.code, h]));
  const selectedHands: HkHandDefinition[] = [];
  let rawFan = 0;
  let hasLimitHand = false;

  for (const code of handCodes) {
    const h = handsMap.get(code);
    if (h) {
      selectedHands.push(h);
      if (h.isLimit) {
        hasLimitHand = true;
      } else {
        rawFan += h.fan;
      }
    }
  }

  let finalFan = 0;
  let bonusFan = 0;

  if (hasLimitHand) {
    rawFan = maxFanLimit;
    finalFan = maxFanLimit;
    bonusFan = 0;
  } else {
    bonusFan = winMethod === 'self_draw' ? selfDrawBonusFan : 0;
    const total = rawFan + bonusFan;
    finalFan = Math.min(total, maxFanLimit);
  }

  const isValid = finalFan >= minFan;
  let errorMessage: string | null = null;
  if (!isValid) {
    errorMessage = `Total ${finalFan} Fan belum memenuhi syarat minimum ${minFan} Fan untuk menang (Hu).`;
  }

  const lookupFan = Math.max(minFan, Math.min(finalFan, 13));
  const row = HK_POINTS_TABLE[lookupFan] || HK_POINTS_TABLE[10];
  // Poin Hong Kong Style (Half-Spicy / Pun Laat):
  // - Tarik Sendiri (Zi Mo): Pemenang menerima akumulasi poin dari 3 posisi lawan (row.selfDrawTotal)
  // - Buang Lawan (Discard): Pemenang menerima alokasi poin dari keping si pembuang (row.discard)
  const pointsAwarded = isValid ? (winMethod === 'self_draw' ? row.selfDrawTotal : row.discard) : 0;

  return {
    rawFan,
    finalFan,
    bonusFan,
    isValid,
    isLimit: hasLimitHand || finalFan >= maxFanLimit,
    pointsAwarded,
    breakdown: {
      discard: row.discard,
      selfDrawEach: row.selfDrawEach,
      selfDrawTotal: row.selfDrawTotal,
    },
    errorMessage,
    selectedHands,
  };
}
