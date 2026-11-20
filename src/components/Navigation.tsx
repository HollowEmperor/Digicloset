import {
  BarChart3,
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Shirt,
} from 'lucide-react';
import { ActiveTab } from '../types/wardrobe';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAddItem: () => void;
}

const NAV_ITEMS: Array<{
  id: ActiveTab;
  label: string;
  icon: typeof Shirt;
}> = [
  { id: 'closet', label: 'Closet', icon: Shirt },
  { id: 'outfits', label: 'Outfits', icon: Layers },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'lookbooks', label: 'Lookbooks', icon: BookOpen },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export function Navigation({
  activeTab,
  onSelectTab,
  onOpenAddItem,
}: NavigationProps) {
  return (
    <>
      {/* Desktop Top Bar — Strict 3-Zone Contract: Brand — Nav Links — Primary Action */}
      <header className="sticky top-0 z-30 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-[#E5E5E1]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-13 md:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Editorial Wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('closet')}
            className="font-editorial text-2xl md:text-[26px] font-semibold tracking-tight text-[#141413] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Closet Index
          </button>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? 'text-[#141413]'
                      : 'text-[#676764] hover:text-[#141413]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 right-0 -bottom-[13px] h-[2px] bg-[#141413]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={onOpenAddItem}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#141413] hover:bg-[#2A2A28] active:scale-[0.98] rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
              Add Item
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Tab Bar (52px header + 60px bottom bar = 112px < 15% of 844px) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAFAFA]/95 backdrop-blur-md border-t border-[#E5E5E1]"
      >
        <div className="grid grid-cols-5 items-center h-[60px]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center min-h-[44px] w-full transition-colors duration-150 cursor-pointer ${
                  isActive ? 'text-[#7A283B]' : 'text-[#676764]'
                }`}
              >
                <Icon
                  className="w-5 h-5"
                  strokeWidth={isActive ? 2.1 : 1.6}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium mt-1 whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
