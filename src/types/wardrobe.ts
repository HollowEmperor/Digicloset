export type Category =
  | 'Outerwear'
  | 'Tops'
  | 'Dresses'
  | 'Bottoms'
  | 'Footwear'
  | 'Bags'
  | 'Accessories';

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'All-Season';

export type SortOption =
  | 'recent'
  | 'most-worn'
  | 'least-worn'
  | 'lowest-cpw'
  | 'highest-price';

export type ActiveTab = 'closet' | 'outfits' | 'calendar' | 'lookbooks' | 'analytics';

export interface WardrobeItem {
  id: string;
  name: string;
  brand: string;
  category: Category;
  colorName: string;
  colorHex: string;
  season: Season;
  price: number;
  baseWears: number;
  size: string;
  location: string;
  notes: string;
  imageUrl: string;
  createdAt: string;
}

export interface OutfitCanvasItem {
  itemId: string;
  /** Horizontal center position as percentage (0-100) */
  x: number;
  /** Vertical center position as percentage (0-100) */
  y: number;
  /** Scale multiplier (0.5 - 1.8) */
  scale: number;
  /** Rotation in degrees (-45 - 45) */
  rotation: number;
  /** Stacking layer order */
  zIndex: number;
}

export interface Outfit {
  id: string;
  name: string;
  season: Season;
  occasion: string;
  items: OutfitCanvasItem[];
  notes: string;
  createdAt: string;
}

export interface CalendarEntry {
  date: string; // YYYY-MM-DD
  outfitId?: string;
  extraItemIds: string[];
  note: string;
}

export interface Lookbook {
  id: string;
  name: string;
  description: string;
  type: 'lookbook' | 'packing';
  outfitIds: string[];
  packedItemIds: string[];
  createdAt: string;
}

export interface ClosetFilterState {
  search: string;
  category: Category | 'All';
  season: Season | 'All';
  sort: SortOption;
}

export interface PackingChecklistResult {
  items: WardrobeItem[];
  packedIds: Set<string>;
  packedCount: number;
  totalCount: number;
  percentComplete: number;
}

export interface CategoryStat {
  category: Category;
  count: number;
  value: number;
  sharePercent: number;
}

export interface ColorStat {
  colorName: string;
  colorHex: string;
  count: number;
  sharePercent: number;
}

export interface WardrobeAnalytics {
  totalItems: number;
  totalValue: number;
  totalWears: number;
  avgCostPerWear: number | null;
  utilizationRate: number;
  wornItemCount: number;
  loggedDaysCount: number;
  unwornItems: WardrobeItem[];
  mostWorn: Array<{ item: WardrobeItem; wears: number; cpw: number | null }>;
  bestValue: Array<{ item: WardrobeItem; wears: number; cpw: number }>;
  categoryBreakdown: CategoryStat[];
  colorDNA: ColorStat[];
}

export const CATEGORIES: Category[] = [
  'Outerwear',
  'Tops',
  'Dresses',
  'Bottoms',
  'Footwear',
  'Bags',
  'Accessories',
];

export const SEASONS: Season[] = [
  'All-Season',
  'Spring',
  'Summer',
  'Autumn',
  'Winter',
];
