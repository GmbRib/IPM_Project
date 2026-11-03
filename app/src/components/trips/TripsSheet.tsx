import { router } from 'expo-router';
import { History, KeyRound, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { BottomSheet, Button, ProgressBar, Text } from '@/components/ui';
import { packingProgress, roleOf, tripStatus } from '@/data/selectors';
import type { ID, PackingItem, Trip } from '@/data/types';
import { ROLE_LABELS } from '@/domain/permissions';
import { rangeLabel } from '@/lib/calendar';
import { cn } from '@/lib/cn';
import { PURPOSES } from '@/lib/labels';
import { useData } from '@/stores/data';
import { useSession } from '@/stores/session';

import { RoleBadge } from './People';

type Props = {
  open: boolean;
  onClose: () => void;
  trips: Trip[];
  packing: PackingItem[];
  selectedId?: ID;
  onSelect: (id: ID) => void;
};

/** "As tuas viagens": switch between upcoming trips, start or join one, or open the history. */
export function TripsSheet({ open, onClose, trips, packing, selectedId, onSelect }: Props) {
  const userId = useSession((s) => s.user?.id);
  const members = useData((s) => s.members);
  const ahead = trips
    .filter((t) => tripStatus(t) !== 'past')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const go = (path: '/trip/new' | '/trip/join' | '/historico') => {
    onClose();
    router.push(path);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="As tuas viagens">
      <View className="gap-2">
        {ahead.length === 0 && <Text className="text-muted">Não tens viagens marcadas.</Text>}
        {ahead.map((t) => {
          const p = packingProgress(packing, t.id, userId);
          const selected = t.id === selectedId;
          // Only worth showing once someone else is on the trip.
          const role =
            members.filter((m) => m.tripId === t.id).length > 1
              ? roleOf(members, t.id, userId)
              : null;
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                onSelect(t.id);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t.destination.name}, ${rangeLabel(t.startDate, t.endDate)}${role ? `, ${ROLE_LABELS[role]}` : ''}, ${p.packed} de ${p.total} itens arrumados na tua mala`}
              className={cn(
                'gap-2 rounded-card border-2 bg-surface p-3 active:opacity-80',
                selected ? 'border-gold' : 'border-line',
              )}
            >
              <View className="flex-row items-center justify-between gap-2">
                <View className="shrink flex-row items-center gap-2">
                  <Text variant="heading" className="shrink text-lg" numberOfLines={1}>
                    {t.destination.name}
                  </Text>
                  {role && <RoleBadge role={role} className="self-center" />}
                </View>
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
        <Button
          title="Entrar com código"
          variant="ghost"
          size="sm"
          icon={KeyRound}
          onPress={() => go('/trip/join')}
        />
      </View>
    </BottomSheet>
  );
}
