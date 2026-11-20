import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarEntry,
  Lookbook,
  Outfit,
  WardrobeItem,
} from '../types/wardrobe';
import {
  SEED_CALENDAR,
  SEED_ITEMS,
  SEED_LOOKBOOKS,
  SEED_OUTFITS,
} from '../data/seedWardrobe';
import {
  computeAllWearCounts,
  computeWardrobeAnalytics,
  formatDateKey,
} from '../utils/wardrobeMath';

const STORAGE_KEY = 'closet-index-store-v1';

interface PersistedState {
  items: WardrobeItem[];
  outfits: Outfit[];
  calendar: Record<string, CalendarEntry>;
  lookbooks: Lookbook[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        items: SEED_ITEMS,
        outfits: SEED_OUTFITS,
        calendar: SEED_CALENDAR,
        lookbooks: SEED_LOOKBOOKS,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (
      Array.isArray(parsed.items) &&
      Array.isArray(parsed.outfits) &&
      parsed.calendar &&
      typeof parsed.calendar === 'object' &&
      Array.isArray(parsed.lookbooks)
    ) {
      return {
        items: parsed.items,
        outfits: parsed.outfits,
        calendar: parsed.calendar,
        lookbooks: parsed.lookbooks,
      };
    }
  } catch {
    // Fall back safely to seed data if storage is unavailable or corrupted
  }
  return {
    items: SEED_ITEMS,
    outfits: SEED_OUTFITS,
    calendar: SEED_CALENDAR,
    lookbooks: SEED_LOOKBOOKS,
  };
}

export function useWardrobeStore() {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [state]);

  const wearCounts = useMemo(
    () => computeAllWearCounts(state.items, state.outfits, state.calendar),
    [state.items, state.outfits, state.calendar]
  );

  const analytics = useMemo(
    () => computeWardrobeAnalytics(state.items, state.outfits, state.calendar),
    [state.items, state.outfits, state.calendar]
  );

  const addItem = useCallback((item: Omit<WardrobeItem, 'id' | 'createdAt'>) => {
    const newItem: WardrobeItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      items: [newItem, ...prev.items],
    }));
    return newItem;
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<Omit<WardrobeItem, 'id'>>) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setState((prev) => ({
      items: prev.items.filter((item) => item.id !== id),
      outfits: prev.outfits.map((outfit) => ({
        ...outfit,
        items: outfit.items.filter((placement) => placement.itemId !== id),
      })),
      calendar: Object.fromEntries(
        Object.entries(prev.calendar).map(([date, entry]) => [
          date,
          {
            ...entry,
            extraItemIds: entry.extraItemIds.filter((itemId) => itemId !== id),
          },
        ])
      ),
      lookbooks: prev.lookbooks.map((lb) => ({
        ...lb,
        packedItemIds: lb.packedItemIds.filter((itemId) => itemId !== id),
      })),
    }));
  }, []);

  const logQuickWearToday = useCallback((itemId: string) => {
    const now = new Date();
    const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
    setState((prev) => {
      const existing = prev.calendar[todayKey];
      const alreadyInExtra = existing?.extraItemIds.includes(itemId) ?? false;
      const outfit = existing?.outfitId
        ? prev.outfits.find((o) => o.id === existing.outfitId)
        : undefined;
      const alreadyInOutfit =
        outfit?.items.some((p) => p.itemId === itemId) ?? false;

      if (alreadyInExtra || alreadyInOutfit) {
        // Increment historical baseWears if already logged on today's calendar
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, baseWears: item.baseWears + 1 } : item
          ),
        };
      }

      const nextEntry: CalendarEntry = existing
        ? {
            ...existing,
            extraItemIds: [...existing.extraItemIds, itemId],
          }
        : {
            date: todayKey,
            extraItemIds: [itemId],
            note: '',
          };

      return {
        ...prev,
        calendar: {
          ...prev.calendar,
          [todayKey]: nextEntry,
        },
      };
    });
  }, []);

  const saveOutfit = useCallback(
    (
      outfitData: Omit<Outfit, 'id' | 'createdAt'>,
      existingId?: string,
      attachToLookbookId?: string
    ) => {
      const targetId =
        existingId ?? `outfit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      setState((prev) => {
        const exists = prev.outfits.some((o) => o.id === targetId);
        const nextOutfits = exists
          ? prev.outfits.map((o) =>
              o.id === targetId ? { ...o, ...outfitData } : o
            )
          : [
              {
                ...outfitData,
                id: targetId,
                createdAt: new Date().toISOString(),
              },
              ...prev.outfits,
            ];

        const nextLookbooks = attachToLookbookId
          ? prev.lookbooks.map((lb) =>
              lb.id === attachToLookbookId && !lb.outfitIds.includes(targetId)
                ? { ...lb, outfitIds: [targetId, ...lb.outfitIds] }
                : lb
            )
          : prev.lookbooks;

        return {
          ...prev,
          outfits: nextOutfits,
          lookbooks: nextLookbooks,
        };
      });

      return targetId;
    },
    []
  );

  const deleteOutfit = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      outfits: prev.outfits.filter((o) => o.id !== id),
      calendar: Object.fromEntries(
        Object.entries(prev.calendar).map(([date, entry]) => [
          date,
          entry.outfitId === id ? { ...entry, outfitId: undefined } : entry,
        ])
      ),
      lookbooks: prev.lookbooks.map((lb) => ({
        ...lb,
        outfitIds: lb.outfitIds.filter((oid) => oid !== id),
      })),
    }));
  }, []);

  const setCalendarEntry = useCallback((entry: CalendarEntry) => {
    setState((prev) => {
      const hasContent =
        Boolean(entry.outfitId) ||
        entry.extraItemIds.length > 0 ||
        entry.note.trim().length > 0;
      const nextCalendar = { ...prev.calendar };
      if (hasContent) {
        nextCalendar[entry.date] = entry;
      } else {
        delete nextCalendar[entry.date];
      }
      return { ...prev, calendar: nextCalendar };
    });
  }, []);

  const clearCalendarEntry = useCallback((dateKey: string) => {
    setState((prev) => {
      const nextCalendar = { ...prev.calendar };
      delete nextCalendar[dateKey];
      return { ...prev, calendar: nextCalendar };
    });
  }, []);

  const createLookbook = useCallback(
    (data: Pick<Lookbook, 'name' | 'description' | 'type' | 'outfitIds'>) => {
      const created: Lookbook = {
        ...data,
        id: `lb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        packedItemIds: [],
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        lookbooks: [created, ...prev.lookbooks],
      }));
      return created;
    },
    []
  );

  const updateLookbookOutfits = useCallback((lookbookId: string, outfitIds: string[]) => {
    setState((prev) => ({
      ...prev,
      lookbooks: prev.lookbooks.map((lb) =>
        lb.id === lookbookId ? { ...lb, outfitIds } : lb
      ),
    }));
  }, []);

  const togglePackedItem = useCallback((lookbookId: string, itemId: string) => {
    setState((prev) => ({
      ...prev,
      lookbooks: prev.lookbooks.map((lb) => {
        if (lb.id !== lookbookId) return lb;
        const exists = lb.packedItemIds.includes(itemId);
        return {
          ...lb,
          packedItemIds: exists
            ? lb.packedItemIds.filter((id) => id !== itemId)
            : [...lb.packedItemIds, itemId],
        };
      }),
    }));
  }, []);

  const deleteLookbook = useCallback((lookbookId: string) => {
    setState((prev) => ({
      ...prev,
      lookbooks: prev.lookbooks.filter((lb) => lb.id !== lookbookId),
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh: PersistedState = {
      items: SEED_ITEMS,
      outfits: SEED_OUTFITS,
      calendar: SEED_CALENDAR,
      lookbooks: SEED_LOOKBOOKS,
    };
    setState(fresh);
  }, []);

  const exportWardrobeJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `closet-index-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [state]);

  return {
    items: state.items,
    outfits: state.outfits,
    calendar: state.calendar,
    lookbooks: state.lookbooks,
    wearCounts,
    analytics,
    addItem,
    updateItem,
    deleteItem,
    logQuickWearToday,
    saveOutfit,
    deleteOutfit,
    setCalendarEntry,
    clearCalendarEntry,
    createLookbook,
    updateLookbookOutfits,
    togglePackedItem,
    deleteLookbook,
    resetDemoData,
    exportWardrobeJson,
  };
}
