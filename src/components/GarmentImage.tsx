import { useState } from 'react';
import { Shirt } from 'lucide-react';

interface GarmentImageProps {
  src: string;
  alt: string;
  brand?: string;
  colorHex?: string;
  className?: string;
  /** Enables studio flat-lay multiply compositing on outfit boards */
  blendMultiply?: boolean;
  draggable?: boolean;
}

export function GarmentImage({
  src,
  alt,
  brand,
  colorHex = '#D4D4D0',
  className = '',
  blendMultiply = false,
  draggable = false,
}: GarmentImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#EFEFED] text-[#676764] select-none p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-2 border border-[#E5E5E1]"
          style={{ backgroundColor: `${colorHex}22` }}
        >
          <Shirt className="w-5 h-5 text-[#141413]/70" strokeWidth={1.5} />
        </div>
        {brand && (
          <span className="text-[11px] font-medium tracking-wide text-[#676764] truncate max-w-full">
            {brand}
          </span>
        )}
        <span className="text-xs font-medium text-[#141413] line-clamp-2 mt-0.5">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      draggable={draggable}
      onError={() => setFailed(true)}
      className={`${className} ${
        blendMultiply ? 'mix-blend-multiply brightness-[1.11] contrast-[1.06]' : ''
      }`}
    />
  );
}
