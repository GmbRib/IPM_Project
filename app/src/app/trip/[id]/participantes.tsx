import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { Ellipsis, LogOut, RefreshCw, Share2, UserPlus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';

import { Avatar, RoleBadge } from '@/components/trips/People';
import { Button, Card, EmptyState, Header, Screen, Text } from '@/components/ui';
import { packingProgress, roleOf, tripMembers } from '@/data/selectors';
import type { TripMember } from '@/data/types';
import { can, ROLE_LABELS } from '@/domain/permissions';
import { rangeLabel } from '@/lib/calendar';
import { cn } from '@/lib/cn';
import { confirm, showActions, type Action } from '@/lib/dialogs';
import { useData } from '@/stores/data';
import { useSession } from '@/stores/session';
import { useUi } from '@/stores/ui';
import colors from '@/theme/colors';

const ROLE_HELP = [
  { role: 'owner', text: 'gere a viagem, quem vai e o papel de cada um.' },
  { role: 'admin', text: 'vê as malas de todos, sugere itens e gere a agenda.' },
  { role: 'member', text: 'faz a sua mala e vê a agenda da viagem.' },
] as const;

/** /trip/[id]/participantes: who is going, the invite code, and (organiser) the roles. */
export default function ParticipantesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useData((s) => s.trips.find((t) => t.id === id));
  const user = useSession((s) => s.user);
  const allMembers = useData((s) => s.members);
  const people = useData((s) => s.people);
  const packing = useData((s) => s.packing);
  const invites = useData((s) => s.invites);
  const { createInvite, setRole, removeMember, transferTrip, leaveTrip } = useData();
  const showToast = useUi((s) => s.showToast);
  const selectTrip = useUi((s) => s.selectTrip);
  const [busy, setBusy] = useState(false);

  if (!trip || !user) {
    return (
      <Screen>
        <Header leading="back" />
        <EmptyState icon={Users} title="Esta viagem já não existe" />
      </Screen>
    );
  }

  const members = tripMembers(allMembers, trip.id);
  const role = roleOf(allMembers, trip.id, user.id);
  const invite = invites.find((i) => i.tripId === trip.id);
  const nameOf = (userId: string) => people.find((p) => p.id === userId)?.name || 'Sem nome';
  const place = trip.destination.name;

  /** Runs a change; the store already tells the user when it fails. */
  async function run(change: () => Promise<unknown>, done?: string) {
    setBusy(true);
    try {
      await change();
      if (done) showToast({ message: done });
    } catch {
      // Shown by the store.
    } finally {
      setBusy(false);
    }
  }

  async function shareCode(code: string) {
    const message = `Vem fazer a mala para ${place} comigo no Pack&Sun! Abre a app, toca em "Entrar com código" e escreve ${code}.`;
    try {
      await Share.share({ message });
    } catch {
      // No share sheet (some browsers): the code is on screen anyway.
      showToast({ message: `Código da viagem: ${code}` });
    }
  }

  async function renewCode() {
    const ok = await confirm({
      title: 'Gerar um código novo?',
      message: 'O código atual deixa de funcionar. Quem já entrou continua na viagem.',
      confirmLabel: 'Gerar novo',
      cancelLabel: 'Cancelar',
    });
    if (ok) await run(() => createInvite(trip!.id, true), 'Novo código criado');
  }

  async function promote(m: TripMember) {
    const name = nameOf(m.userId);
    const ok = await confirm({
      title: `Tornar ${name} co-organizador?`,
      message: 'Passa a ver as malas de todos, a sugerir itens e a gerir a agenda da viagem.',
      confirmLabel: 'Tornar co-organizador',
      cancelLabel: 'Cancelar',
    });
    if (ok) await run(() => setRole(trip!.id, m.userId, 'admin'), `${name} é agora co-organizador`);
  }

  async function transfer(m: TripMember) {
    const name = nameOf(m.userId);
    const ok = await confirm({
      title: `Passar a organização a ${name}?`,
      message: `${name} fica com a viagem; tu passas a co-organizador. Só ${name} a pode devolver.`,
      confirmLabel: 'Passar organização',
      cancelLabel: 'Cancelar',
    });
    if (ok) await run(() => transferTrip(trip!.id, m.userId), `${name} é agora o organizador`);
  }

  async function remove(m: TripMember) {
    const name = nameOf(m.userId);
    const ok = await confirm({
      title: `Remover ${name} da viagem?`,
      message: `A mala de ${name} nesta viagem é apagada.`,
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      destructive: true,
    });
    if (ok) await run(() => removeMember(trip!.id, m.userId), `${name} saiu da viagem`);
  }

  async function leave() {
    const ok = await confirm({
      title: `Sair da viagem a ${place}?`,
      message: 'A tua mala desta viagem é apagada. Para voltares precisas de um código novo.',
      confirmLabel: 'Sair',
      cancelLabel: 'Ficar',
      destructive: true,
    });
    if (!ok) return;
    await run(async () => {
      await leaveTrip(trip!.id);
      selectTrip(null);
      router.dismissTo('/viagens');
    }, `Saíste da viagem a ${place}`);
  }

  function actionsFor(m: TripMember): Action[] {
    if (m.userId === user!.id) return [];
    const actions: Action[] = [];
    if (can(role, 'bags.viewOthers')) {
      actions.push({
        label: 'Ver mala',
        onPress: () =>
          router.push({
            pathname: '/trip/[id]/mala',
            params: { id: trip!.id, member: m.userId },
          }),
      });
    }
    if (can(role, 'members.manage')) {
      actions.push(
        m.role === 'admin'
          ? {
              label: 'Tornar participante',
              onPress: () =>
                run(
                  () => setRole(trip!.id, m.userId, 'member'),
                  `${nameOf(m.userId)} é agora participante`,
                ),
            }
          : { label: 'Tornar co-organizador', onPress: () => promote(m) },
        { label: 'Passar a organização', onPress: () => transfer(m) },
        { label: 'Remover da viagem', destructive: true, onPress: () => remove(m) },
      );
    }
    return actions;
  }

  return (
    <Screen scroll>
      <Header
        leading="back"
        title="Quem vai"
        subtitle={`${place} · ${rangeLabel(trip.startDate, trip.endDate)}`}
      />

      <View className="gap-4">
        {can(role, 'trip.invite') && (
          <Card title="Convidar">
            {invite ? (
              <View className="gap-3">
                <Text className="text-muted">
                  Quem tiver a app toca em “Entrar com código” e escreve:
                </Text>
                <View className="items-center gap-1 rounded-2xl border-2 border-dashed border-gold bg-sun-soft py-3">
                  <Text
                    variant="title"
                    selectable
                    style={{ letterSpacing: 6 }}
                    accessibilityLabel={`Código: ${invite.code.split('').join(' ')}`}
                  >
                    {invite.code}
                  </Text>
                  <Text variant="caption">
                    Válido até {format(parseISO(invite.expiresAt), "d 'de' MMMM", { locale: pt })}
                  </Text>
                </View>
                <Button
                  title="Partilhar código"
                  icon={Share2}
                  fullWidth
                  onPress={() => shareCode(invite.code)}
                />
                <Button
                  title="Gerar novo código"
                  variant="ghost"
                  size="sm"
                  icon={RefreshCw}
                  disabled={busy}
                  onPress={renewCode}
                />
              </View>
            ) : (
              <View className="gap-3">
                <Text className="text-muted">
                  Cria um código e envia-o a quem vai contigo. Cada pessoa faz a sua mala.
                </Text>
                <Button
                  title="Criar código de convite"
                  icon={UserPlus}
                  fullWidth
                  loading={busy}
                  onPress={() => run(() => createInvite(trip.id))}
                />
              </View>
            )}
          </Card>
        )}

        <Card title={`Participantes (${members.length})`}>
          {members.map((m, i) => {
            const me = m.userId === user.id;
            const name = nameOf(m.userId);
            const email = people.find((p) => p.id === m.userId)?.email;
            const actions = actionsFor(m);
            const bag = packingProgress(packing, trip.id, m.userId);
            const detail =
              me || can(role, 'bags.viewOthers')
                ? `Mala: ${bag.packed}/${bag.total} arrumados`
                : email;
            return (
              <Pressable
                key={m.id}
                disabled={actions.length === 0}
                onPress={() => showActions(name, actions)}
                accessibilityRole={actions.length ? 'button' : undefined}
                accessibilityLabel={`${me ? 'Tu' : name}, ${ROLE_LABELS[m.role]}${detail ? `, ${detail}` : ''}`}
                accessibilityHint={actions.length ? 'Mostra o que podes fazer' : undefined}
                className={cn(
                  'min-h-16 flex-row items-center gap-3 py-2',
                  i > 0 && 'border-t border-line',
                  actions.length > 0 && 'active:opacity-70',
                )}
              >
                <Avatar name={name} me={me} />
                <View className="flex-1 gap-0.5">
                  <Text variant="label" numberOfLines={1}>
                    {name}
                    {me ? ' (tu)' : ''}
                  </Text>
                  {!!detail && (
                    <Text variant="caption" numberOfLines={1}>
                      {detail}
                    </Text>
                  )}
                </View>
                <RoleBadge role={m.role} className="self-center" />
                {actions.length > 0 && <Ellipsis size={18} color={colors.muted} />}
              </Pressable>
            );
          })}
        </Card>

        <View className="gap-1.5 px-1">
          <Text variant="label">O que cada um pode fazer</Text>
          {ROLE_HELP.map((h) => (
            <Text key={h.role} variant="caption">
              <Text variant="caption" className="font-body-bold text-ink">
                {ROLE_LABELS[h.role]}:
              </Text>{' '}
              {h.text}
            </Text>
          ))}
        </View>

        {role === 'owner' ? (
          members.length > 1 && (
            <Text variant="caption" className="px-1">
              Para saíres da viagem, passa primeiro a organização a outra pessoa.
            </Text>
          )
        ) : (
          <Button
            title="Sair da viagem"
            variant="ghost"
            icon={LogOut}
            disabled={busy}
            onPress={leave}
          />
        )}
      </View>
    </Screen>
  );
}
