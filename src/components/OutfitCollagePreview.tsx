import { OutfitCanvasItem, WardrobeItem } from '../types/wardrobe';
import { GarmentImage } from './GarmentImage';

interface OutfitCollagePreviewProps {
  placements: OutfitCanvasItem[];
  itemMap: Map<string, WardrobeItem>;
  /** Compact mode for small calendar thumbnails */
  compact?: boolean;
  className?: string;
}

export function OutfitCollagePreview({
  placements,
  itemMap,
  compact = false,
  className = '',
}: OutfitCollagePreviewProps) {
  const sorted = [...placements].sort((a, b) => a.zIndex - b.zIndex);

  if (sorted.length === 0) {
    return (
      <div
        className={`relative w-full h-full bg-[#EFEFED] flex items-center justify-center text-xs text-[#676764] ${className}`}
      >
        Empty look
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full bg-[#F5F5F3] overflow-hidden select-none ${className}`}
    >
      {sorted.map((placement) => {
        const item = itemMap.get(placement.itemId);
        if (!item) return null;
        const baseWidthPercent = compact ? 42 : 34;
        const widthPercent = Math.min(72, Math.max(18, baseWidthPercent * placement.scale));

        return (
          <div
            key={`${placement.itemId}-${placement.zIndex}`}
            className="absolute pointer-events-none"
            style={{
              left: `${placement.x}%`,
              top: `${placement.y}%`,
              width: `${widthPercent}%`,
              aspectRatio: '3 / 4',
              transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
              zIndex: placement.zIndex,
            }}
          >
            <GarmentImage
              src={item.imageUrl}
              alt={`${item.brand} ${item.name}`}
              brand={item.brand}
              colorHex={item.colorHex}
              blendMultiply
              className="w-full h-full object-contain"
            />
          </div>
        );
      })}
    </div>
  );
}
