import { useState } from 'react';
import { Download, Layers, RotateCcw } from 'lucide-react';
import { WardrobeAnalytics, WardrobeItem } from '../types/wardrobe';
import { formatCurrency } from '../utils/wardrobeMath';
import { GarmentImage } from './GarmentImage';

interface AnalyticsViewProps {
  analytics: WardrobeAnalytics;
  onSelectItem: (item: WardrobeItem) => void;
  onStyleUnwornItem: (item: WardrobeItem) => void;
  onExportJson: () => void;
  onResetDemo: () => void;
}

export function AnalyticsView({
  analytics,
  onSelectItem,
  onStyleUnwornItem,
  onExportJson,
  onResetDemo,
}: AnalyticsViewProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <section aria-label="Wardrobe Analytics and Cost Per Wear" className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-editorial text-4xl sm:text-[44px] leading-[1.08] font-medium tracking-tight text-[#141413]">
            Wardrobe Insights
          </h1>
          <p className="mt-2 text-sm text-[#676764]">
            Live utilization, cost-per-wear rankings, and color architecture across your closet
          </p>
        </div>
      </div>

      {/* 4-Column Full-Width KPI Strip */}
      <div
        data-testid="analytics-kpis"
        className="grid grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <div className="p-5 bg-white border border-[#E5E5E1] rounded-xl">
          <p className="text-xs text-[#676764]">Total Wardrobe Value</p>
          <p
            data-testid="kpi-total-value"
            className="mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-medium text-[#141413]"
          >
            {formatCurrency(analytics.totalValue)}
          </p>
          <p className="mt-1 text-xs text-[#676764] font-mono tabular-nums">
            {analytics.totalItems} cataloged pieces
          </p>
        </div>

        <div className="p-5 bg-white border border-[#E5E5E1] rounded-xl">
          <p className="text-xs text-[#676764]">Average Cost / Wear</p>
          <p
            data-testid="kpi-avg-cpw"
            className="mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-medium text-[#7A283B]"
          >
            {analytics.avgCostPerWear === null
              ? '—'
              : formatCurrency(analytics.avgCostPerWear)}
          </p>
          <p className="mt-1 text-xs text-[#676764] font-mono tabular-nums">
            {analytics.totalWears} total wears recorded
          </p>
        </div>

        <div className="p-5 bg-white border border-[#E5E5E1] rounded-xl">
          <p className="text-xs text-[#676764]">Wardrobe Utilization</p>
          <p
            data-testid="kpi-utilization"
            className="mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-medium text-[#141413]"
          >
            {analytics.utilizationRate}%
          </p>
          <p className="mt-1 text-xs text-[#676764] font-mono tabular-nums">
            {analytics.wornItemCount} of {analytics.totalItems} pieces worn
          </p>
        </div>

        <div className="p-5 bg-white border border-[#E5E5E1] rounded-xl">
          <p className="text-xs text-[#676764]">Calendar Days Logged</p>
          <p
            data-testid="kpi-logged-days"
            className="mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-medium text-[#141413]"
          >
            {analytics.loggedDaysCount}
          </p>
          <p className="mt-1 text-xs text-[#676764]">
            Tracked daily looks
          </p>
        </div>
      </div>

      {/* Leaderboards: Most Worn & Lowest Cost-Per-Wear */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-[#E5E5E1] rounded-xl p-6 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-editorial text-2xl font-medium text-[#141413]">
              Most Worn Staples
            </h2>
            <span className="text-xs text-[#676764]">By wear count</span>
          </div>

          {analytics.mostWorn.length === 0 ? (
            <p className="text-xs text-[#676764] py-6">
              Log outfits on your calendar to build your staple rankings.
            </p>
          ) : (
            <ol className="divide-y divide-[#E5E5E1]/70">
              {analytics.mostWorn.map(({ item, wears, cpw }, idx) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="w-full py-3 flex items-center gap-3.5 text-left hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                  >
                    <span className="font-mono tabular-nums text-xs text-[#8E8E8A] w-5">
                      0{idx + 1}
                    </span>
                    <div className="w-10 aspect-[3/4] rounded overflow-hidden bg-[#EFEFED] border border-[#E5E5E1] shrink-0">
                      <GarmentImage
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#141413] truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#676764] truncate">
                        {item.brand} · {item.category}
                      </p>
                    </div>
                    <div className="text-right font-mono tabular-nums shrink-0">
                      <p className="text-sm font-medium text-[#141413]">
                        {wears} wears
                      </p>
                      <p className="text-[11px] text-[#676764]">
                        {cpw === null ? '—' : `${formatCurrency(cpw)}/wear`}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="bg-white border border-[#E5E5E1] rounded-xl p-6 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-editorial text-2xl font-medium text-[#141413]">
              Best Cost-Per-Wear
            </h2>
            <span className="text-xs text-[#676764]">Lowest cost per wear</span>
          </div>

          {analytics.bestValue.length === 0 ? (
            <p className="text-xs text-[#676764] py-6">
              Record wears to reveal your highest-value wardrobe investments.
            </p>
          ) : (
            <ol className="divide-y divide-[#E5E5E1]/70">
              {analytics.bestValue.map(({ item, wears, cpw }, idx) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="w-full py-3 flex items-center gap-3.5 text-left hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                  >
                    <span className="font-mono tabular-nums text-xs text-[#8E8E8A] w-5">
                      0{idx + 1}
                    </span>
                    <div className="w-10 aspect-[3/4] rounded overflow-hidden bg-[#EFEFED] border border-[#E5E5E1] shrink-0">
                      <GarmentImage
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#141413] truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#676764] truncate">
                        {item.brand} · {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="text-right font-mono tabular-nums shrink-0">
                      <p className="text-sm font-medium text-[#7A283B]">
                        {formatCurrency(cpw)}/wear
                      </p>
                      <p className="text-[11px] text-[#676764]">{wears} wears</p>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Category Composition & Color Palette DNA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white border border-[#E5E5E1] rounded-xl p-6 space-y-5">
          <h2 className="font-editorial text-2xl font-medium text-[#141413]">
            Category Composition
          </h2>
          <div className="space-y-3.5">
            {analytics.categoryBreakdown.map((row) => (
              <div key={row.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#141413]">
                    {row.category}
                  </span>
                  <span className="font-mono tabular-nums text-[#676764]">
                    {row.count} {row.count === 1 ? 'piece' : 'pieces'} ·{' '}
                    {formatCurrency(row.value)} ({row.sharePercent}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#EFEFED] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#141413]"
                    style={{ width: `${Math.max(4, row.sharePercent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E5E5E1] rounded-xl p-6 space-y-5">
          <h2 className="font-editorial text-2xl font-medium text-[#141413]">
            Color Palette DNA
          </h2>

          {/* Proportional Color Spectrum Bar */}
          {analytics.colorDNA.length > 0 && (
            <div
              className="h-8 w-full rounded-lg overflow-hidden flex border border-[#E5E5E1]"
              role="img"
              aria-label="Proportional wardrobe color distribution"
            >
              {analytics.colorDNA.map((c) => (
                <div
                  key={c.colorName}
                  title={`${c.colorName} (${c.count})`}
                  style={{
                    width: `${(c.count / Math.max(1, analytics.totalItems)) * 100}%`,
                    backgroundColor: c.colorHex,
                  }}
                />
              ))}
            </div>
          )}

          <ul className="space-y-2.5">
            {analytics.colorDNA.map((c) => (
              <li
                key={c.colorName}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2 text-[#141413] font-medium">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/15"
                    style={{ backgroundColor: c.colorHex }}
                    aria-hidden="true"
                  />
                  {c.colorName}
                </span>
                <span className="font-mono tabular-nums text-[#676764]">
                  {c.count} · {c.sharePercent}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Unworn Pieces Spotlight */}
      {analytics.unwornItems.length > 0 && (
        <div className="bg-white border border-[#E5E5E1] rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 className="font-editorial text-2xl font-medium text-[#141413]">
                Waiting to Be Worn
              </h2>
              <p className="text-xs text-[#676764] mt-0.5">
                {analytics.unwornItems.length}{' '}
                {analytics.unwornItems.length === 1 ? 'piece has' : 'pieces have'} 0 recorded wears
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.unwornItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3.5 p-3 rounded-lg bg-[#FAFAFA] border border-[#E5E5E1]"
              >
                <div className="w-14 aspect-[3/4] rounded overflow-hidden bg-[#EFEFED] shrink-0">
                  <GarmentImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs text-[#676764] truncate">{item.brand}</p>
                  <p className="text-sm font-semibold text-[#141413] truncate">
                    {item.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => onStyleUnwornItem(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A283B] hover:underline cursor-pointer pt-0.5"
                  >
                    <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                    Style in Outfit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiet Data Portability Footer */}
      <div className="pt-6 border-t border-[#E5E5E1] flex flex-wrap items-center justify-between gap-4 text-xs text-[#676764]">
        <p>Your wardrobe archive is saved locally in your browser.</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 font-semibold text-[#141413] bg-white border border-[#E5E5E1] hover:border-[#141413] rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Export JSON
          </button>

          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetDemo();
                  setConfirmReset(false);
                }}
                className="min-h-[38px] px-3 py-1.5 font-semibold text-white bg-[#7A283B] rounded-lg cursor-pointer"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-[38px] px-2 text-[#676764] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 font-medium text-[#676764] hover:text-[#141413] rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset Sample Closet
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
