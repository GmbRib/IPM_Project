import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Plane, Users } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Banner, Button, Card, Header, Screen, Text, TextField } from '@/components/ui';
import { ApiError, rpc } from '@/data/api';
import { generatePackingList } from '@/domain/packing';
import { rangeLabel } from '@/lib/calendar';
import { PURPOSES } from '@/lib/labels';
import { goBack } from '@/lib/navigation';
import type { ActionOutput } from '@/server/actions';
import { getTripForecast } from '@/services/weather';
import { useData } from '@/stores/data';
import { useSession } from '@/stores/session';
import { useUi } from '@/stores/ui';
import colors from '@/theme/colors';

type Preview = ActionOutput<'invites.preview'>;

const CODE_LENGTH = 6;

/** /trip/join (or /trip/join?code=GENEVA): join a trip someone shared with you. */
export default function JoinTripScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const user = useSession((s) => s.user);
  const joinTrip = useData((s) => s.joinTrip);
  const selectTrip = useUi((s) => s.selectTrip);
  const showToast = useUi((s) => s.showToast);

  const [code, setCode] = useState((params.code ?? '').toUpperCase());
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function look() {
    setBusy(true);
    setError(undefined);
    try {
      setPreview(await rpc('invites.preview', { code }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível ver este código.');
    } finally {
      setBusy(false);
    }
  }

  function open(tripId: string) {
    selectTrip(tripId);
    router.dismissTo('/viagens');
  }

  async function join() {
    if (!preview || !user) return;
    setBusy(true);
    try {
      // Your own bag, for you alone and your needs; the trip's weather if it's close.
      const trip = { ...preview.trip, adults: 1, children: 0 };
      const forecast = await getTripForecast(trip);
      const items = generatePackingList(
        {
          trip,
          conditions: user.conditions,
          forecast: forecast.status === 'ready' ? forecast.days : undefined,
        },
        // The server puts the items in the right trip and bag.
        { tripId: preview.tripId, memberId: user.id },
      );
      const tripId = await joinTrip(code, items);
      showToast({
        message: `Entraste na viagem a ${preview.trip.destination.name}. A tua mala está pronta!`,
      });
      open(tripId);
    } catch {
      // The store already said what went wrong.
      setBusy(false);
    }
  }

  return (
    <Screen scroll>
      <Header leading="close" title="Entrar numa viagem" />

      {!preview ? (
        <View className="mt-2 gap-4">
          <Text className="text-muted">
            Pede o código a quem organiza a viagem. Tem {CODE_LENGTH} letras e números.
          </Text>
          <TextField
            label="Código da viagem"
            value={code}
            onChangeText={(t) => {
              setCode(t.replace(/[^a-z0-9]/gi, '').toUpperCase());
              setError(undefined);
            }}
            placeholder="Ex.: GENEVA"
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            maxLength={CODE_LENGTH}
            returnKeyType="go"
            onSubmitEditing={() => code.length === CODE_LENGTH && look()}
            error={error}
            autoFocus={!params.code}
            style={{ letterSpacing: 4 }}
          />
          <Button
            title="Continuar"
            fullWidth
            loading={busy}
            disabled={code.length !== CODE_LENGTH}
            onPress={look}
          />
        </View>
      ) : (
        <View className="mt-2 gap-4">
          <Card>
            <View className="gap-3">
              <Text variant="title">{preview.trip.destination.name}</Text>
              <Row icon={CalendarDays}>
                {rangeLabel(preview.trip.startDate, preview.trip.endDate)} ·{' '}
                {PURPOSES[preview.trip.purpose]}
              </Row>
              {!!preview.organizer && <Row icon={Plane}>Organizada por {preview.organizer}</Row>}
              <Row icon={Users}>
                {preview.memberCount === 1
                  ? 'Ainda só vai quem organiza'
                  : `Já vão ${preview.memberCount} pessoas`}
              </Row>
            </View>
          </Card>

          {preview.alreadyMember ? (
            <>
              <Banner tone="success" message="Já estás nesta viagem." />
              <Button title="Abrir a viagem" fullWidth onPress={() => open(preview.tripId)} />
            </>
          ) : (
            <>
              <Banner
                tone="info"
                message="Ao entrar, quem organiza a viagem vê o teu nome, o teu email e a tua mala, e pode sugerir-te itens. Os teus documentos continuam só teus."
              />
              <Button
                title="Entrar e preparar a minha mala"
                fullWidth
                loading={busy}
                onPress={join}
              />
            </>
          )}
          <Button
            title="Usar outro código"
            variant="ghost"
            disabled={busy}
            onPress={() => {
              setPreview(null);
              setCode('');
            }}
          />
        </View>
      )}

      {!preview && (
        <Button title="Cancelar" variant="ghost" className="mt-2" onPress={() => goBack()} />
      )}
    </Screen>
  );
}

function Row({ icon: Icon, children }: { icon: typeof Plane; children: ReactNode }) {
  return (
    <View className="flex-row items-center gap-3">
      <Icon size={20} color={colors.ember} />
      <Text className="flex-1">{children}</Text>
    </View>
  );
}
