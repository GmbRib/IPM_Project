import { format, startOfDay } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import Animated, { SlideInLeft, SlideInRight } from 'react-native-reanimated';

import { PlaneScene } from '@/components/animations/PlaneScene';
import { DestinationField } from '@/components/trips/DestinationField';
import {
  Banner,
  Button,
  Chip,
  ConfirmDialog,
  DateField,
  Header,
  Screen,
  SegmentedControl,
  StepProgress,
  Stepper,
  Text,
} from '@/components/ui';
import { generatePackingList } from '@/domain/packing';
import { suggestEvents } from '@/domain/suggestions';
import { ACTIVITIES } from '@/lib/labels';
import { tripSchema, type TripInput, type TripValues } from '@/lib/validation';
import { zodResolver } from '@/lib/zodResolver';
import { getTripForecast } from '@/services/weather';
import { useData } from '@/stores/data';
import { useSession } from '@/stores/session';
import { useUi } from '@/stores/ui';
import { goBack } from '@/lib/navigation';

const STEPS = 3;
const STEP_FIELDS: (keyof TripInput)[][] = [
  ['destination', 'start', 'end'],
  ['people', 'children', 'purpose'],
  ['activities'],
];

/** /trip/new, or /trip/new?baseTripId=… ("Usar como base para a próxima viagem"). */
export default function NewTripScreen() {
  const { baseTripId } = useLocalSearchParams<{ baseTripId?: string }>();
  const user = useSession((s) => s.user);
  const trips = useData((s) => s.trips);
  const reviews = useData((s) => s.reviews);
  const { addTrip, addPackingItems, addEvents } = useData();
  const selectTrip = useUi((s) => s.selectTrip);

  const base = trips.find((t) => t.id === baseTripId);
  const [step, setStep] = useState(1);
  // 1 = forward, -1 = back: new steps slide in from that side.
  const [direction, setDirection] = useState(1);
  const [confirmExit, setConfirmExit] = useState(false);
  const [creating, setCreating] = useState(false);
  const [failed, setFailed] = useState(false);
  // Resolved by the take-off animation; we leave once both it and the work are done.
  const takeoffDone = useRef<() => void>(undefined);
  const today = startOfDay(new Date());

  const { control, handleSubmit, trigger, formState } = useForm<TripInput, unknown, TripValues>({
    resolver: zodResolver(tripSchema),
    mode: 'onTouched',
    defaultValues: {
      destination: null,
      start: null as unknown as Date,
      end: null as unknown as Date,
      people: base ? base.adults + base.children : 1,
      children: base?.children ?? 0,
      purpose: base?.purpose ?? 'leisure',
      activities: base?.activities ?? [],
    },
  });
  const [start, people] = useWatch({ control, name: ['start', 'people'] });

  async function next() {
    if (await trigger(STEP_FIELDS[step - 1])) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }

  function close() {
    if (formState.isDirty) setConfirmExit(true);
    else goBack();
  }

  async function create(v: TripValues) {
    if (!user || !v.destination) return;
    const tookOff = new Promise<void>((resolve) => (takeoffDone.current = resolve));
    setCreating(true);
    setFailed(false);
    try {
      const trip = await addTrip({
        userId: user.id,
        destination: v.destination,
        startDate: format(v.start, 'yyyy-MM-dd'),
        endDate: format(v.end, 'yyyy-MM-dd'),
        adults: v.people - v.children,
        children: v.children,
        purpose: v.purpose,
        activities: v.activities,
        basedOnTripId: base?.id,
      });
      const forecast = await getTripForecast(trip);
      const items = generatePackingList(
        {
          trip,
          conditions: user.conditions,
          forecast: forecast.status === 'ready' ? forecast.days : undefined,
          baseReview: reviews.find((r) => r.tripId === base?.id),
        },
        trip.id,
      );
      await addPackingItems(items);
      await addEvents(suggestEvents(trip));
      await tookOff;
      selectTrip(trip.id);
      router.dismissTo('/viagens');
    } catch {
      setFailed(true);
      setCreating(false);
    }
  }

  if (creating) {
    return (
      <Screen className="justify-center">
        <PlaneScene mode="takeoff" onDone={() => takeoffDone.current?.()}>
          <Text variant="heading" className="text-center" accessibilityLiveRegion="polite">
            A preparar a tua mala…
          </Text>
          <Text variant="caption" className="text-center">
            Vemos o tempo no destino e juntamos o que vais precisar.
          </Text>
        </PlaneScene>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header leading="close" onLeadingPress={close} title="Nova viagem" />
      <StepProgress step={step} total={STEPS} className="mb-4" />
      {base && (
        <View className="mb-4">
          <Banner
            tone="info"
            message={`Com base na viagem a ${base.destination.name}: aproveitamos o que aprendeste lá.`}
          />
        </View>
      )}

      <Animated.View
        key={step}
        entering={(direction > 0 ? SlideInRight : SlideInLeft).duration(280)}
      >
        {step === 1 && (
          <View className="gap-5">
            <Text variant="heading">Para onde vais?</Text>
            <Controller
              control={control}
              name="destination"
              render={({ field, fieldState }) => (
                <DestinationField
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <View className="flex-row gap-3">
              <Controller
                control={control}
                name="start"
                render={({ field, fieldState }) => (
                  <DateField
                    label="Ida"
                    required
                    value={field.value}
                    minimumDate={today}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    className="flex-1"
                  />
                )}
              />
              <Controller
                control={control}
                name="end"
                render={({ field, fieldState }) => (
                  <DateField
                    label="Regresso"
                    required
                    value={field.value}
                    minimumDate={start ?? today}
                    onChange={(d) => {
                      field.onChange(d);
                      field.onBlur();
                    }}
                    error={fieldState.error?.message}
                    className="flex-1"
                  />
                )}
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View className="gap-5">
            <Text variant="heading">Quantos vão e porquê?</Text>
            <Controller
              control={control}
              name="people"
              render={({ field }) => (
                <Stepper
                  label="Número de pessoas"
                  value={field.value}
                  onChange={field.onChange}
                  min={1}
                  max={20}
                />
              )}
            />
            <Controller
              control={control}
              name="children"
              render={({ field, fieldState }) => (
                <View className="gap-1">
                  <Stepper
                    label="Quantas são crianças?"
                    value={field.value}
                    onChange={field.onChange}
                    min={0}
                    max={Math.max(0, people - 1)}
                  />
                  {fieldState.error && (
                    <Text variant="caption" className="text-danger">
                      {fieldState.error.message}
                    </Text>
                  )}
                </View>
              )}
            />
            <Controller
              control={control}
              name="purpose"
              render={({ field }) => (
                <SegmentedControl
                  label="Motivo"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'leisure', label: 'Lazer' },
                    { value: 'work', label: 'Trabalho' },
                  ]}
                />
              )}
            />
          </View>
        )}

        {step === 3 && (
          <View className="gap-4">
            <Text variant="heading">O que vais fazer?</Text>
            <Text variant="caption">
              Escolhe tudo o que se aplica. Ajuda-nos a sugerir o que levar.
            </Text>
            <Controller
              control={control}
              name="activities"
              render={({ field }) => (
                <View className="flex-row flex-wrap gap-2">
                  {ACTIVITIES.map((a) => {
                    const on = field.value.includes(a.value);
                    return (
                      <Chip
                        key={a.value}
                        label={a.label}
                        selected={on}
                        onPress={() =>
                          field.onChange(
                            on
                              ? field.value.filter((x) => x !== a.value)
                              : [...field.value, a.value],
                          )
                        }
                      />
                    );
                  })}
                </View>
              )}
            />
            {failed && (
              <Banner tone="danger" message="Não foi possível criar a viagem. Tenta outra vez." />
            )}
          </View>
        )}
      </Animated.View>

      <View className="mt-8 gap-2">
        {step < STEPS ? (
          <Button title="Continuar" fullWidth onPress={next} />
        ) : (
          <Button
            title="Criar viagem e gerar mala"
            fullWidth
            onPress={() => handleSubmit(create)()}
          />
        )}
        {step > 1 && (
          <Button
            title="Voltar ao passo anterior"
            variant="ghost"
            onPress={() => {
              setDirection(-1);
              setStep((s) => s - 1);
            }}
          />
        )}
      </View>

      <ConfirmDialog
        open={confirmExit}
        title="Sair sem criar a viagem?"
        message="O que preencheste vai perder-se."
        confirmLabel="Sair"
        cancelLabel="Continuar a preencher"
        destructive
        onConfirm={() => {
          setConfirmExit(false);
          goBack();
        }}
        onCancel={() => setConfirmExit(false)}
      />
    </Screen>
  );
}
