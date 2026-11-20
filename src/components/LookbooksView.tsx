import { FormEvent, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Luggage,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Lookbook, Outfit, WardrobeItem } from '../types/wardrobe';
import { extractPackingChecklist, formatCurrency } from '../utils/wardrobeMath';
import { GarmentImage } from './GarmentImage';
import { OutfitCollagePreview } from './OutfitCollagePreview';

interface LookbooksViewProps {
  items: WardrobeItem[];
  outfits: Outfit[];
  lookbooks: Lookbook[];
  itemMap: Map<string, WardrobeItem>;
  onCreateLookbook: (
    data: Pick<Lookbook, 'name' | 'description' | 'type' | 'outfitIds'>
  ) => Lookbook;
  onUpdateLookbookOutfits: (lookbookId: string, outfitIds: string[]) => void;
  onTogglePackedItem: (lookbookId: string, itemId: string) => void;
  onDeleteLookbook: (lookbookId: string) => void;
}

export function LookbooksView({
  items,
  outfits,
  lookbooks,
  itemMap,
  onCreateLookbook,
  onUpdateLookbookOutfits,
  onTogglePackedItem,
  onDeleteLookbook,
}: LookbooksViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingOutfits, setEditingOutfits] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'lookbook' | 'packing'>('lookbook');
  const [newOutfitIds, setNewOutfitIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  const outfitMap = useMemo(() => {
    const map = new Map<string, Outfit>();
    for (const o of outfits) map.set(o.id, o);
    return map;
  }, [outfits]);

  const activeLookbook = lookbooks.find((lb) => lb.id === selectedId) ?? null;

  const checklist = useMemo(() => {
    if (!activeLookbook) return null;
    return extractPackingChecklist(activeLookbook, outfits, items);
  }, [activeLookbook, outfits, items]);

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newName.trim().length === 0) {
      setFormError('Give your collection a title.');
      return;
    }
    const created = onCreateLookbook({
      name: newName.trim(),
      description: newDesc.trim(),
      type: newType,
      outfitIds: newOutfitIds,
    });
    setIsCreating(false);
    setNewName('');
    setNewDesc('');
    setNewType('lookbook');
    setNewOutfitIds([]);
    setFormError('');
    setSelectedId(created.id);
  };

  const toggleOutfitInActive = (outfitId: string) => {
    if (!activeLookbook) return;
    const exists = activeLookbook.outfitIds.includes(outfitId);
    const nextIds = exists
      ? activeLookbook.outfitIds.filter((id) => id !== outfitId)
      : [...activeLookbook.outfitIds, outfitId];
    onUpdateLookbookOutfits(activeLookbook.id, nextIds);
  };

  if (activeLookbook && checklist) {
    const assignedOutfits = activeLookbook.outfitIds
      .map((id) => outfitMap.get(id))
      .filter(Boolean) as Outfit[];

    return (
      <section aria-label={activeLookbook.name} className="space-y-7">
        {/* Back + Header */}
        <div className="pb-6 border-b border-[#E5E5E1] space-y-4">
          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setEditingOutfits(false);
              setConfirmDelete(false);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#676764] hover:text-[#141413] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            All Lookbooks &amp; Packing Lists
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#7A283B]">
                {activeLookbook.type === 'packing' ? 'Packing List' : 'Curated Lookbook'}
              </p>
              <h1 className="font-editorial text-4xl font-medium text-[#141413] mt-1">
                {activeLookbook.name}
              </h1>
              {activeLookbook.description && (
                <p className="mt-2 text-sm text-[#676764] max-w-2xl">
                  {activeLookbook.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingOutfits((v) => !v)}
                className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#141413] bg-white border border-[#141413] hover:bg-[#EFEFED] rounded-lg transition-colors cursor-pointer"
              >
                {editingOutfits ? 'Done Selecting' : 'Manage Outfits'}
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteLookbook(activeLookbook.id);
                      setSelectedId(null);
                    }}
                    className="min-h-[40px] px-3 py-2 text-xs font-semibold text-white bg-[#7A283B] rounded-lg cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="min-h-[40px] px-2.5 text-xs text-[#676764] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label={`Delete ${activeLookbook.name}`}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#676764] hover:text-[#7A283B] hover:bg-[#7A283B]/10 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inline Outfit Selector */}
        {editingOutfits && (
          <div className="p-5 bg-white border border-[#E5E5E1] rounded-xl space-y-3">
            <h2 className="text-xs font-semibold text-[#141413]">
              Include Outfits in {activeLookbook.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {outfits.map((outfit) => {
                const included = activeLookbook.outfitIds.includes(outfit.id);
                return (
                  <button
                    key={outfit.id}
                    type="button"
                    onClick={() => toggleOutfitInActive(outfit.id)}
                    aria-pressed={included}
                    className={`relative text-left rounded-lg overflow-hidden border transition-all cursor-pointer ${
                      included
                        ? 'border-[#7A283B] ring-1 ring-[#7A283B]'
                        : 'border-[#E5E5E1] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="aspect-[4/5]">
                      <OutfitCollagePreview
                        placements={outfit.items}
                        itemMap={itemMap}
                        compact
                      />
                    </div>
                    {included && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#7A283B] text-white flex items-center justify-center">
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      </span>
                    )}
                    <p className="p-2 text-xs font-medium text-[#141413] truncate bg-white">
                      {outfit.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Outfits Gallery */}
          <div
            className={
              activeLookbook.type === 'packing'
                ? 'lg:col-span-7 space-y-4'
                : 'lg:col-span-12 space-y-4'
            }
          >
            <h2 className="text-sm font-semibold text-[#141413]">
              Included Looks ({assignedOutfits.length})
            </h2>
            {assignedOutfits.length === 0 ? (
              <p className="text-sm text-[#676764] py-10 text-center bg-white border border-dashed border-[#E5E5E1] rounded-xl">
                No outfits added yet. Click &ldquo;Manage Outfits&rdquo; to curate this collection.
              </p>
            ) : (
              <div
                className={`grid gap-6 ${
                  activeLookbook.type === 'packing'
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {assignedOutfits.map((outfit) => (
                  <article key={outfit.id} className="space-y-2.5">
                    <div className="aspect-[4/5] rounded-lg overflow-hidden border border-[#E5E5E1]">
                      <OutfitCollagePreview
                        placements={outfit.items}
                        itemMap={itemMap}
                      />
                    </div>
                    <div>
                      <h3 className="font-editorial text-xl font-medium text-[#141413]">
                        {outfit.name}
                      </h3>
                      <p className="text-xs text-[#676764]">
                        {outfit.occasion} · {outfit.items.length} pieces
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Deduplicated Packing Checklist */}
          {activeLookbook.type === 'packing' && (
            <aside
              aria-label="Packing checklist"
              className="lg:col-span-5 bg-white border border-[#E5E5E1] rounded-xl p-5 space-y-5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-editorial text-2xl font-medium text-[#141413] flex items-center gap-2">
                    <Luggage className="w-5 h-5 text-[#7A283B]" aria-hidden="true" />
                    Packing Checklist
                  </h2>
                  <span
                    data-testid="packing-progress-count"
                    className="font-mono tabular-nums text-xs font-medium text-[#141413]"
                  >
                    {checklist.packedCount} / {checklist.totalCount} packed
                  </span>
                </div>
                <p className="text-xs text-[#676764]">
                  Automatically deduplicated across all {assignedOutfits.length} trip outfits
                </p>
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-[#EFEFED] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7A283B] transition-all duration-200"
                    style={{ width: `${checklist.percentComplete}%` }}
                  />
                </div>
              </div>

              {checklist.items.length === 0 ? (
                <p className="text-xs text-[#676764]">
                  Add outfits to generate your deduplicated suitcase checklist.
                </p>
              ) : (
                <ul className="divide-y divide-[#E5E5E1]/70">
                  {checklist.items.map((item) => {
                    const isPacked = checklist.packedIds.has(item.id);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => onTogglePackedItem(activeLookbook.id, item.id)}
                          aria-pressed={isPacked}
                          aria-label={`${isPacked ? 'Unpack' : 'Pack'} ${item.brand} ${item.name}`}
                          className="w-full py-2.5 flex items-center gap-3 text-left hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                        >
                          <span
                            aria-hidden="true"
                            className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              isPacked
                                ? 'bg-[#141413] border-[#141413] text-white'
                                : 'border-[#C8C8C4] bg-white'
                            }`}
                          >
                            {isPacked && <Check className="w-3 h-3" strokeWidth={3} />}
                          </span>
                          <div className="w-10 aspect-[3/4] rounded overflow-hidden bg-[#EFEFED] border border-[#E5E5E1] shrink-0">
                            <GarmentImage
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium truncate ${
                                isPacked
                                  ? 'line-through text-[#8E8E8A]'
                                  : 'text-[#141413]'
                              }`}
                            >
                              {item.name}
                            </p>
                            <p className="text-xs text-[#676764] truncate">
                              {item.brand} · {item.category}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {checklist.items.length > 0 && (
                <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-between text-xs text-[#676764]">
                  <span>Total suitcase value</span>
                  <span className="font-mono tabular-nums font-medium text-[#141413]">
                    {formatCurrency(
                      checklist.items.reduce((s, item) => s + item.price, 0)
                    )}
                  </span>
                </div>
              )}
            </aside>
          )}
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Lookbooks and Packing Lists" className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-editorial text-4xl sm:text-[44px] leading-[1.08] font-medium tracking-tight text-[#141413]">
            Lookbooks &amp; Packing
          </h1>
          <p className="mt-2 text-sm text-[#676764]">
            Curate seasonal capsules and deduplicated travel packing checklists
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#141413] hover:bg-[#2A2A28] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          New Lookbook
        </button>
      </div>

      {/* Lookbook Cards Grid */}
      <div
        data-testid="lookbooks-grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7"
      >
        {lookbooks.map((lb) => {
          const lbOutfits = lb.outfitIds
            .map((id) => outfitMap.get(id))
            .filter(Boolean) as Outfit[];
          const lbChecklist = extractPackingChecklist(lb, outfits, items);

          return (
            <article key={lb.id} className="group">
              <button
                type="button"
                onClick={() => setSelectedId(lb.id)}
                aria-label={`Open ${lb.name}`}
                className="w-full text-left cursor-pointer"
              >
                {/* 2-Panel Editorial Cover Spread */}
                <div className="grid grid-cols-2 gap-1.5 aspect-[4/3] w-full rounded-lg overflow-hidden border border-[#E5E5E1] bg-[#EFEFED] p-1.5 transition-transform duration-200 group-hover:-translate-y-0.5">
                  {[0, 1].map((idx) => {
                    const outfit = lbOutfits[idx];
                    return (
                      <div
                        key={idx}
                        className="w-full h-full rounded overflow-hidden bg-[#F7F7F5]"
                      >
                        {outfit ? (
                          <OutfitCollagePreview
                            placements={outfit.items}
                            itemMap={itemMap}
                            compact
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[11px] text-[#8E8E8A]">
                            Add look
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#676764]">
                    <span className={lb.type === 'packing' ? 'text-[#7A283B] font-medium' : ''}>
                      {lb.type === 'packing' ? 'Packing List' : 'Lookbook'}
                    </span>
                    <span className="font-mono tabular-nums">
                      {lbOutfits.length} {lbOutfits.length === 1 ? 'look' : 'looks'} ·{' '}
                      {lbChecklist.totalCount} pcs
                    </span>
                  </div>
                  <h2 className="font-editorial text-2xl font-medium text-[#141413] group-hover:text-[#7A283B] transition-colors">
                    {lb.name}
                  </h2>
                  {lb.description && (
                    <p className="text-xs text-[#676764] line-clamp-2 leading-relaxed">
                      {lb.description}
                    </p>
                  )}
                  {lb.type === 'packing' && lbChecklist.totalCount > 0 && (
                    <div className="pt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#676764]">
                        <span>
                          {lbChecklist.packedCount}/{lbChecklist.totalCount} packed
                        </span>
                        <span>{lbChecklist.percentComplete}%</span>
                      </div>
                      <div className="h-1 w-full bg-[#EFEFED] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#7A283B]"
                          style={{ width: `${lbChecklist.percentComplete}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </button>
            </article>
          );
        })}
      </div>

      {/* Create Lookbook Modal */}
      {isCreating && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#141413]/45 backdrop-blur-[2px] p-0 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-lookbook-heading"
          onClick={() => setIsCreating(false)}
        >
          <div
            className="w-full md:max-w-lg max-h-[90vh] overflow-y-auto bg-[#FAFAFA] rounded-t-2xl md:rounded-xl border border-[#E5E5E1] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E1]">
              <h2
                id="create-lookbook-heading"
                className="font-editorial text-2xl font-medium text-[#141413]"
              >
                New Lookbook or Packing List
              </h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                aria-label="Close modal"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#676764] hover:text-[#141413] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#EFEFED] rounded-lg">
                <button
                  type="button"
                  onClick={() => setNewType('lookbook')}
                  className={`min-h-[38px] text-xs font-semibold rounded-md cursor-pointer ${
                    newType === 'lookbook'
                      ? 'bg-white text-[#141413] shadow-xs'
                      : 'text-[#676764]'
                  }`}
                >
                  Lookbook
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('packing')}
                  className={`min-h-[38px] text-xs font-semibold rounded-md cursor-pointer ${
                    newType === 'packing'
                      ? 'bg-white text-[#141413] shadow-xs'
                      : 'text-[#676764]'
                  }`}
                >
                  Packing List
                </button>
              </div>

              <div>
                <label
                  htmlFor="lookbook-name"
                  className="block text-xs font-medium text-[#141413] mb-1.5"
                >
                  Title <span className="text-[#7A283B]">*</span>
                </label>
                <input
                  id="lookbook-name"
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setFormError('');
                  }}
                  placeholder={
                    newType === 'packing'
                      ? 'e.g. Milan 5-Day Carry-On'
                      : 'e.g. Winter Monochrome Edit'
                  }
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#E5E5E1] rounded-lg"
                />
                {formError && (
                  <p role="alert" className="mt-1 text-xs text-[#7A283B]">
                    {formError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lookbook-desc"
                  className="block text-xs font-medium text-[#141413] mb-1.5"
                >
                  Description
                </label>
                <textarea
                  id="lookbook-desc"
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Theme, weather range, or suitcase rules..."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E1] rounded-lg resize-none"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-[#141413] mb-2">
                  Select Outfits ({newOutfitIds.length} chosen)
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {outfits.map((outfit) => {
                    const selected = newOutfitIds.includes(outfit.id);
                    return (
                      <button
                        key={outfit.id}
                        type="button"
                        onClick={() =>
                          setNewOutfitIds((prev) =>
                            selected
                              ? prev.filter((id) => id !== outfit.id)
                              : [...prev, outfit.id]
                          )
                        }
                        aria-pressed={selected}
                        className={`p-2 text-left text-xs rounded-lg border transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#7A283B] bg-[#7A283B]/5 text-[#141413] font-semibold'
                            : 'border-[#E5E5E1] bg-white text-[#676764]'
                        }`}
                      >
                        <p className="truncate">{outfit.name}</p>
                        <p className="text-[11px] font-normal text-[#676764]">
                          {outfit.items.length} pieces
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="min-h-[42px] px-4 text-xs font-semibold text-[#676764] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 text-xs font-semibold text-white bg-[#141413] hover:bg-[#2A2A28] rounded-lg cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
