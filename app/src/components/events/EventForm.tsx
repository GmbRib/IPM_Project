import { addHours, format, parse, parseISO, setHours, startOfHour } from 'date-fns';
import { Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { FormTextField } from '@/components/form/FormFields';
import { Banner, Button, Chip, ConfirmDialog, DateField, Text, Toggle } from '@/components/ui';
import type { ISODate, TripEvent } from '@/data/types';
import { overlapping, rangeLabel, toISODate, tripsOn } from '@/lib/calendar';
import { eventSchema, type EventValues } from '@/lib/validation';
import { zodResolver } from '@/lib/zodResolver';
import { useData } from '@/stores/data';
import { useSession } from '@/stores/session';
import { useUi } from '@/stores/ui';
import { goBack } from '@/lib/navigation';

type Props = {
  /** Editing an existing event… */
  event?: TripEvent;
  /** …or creating one, optionally prefilled from where the user tapped. */
  initial?: { date?: ISODate; time?: string; tripId?: string };
};

const timeOn = (day: Date, hhmm: string) => parse(hhmm, 'HH:mm', day);

function defaultStart(day: Date, time?: string) {
  if (time) return timeOn(day, time);
  const now = new Date();
  // Today: the next full hour. Other days: 09:00.
  return toISODate(day) === toISODate(now) && now.getHours() < 23
    ? startOfHour(addHours(now, 1))
    : setHours(startOfHour(day), 9);
}

export function EventForm({ event, initial }: Props) {
  const userId = useSession((s) => s.user?.id);
  const trips = useData((s) => s.trips);
  const events = useData((s) => s.events);
  const { addEvent, updateEvent, removeEvent } = useData();
  const showToast = useUi((s) => s.showToast);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const day = parseISO(event?.date ?? initial?.date ?? toISODate(new Date()));
  const { control, handleSubmit, setValue, formState } = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    mode: 'onTouched',
    defaultValues: {
      title: event?.title ?? '',
      date: day,
      start: event ? timeOn(day, event.startTime) : defaultStart(day, initial?.time),
      end: event?.endTime ? timeOn(day, event.endTime) : null,
      location: event?.location ?? '',
      tripId: event?.tripId ?? initial?.tripId ?? tripsOn(trips, toISODate(day))[0]?.id ?? null,
      notes: event?.notes ?? '',
    },
  });

  const [date, start, end, tripId] = useWatch({
    control,
    name: ['date', 'start', 'end', 'tripId'],
  });
  const isoDate = date ? toISODate(date) : null;
  const dayTrips = isoDate ? tripsOn(trips, isoDate) : [];

  // Moving the event to another day: keep the trip only if it still covers that day.
  useEffect(() => {
    if (!isoDate) return;
    const covering = tripsOn(trips, isoDate);
    if (tripId && !covering.some((t) => t.id === tripId)) {
      setValue('tripId', covering[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isoDate]);

  const clashes =
    isoDate && start
      ? overlapping(events, {
          id: event?.id,
          date: isoDate,
          startTime: format(start, 'HH:mm'),
          endTime: end ? format(end, 'HH:mm') : undefined,
        })
      : [];

  async function save(v: EventValues) {
    if (!userId) return;
    const data = {
      title: v.title,
      date: toISODate(v.date),
      startTime: format(v.start, 'HH:mm'),
      endTime: v.end ? format(v.end, 'HH:mm') : undefined,
      location: v.location || undefined,
      notes: v.notes || undefined,
      tripId: v.tripId ?? undefined,
      // Editing a suggestion means the user wants it.
      status: 'accepted' as const,
    };
    if (event) await updateEvent(event.id, data);
    else await addEvent({ ...data, userId, kind: 'user' });
    goBack();
  }

  async function remove() {
    if (!event) return;
    setConfirmDelete(false);
    const { id: _id, ...rest } = event;
    await removeEvent(event.id);
    goBack();
    showToast({
      message: `"${event.title}" eliminado`,
      actionLabel: 'Anular',
      onAction: () => addEvent(rest),
    });
  }

  return (
    <View className="gap-5">
      <FormTextField
        control={control}
        name="title"
        label="Título"
        required
        placeholder="Ex.: Jantar com amigos"
        autoCapitalize="sentences"
      />

      <Controller
        control={control}
        name="date"
        render={({ field, fieldState }) => (
          <DateField
            label="Dia"
            required
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
              label="Começa"
              required
              mode="time"
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              className="flex-1"
            />
          )}
        />
        {end && (
          <Controller
            control={control}
            name="end"
            render={({ field, fieldState }) => (
              <DateField
                label="Acaba"
                mode="time"
                value={field.value}
                onChange={(d) => {
                  field.onChange(d);
                  field.onBlur();
                }}
                error={fieldState.error?.message}
                className="flex-1"
              />
            )}
          />
        )}
      </View>
      <Toggle
        label="Definir hora de fim"
        description={end ? undefined : 'Sem hora de fim, conta como 1 hora.'}
        value={!!end}
        onValueChange={(on) =>
          setValue('end', on && start ? addHours(start, 1) : null, { shouldValidate: true })
        }
        className="-mt-3"
      />

      {clashes.length > 0 && (
        <Banner
          tone="info"
          message={`Sobrepõe-se a ${clashes
            .map((c) => `"${c.title}" (${c.endTime ? `${c.startTime}–${c.endTime}` : c.startTime})`)
            .join(', ')}. Podes guardar na mesma.`}
        />
      )}

      <FormTextField control={control} name="location" label="Local" placeholder="Ex.: Casa Cusi" />

      {dayTrips.length > 0 && (
        <Controller
          control={control}
          name="tripId"
          render={({ field }) => (
            <View className="gap-2">
              <Text variant="label">Faz parte da viagem</Text>
              <View className="flex-row flex-wrap gap-2">
                {dayTrips.map((t) => (
                  <Chip
                    key={t.id}
                    label={`${t.destination.name} · ${rangeLabel(t.startDate, t.endDate)}`}
                    selected={field.value === t.id}
                    onPress={() => field.onChange(t.id)}
                  />
                ))}
                <Chip
                  label="Nenhuma"
                  selected={field.value === null}
                  onPress={() => field.onChange(null)}
                />
              </View>
            </View>
          )}
        />
      )}

      <FormTextField
        control={control}
        name="notes"
        label="Notas"
        placeholder="Opcional"
        multiline
        textAlignVertical="top"
        style={{ minHeight: 88, paddingTop: 12 }}
      />

      <Button
        title="Guardar"
        fullWidth
        loading={formState.isSubmitting}
        onPress={handleSubmit(save)}
      />
      {event && (
        <Button
          title="Eliminar evento"
          variant="ghost"
          icon={Trash2}
          onPress={() => setConfirmDelete(true)}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar evento?"
        message={event && `"${event.title}" vai sair da tua agenda.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}
