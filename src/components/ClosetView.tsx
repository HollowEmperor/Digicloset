import { useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import {
  CATEGORIES,
  Category,
  ClosetFilterState,
  SEASONS,
  Season,
  SortOption,
  WardrobeItem,
} from '../types/wardrobe';
import {
  calculateCostPerWear,
  filterAndSortItems,
  formatCurrency,
} from '../utils/wardrobeMath';
import { GarmentImage } from './GarmentImage';

interface ClosetViewProps {
  items: WardrobeItem[];
  wearCounts: Record<string, number>;
  filters: ClosetFilterState;
  onChangeFilters: (next: ClosetFilterState) => void;
  onSelectItem: (item: WardrobeItem) => void;
  onOpenAddItem: () => void;
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'most-worn', label: 'Most Worn' },
  { value: 'least-worn', label: 'Least Worn' },
  { value: 'lowest-cpw', label: 'Lowest Cost / Wear' },
  { value: 'highest-price', label: 'Highest Value' },
];

export function ClosetView({
  items,
  wearCounts,
  filters,
  onChangeFilters,
  onSelectItem,
  onOpenAddItem,
}: ClosetViewProps) {
  const filteredItems = useMemo(
    () => filterAndSortItems(items, filters, wearCounts),
    [items, filters, wearCounts]
  );

  const totalCatalogValue = useMemo(
    () => filteredItems.reduce((sum, item) => sum + item.price, 0),
    [filteredItems]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    for (const item of items) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const hasActiveFilter =
    filters.category !== 'All' ||
    filters.season !== 'All' ||
    filters.search.trim().length > 0;

  const resetFilters = () =>
    onChangeFilters({
      search: '',
      category: 'All',
      season: 'All',
      sort: filters.sort,
    });

  return (
    <section aria-label="Digital Closet" className="space-y-7">
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-editorial text-4xl sm:text-[44px] leading-[1.08] font-medium tracking-tight text-[#141413]">
            Your Closet
          </h1>
          <p className="mt-2 text-sm text-[#676764] flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono tabular-nums text-[#141413]">
              {filteredItems.length} {filteredItems.length === 1 ? 'piece' : 'pieces'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {formatCurrency(totalCatalogValue)} catalog value
            </span>
            {filters.category !== 'All' && (
              <>
                <span aria-hidden="true">·</span>
                <span>{filters.category}</span>
              </>
            )}
          </p>
        </div>

        {/* Search & Utility Controls */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search
              className="w-4 h-4 text-[#676764] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="closet-search" className="sr-only">
              Search wardrobe by brand, item, or color
            </label>
            <input
              id="closet-search"
              type="search"
              value={filters.search}
              onChange={(e) =>
                onChangeFilters({ ...filters, search: e.target.value })
              }
              placeholder="Search brand, piece, color"
              className="w-full min-h-[42px] pl-10 pr-8 py-2 text-sm bg-white border border-[#E5E5E1] rounded-lg text-[#141413] placeholder:text-[#8E8E8A] focus:border-[#141413] transition-colors"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, search: '' })}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#676764] hover:text-[#141413] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="closet-season" className="sr-only">
              Filter by season
            </label>
            <select
              id="closet-season"
              value={filters.season}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  season: e.target.value as Season | 'All',
                })
              }
              className="min-h-[42px] px-3 py-2 text-xs font-medium bg-white border border-[#E5E5E1] rounded-lg text-[#141413] cursor-pointer"
            >
              <option value="All">All Seasons</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div className="relative flex items-center">
              <SlidersHorizontal
                className="w-3.5 h-3.5 text-[#676764] absolute left-3 pointer-events-none"
                aria-hidden="true"
              />
              <label htmlFor="closet-sort" className="sr-only">
                Sort garments
              </label>
              <select
                id="closet-sort"
                value={filters.sort}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    sort: e.target.value as SortOption,
                  })
                }
                className="min-h-[42px] pl-8 pr-3 py-2 text-xs font-medium bg-white border border-[#E5E5E1] rounded-lg text-[#141413] cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Category Filter Bar */}
      <div
        role="tablist"
        aria-label="Filter wardrobe by category"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1"
      >
        {(['All', ...CATEGORIES] as Array<Category | 'All'>).map((cat) => {
          const isActive = filters.category === cat;
          const count = categoryCounts[cat] ?? 0;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChangeFilters({ ...filters, category: cat })}
              className={`min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#141413] text-white'
                  : 'bg-transparent text-[#676764] hover:text-[#141413] hover:bg-[#EFEFED]'
              }`}
            >
              <span>{cat}</span>{' '}
              <span
                className={`ml-1 font-mono tabular-nums text-[11px] ${
                  isActive ? 'text-white/75' : 'text-[#8E8E8A]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {hasActiveFilter && (
          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto min-h-[40px] px-3 py-2 text-xs font-medium text-[#7A283B] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Garment Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-[#D8D8D3] rounded-xl bg-white/50">
          <p className="font-editorial text-2xl text-[#141413]">
            No pieces match this view
          </p>
          <p className="mt-2 text-sm text-[#676764] max-w-md mx-auto">
            {items.length === 0
              ? 'Start digitizing your closet by adding your first garment.'
              : 'Try broadening your search, season, or category filter.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[42px] px-5 py-2 text-xs font-semibold text-[#141413] border border-[#141413] rounded-lg hover:bg-[#141413] hover:text-white transition-colors cursor-pointer"
              >
                Show All Pieces
              </button>
            )}
            <button
              type="button"
              onClick={onOpenAddItem}
              className="min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#141413] rounded-lg hover:bg-[#2A2A28] transition-colors cursor-pointer"
            >
              Add New Piece
            </button>
          </div>
        </div>
      ) : (
        <div
          data-testid="closet-grid"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8"
        >
          {filteredItems.map((item) => {
            const wears = wearCounts[item.id] ?? 0;
            const cpw = calculateCostPerWear(item.price, wears);

            return (
              <article key={item.id} className="group">
                <button
                  type="button"
                  onClick={() => onSelectItem(item)}
                  aria-label={`Inspect ${item.brand} ${item.name}`}
                  className="w-full text-left cursor-pointer focus-visible:outline-offset-4"
                >
                  {/* Studio 3:4 Tile */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#EFEFED] border border-[#E5E5E1]/80 transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
                    <GarmentImage
                      src={item.imageUrl}
                      alt={`${item.brand} ${item.name}`}
                      brand={item.brand}
                      colorHex={item.colorHex}
                      className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    />
                  </div>

                  {/* Clean Zero-Pill Editorial Metadata */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#676764]">
                      <span className="font-medium truncate">{item.brand}</span>
                      <span className="font-mono tabular-nums shrink-0 text-[#141413]">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    <h2 className="text-sm font-semibold text-[#141413] leading-snug truncate">
                      {item.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-[#676764] font-mono tabular-nums">
                      <span>
                        {wears} {wears === 1 ? 'wear' : 'wears'}
                      </span>
                      <span aria-hidden="true" className="font-sans">
                        ·
                      </span>
                      <span className={cpw === null ? 'text-[#7A283B] font-sans' : ''}>
                        {cpw === null ? 'Unworn' : `${formatCurrency(cpw)}/wear`}
                      </span>
                    </div>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
