import { useMemo, useState } from 'react';
import { ActiveTab, ClosetFilterState, WardrobeItem } from './types/wardrobe';
import { useWardrobeStore } from './hooks/useWardrobeStore';
import { Navigation } from './components/Navigation';
import { ClosetView } from './components/ClosetView';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ItemFormModal } from './components/ItemFormModal';
import { OutfitsView } from './components/OutfitsView';
import { CalendarView } from './components/CalendarView';
import { LookbooksView } from './components/LookbooksView';
import { AnalyticsView } from './components/AnalyticsView';

export default function App() {
  const store = useWardrobeStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('closet');
  const [filters, setFilters] = useState<ClosetFilterState>({
    search: '',
    category: 'All',
    season: 'All',
    sort: 'recent',
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [studioSeedItem, setStudioSeedItem] = useState<WardrobeItem | null>(null);
  const [calendarSeedOutfitId, setCalendarSeedOutfitId] = useState<string | null>(
    null
  );

  const itemMap = useMemo(() => {
    const map = new Map<string, WardrobeItem>();
    for (const item of store.items) {
      map.set(item.id, item);
    }
    return map;
  }, [store.items]);

  const selectedItem = selectedItemId ? itemMap.get(selectedItemId) ?? null : null;

  const handleOpenAddItem = () => {
    setEditingItem(null);
    setIsItemFormOpen(true);
  };

  const handleOpenEditItem = (item: WardrobeItem) => {
    setSelectedItemId(null);
    setEditingItem(item);
    setIsItemFormOpen(true);
  };

  const handleSubmitItemForm = (
    data: Omit<WardrobeItem, 'id' | 'createdAt'>,
    editId?: string
  ) => {
    if (editId) {
      store.updateItem(editId, data);
    } else {
      store.addItem(data);
    }
  };

  const handleStyleInOutfit = (item: WardrobeItem) => {
    setStudioSeedItem(item);
    setActiveTab('outfits');
  };

  const handlePlanOutfitOnCalendar = (outfitId: string) => {
    setCalendarSeedOutfitId(outfitId);
    setActiveTab('calendar');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#141413] flex flex-col">
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddItem={handleOpenAddItem}
      />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-24 md:pb-16">
        {activeTab === 'closet' && (
          <ClosetView
            items={store.items}
            wearCounts={store.wearCounts}
            filters={filters}
            onChangeFilters={setFilters}
            onSelectItem={(item) => setSelectedItemId(item.id)}
            onOpenAddItem={handleOpenAddItem}
          />
        )}

        {activeTab === 'outfits' && (
          <OutfitsView
            items={store.items}
            outfits={store.outfits}
            lookbooks={store.lookbooks}
            itemMap={itemMap}
            initialStudioItem={studioSeedItem}
            onClearInitialStudioItem={() => setStudioSeedItem(null)}
            onSaveOutfit={store.saveOutfit}
            onDeleteOutfit={store.deleteOutfit}
            onPlanOutfitOnCalendar={handlePlanOutfitOnCalendar}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            items={store.items}
            outfits={store.outfits}
            calendar={store.calendar}
            itemMap={itemMap}
            preselectedOutfitId={calendarSeedOutfitId}
            onClearPreselectedOutfit={() => setCalendarSeedOutfitId(null)}
            onSaveEntry={store.setCalendarEntry}
            onClearEntry={store.clearCalendarEntry}
          />
        )}

        {activeTab === 'lookbooks' && (
          <LookbooksView
            items={store.items}
            outfits={store.outfits}
            lookbooks={store.lookbooks}
            itemMap={itemMap}
            onCreateLookbook={store.createLookbook}
            onUpdateLookbookOutfits={store.updateLookbookOutfits}
            onTogglePackedItem={store.togglePackedItem}
            onDeleteLookbook={store.deleteLookbook}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            analytics={store.analytics}
            onSelectItem={(item) => setSelectedItemId(item.id)}
            onStyleUnwornItem={handleStyleInOutfit}
            onExportJson={store.exportWardrobeJson}
            onResetDemo={store.resetDemoData}
          />
        )}
      </main>

      <ItemDetailModal
        item={selectedItem}
        wearCount={selectedItem ? store.wearCounts[selectedItem.id] ?? 0 : 0}
        outfits={store.outfits}
        itemMap={itemMap}
        onClose={() => setSelectedItemId(null)}
        onLogWearToday={store.logQuickWearToday}
        onStyleInOutfit={handleStyleInOutfit}
        onEdit={handleOpenEditItem}
        onDelete={store.deleteItem}
      />

      <ItemFormModal
        isOpen={isItemFormOpen}
        editingItem={editingItem}
        onClose={() => setIsItemFormOpen(false)}
        onSubmit={handleSubmitItemForm}
      />
    </div>
  );
}
