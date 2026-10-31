// ── Domain Types for Mahjongyuks ──

export interface EventSession {
  id: string;
  category: 'kompetitif' | 'santai' | 'pemula';
  categoryLabel: string;
  title: string;
  venue: string;
  dateTime: string;
  price: string;
  priceUnit: string;
  description: string;
  tags: string[];
  image: string;
  seatsRemaining: number;
}

export interface VenueBranch {
  id: string;
  name: string;
  city: string;
  area: string;
  address: string;
  hours: string;
  tableCount: number;
  tableType: string;
  image: string;
  features: string[];
  description: string;
}

export interface LeaderboardPlayer {
  rank: number;
  name: string;
  initials: string;
  club: string;
  rankTitle: string;
  danRank: string;
  eloRating: number;
  winRate: string;
  totalMatches: number;
  avatarBg?: string;
}

export interface FilterState {
  location: string;
  schedule: string;
  category: string;
  priceRange: string;
}

export interface HowItWorksStep {
  stepNumber: string;
  title: string;
  description: string;
}
