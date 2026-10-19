import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import {
  ChevronDown,
  ChevronRight,
  Luggage,
  PackageCheck,
  ShoppingCart,
} from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { ItemRow } from '@/components/packing/ItemRow';
import { ItemSheet, type ItemDraft } from '@/components/packing/ItemSheet';
import {
  Banner,
  EmptyState,
  Fab,
  Header,
  ProgressBar,
  Screen,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { packingProgress } from '@/data/selectors';
import type { Category, PackingItem } from '@/data/types';
import { rangeLabel } from '@/lib/calendar';
import { CATEGORIES } from '@/lib/labels';
import { useData } from '@/stores/data';
import { useUi } from '@/stores/ui';
import colors from '@/theme/colors';

type Filter = 'all' | 'todo' | 'buy';

export default function MalaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useData((s) => s.trips.find((t) => t.id === id));
  const allItems = useData((s) => s.packing);
  const { addPackingItems, updatePackingItem, removePackingItem } = useData();
  const showToast = useUi((s) => s.showToast);

  const [filter, setFilter] = useState<Filter>('all');
  const [collapsed, setCollapsed] = useState<Set<Category>>(new Set());
  const [sheet, setSheet] = useState<{ open: boolean; item?: PackingItem }>({ open: false });

  if (!trip) {
    return (
      <Screen>
        <Header leading="back" />
        <EmptyState icon={Luggage} title="Esta viagem já não existe" />
      </Screen>
    );
  }

  const items = allItems.filter((i) => i.tripId === trip.id);
  const progress = packingProgress(allItems, trip.id);
  const toBuy = items.filter((i) => i.buyLater).length;
  const shown = items.filter((i) =>
    filter === 'todo' ? !i.packed : filter === 'buy' ? i.buyLater : true,
  );

  function toggle(item: PackingItem) {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    updatePackingItem(item.id, { packed: !item.packed });
  }

  function toggleSection(c: Category) {
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  async function save(draft: ItemDraft) {
    if (sheet.item) await updatePackingItem(sheet.item.id, draft);
    else await addPackingItems([{ ...draft, tripId: trip!.id, packed: false, source: 'manual' }]);
    setSheet({ open: false });
  }

  async function remove(item: PackingItem) {
    setSheet({ open: false });
    const { id: _id, ...rest } = item;
    await removePackingItem(item.id);
    showToast({
      message: `"${item.name}" removido da mala`,
      actionLabel: 'Anular',
      onAction: () => addPackingItems([rest]),
    });
  }

  return (
    <View className="flex-1">
      <Screen scroll>
        <Header
          leading="back"
          title={`Mala · ${trip.destination.name}`}
          subtitle={rangeLabel(trip.startDate, trip.endDate)}
        />

        <View className="mb-4 gap-2">
          <Text variant="label" accessibilityLiveRegion="polite">
            {progress.packed}/{progress.total} itens arrumados
          </Text>
          <ProgressBar value={progress.ratio} accessibilityLabel="Progresso da mala" />
          {progress.total > 0 && progress.packed === progress.total && (
            <Banner tone="success" message="Mala pronta! Boa viagem." />
          )}
        </View>

        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'todo', label: 'Por arrumar' },
            { value: 'buy', label: toBuy ? `Comprar (${toBuy})` : 'Comprar' },
          ]}
          className="mb-4"
        />

        {shown.length === 0 ? (
          filter === 'todo' ? (
            <EmptyState icon={PackageCheck} title="Está tudo arrumado!" />
          ) : filter === 'buy' ? (
            <EmptyState
              icon={ShoppingCart}
              title="Nada para comprar"
              message="Marca “Comprar mais tarde” num item para o veres aqui."
            />
          ) : (
            <EmptyState
              icon={Luggage}
              title="A mala está vazia"
              message="Adiciona o primeiro item com o +."
            />
          )
        ) : (
          CATEGORIES.map((c) => {
            const inCat = shown.filter((i) => i.category === c);
            if (!inCat.length) return null;
            const all = items.filter((i) => i.category === c);
            const packed = all.filter((i) => i.packed).length;
            const isCollapsed = collapsed.has(c);
            return (
              <View key={c} className="mb-3 rounded-card border border-line bg-surface px-4">
                <Pressable
                  onPress={() => toggleSection(c)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: !isCollapsed }}
                  accessibilityLabel={`${c}, ${packed} de ${all.length} arrumados`}
                  className="min-h-12 flex-row items-center gap-2 active:opacity-70"
                >
                  {isCollapsed ? (
                    <ChevronRight size={20} color={colors.ink} />
                  ) : (
                    <ChevronDown size={20} color={colors.ink} />
                  )}
                  <Text variant="heading" className="flex-1 text-lg">
                    {c}
                  </Text>
                  <Text variant="caption" className="font-body-bold">
                    {packed}/{all.length}
                  </Text>
                </Pressable>
                {!isCollapsed &&
                  inCat
                    .sort(
                      (a, b) => Number(a.packed) - Number(b.packed) || a.name.localeCompare(b.name),
                    )
                    .map((item) => (
                      <Animated.View
                        key={item.id}
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(150)}
                        layout={LinearTransition.duration(260)}
                        style={{ borderTopWidth: 1, borderColor: colors.line }}
                      >
                        <ItemRow
                          item={item}
                          onToggle={() => toggle(item)}
                          onEdit={() => setSheet({ open: true, item })}
                        />
                      </Animated.View>
                    ))}
              </View>
            );
          })
        )}
        <View className="h-20" />
      </Screen>
      <Fab accessibilityLabel="Adicionar item" onPress={() => setSheet({ open: true })} />
      <ItemSheet
        open={sheet.open}
        item={sheet.item}
        onClose={() => setSheet({ open: false })}
        onSave={save}
        onDelete={sheet.item ? () => remove(sheet.item!) : undefined}
      />
    </View>
  );
}
