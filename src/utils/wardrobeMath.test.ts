import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAutoArrangeLayout,
  calculateCostPerWear,
  computeAllWearCounts,
  computeWardrobeAnalytics,
  extractPackingChecklist,
  filterAndSortItems,
  getMonthCalendarDays,
} from './wardrobeMath';
import { CalendarEntry, Lookbook, Outfit, WardrobeItem } from '../types/wardrobe';

const sampleItems: WardrobeItem[] = [
  {
    id: 'coat-1',
    name: 'Double-Breasted Camel Coat',
    brand: 'Totême',
    category: 'Outerwear',
    colorName: 'Camel',
    colorHex: '#A67C52',
    season: 'Autumn',
    price: 880,
    baseWears: 10,
    size: 'S',
    location: 'Hall Closet',
    notes: 'Heavyweight wool',
    imageUrl: '/test-coat.jpg',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'knit-1',
    name: 'Ribbed Cashmere Crewneck',
    brand: 'The Row',
    category: 'Tops',
    colorName: 'Ivory',
    colorHex: '#EDE8DC',
    season: 'Winter',
    price: 600,
    baseWears: 20,
    size: 'M',
    location: 'Dresser',
    notes: 'Soft cashmere',
    imageUrl: '/test-knit.jpg',
    createdAt: '2026-09-10T10:00:00Z',
  },
  {
    id: 'dress-1',
    name: 'Bias Silk Slip Dress',
    brand: 'Celine',
    category: 'Dresses',
    colorName: 'Espresso',
    colorHex: '#5C473C',
    season: 'Summer',
    price: 540,
    baseWears: 0,
    size: 'S',
    location: 'Main Rack',
    notes: 'Unworn evening piece',
    imageUrl: '/test-dress.jpg',
    createdAt: '2026-10-05T10:00:00Z',
  },
  {
    id: 'shoe-1',
    name: 'Oxblood Penny Loafers',
    brand: 'G.H. Bass',
    category: 'Footwear',
    colorName: 'Oxblood',
    colorHex: '#4E1D24',
    season: 'All-Season',
    price: 200,
    baseWears: 25,
    size: '39',
    location: 'Shoe Rack',
    notes: 'Everyday shoe',
    imageUrl: '/test-shoe.jpg',
    createdAt: '2026-08-15T10:00:00Z',
  },
];

const sampleOutfits: Outfit[] = [
  {
    id: 'outfit-1',
    name: 'Gallery Walk',
    season: 'Autumn',
    occasion: 'Weekend',
    items: [
      { itemId: 'coat-1', x: 25, y: 40, scale: 1, rotation: 0, zIndex: 1 },
      { itemId: 'knit-1', x: 55, y: 30, scale: 1, rotation: 0, zIndex: 2 },
      { itemId: 'shoe-1', x: 75, y: 75, scale: 0.8, rotation: 0, zIndex: 3 },
    ],
    notes: '',
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'outfit-2',
    name: 'Evening Dinner',
    season: 'Autumn',
    occasion: 'Evening',
    items: [
      { itemId: 'coat-1', x: 25, y: 40, scale: 1, rotation: 0, zIndex: 1 },
      { itemId: 'dress-1', x: 50, y: 50, scale: 1.1, rotation: 0, zIndex: 2 },
    ],
    notes: '',
    createdAt: '2026-10-12T10:00:00Z',
  },
];

test('calculateCostPerWear handles positive wears, zero wears, and free items', () => {
  assert.equal(calculateCostPerWear(880, 10), 88);
  assert.equal(calculateCostPerWear(250, 3), 83.33);
  assert.equal(calculateCostPerWear(540, 0), null);
  assert.equal(calculateCostPerWear(0, 5), 0);
  assert.equal(calculateCostPerWear(-10, 5), null);
});

test('computeAllWearCounts combines base wears and calendar logs without double-counting same day', () => {
  const calendar: Record<string, CalendarEntry> = {
    '2026-11-10': {
      date: '2026-11-10',
      outfitId: 'outfit-1',
      // coat-1 is already inside outfit-1; should only count once for this date
      extraItemIds: ['coat-1'],
      note: 'Crisp morning',
    },
    '2026-11-11': {
      date: '2026-11-11',
      extraItemIds: ['shoe-1'],
      note: '',
    },
  };

  const counts = computeAllWearCounts(sampleItems, sampleOutfits, calendar);
  assert.equal(counts['coat-1'], 11);
  assert.equal(counts['knit-1'], 21);
  assert.equal(counts['shoe-1'], 27);
  assert.equal(counts['dress-1'], 0);
});

test('filterAndSortItems filters by category, season (including All-Season), search, and sorts by lowest CPW', () => {
  const counts = { 'coat-1': 10, 'knit-1': 20, 'dress-1': 0, 'shoe-1': 25 };

  const autumnItems = filterAndSortItems(
    sampleItems,
    { search: '', category: 'All', season: 'Autumn', sort: 'lowest-cpw' },
    counts
  );
  // Autumn includes coat-1 (Autumn, CPW $88) and shoe-1 (All-Season, CPW $8)
  assert.deepEqual(
    autumnItems.map((i) => i.id),
    ['shoe-1', 'coat-1']
  );

  const searchRes = filterAndSortItems(
    sampleItems,
    { search: 'row', category: 'All', season: 'All', sort: 'recent' },
    counts
  );
  assert.deepEqual(
    searchRes.map((i) => i.id),
    ['knit-1']
  );
});

test('buildAutoArrangeLayout keeps all items in safe canvas bounds', () => {
  const layout = buildAutoArrangeLayout(sampleItems);
  assert.equal(layout.length, sampleItems.length);
  for (const placement of layout) {
    assert.ok(placement.x >= 18 && placement.x <= 82);
    assert.ok(placement.y >= 18 && placement.y <= 82);
    assert.ok(placement.scale >= 0.5 && placement.scale <= 1.5);
  }
});

test('extractPackingChecklist deduplicates shared pieces across outfits and computes progress', () => {
  const lookbook: Lookbook = {
    id: 'lb-1',
    name: 'Weekend Trip',
    description: 'Two looks sharing one coat',
    type: 'packing',
    outfitIds: ['outfit-1', 'outfit-2'],
    packedItemIds: ['coat-1', 'knit-1'],
    createdAt: '2026-11-01T00:00:00Z',
  };

  const result = extractPackingChecklist(lookbook, sampleOutfits, sampleItems);
  // outfit-1 has coat-1, knit-1, shoe-1; outfit-2 has coat-1, dress-1 => 4 unique items
  assert.equal(result.totalCount, 4);
  assert.equal(result.packedCount, 2);
  assert.equal(result.percentComplete, 50);
});

test('computeWardrobeAnalytics calculates value, utilization, unworn pieces, and leaderboards accurately', () => {
  const calendar: Record<string, CalendarEntry> = {
    '2026-11-18': { date: '2026-11-18', outfitId: 'outfit-1', extraItemIds: [], note: '' },
  };
  const analytics = computeWardrobeAnalytics(sampleItems, sampleOutfits, calendar);

  assert.equal(analytics.totalItems, 4);
  assert.equal(analytics.totalValue, 2220);
  assert.equal(analytics.wornItemCount, 3);
  assert.equal(analytics.utilizationRate, 75);
  assert.equal(analytics.loggedDaysCount, 1);
  assert.deepEqual(
    analytics.unwornItems.map((i) => i.id),
    ['dress-1']
  );
  assert.equal(analytics.bestValue[0].item.id, 'shoe-1');
  assert.equal(analytics.mostWorn[0].item.id, 'shoe-1');
});

test('getMonthCalendarDays produces complete Sunday-Saturday weeks', () => {
  const days = getMonthCalendarDays(2026, 10); // November 2026
  assert.equal(days.length % 7, 0);
  const novDays = days.filter((d) => d.inCurrentMonth);
  assert.equal(novDays.length, 30);
  assert.equal(novDays[0].dateKey, '2026-11-01');
  assert.equal(novDays[29].dateKey, '2026-11-30');
});
