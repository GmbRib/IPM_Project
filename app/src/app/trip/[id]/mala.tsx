import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronDown,
  ChevronRight,
  Luggage,
  PackageCheck,
  ShoppingCart,
} from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ItemRow } from '@/components/packing/ItemRow';
import { ItemSheet, type ItemDraft } from '@/components/packing/ItemSheet';
import {
  Banner,
  Chip,
  EmptyState,
  Fab,
  Header,
  ProgressBar,
  Screen,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { packingProgress, roleOf, tripMembers } from '@/data/selectors';
import type { Category, PackingItem } from '@/data/types';
import { can, canEditItem, canTogglePacked } from '@/domain/permissions';
import { rangeLabel } from '@/lib/calendar';
import { CATEGORIES } from '@/lib/labels';
import { useData } from '@/stores/data';
import { useSession } from '@/stores/session';
import { useUi } from '@/stores/ui';
import colors from '@/theme/colors';

type Filter = 'all' | 'todo' | 'buy';

/** /trip/[id]/mala: your bag; organisers can open someone else's with ?member=<userId>. */
export default function MalaScreen() {
  const { id, member } = useLocalSearchParams<{ id: string; member?: string }>();
  const trip = useData((s) => s.trips.find((t) => t.id === id));
  const allItems = useData((s) => s.packing);
  const allMembers = useData((s) => s.members);
  const people = useData((s) => s.people);
  const userId = useSession((s) => s.user?.id) ?? '';
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

  const role = roleOf(allMembers, trip.id, userId);
  const members = tripMembers(allMembers, trip.id);
  // Whose bag: yours, unless an organiser picked someone else's (and they're still on the trip).
  const owner =
    member && can(role, 'bags.viewOthers') && members.some((m) => m.userId === member)
      ? member
      : userId;
  const mine = owner === userId;
  const nameOf = (uid: string) =>
    uid === userId ? 'ti' : people.find((p) => p.id === uid)?.name || 'Sem nome';
  const showBag = (uid: string) => router.setParams({ member: uid === userId ? undefined : uid });

  const items = allItems.filter((i) => i.tripId === trip.id && i.memberId === owner);
  const progress = packingProgress(allItems, trip.id, owner);
  const toBuy = items.filter((i) => i.buyLater).length;
  const shown = items.filter((i) =>
    filter === 'todo' ? !i.packed : filter === 'buy' ? i.buyLater : true,
  );

  function toggle(item: PackingItem) {
    if (!canTogglePacked(item, userId)) {
      showToast({ message: `Só ${nameOf(item.memberId)} pode arrumar a sua mala.` });
      return;
    }
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
    try {
      if (sheet.item) await updatePackingItem(sheet.item.id, draft);
      else {
        // In someone else's bag this is a suggestion ("Sugerido por …").
        await addPackingItems([
          { ...draft, tripId: trip!.id, memberId: owner, packed: false, source: 'manual' },
        ]);
      }
      setSheet({ open: false });
    } catch {
      // The store already said what went wrong; the sheet stays open.
    }
  }

  async function remove(item: PackingItem) {
    setSheet({ open: false });
    const { id: _id, ...rest } = item;
    try {
      await removePackingItem(item.id);
    } catch {
      return;
    }
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
          title={mine ? `Mala · ${trip.destination.name}` : `Mala de ${nameOf(owner)}`}
          subtitle={`${mine ? '' : `${trip.destination.name} · `}${rangeLabel(trip.startDate, trip.endDate)}`}
        />

        {/* Organisers switch between the bags of everyone on the trip. */}
        {can(role, 'bags.viewOthers') && members.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-5 mb-4 grow-0"
            contentContainerClassName="gap-2 px-5"
          >
            {members.map((m) => {
              const p = packingProgress(allItems, trip.id, m.userId);
              return (
                <Chip
                  key={m.id}
                  label={`${m.userId === userId ? 'A minha' : nameOf(m.userId)} · ${p.packed}/${p.total}`}
                  selected={m.userId === owner}
                  onPress={() => showBag(m.userId)}
                />
              );
            })}
          </ScrollView>
        )}
        {!mine && (
          <View className="mb-4">
            <Banner
              tone="info"
              message={`Só ${nameOf(owner)} arruma esta mala. Podes sugerir itens com o +; ${nameOf(owner)} vê quem os sugeriu.`}
            />
          </View>
        )}

        <View className="mb-4 gap-2">
          <Text variant="label" accessibilityLiveRegion="polite">
            {progress.packed}/{progress.total} itens arrumados
          </Text>
          <ProgressBar value={progress.ratio} accessibilityLabel="Progresso da mala" />
          {progress.total > 0 && progress.packed === progress.total && (
            <Banner
              tone="success"
              message={
                mine ? 'Mala pronta! Boa viagem.' : `A mala de ${nameOf(owner)} está pronta.`
              }
            />
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
                        style={{ borderTopWidth: 1, borderColor: colors.line }}
                      >
                        <ItemRow
                          item={item}
                          suggestedBy={item.suggestedBy && nameOf(item.suggestedBy)}
                          canToggle={canTogglePacked(item, userId)}
                          onToggle={() => toggle(item)}
                          onEdit={
                            canEditItem(item, userId, role)
                              ? () => setSheet({ open: true, item })
                              : undefined
                          }
                        />
                      </Animated.View>
                    ))}
              </View>
            );
          })
        )}
        <View className="h-20" />
      </Screen>
      {(mine || can(role, 'bags.suggest')) && (
        <Fab
          label={mine ? 'Item' : 'Sugerir'}
          accessibilityLabel={mine ? 'Adicionar item' : `Sugerir um item a ${nameOf(owner)}`}
          onPress={() => setSheet({ open: true })}
        />
      )}
      <ItemSheet
        open={sheet.open}
        item={sheet.item}
        onClose={() => setSheet({ open: false })}
        onSave={save}
        onDelete={sheet.item ? () => remove(sheet.item!) : undefined}
        title={!sheet.item && !mine ? `Sugerir a ${nameOf(owner)}` : undefined}
      />
    </View>
  );
}
