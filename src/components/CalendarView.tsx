import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Check } from 'lucide-react';
import { CalendarEntry, Outfit, WardrobeItem } from '../types/wardrobe';
import {
  formatCurrency,
  formatDateKey,
  getMonthCalendarDays,
} from '../utils/wardrobeMath';
import { GarmentImage } from './GarmentImage';
import { OutfitCollagePreview } from './OutfitCollagePreview';

interface CalendarViewProps {
  items: WardrobeItem[];
  outfits: Outfit[];
  calendar: Record<string, CalendarEntry>;
  itemMap: Map<string, WardrobeItem>;
  preselectedOutfitId: string | null;
  onClearPreselectedOutfit: () => void;
  onSaveEntry: (entry: CalendarEntry) => void;
  onClearEntry: (dateKey: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function CalendarView({
  items,
  outfits,
  calendar,
  itemMap,
  preselectedOutfitId,
  onClearPreselectedOutfit,
  onSaveEntry,
  onClearEntry,
}: CalendarViewProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [noteDraft, setNoteDraft] = useState('');
  const [showExtraPieces, setShowExtraPieces] = useState(false);

  const outfitMap = useMemo(() => {
    const map = new Map<string, Outfit>();
    for (const o of outfits) map.set(o.id, o);
    return map;
  }, [outfits]);

  const currentEntry = calendar[selectedDateKey];

  useEffect(() => {
    setNoteDraft(currentEntry?.note ?? '');
  }, [selectedDateKey, currentEntry?.note]);

  // If navigated from Outfits -> Plan on Calendar, assign the outfit to today/selected date
  useEffect(() => {
    if (!preselectedOutfitId) return;
    const existing = calendar[selectedDateKey];
    onSaveEntry({
      date: selectedDateKey,
      outfitId: preselectedOutfitId,
      extraItemIds: existing?.extraItemIds ?? [],
      note: existing?.note ?? '',
    });
    onClearPreselectedOutfit();
  }, [preselectedOutfitId, selectedDateKey, calendar, onSaveEntry, onClearPreselectedOutfit]);

  const days = useMemo(
    () => getMonthCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const monthLoggedCount = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-`;
    return Object.values(calendar).filter(
      (entry) =>
        entry.date.startsWith(prefix) &&
        (Boolean(entry.outfitId) || entry.extraItemIds.length > 0)
    ).length;
  }, [calendar, viewYear, viewMonth]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDateKey(todayKey);
  };

  const handleAssignOutfit = (outfitId: string | undefined) => {
    onSaveEntry({
      date: selectedDateKey,
      outfitId,
      extraItemIds: currentEntry?.extraItemIds ?? [],
      note: noteDraft,
    });
  };

  const handleToggleExtraPiece = (itemId: string) => {
    const existingIds = currentEntry?.extraItemIds ?? [];
    const nextIds = existingIds.includes(itemId)
      ? existingIds.filter((id) => id !== itemId)
      : [...existingIds, itemId];
    onSaveEntry({
      date: selectedDateKey,
      outfitId: currentEntry?.outfitId,
      extraItemIds: nextIds,
      note: noteDraft,
    });
  };

  const handleSaveNote = () => {
    onSaveEntry({
      date: selectedDateKey,
      outfitId: currentEntry?.outfitId,
      extraItemIds: currentEntry?.extraItemIds ?? [],
      note: noteDraft.trim(),
    });
  };

  const selectedOutfit = currentEntry?.outfitId
    ? outfitMap.get(currentEntry.outfitId)
    : undefined;

  const selectedDayPieces = useMemo(() => {
    const seen = new Set<string>();
    const list: WardrobeItem[] = [];
    if (selectedOutfit) {
      for (const p of selectedOutfit.items) {
        const item = itemMap.get(p.itemId);
        if (item && !seen.has(item.id)) {
          seen.add(item.id);
          list.push(item);
        }
      }
    }
    for (const id of currentEntry?.extraItemIds ?? []) {
      const item = itemMap.get(id);
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        list.push(item);
      }
    }
    return list;
  }, [selectedOutfit, currentEntry, itemMap]);

  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDateKey]);

  return (
    <section aria-label="Outfit Calendar and Wear Tracker" className="space-y-7">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-editorial text-4xl sm:text-[44px] leading-[1.08] font-medium tracking-tight text-[#141413]">
            Wear Calendar
          </h1>
          <p className="mt-2 text-sm text-[#676764]">
            <span className="font-mono tabular-nums text-[#141413]">
              {monthLoggedCount} {monthLoggedCount === 1 ? 'day' : 'days'}
            </span>{' '}
            logged in {MONTH_NAMES[viewMonth]} {viewYear} — every entry updates garment wears &amp; cost-per-wear
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevMonth}
            aria-label="Previous month"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center bg-white border border-[#E5E5E1] hover:border-[#141413] rounded-lg cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="min-w-[148px] text-center text-sm font-semibold text-[#141413]">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={goNextMonth}
            aria-label="Next month"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center bg-white border border-[#E5E5E1] hover:border-[#141413] rounded-lg cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-[#141413] bg-white border border-[#E5E5E1] hover:border-[#141413] rounded-lg whitespace-nowrap cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* Main Split: Calendar Grid + Day Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Monthly Grid */}
        <div className="lg:col-span-8 bg-white border border-[#E5E5E1] rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#E5E5E1] bg-[#FAFAFA]">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-[11px] font-semibold text-[#676764]"
              >
                {day}
              </div>
            ))}
          </div>

          <div
            data-testid="calendar-grid"
            className="grid grid-cols-7 divide-x divide-y divide-[#E5E5E1]/70"
          >
            {days.map((cell) => {
              const entry = calendar[cell.dateKey];
              const outfit = entry?.outfitId ? outfitMap.get(entry.outfitId) : undefined;
              const extraFirstItem =
                !outfit && entry?.extraItemIds[0]
                  ? itemMap.get(entry.extraItemIds[0])
                  : undefined;
              const isSelected = cell.dateKey === selectedDateKey;
              const isToday = cell.dateKey === todayKey;

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  aria-label={`Select ${cell.dateKey}${outfit ? `, planned ${outfit.name}` : ''}`}
                  aria-pressed={isSelected}
                  className={`relative min-h-[78px] sm:min-h-[96px] p-1.5 flex flex-col justify-between text-left transition-colors cursor-pointer ${
                    !cell.inCurrentMonth ? 'bg-[#FAFAFA]/60 text-[#A4A4A0]' : 'bg-white'
                  } ${
                    isSelected
                      ? 'ring-2 ring-inset ring-[#7A283B] bg-[#7A283B]/[0.03]'
                      : 'hover:bg-[#FAFAFA]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`font-mono tabular-nums text-xs leading-none px-1.5 py-0.5 rounded ${
                        isToday
                          ? 'bg-[#141413] text-white font-semibold'
                          : isSelected
                          ? 'text-[#7A283B] font-semibold'
                          : 'text-[#141413]'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                  </div>

                  {outfit ? (
                    <div className="mt-1 w-full max-w-[66px] mx-auto aspect-[4/5] rounded overflow-hidden border border-[#E5E5E1]">
                      <OutfitCollagePreview
                        placements={outfit.items}
                        itemMap={itemMap}
                        compact
                      />
                    </div>
                  ) : extraFirstItem ? (
                    <div className="mt-1 w-full max-w-[66px] mx-auto aspect-[4/5] rounded overflow-hidden border border-[#E5E5E1] bg-[#EFEFED]">
                      <GarmentImage
                        src={extraFirstItem.imageUrl}
                        alt={extraFirstItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Inspector Panel */}
        <aside
          aria-label="Selected day details"
          className="lg:col-span-4 bg-white border border-[#E5E5E1] rounded-xl p-5 space-y-5"
        >
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E5E5E1]">
            <div>
              <p className="text-xs font-mono tabular-nums text-[#676764]">
                {selectedDateKey}
              </p>
              <h2 className="font-editorial text-2xl font-medium text-[#141413] mt-0.5">
                {formattedSelectedDate}
              </h2>
            </div>
            {currentEntry && (
              <button
                type="button"
                onClick={() => onClearEntry(selectedDateKey)}
                aria-label="Clear day entry"
                className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#676764] hover:text-[#7A283B] hover:bg-[#7A283B]/10 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selected Outfit Preview */}
          {selectedOutfit ? (
            <div className="space-y-3">
              <div className="aspect-[4/5] max-h-[260px] mx-auto rounded-lg overflow-hidden border border-[#E5E5E1]">
                <OutfitCollagePreview
                  placements={selectedOutfit.items}
                  itemMap={itemMap}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#141413]">
                  {selectedOutfit.name}
                </span>
                <span className="font-mono tabular-nums text-[#676764]">
                  {selectedDayPieces.length} pieces ·{' '}
                  {formatCurrency(
                    selectedDayPieces.reduce((s, item) => s + item.price, 0)
                  )}
                </span>
              </div>
            </div>
          ) : selectedDayPieces.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#676764]">
                Logged individual pieces ({selectedDayPieces.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedDayPieces.map((item) => (
                  <div
                    key={item.id}
                    className="w-16 aspect-[3/4] rounded overflow-hidden border border-[#E5E5E1] bg-[#EFEFED]"
                  >
                    <GarmentImage
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#676764] py-4 text-center bg-[#FAFAFA] rounded-lg border border-dashed border-[#E5E5E1]">
              Nothing logged for this date yet. Assign a saved outfit below.
            </p>
          )}

          {/* Assign Saved Outfit */}
          <div>
            <label
              htmlFor="calendar-assign-outfit"
              className="block text-xs font-semibold text-[#141413] mb-2"
            >
              Assign Saved Outfit
            </label>
            <select
              id="calendar-assign-outfit"
              value={currentEntry?.outfitId ?? ''}
              onChange={(e) =>
                handleAssignOutfit(e.target.value || undefined)
              }
              className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E5E5E1] rounded-lg text-[#141413]"
            >
              <option value="">No outfit assigned</option>
              {outfits.map((outfit) => (
                <option key={outfit.id} value={outfit.id}>
                  {outfit.name} ({outfit.items.length} pcs)
                </option>
              ))}
            </select>
          </div>

          {/* Optional Extra Pieces Disclosure */}
          <div className="pt-1">
            <button
              type="button"
              aria-expanded={showExtraPieces}
              onClick={() => setShowExtraPieces((v) => !v)}
              className="text-xs font-semibold text-[#141413] hover:text-[#7A283B] transition-colors cursor-pointer"
            >
              {showExtraPieces
                ? 'Hide individual pieces'
                : `Add individual pieces (${currentEntry?.extraItemIds.length ?? 0})`}
            </button>

            {showExtraPieces && (
              <div className="mt-3 grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => {
                  const checked =
                    currentEntry?.extraItemIds.includes(item.id) ?? false;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleExtraPiece(item.id)}
                      aria-pressed={checked}
                      className={`relative rounded overflow-hidden border text-left cursor-pointer ${
                        checked
                          ? 'border-[#7A283B] ring-1 ring-[#7A283B]'
                          : 'border-[#E5E5E1]'
                      }`}
                    >
                      <div className="aspect-[3/4] bg-[#EFEFED]">
                        <GarmentImage
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {checked && (
                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#7A283B] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                      )}
                      <p className="p-1 text-[10px] truncate bg-white text-[#141413]">
                        {item.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Day Note */}
          <div className="space-y-2 pt-2 border-t border-[#E5E5E1]">
            <label
              htmlFor="calendar-day-note"
              className="block text-xs font-semibold text-[#141413]"
            >
              Weather &amp; Day Notes
            </label>
            <textarea
              id="calendar-day-note"
              rows={2}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="e.g. 60°F breeze, client lunch..."
              className="w-full px-3 py-2 text-xs bg-[#FAFAFA] border border-[#E5E5E1] rounded-lg text-[#141413] resize-none"
            />
            <button
              type="button"
              onClick={handleSaveNote}
              className="w-full min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#141413] hover:bg-[#2A2A28] rounded-lg transition-colors cursor-pointer"
            >
              Save Day Log
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
