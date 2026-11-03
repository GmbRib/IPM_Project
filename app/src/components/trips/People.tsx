import { router } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { View } from 'react-native';

import { Button, Card, ProgressBar, Text } from '@/components/ui';
import { packingProgress, roleOf, tripMembers } from '@/data/selectors';
import type { Role, Trip } from '@/data/types';
import { can, ROLE_LABELS } from '@/domain/permissions';
import { cn } from '@/lib/cn';
import { useData } from '@/stores/data';
import { useSession } from '@/stores/session';

/** Initials in a circle. The signed-in user's is filled in sun yellow. */
export function Avatar({
  name,
  me = false,
  size = 36,
}: {
  name: string;
  me?: boolean;
  size?: number;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
  return (
    <View
      style={{ width: size, height: size }}
      className={cn(
        'items-center justify-center rounded-full border-2 border-surface',
        me ? 'bg-sun' : 'bg-sun-soft',
      )}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Text
        className="font-body-bold text-ink"
        style={{ fontSize: size * 0.38, lineHeight: size * 0.5 }}
      >
        {initials}
      </Text>
    </View>
  );
}

const ROLE_STYLE: Record<Role, string> = {
  owner: 'bg-sun',
  admin: 'bg-sun-soft',
  member: 'border border-line bg-surface',
};

/** The role as text (not only colour): "Organizador", "Co-organizador", "Participante". */
export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <View className={cn('self-start rounded-full px-2 py-0.5', ROLE_STYLE[role], className)}>
      <Text variant="caption" className="font-body-bold text-ink">
        {ROLE_LABELS[role]}
      </Text>
    </View>
  );
}

/** "Tu, Rui e Pedro" / "Professora Teresa e tu". */
function listNames(names: string[]) {
  const text =
    names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} e ${names.at(-1)}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Quem vai" on the trip dashboard: who's on it, and (organisers) how the group is packing. */
export function PeopleCard({ trip }: { trip: Trip }) {
  const userId = useSession((s) => s.user?.id);
  const allMembers = useData((s) => s.members);
  const people = useData((s) => s.people);
  const packing = useData((s) => s.packing);

  const members = tripMembers(allMembers, trip.id);
  const role = roleOf(allMembers, trip.id, userId);
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name || 'Sem nome';
  const open = () => router.push({ pathname: '/trip/[id]/participantes', params: { id: trip.id } });

  if (members.length <= 1) {
    return (
      // Not pressable itself: it holds a button (a button inside a button breaks on web).
      <Card title="Quem vai">
        <View className="gap-3">
          <Text className="text-muted">
            Só tu, por agora. Convida a família: cada um faz a sua mala e tu acompanhas.
          </Text>
          {can(role, 'trip.invite') && (
            <Button
              title="Convidar"
              icon={UserPlus}
              variant="secondary"
              size="sm"
              className="self-start"
              onPress={open}
            />
          )}
        </View>
      </Card>
    );
  }

  const names = members.map((m) => (m.userId === userId ? 'tu' : nameOf(m.userId)));
  const group = packingProgress(packing, trip.id);
  const seesBags = can(role, 'bags.viewOthers');

  return (
    <Card
      title="Quem vai"
      onPress={open}
      accessibilityLabel={`Quem vai: ${listNames(names)}.${seesBags ? ` Malas do grupo: ${group.packed} de ${group.total} itens arrumados.` : ''} Ver participantes`}
    >
      <View className="gap-3">
        <View className="flex-row items-center">
          {members.slice(0, 5).map((m, i) => (
            <View key={m.id} style={{ marginLeft: i ? -8 : 0, zIndex: 10 - i }}>
              <Avatar name={nameOf(m.userId)} me={m.userId === userId} />
            </View>
          ))}
          <Text className="ml-3 flex-1" numberOfLines={2}>
            {listNames(names)}
          </Text>
        </View>
        {seesBags && (
          <View className="gap-1.5">
            <Text variant="caption">
              Malas do grupo: {group.packed}/{group.total} itens arrumados
            </Text>
            <ProgressBar value={group.ratio} />
          </View>
        )}
        {role && (
          <View className="flex-row items-center gap-2">
            <Text variant="caption">O teu papel:</Text>
            <RoleBadge role={role} />
          </View>
        )}
      </View>
    </Card>
  );
}
