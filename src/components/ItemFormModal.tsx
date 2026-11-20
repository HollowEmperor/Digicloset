import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Upload, Wand2, X } from 'lucide-react';
import {
  CATEGORIES,
  Category,
  SEASONS,
  Season,
  WardrobeItem,
} from '../types/wardrobe';
import { STUDIO_IMAGE_PRESETS } from '../data/seedWardrobe';
import { processGarmentPhoto } from '../utils/imageProcessor';
import { GarmentImage } from './GarmentImage';

interface ItemFormModalProps {
  isOpen: boolean;
  editingItem: WardrobeItem | null;
  onClose: () => void;
  onSubmit: (data: Omit<WardrobeItem, 'id' | 'createdAt'>, editId?: string) => void;
}

const COLOR_SWATCHES: Array<{ name: string; hex: string }> = [
  { name: 'Black', hex: '#1F1F1E' },
  { name: 'Ivory', hex: '#EDE8DC' },
  { name: 'Camel', hex: '#A67C52' },
  { name: 'Charcoal', hex: '#3F4144' },
  { name: 'Espresso', hex: '#4E3B31' },
  { name: 'Indigo', hex: '#334E70' },
  { name: 'Sky Blue', hex: '#B7CCE0' },
  { name: 'Oxblood', hex: '#5D1F2C' },
  { name: 'Olive', hex: '#555B43' },
];

export function ItemFormModal({
  isOpen,
  editingItem,
  onClose,
  onSubmit,
}: ItemFormModalProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<Category>('Tops');
  const [season, setSeason] = useState<Season>('All-Season');
  const [colorName, setColorName] = useState('Black');
  const [colorHex, setColorHex] = useState('#1F1F1E');
  const [price, setPrice] = useState('');
  const [baseWears, setBaseWears] = useState('0');
  const [size, setSize] = useState('');
  const [location, setLocation] = useState('Main Closet');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState(STUDIO_IMAGE_PRESETS[2].url);
  const [cleanBackdrop, setCleanBackdrop] = useState(true);
  const [processingImage, setProcessingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setName(editingItem.name);
      setBrand(editingItem.brand);
      setCategory(editingItem.category);
      setSeason(editingItem.season);
      setColorName(editingItem.colorName);
      setColorHex(editingItem.colorHex);
      setPrice(String(editingItem.price));
      setBaseWears(String(editingItem.baseWears));
      setSize(editingItem.size);
      setLocation(editingItem.location);
      setNotes(editingItem.notes);
      setImageUrl(editingItem.imageUrl);
    } else {
      setName('');
      setBrand('');
      setCategory('Tops');
      setSeason('All-Season');
      setColorName('Ivory');
      setColorHex('#EDE8DC');
      setPrice('');
      setBaseWears('0');
      setSize('M');
      setLocation('Main Closet');
      setNotes('');
      setImageUrl(STUDIO_IMAGE_PRESETS[2].url);
    }
    setErrors({});
  }, [isOpen, editingItem]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessingImage(true);
    try {
      const processed = await processGarmentPhoto(file, { cleanBackdrop });
      setImageUrl(processed);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.image;
        return next;
      });
    } catch {
      setErrors((prev) => ({
        ...prev,
        image: 'Unable to process this image file. Please choose a JPG or PNG.',
      }));
    } finally {
      setProcessingImage(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (brand.trim().length === 0) {
      nextErrors.brand = 'Brand name is required.';
    }
    if (name.trim().length === 0) {
      nextErrors.name = 'Item name is required.';
    }
    const parsedPrice = Number(price);
    if (price.trim() === '' || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      nextErrors.price = 'Enter a valid price of $0 or more.';
    }
    const parsedWears = Number(baseWears);
    if (!Number.isFinite(parsedWears) || parsedWears < 0) {
      nextErrors.baseWears = 'Wears must be 0 or greater.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(
      {
        name: name.trim(),
        brand: brand.trim(),
        category,
        season,
        colorName: colorName.trim() || 'Neutral',
        colorHex,
        price: Number(parsedPrice.toFixed(2)),
        baseWears: Math.floor(parsedWears),
        size: size.trim(),
        location: location.trim() || 'Main Closet',
        notes: notes.trim(),
        imageUrl,
      },
      editingItem?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#141413]/45 backdrop-blur-[2px] p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-form-heading"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-3xl max-h-[92vh] overflow-y-auto bg-[#FAFAFA] rounded-t-2xl md:rounded-xl border border-[#E5E5E1] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-[#E5E5E1]">
          <h2
            id="item-form-heading"
            className="font-editorial text-2xl font-medium text-[#141413]"
          >
            {editingItem ? 'Edit Garment' : 'Add to Closet'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close garment form"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#676764] hover:text-[#141413] hover:bg-[#EFEFED] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Photo Column */}
            <div className="md:col-span-5 space-y-3">
              <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-[#EFEFED] border border-[#E5E5E1] relative">
                <GarmentImage
                  src={imageUrl}
                  alt={name || 'Garment preview'}
                  brand={brand}
                  colorHex={colorHex}
                  className="w-full h-full object-cover"
                />
                {processingImage && (
                  <div className="absolute inset-0 bg-white/75 flex items-center justify-center text-xs font-medium text-[#141413]">
                    Cleaning studio backdrop...
                  </div>
                )}
              </div>

              <label className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#141413] bg-white border border-[#141413] hover:bg-[#EFEFED] rounded-lg transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                Upload Garment Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>

              <label className="flex items-center gap-2 text-xs text-[#676764] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cleanBackdrop}
                  onChange={(e) => setCleanBackdrop(e.target.checked)}
                  className="rounded border-[#C8C8C4] accent-[#141413]"
                />
                <Wand2 className="w-3.5 h-3.5 text-[#7A283B]" aria-hidden="true" />
                <span>Auto-clean light photo background</span>
              </label>

              {errors.image && (
                <p className="text-xs text-[#7A283B]">{errors.image}</p>
              )}

              <div>
                <p className="text-[11px] font-medium text-[#676764] mb-2">
                  Or choose a studio archive preset
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {STUDIO_IMAGE_PRESETS.map((preset) => {
                    const selected = imageUrl === preset.url;
                    return (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        aria-label={`Use studio preset ${preset.label}`}
                        className={`aspect-[3/4] rounded overflow-hidden border transition-all cursor-pointer ${
                          selected
                            ? 'border-[#141413] ring-1 ring-[#141413]'
                            : 'border-[#E5E5E1] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Form Fields Column */}
            <div className="md:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="garment-brand"
                    className="block text-xs font-medium text-[#141413] mb-1.5"
                  >
                    Brand <span className="text-[#7A283B]">*</span>
                  </label>
                  <input
                    id="garment-brand"
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Totême, The Row, COS"
                    aria-invalid={Boolean(errors.brand)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#E5E5E1] rounded-lg text-[#141413]"
                  />
                  {errors.brand && (
                    <p role="alert" className="mt-1 text-xs text-[#7A283B]">
                      {errors.brand}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="garment-name"
                    className="block text-xs font-medium text-[#141413] mb-1.5"
                  >
                    Item Name <span className="text-[#7A283B]">*</span>
                  </label>
                  <input
                    id="garment-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cashmere Turtleneck"
                    aria-invalid={Boolean(errors.name)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#E5E5E1] rounded-lg text-[#141413]"
                  />
                  {errors.name && (
                    <p role="alert" className="mt-1 text-xs text-[#7A283B]">
                      {errors.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="garment-category"
                    className="block text-xs font-medium text-[#141413] mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="garment-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#E5E5E1] rounded-lg text-[#141413]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="garment-season"
                    className="block text-xs font-medium text-[#141413] mb-1.5"
                  >
                    Season
                  </label>
                  <select
                    id="garment-season"
                    value={season}
                    onChange={(e) => setSeason(e.target.value as Season)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#E5E5E1] rounded-lg text-[#141413]"
                  >
                    {SEASONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="garment-price"
                    className="block text-xs font-medium text-[#141413] mb-1.5"
                  >
                    Price (USD) <span className="text-[#7A283B]">*</span>
                  </label>
                  <input
                    id="garment-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="250"
                    aria-invalid={Boolean(errors.price)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#E5E5E1] rounded-lg text-[#141413]"
                  />
                  {errors.price && (
                    <p role="alert" className="mt-1 text-xs text-[#7A283B]">
                      {errors.price}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="garment-wears"
                    className="block text-xs font-medium text-[#141413] mb-1.5"
                  >
                    Past Wears
                  </label>
                  <input
                    id="garment-wears"
                    type="number"
                    min="0"
                    step="1"
                    value={baseWears}
                    onChange={(e) => setBaseWears(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#E5E5E1] rounded-lg text-[#141413]"
                  />
                  {errors.baseWears && (
                    <p role="alert" className="mt-1 text-xs text-[#7A283B]">
                      {errors.baseWears}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="garment-size"
                    className="block text-xs font-medium text-[#141413] mb-1.5"
                  >
                    Size
                  </label>
                  <input
                    id="garment-size"
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="S, 28, 39"
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#E5E5E1] rounded-lg text-[#141413]"
                  />
                </div>
              </div>

              {/* Color Swatches */}
              <div>
                <span className="block text-xs font-medium text-[#141413] mb-2">
                  Primary Color — <span className="text-[#676764]">{colorName}</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_SWATCHES.map((swatch) => {
                    const selected = colorName === swatch.name;
                    return (
                      <button
                        key={swatch.name}
                        type="button"
                        onClick={() => {
                          setColorName(swatch.name);
                          setColorHex(swatch.hex);
                        }}
                        aria-label={`Select color ${swatch.name}`}
                        aria-pressed={selected}
                        className={`w-8 h-8 rounded-full border transition-transform cursor-pointer ${
                          selected
                            ? 'ring-2 ring-offset-2 ring-[#141413] scale-105'
                            : 'border-black/15 hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="garment-location"
                  className="block text-xs font-medium text-[#141413] mb-1.5"
                >
                  Closet Location
                </label>
                <input
                  id="garment-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Rack, Cedar Drawer, Shoe Shelf"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#E5E5E1] rounded-lg text-[#141413]"
                />
              </div>

              <div>
                <label
                  htmlFor="garment-notes"
                  className="block text-xs font-medium text-[#141413] mb-1.5"
                >
                  Care &amp; Styling Notes
                </label>
                <textarea
                  id="garment-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Fabric details, tailoring notes, or favorite pairings..."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E1] rounded-lg text-[#141413] resize-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E5E1] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-5 py-2 text-xs font-semibold text-[#676764] hover:text-[#141413] rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[42px] px-6 py-2 text-xs font-semibold text-white bg-[#141413] hover:bg-[#2A2A28] rounded-lg transition-colors cursor-pointer"
            >
              {editingItem ? 'Save Changes' : 'Add to Closet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
