import { useEffect, useState } from 'react';
import {
  Check,
  Layers,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Outfit, WardrobeItem } from '../types/wardrobe';
import { calculateCostPerWear, formatCurrency } from '../utils/wardrobeMath';
import { GarmentImage } from './GarmentImage';
import { OutfitCollagePreview } from './OutfitCollagePreview';

interface ItemDetailModalProps {
  item: WardrobeItem | null;
  wearCount: number;
  outfits: Outfit[];
  itemMap: Map<string, WardrobeItem>;
  onClose: () => void;
  onLogWearToday: (itemId: string) => void;
  onStyleInOutfit: (item: WardrobeItem) => void;
  onEdit: (item: WardrobeItem) => void;
  onDelete: (itemId: string) => void;
}

export function ItemDetailModal({
  item,
  wearCount,
  outfits,
  itemMap,
  onClose,
  onLogWearToday,
  onStyleInOutfit,
  onEdit,
  onDelete,
}: ItemDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
    setJustLogged(false);
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const cpw = calculateCostPerWear(item.price, wearCount);
  const relatedOutfits = outfits.filter((o) =>
    o.items.some((placement) => placement.itemId === item.id)
  );

  const handleLogWear = () => {
    onLogWearToday(item.id);
    setJustLogged(true);
    window.setTimeout(() => setJustLogged(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#141413]/45 backdrop-blur-[2px] p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-detail-heading"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-3xl max-h-[92vh] overflow-y-auto bg-[#FAFAFA] rounded-t-2xl md:rounded-xl border border-[#E5E5E1] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Strip */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-[#E5E5E1]">
          <div className="text-xs text-[#676764] flex items-center gap-2">
            <span>{item.category}</span>
            <span aria-hidden="true">·</span>
            <span>{item.season}</span>
            {item.size && (
              <>
                <span aria-hidden="true">·</span>
                <span>Size {item.size}</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close item details"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#676764] hover:text-[#141413] hover:bg-[#EFEFED] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6">
          {/* Studio Image Column */}
          <div className="md:col-span-5">
            <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-[#EFEFED] border border-[#E5E5E1]">
              <GarmentImage
                src={item.imageUrl}
                alt={`${item.brand} ${item.name}`}
                brand={item.brand}
                colorHex={item.colorHex}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Editorial Specs & Actions Column */}
          <div className="md:col-span-7 flex flex-col justify-between gap-6">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium tracking-wide text-[#676764]">
                  {item.brand}
                </p>
                <h2
                  id="item-detail-heading"
                  className="font-editorial text-3xl font-medium text-[#141413] mt-1 leading-tight"
                >
                  {item.name}
                </h2>
              </div>

              {/* 3-Column Metric Row */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y border-[#E5E5E1]">
                <div>
                  <p className="text-xs text-[#676764]">Purchase Price</p>
                  <p className="mt-1 font-mono tabular-nums text-lg font-medium text-[#141413]">
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#676764]">Total Wears</p>
                  <p
                    data-testid="detail-wear-count"
                    className="mt-1 font-mono tabular-nums text-lg font-medium text-[#141413]"
                  >
                    {wearCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#676764]">Cost / Wear</p>
                  <p className="mt-1 font-mono tabular-nums text-lg font-medium text-[#7A283B]">
                    {cpw === null ? 'Unworn' : formatCurrency(cpw)}
                  </p>
                </div>
              </div>

              {/* Primary Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleLogWear}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#141413] hover:bg-[#2A2A28] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  {justLogged ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      Wear Logged
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      Log Wear Today
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStyleInOutfit(item);
                  }}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#141413] bg-white border border-[#141413] hover:bg-[#EFEFED] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Layers className="w-4 h-4" aria-hidden="true" />
                  Style in Outfit
                </button>
              </div>

              {/* Metadata Specification Table */}
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-[#E5E5E1]/70">
                  <dt className="text-[#676764]">Color</dt>
                  <dd className="flex items-center gap-2 font-medium text-[#141413]">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15"
                      style={{ backgroundColor: item.colorHex }}
                      aria-hidden="true"
                    />
                    {item.colorName}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#E5E5E1]/70">
                  <dt className="text-[#676764]">Location</dt>
                  <dd className="font-medium text-[#141413]">
                    {item.location || 'Main Closet'}
                  </dd>
                </div>
                {item.notes && (
                  <div className="pt-1">
                    <dt className="text-[#676764] mb-1">Care &amp; Styling Notes</dt>
                    <dd className="text-[#141413] leading-relaxed">{item.notes}</dd>
                  </div>
                )}
              </dl>

              {/* Styled Outfits Featuring This Garment */}
              {relatedOutfits.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-[#676764] mb-3">
                    Styled in {relatedOutfits.length}{' '}
                    {relatedOutfits.length === 1 ? 'outfit' : 'outfits'}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {relatedOutfits.slice(0, 3).map((outfit) => (
                      <div key={outfit.id} className="space-y-1">
                        <div className="aspect-[3/4] rounded-md overflow-hidden border border-[#E5E5E1]">
                          <OutfitCollagePreview
                            placements={outfit.items}
                            itemMap={itemMap}
                            compact
                          />
                        </div>
                        <p className="text-[11px] font-medium text-[#141413] truncate">
                          {outfit.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Secondary Edit / Delete Controls */}
            <div className="pt-4 border-t border-[#E5E5E1] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 text-xs font-medium text-[#141413] hover:bg-[#EFEFED] rounded-lg transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                Edit Details
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#676764]">Remove piece?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(item.id);
                      onClose();
                    }}
                    className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-white bg-[#7A283B] rounded-lg hover:bg-[#611E2E] cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="min-h-[36px] px-2.5 py-1.5 text-xs font-medium text-[#676764] hover:text-[#141413] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 text-xs font-medium text-[#7A283B] hover:bg-[#7A283B]/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Delete Piece
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
