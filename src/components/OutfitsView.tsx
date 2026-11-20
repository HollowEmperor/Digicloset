import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  LayoutGrid,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  X,
} from 'lucide-react';
import {
  CATEGORIES,
  Category,
  Lookbook,
  Outfit,
  OutfitCanvasItem,
  SEASONS,
  Season,
  WardrobeItem,
} from '../types/wardrobe';
import { buildAutoArrangeLayout, formatCurrency } from '../utils/wardrobeMath';
import { GarmentImage } from './GarmentImage';
import { OutfitCollagePreview } from './OutfitCollagePreview';

interface OutfitsViewProps {
  items: WardrobeItem[];
  outfits: Outfit[];
  lookbooks: Lookbook[];
  itemMap: Map<string, WardrobeItem>;
  initialStudioItem: WardrobeItem | null;
  onClearInitialStudioItem: () => void;
  onSaveOutfit: (
    data: Omit<Outfit, 'id' | 'createdAt'>,
    existingId?: string,
    attachToLookbookId?: string
  ) => void;
  onDeleteOutfit: (id: string) => void;
  onPlanOutfitOnCalendar: (outfitId: string) => void;
}

const OCCASIONS = ['Work & Studio', 'Weekend', 'Evening', 'Travel', 'Casual'];

export function OutfitsView({
  items,
  outfits,
  lookbooks,
  itemMap,
  initialStudioItem,
  onClearInitialStudioItem,
  onSaveOutfit,
  onDeleteOutfit,
  onPlanOutfitOnCalendar,
}: OutfitsViewProps) {
  const [mode, setMode] = useState<'gallery' | 'studio'>('gallery');
  const [editingOutfitId, setEditingOutfitId] = useState<string | null>(null);
  const [placements, setPlacements] = useState<OutfitCanvasItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [outfitName, setOutfitName] = useState('');
  const [outfitSeason, setOutfitSeason] = useState<Season>('Autumn');
  const [outfitOccasion, setOutfitOccasion] = useState('Work & Studio');
  const [outfitNotes, setOutfitNotes] = useState('');
  const [targetLookbookId, setTargetLookbookId] = useState('');
  const [trayCategory, setTrayCategory] = useState<Category | 'All'>('All');
  const [studioError, setStudioError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    itemId: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // If user clicked "Style in Outfit" from Closet or Analytics, pre-load studio
  useEffect(() => {
    if (!initialStudioItem) return;
    setEditingOutfitId(null);
    const initialLayout = buildAutoArrangeLayout([initialStudioItem]);
    setPlacements(initialLayout);
    setSelectedItemId(initialStudioItem.id);
    setOutfitName('');
    setOutfitSeason(initialStudioItem.season);
    setOutfitOccasion('Work & Studio');
    setOutfitNotes('');
    setTargetLookbookId('');
    setStudioError('');
    setMode('studio');
    onClearInitialStudioItem();
  }, [initialStudioItem, onClearInitialStudioItem]);

  const startNewOutfit = () => {
    setEditingOutfitId(null);
    setPlacements([]);
    setSelectedItemId(null);
    setOutfitName('');
    setOutfitSeason('Autumn');
    setOutfitOccasion('Work & Studio');
    setOutfitNotes('');
    setTargetLookbookId('');
    setStudioError('');
    setMode('studio');
  };

  const openOutfitInStudio = (outfit: Outfit) => {
    setEditingOutfitId(outfit.id);
    setPlacements(outfit.items.map((p) => ({ ...p })));
    setSelectedItemId(outfit.items[0]?.itemId ?? null);
    setOutfitName(outfit.name);
    setOutfitSeason(outfit.season);
    setOutfitOccasion(outfit.occasion);
    setOutfitNotes(outfit.notes);
    setTargetLookbookId('');
    setStudioError('');
    setMode('studio');
  };

  const toggleItemOnCanvas = (item: WardrobeItem) => {
    setStudioError('');
    setPlacements((prev) => {
      const exists = prev.some((p) => p.itemId === item.id);
      if (exists) {
        if (selectedItemId === item.id) setSelectedItemId(null);
        return prev.filter((p) => p.itemId !== item.id);
      }
      const nextItems = [...prev.map((p) => itemMap.get(p.itemId)).filter(Boolean) as WardrobeItem[], item];
      const suggested = buildAutoArrangeLayout(nextItems);
      const newPlacement = suggested.find((p) => p.itemId === item.id) ?? {
        itemId: item.id,
        x: 50,
        y: 50,
        scale: 0.95,
        rotation: 0,
        zIndex: prev.length + 1,
      };
      const maxZ = prev.reduce((m, p) => Math.max(m, p.zIndex), 0);
      setSelectedItemId(item.id);
      return [...prev, { ...newPlacement, zIndex: maxZ + 1 }];
    });
  };

  const handleAutoArrange = () => {
    const activeItems = placements
      .map((p) => itemMap.get(p.itemId))
      .filter(Boolean) as WardrobeItem[];
    if (activeItems.length === 0) return;
    setPlacements(buildAutoArrangeLayout(activeItems));
  };

  const updateSelectedPlacement = (
    updater: (current: OutfitCanvasItem) => OutfitCanvasItem
  ) => {
    if (!selectedItemId) return;
    setPlacements((prev) =>
      prev.map((p) => (p.itemId === selectedItemId ? updater(p) : p))
    );
  };

  const handleCanvasPointerDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    placement: OutfitCanvasItem
  ) => {
    e.stopPropagation();
    setSelectedItemId(placement.itemId);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      itemId: placement.itemId,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: placement.x,
      origY: placement.y,
    };
  };

  const handleCanvasPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas || drag.pointerId !== e.pointerId) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dxPercent = ((e.clientX - drag.startClientX) / rect.width) * 100;
    const dyPercent = ((e.clientY - drag.startClientY) / rect.height) * 100;
    const nextX = Math.max(10, Math.min(90, drag.origX + dxPercent));
    const nextY = Math.max(10, Math.min(90, drag.origY + dyPercent));

    setPlacements((prev) =>
      prev.map((p) =>
        p.itemId === drag.itemId ? { ...p, x: nextX, y: nextY } : p
      )
    );
  };

  const handleCanvasPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current && dragRef.current.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  };

  const handleSaveStudioOutfit = () => {
    if (placements.length === 0) {
      setStudioError('Add at least one garment from your closet onto the board.');
      return;
    }
    if (outfitName.trim().length === 0) {
      setStudioError('Give your outfit a name before saving.');
      return;
    }

    onSaveOutfit(
      {
        name: outfitName.trim(),
        season: outfitSeason,
        occasion: outfitOccasion,
        items: placements,
        notes: outfitNotes.trim(),
      },
      editingOutfitId ?? undefined,
      targetLookbookId || undefined
    );
    setMode('gallery');
    setEditingOutfitId(null);
  };

  const trayItems = useMemo(() => {
    if (trayCategory === 'All') return items;
    return items.filter((item) => item.category === trayCategory);
  }, [items, trayCategory]);

  const placedIds = useMemo(
    () => new Set(placements.map((p) => p.itemId)),
    [placements]
  );

  const selectedPlacement = placements.find((p) => p.itemId === selectedItemId) ?? null;

  return (
    <section aria-label="Outfits and Styling Studio" className="space-y-7">
      {/* Header + Segmented View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-editorial text-4xl sm:text-[44px] leading-[1.08] font-medium tracking-tight text-[#141413]">
            {mode === 'gallery' ? 'Outfits' : editingOutfitId ? 'Edit Outfit' : 'Outfit Studio'}
          </h1>
          <p className="mt-2 text-sm text-[#676764]">
            {mode === 'gallery'
              ? `${outfits.length} curated ${outfits.length === 1 ? 'look' : 'looks'} composed from your wardrobe`
              : 'Select garments from your closet and drag to compose a layered flat-lay'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            role="tablist"
            aria-label="Outfits workspace mode"
            className="inline-flex items-center p-1 bg-[#EFEFED] rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'gallery'}
              onClick={() => setMode('gallery')}
              className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'gallery'
                  ? 'bg-white text-[#141413] shadow-xs'
                  : 'text-[#676764] hover:text-[#141413]'
              }`}
            >
              Saved Outfits
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'studio'}
              onClick={startNewOutfit}
              className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'studio'
                  ? 'bg-white text-[#141413] shadow-xs'
                  : 'text-[#676764] hover:text-[#141413]'
              }`}
            >
              Create Outfit
            </button>
          </div>
        </div>
      </div>

      {mode === 'gallery' ? (
        outfits.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-[#D8D8D3] rounded-xl bg-white/50">
            <p className="font-editorial text-2xl text-[#141413]">
              No saved outfits yet
            </p>
            <p className="mt-2 text-sm text-[#676764]">
              Layer pieces from your digital closet on the interactive mood board.
            </p>
            <button
              type="button"
              onClick={startNewOutfit}
              className="mt-6 min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#141413] rounded-lg hover:bg-[#2A2A28] cursor-pointer"
            >
              Open Outfit Studio
            </button>
          </div>
        ) : (
          <div
            data-testid="outfits-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-9"
          >
            {outfits.map((outfit) => {
              const outfitValue = outfit.items.reduce(
                (sum, p) => sum + (itemMap.get(p.itemId)?.price ?? 0),
                0
              );
              const isConfirming = confirmDeleteId === outfit.id;

              return (
                <article key={outfit.id} className="group flex flex-col">
                  <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden border border-[#E5E5E1] bg-[#EFEFED]">
                    <OutfitCollagePreview
                      placements={outfit.items}
                      itemMap={itemMap}
                    />
                  </div>

                  <div className="mt-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-editorial text-2xl font-medium text-[#141413] leading-snug truncate">
                        {outfit.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-[#676764] flex flex-wrap items-center gap-1.5">
                        <span>{outfit.occasion}</span>
                        <span aria-hidden="true">·</span>
                        <span>{outfit.season}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {outfit.items.length} pcs
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatCurrency(outfitValue)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {outfit.notes && (
                    <p className="mt-1.5 text-xs text-[#676764] line-clamp-2 leading-relaxed">
                      {outfit.notes}
                    </p>
                  )}

                  {/* Clean Action Row */}
                  <div className="mt-3.5 pt-3 border-t border-[#E5E5E1] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openOutfitInStudio(outfit)}
                        aria-label={`Edit ${outfit.name}`}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#EFEFED] rounded-md transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onPlanOutfitOnCalendar(outfit.id)}
                        aria-label={`Plan ${outfit.name} on Calendar`}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#EFEFED] rounded-md transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        Plan
                      </button>
                    </div>

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteOutfit(outfit.id);
                            setConfirmDeleteId(null);
                          }}
                          className="min-h-[32px] px-2.5 py-1 text-xs font-semibold text-white bg-[#7A283B] rounded cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[32px] px-2 py-1 text-xs text-[#676764] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(outfit.id)}
                        aria-label={`Delete ${outfit.name}`}
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#676764] hover:text-[#7A283B] hover:bg-[#7A283B]/10 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : (
        /* Interactive Drag-and-Drop Outfit Studio */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left / Center Interactive Board */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[#676764]">
                Drag garments directly on the canvas to arrange layers
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoArrange}
                  disabled={placements.length === 0}
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 text-xs font-medium text-[#141413] bg-white border border-[#E5E5E1] hover:border-[#141413] disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
                >
                  <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                  Auto-Arrange
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlacements([]);
                    setSelectedItemId(null);
                  }}
                  disabled={placements.length === 0}
                  className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-[#676764] hover:text-[#7A283B] disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Board
                </button>
              </div>
            </div>

            {/* Drag Canvas */}
            <div
              ref={canvasRef}
              data-testid="outfit-studio-canvas"
              onClick={() => setSelectedItemId(null)}
              className="relative aspect-[4/5] w-full max-w-[440px] mx-auto rounded-xl bg-[#F5F5F3] border border-[#E5E5E1] overflow-hidden touch-none select-none"
            >
              {placements.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <p className="font-editorial text-2xl text-[#141413]">
                    Your styling board is blank
                  </p>
                  <p className="mt-2 text-xs text-[#676764] max-w-xs">
                    Select pieces from your closet tray on the right to layer them here.
                  </p>
                </div>
              ) : (
                [...placements]
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map((placement) => {
                    const item = itemMap.get(placement.itemId);
                    if (!item) return null;
                    const isSelected = selectedItemId === placement.itemId;
                    const widthPercent = Math.min(72, Math.max(18, 34 * placement.scale));

                    return (
                      <div
                        key={placement.itemId}
                        role="button"
                        tabIndex={0}
                        aria-label={`Move ${item.brand} ${item.name} on outfit canvas`}
                        onPointerDown={(e) => handleCanvasPointerDown(e, placement)}
                        onPointerMove={handleCanvasPointerMove}
                        onPointerUp={handleCanvasPointerUp}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemId(placement.itemId);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedItemId(placement.itemId);
                          }
                        }}
                        style={{
                          left: `${placement.x}%`,
                          top: `${placement.y}%`,
                          width: `${widthPercent}%`,
                          aspectRatio: '3 / 4',
                          transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
                          zIndex: placement.zIndex,
                        }}
                        className={`absolute cursor-grab active:cursor-grabbing rounded-md transition-shadow ${
                          isSelected
                            ? 'ring-2 ring-[#7A283B] ring-offset-2 ring-offset-[#EFEFED]'
                            : 'hover:ring-1 hover:ring-[#141413]/30'
                        }`}
                      >
                        <GarmentImage
                          src={item.imageUrl}
                          alt={`${item.brand} ${item.name}`}
                          brand={item.brand}
                          colorHex={item.colorHex}
                          blendMultiply
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      </div>
                    );
                  })
              )}
            </div>

            {/* Selected Piece Transform Controls */}
            {selectedPlacement && itemMap.get(selectedPlacement.itemId) && (
              <div className="max-w-[440px] mx-auto flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-white border border-[#E5E5E1] rounded-lg">
                <span className="text-xs font-semibold text-[#141413] truncate max-w-[180px]">
                  {itemMap.get(selectedPlacement.itemId)?.name}
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    aria-label="Shrink piece"
                    onClick={() =>
                      updateSelectedPlacement((p) => ({
                        ...p,
                        scale: Math.max(0.55, Number((p.scale - 0.1).toFixed(2))),
                      }))
                    }
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md hover:bg-[#EFEFED] text-[#141413] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Enlarge piece"
                    onClick={() =>
                      updateSelectedPlacement((p) => ({
                        ...p,
                        scale: Math.min(1.65, Number((p.scale + 0.1).toFixed(2))),
                      }))
                    }
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md hover:bg-[#EFEFED] text-[#141413] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Rotate left"
                    onClick={() =>
                      updateSelectedPlacement((p) => ({
                        ...p,
                        rotation: Math.max(-45, p.rotation - 10),
                      }))
                    }
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md hover:bg-[#EFEFED] text-[#141413] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Rotate right"
                    onClick={() =>
                      updateSelectedPlacement((p) => ({
                        ...p,
                        rotation: Math.min(45, p.rotation + 10),
                      }))
                    }
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md hover:bg-[#EFEFED] text-[#141413] cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Send layer backward"
                    onClick={() =>
                      updateSelectedPlacement((p) => ({
                        ...p,
                        zIndex: Math.max(1, p.zIndex - 1),
                      }))
                    }
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md hover:bg-[#EFEFED] text-[#141413] cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Bring layer forward"
                    onClick={() =>
                      updateSelectedPlacement((p) => ({
                        ...p,
                        zIndex: p.zIndex + 1,
                      }))
                    }
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md hover:bg-[#EFEFED] text-[#141413] cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove piece from board"
                    onClick={() => {
                      setPlacements((prev) =>
                        prev.filter((p) => p.itemId !== selectedPlacement.itemId)
                      );
                      setSelectedItemId(null);
                    }}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md hover:bg-[#7A283B]/10 text-[#7A283B] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Outfit Details & Closet Piece Picker */}
          <div className="lg:col-span-5 space-y-5">
            {/* Outfit Metadata Form */}
            <div className="p-4 bg-white border border-[#E5E5E1] rounded-xl space-y-3">
              <div>
                <label
                  htmlFor="outfit-title-input"
                  className="block text-xs font-medium text-[#141413] mb-1.5"
                >
                  Outfit Title <span className="text-[#7A283B]">*</span>
                </label>
                <input
                  id="outfit-title-input"
                  type="text"
                  value={outfitName}
                  onChange={(e) => {
                    setOutfitName(e.target.value);
                    setStudioError('');
                  }}
                  placeholder="e.g. Gallery Opening, Rainy Commute"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E5E5E1] rounded-lg text-[#141413]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="outfit-season-select"
                    className="block text-xs font-medium text-[#141413] mb-1.5"
                  >
                    Season
                  </label>
                  <select
                    id="outfit-season-select"
                    value={outfitSeason}
                    onChange={(e) => setOutfitSeason(e.target.value as Season)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E5E5E1] rounded-lg text-[#141413]"
                  >
                    {SEASONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="outfit-occasion-select"
                    className="block text-xs font-medium text-[#141413] mb-1.5"
                  >
                    Occasion
                  </label>
                  <select
                    id="outfit-occasion-select"
                    value={outfitOccasion}
                    onChange={(e) => setOutfitOccasion(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E5E5E1] rounded-lg text-[#141413]"
                  >
                    {OCCASIONS.map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {lookbooks.length > 0 && (
                <div>
                  <label
                    htmlFor="outfit-lookbook-select"
                    className="block text-xs font-medium text-[#141413] mb-1.5"
                  >
                    Add to Lookbook (Optional)
                  </label>
                  <select
                    id="outfit-lookbook-select"
                    value={targetLookbookId}
                    onChange={(e) => setTargetLookbookId(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E5E5E1] rounded-lg text-[#141413]"
                  >
                    <option value="">None</option>
                    {lookbooks.map((lb) => (
                      <option key={lb.id} value={lb.id}>
                        {lb.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label
                  htmlFor="outfit-notes-input"
                  className="block text-xs font-medium text-[#141413] mb-1.5"
                >
                  Styling Notes
                </label>
                <input
                  id="outfit-notes-input"
                  type="text"
                  value={outfitNotes}
                  onChange={(e) => setOutfitNotes(e.target.value)}
                  placeholder="Optional tuck, layering, or weather note..."
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E5E5E1] rounded-lg text-[#141413]"
                />
              </div>

              {studioError && (
                <p role="alert" className="text-xs font-medium text-[#7A283B]">
                  {studioError}
                </p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSaveStudioOutfit}
                  className="flex-1 min-h-[44px] px-5 py-2.5 text-xs font-semibold text-white bg-[#141413] hover:bg-[#2A2A28] rounded-lg transition-colors cursor-pointer"
                >
                  {editingOutfitId ? 'Update Outfit' : 'Save Outfit'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('gallery')}
                  className="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-[#676764] hover:text-[#141413] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Wardrobe Tray */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-[#141413]">
                  Select Garments ({placements.length} on board)
                </h2>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                {(['All', ...CATEGORIES] as Array<Category | 'All'>).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTrayCategory(cat)}
                    className={`min-h-[34px] px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                      trayCategory === cat
                        ? 'bg-[#141413] text-white'
                        : 'bg-[#EFEFED] text-[#676764] hover:text-[#141413]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {trayItems.map((item) => {
                  const isPlaced = placedIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItemOnCanvas(item)}
                      aria-pressed={isPlaced}
                      aria-label={`${isPlaced ? 'Remove' : 'Add'} ${item.brand} ${item.name}`}
                      className={`group relative text-left rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        isPlaced
                          ? 'border-[#7A283B] ring-1 ring-[#7A283B]'
                          : 'border-[#E5E5E1] hover:border-[#141413]'
                      }`}
                    >
                      <div className="aspect-[3/4] bg-[#EFEFED] relative">
                        <GarmentImage
                          src={item.imageUrl}
                          alt={`${item.brand} ${item.name}`}
                          brand={item.brand}
                          colorHex={item.colorHex}
                          className="w-full h-full object-cover"
                        />
                        {isPlaced && (
                          <span
                            aria-hidden="true"
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#7A283B] text-white flex items-center justify-center"
                          >
                            <Check className="w-3 h-3" strokeWidth={2.5} />
                          </span>
                        )}
                      </div>
                      <div className="p-2 bg-white">
                        <p className="text-[11px] font-medium text-[#141413] truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-[#676764] truncate">
                          {item.brand}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
