import {
  CATEGORIES,
  CalendarEntry,
  Category,
  CategoryStat,
  ClosetFilterState,
  ColorStat,
  Lookbook,
  Outfit,
  OutfitCanvasItem,
  PackingChecklistResult,
  WardrobeAnalytics,
  WardrobeItem,
} from '../types/wardrobe';

/**
 * Calculates Cost-Per-Wear for a garment.
 * Returns null when the item has 0 wears so UI displays an explicit unworn indicator.
 */
export function calculateCostPerWear(price: number, wears: number): number | null {
  if (!Number.isFinite(price) || price < 0) return null;
  if (!Number.isFinite(wears) || wears <= 0) return null;
  return Number((price / wears).toFixed(2));
}

/**
 * Computes effective wear counts for every item by combining historical base wears
 * with logged calendar entries (deduplicating items within the same calendar date).
 */
export function computeAllWearCounts(
  items: WardrobeItem[],
  outfits: Outfit[],
  calendar: Record<string, CalendarEntry>
): Record<string, number> {
  const outfitMap = new Map<string, Outfit>();
  for (const outfit of outfits) {
    outfitMap.set(outfit.id, outfit);
  }

  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.id] = Math.max(0, Math.floor(item.baseWears));
  }

  for (const entry of Object.values(calendar)) {
    const wornOnDay = new Set<string>();
    if (entry.outfitId) {
      const outfit = outfitMap.get(entry.outfitId);
      if (outfit) {
        for (const placement of outfit.items) {
          wornOnDay.add(placement.itemId);
        }
      }
    }
    for (const extraId of entry.extraItemIds) {
      wornOnDay.add(extraId);
    }

    for (const itemId of wornOnDay) {
      if (itemId in counts) {
        counts[itemId] += 1;
      }
    }
  }

  return counts;
}

/**
 * Filters and sorts wardrobe items deterministically.
 */
export function filterAndSortItems(
  items: WardrobeItem[],
  filters: ClosetFilterState,
  wearCounts: Record<string, number>
): WardrobeItem[] {
  const query = filters.search.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (filters.category !== 'All' && item.category !== filters.category) {
      return false;
    }
    if (
      filters.season !== 'All' &&
      item.season !== filters.season &&
      item.season !== 'All-Season'
    ) {
      return false;
    }
    if (query.length > 0) {
      const haystack = `${item.name} ${item.brand} ${item.colorName} ${item.category} ${item.location} ${item.notes}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    const wearsA = wearCounts[a.id] ?? a.baseWears;
    const wearsB = wearCounts[b.id] ?? b.baseWears;

    switch (filters.sort) {
      case 'most-worn':
        return wearsB - wearsA || a.name.localeCompare(b.name);
      case 'least-worn':
        return wearsA - wearsB || b.price - a.price;
      case 'lowest-cpw': {
        const cpwA = calculateCostPerWear(a.price, wearsA) ?? Number.POSITIVE_INFINITY;
        const cpwB = calculateCostPerWear(b.price, wearsB) ?? Number.POSITIVE_INFINITY;
        return cpwA - cpwB || wearsB - wearsA;
      }
      case 'highest-price':
        return b.price - a.price || a.name.localeCompare(b.name);
      case 'recent':
      default:
        return b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name);
    }
  });
}

/**
 * Generates an editorial magazine flat-lay arrangement for a set of garments.
 * Guarantees all coordinates stay cleanly inside [16, 84] bounds with intuitive z-ordering.
 */
export function buildAutoArrangeLayout(items: WardrobeItem[]): OutfitCanvasItem[] {
  const slots: Record<Category, Array<{ x: number; y: number; scale: number; z: number }>> = {
    Outerwear: [
      { x: 26, y: 38, scale: 1.08, z: 2 },
      { x: 74, y: 38, scale: 1.02, z: 2 },
    ],
    Dresses: [
      { x: 48, y: 48, scale: 1.16, z: 3 },
      { x: 30, y: 48, scale: 1.05, z: 3 },
    ],
    Tops: [
      { x: 52, y: 29, scale: 0.96, z: 4 },
      { x: 34, y: 31, scale: 0.92, z: 3 },
    ],
    Bottoms: [
      { x: 52, y: 69, scale: 1.06, z: 3 },
      { x: 34, y: 69, scale: 1.0, z: 3 },
    ],
    Bags: [
      { x: 78, y: 46, scale: 0.86, z: 5 },
      { x: 22, y: 68, scale: 0.82, z: 5 },
    ],
    Footwear: [
      { x: 77, y: 76, scale: 0.8, z: 6 },
      { x: 24, y: 78, scale: 0.78, z: 6 },
    ],
    Accessories: [
      { x: 77, y: 22, scale: 0.68, z: 7 },
      { x: 24, y: 20, scale: 0.66, z: 7 },
    ],
  };

  const usedPerCategory: Record<string, number> = {};
  const hasOuterwear = items.some((i) => i.category === 'Outerwear');

  return items.map((item, idx) => {
    const used = usedPerCategory[item.category] ?? 0;
    usedPerCategory[item.category] = used + 1;

    const categorySlots = slots[item.category];
    const preset = categorySlots[used];

    if (preset) {
      // Shift center pieces slightly right when paired with outerwear on the left
      const xAdjust =
        !hasOuterwear && (item.category === 'Tops' || item.category === 'Bottoms' || item.category === 'Dresses')
          ? -12
          : 0;
      return {
        itemId: item.id,
        x: clamp(preset.x + xAdjust, 18, 82),
        y: clamp(preset.y, 18, 82),
        scale: preset.scale,
        rotation: 0,
        zIndex: preset.z + used,
      };
    }

    // Fallback grid for extra items beyond standard slots
    const col = idx % 3;
    const row = Math.floor(idx / 3) % 3;
    return {
      itemId: item.id,
      x: clamp(24 + col * 26, 18, 82),
      y: clamp(24 + row * 26, 18, 82),
      scale: 0.85,
      rotation: 0,
      zIndex: idx + 1,
    };
  });
}

/**
 * Deduplicates all garments required across every outfit assigned to a Lookbook or Packing List.
 */
export function extractPackingChecklist(
  lookbook: Lookbook,
  outfits: Outfit[],
  items: WardrobeItem[]
): PackingChecklistResult {
  const itemMap = new Map<string, WardrobeItem>();
  for (const item of items) {
    itemMap.set(item.id, item);
  }

  const outfitMap = new Map<string, Outfit>();
  for (const outfit of outfits) {
    outfitMap.set(outfit.id, outfit);
  }

  const uniqueItemIds = new Set<string>();
  for (const outfitId of lookbook.outfitIds) {
    const outfit = outfitMap.get(outfitId);
    if (!outfit) continue;
    for (const placement of outfit.items) {
      if (itemMap.has(placement.itemId)) {
        uniqueItemIds.add(placement.itemId);
      }
    }
  }

  const categoryOrder = new Map<Category, number>(
    CATEGORIES.map((cat, index) => [cat, index])
  );

  const checklistItems = Array.from(uniqueItemIds)
    .map((id) => itemMap.get(id)!)
    .sort((a, b) => {
      const catDiff = (categoryOrder.get(a.category) ?? 99) - (categoryOrder.get(b.category) ?? 99);
      return catDiff !== 0 ? catDiff : a.name.localeCompare(b.name);
    });

  const packedIds = new Set(
    lookbook.packedItemIds.filter((id) => uniqueItemIds.has(id))
  );
  const totalCount = checklistItems.length;
  const packedCount = packedIds.size;
  const percentComplete =
    totalCount === 0 ? 0 : Math.round((packedCount / totalCount) * 100);

  return {
    items: checklistItems,
    packedIds,
    packedCount,
    totalCount,
    percentComplete,
  };
}

/**
 * Computes full wardrobe analytics derived purely from items, outfits, and calendar history.
 */
export function computeWardrobeAnalytics(
  items: WardrobeItem[],
  outfits: Outfit[],
  calendar: Record<string, CalendarEntry>
): WardrobeAnalytics {
  const wearCounts = computeAllWearCounts(items, outfits, calendar);
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + Math.max(0, item.price), 0);

  let totalWears = 0;
  let wornItemCount = 0;
  const cpwEntries: Array<{ item: WardrobeItem; wears: number; cpw: number }> = [];
  const wornList: Array<{ item: WardrobeItem; wears: number; cpw: number | null }> = [];
  const unwornItems: WardrobeItem[] = [];

  for (const item of items) {
    const wears = wearCounts[item.id] ?? 0;
    totalWears += wears;
    const cpw = calculateCostPerWear(item.price, wears);

    if (wears > 0) {
      wornItemCount += 1;
      wornList.push({ item, wears, cpw });
      if (cpw !== null) {
        cpwEntries.push({ item, wears, cpw });
      }
    } else {
      unwornItems.push(item);
    }
  }

  const avgCostPerWear =
    totalWears > 0 ? Number((totalValue / totalWears).toFixed(2)) : null;

  const utilizationRate =
    totalItems > 0 ? Math.round((wornItemCount / totalItems) * 100) : 0;

  const loggedDaysCount = Object.values(calendar).filter(
    (entry) => Boolean(entry.outfitId) || entry.extraItemIds.length > 0
  ).length;

  const mostWorn = [...wornList]
    .sort((a, b) => b.wears - a.wears || a.item.name.localeCompare(b.item.name))
    .slice(0, 5);

  const bestValue = [...cpwEntries]
    .sort((a, b) => a.cpw - b.cpw || b.wears - a.wears)
    .slice(0, 5);

  const categoryBreakdown: CategoryStat[] = CATEGORIES.map((category) => {
    const matching = items.filter((item) => item.category === category);
    const value = matching.reduce((sum, item) => sum + item.price, 0);
    return {
      category,
      count: matching.length,
      value,
      sharePercent: totalItems > 0 ? Math.round((matching.length / totalItems) * 100) : 0,
    };
  })
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || b.value - a.value);

  const colorAccumulator = new Map<string, { colorName: string; colorHex: string; count: number }>();
  for (const item of items) {
    const key = item.colorName.trim().toLowerCase();
    const existing = colorAccumulator.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      colorAccumulator.set(key, {
        colorName: item.colorName.trim(),
        colorHex: item.colorHex,
        count: 1,
      });
    }
  }

  const colorDNA: ColorStat[] = Array.from(colorAccumulator.values())
    .sort((a, b) => b.count - a.count || a.colorName.localeCompare(b.colorName))
    .map((entry) => ({
      ...entry,
      sharePercent: totalItems > 0 ? Math.round((entry.count / totalItems) * 100) : 0,
    }));

  return {
    totalItems,
    totalValue,
    totalWears,
    avgCostPerWear,
    utilizationRate,
    wornItemCount,
    loggedDaysCount,
    unwornItems,
    mostWorn,
    bestValue,
    categoryBreakdown,
    colorDNA,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount >= 100 ? 0 : 2,
  }).format(amount);
}

export function formatDateKey(year: number, monthZeroIndexed: number, day: number): string {
  const m = String(monthZeroIndexed + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export interface CalendarDayCell {
  dateKey: string;
  dayNumber: number;
  inCurrentMonth: boolean;
}

/**
 * Returns a 35- or 42-day grid (Sun-Sat) for rendering a monthly calendar.
 */
export function getMonthCalendarDays(year: number, monthZeroIndexed: number): CalendarDayCell[] {
  const firstDayOfMonth = new Date(year, monthZeroIndexed, 1);
  const startWeekday = firstDayOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, monthZeroIndexed + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthZeroIndexed, 0).getDate();

  const cells: CalendarDayCell[] = [];

  // Leading days from previous month
  const prevMonthDate = new Date(year, monthZeroIndexed - 1, 1);
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    cells.push({
      dateKey: formatDateKey(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), d),
      dayNumber: d,
      inCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      dateKey: formatDateKey(year, monthZeroIndexed, d),
      dayNumber: d,
      inCurrentMonth: true,
    });
  }

  // Trailing days from next month to fill full weeks
  const nextMonthDate = new Date(year, monthZeroIndexed + 1, 1);
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      dateKey: formatDateKey(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), nextDay),
      dayNumber: nextDay,
      inCurrentMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
