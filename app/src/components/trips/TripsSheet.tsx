import { router } from 'expo-router';
import { History, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { BottomSheet, Button, ProgressBar, Text } from '@/components/ui';
import { packingProgress, tripStatus } from '@/data/selectors';
import type { ID, PackingItem, Trip } from '@/data/types';
import { rangeLabel } from '@/lib/calendar';
import { cn } from '@/lib/cn';
import { PURPOSES } from '@/lib/labels';

type Props = {
  open: boolean;
  onClose: () => void;
  trips: Trip[];
  packing: PackingItem[];
  selectedId?: ID;
  onSelect: (id: ID) => void;
};

/** "As tuas viagens": switch between upcoming trips, start a new one, or open the history. */
export function TripsSheet({ open, onClose, trips, packing, selectedId, onSelect }: Props) {
  const ahead = trips
    .filter((t) => tripStatus(t) !== 'past')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const go = (path: '/trip/new' | '/historico') => {
    onClose();
    router.push(path);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="As tuas viagens">
      <View className="gap-2">
        {ahead.length === 0 && <Text className="text-muted">Não tens viagens marcadas.</Text>}
        {ahead.map((t) => {
          const p = packingProgress(packing, t.id);
          const selected = t.id === selectedId;
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                onSelect(t.id);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t.destination.name}, ${rangeLabel(t.startDate, t.endDate)}, ${p.packed} de ${p.total} itens arrumados`}
              className={cn(
                'gap-2 rounded-card border-2 bg-surface p-3 active:opacity-80',
                selected ? 'border-gold' : 'border-line',
              )}
            >
              <View className="flex-row items-baseline justify-between">
                <Text variant="heading" className="text-lg">
                  {t.destination.name}
                </Text>
                <Text variant="caption">
                  {rangeLabel(t.startDate, t.endDate)} · {PURPOSES[t.purpose]}
                </Text>
              </View>
              <ProgressBar value={p.ratio} />
            </Pressable>
          );
        })}
        <View className="mt-2 flex-row gap-2">
          <Button
            title="Nova viagem"
            icon={Plus}
            size="sm"
            className="flex-1"
            onPress={() => go('/trip/new')}
          />
          <Button
            title="Histórico"
            variant="secondary"
            icon={History}
            size="sm"
            className="flex-1"
            onPress={() => go('/historico')}
          />
        </View>
      </View>
    </BottomSheet>
  );
}
