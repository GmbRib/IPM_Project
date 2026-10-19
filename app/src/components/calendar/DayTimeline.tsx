import { Check, MapPin, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import type { TripEvent } from '@/data/types';
import { eventEnd, fromMinutes, placeEvents, toMinutes } from '@/lib/calendar';
import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

export const HOUR_H = 64;
const LABEL_W = 48;
const MIN_CARD_H = 44;
const SUGGESTION_MIN_H = 96;

type Props = {
  events: TripEvent[];
  /** First hour shown (the timeline grows earlier if an event starts before). */
  startHour: number;
  onSlotPress: (time: string) => void;
  onEventPress: (event: TripEvent) => void;
  onAccept: (event: TripEvent) => void;
  onDismiss: (event: TripEvent) => void;
};

/** Hour-by-hour day view. Tap an empty hour to create, tap a card to edit. */
export function DayTimeline({
  events,
  startHour,
  onSlotPress,
  onEventPress,
  onAccept,
  onDismiss,
}: Props) {
  const [width, setWidth] = useState(0);
  const hours = Array.from({ length: 24 - startHour }, (_, i) => startHour + i);
  const top = (min: number) => ((min - startHour * 60) / 60) * HOUR_H;
  const areaW = width - LABEL_W;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: hours.length * HOUR_H }}
    >
      {hours.map((h) => (
        <Pressable
          key={h}
          onPress={() => onSlotPress(fromMinutes(h * 60))}
          accessibilityRole="button"
          accessibilityLabel={`${String(h).padStart(2, '0')}:00, criar evento`}
          className="flex-row active:bg-sun-soft"
          style={{ height: HOUR_H }}
        >
          <Text variant="caption" style={{ width: LABEL_W, marginTop: -9 }}>
            {String(h).padStart(2, '0')}:00
          </Text>
          <View className="flex-1 border-t border-line" />
        </Pressable>
      ))}

      {areaW > 0 &&
        placeEvents(events).map(({ event, column, columns }) => {
          const start = toMinutes(event.startTime);
          const pending = event.status === 'pending';
          const minH = pending ? SUGGESTION_MIN_H : MIN_CARD_H;
          const colW = areaW / columns;
          return (
            <View
              key={event.id}
              style={{
                position: 'absolute',
                top: top(start) + 1,
                left: LABEL_W + column * colW + 2,
                width: colW - 4,
                height: Math.max(top(eventEnd(event)) - top(start) - 2, minH),
              }}
            >
              {pending ? (
                <SuggestionCard
                  event={event}
                  onPress={() => onEventPress(event)}
                  onAccept={() => onAccept(event)}
                  onDismiss={() => onDismiss(event)}
                />
              ) : (
                <EventCard event={event} onPress={() => onEventPress(event)} />
              )}
            </View>
          );
        })}
    </View>
  );
}

const timeRange = (e: TripEvent) => (e.endTime ? `${e.startTime}–${e.endTime}` : e.startTime);

function EventCard({ event, onPress }: { event: TripEvent; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${timeRange(event)}${event.location ? `, ${event.location}` : ''}`}
      accessibilityHint="Abre para editar"
      className="flex-1 overflow-hidden rounded-xl border-l-4 border-ember bg-sun-soft px-2 py-1 active:opacity-80"
    >
      <Text variant="label" numberOfLines={1} className="font-body-bold">
        {event.title}
      </Text>
      <Text variant="caption" numberOfLines={1}>
        {timeRange(event)}
        {event.location ? ` · ${event.location}` : ''}
      </Text>
    </Pressable>
  );
}

function SuggestionCard({
  event,
  onPress,
  onAccept,
  onDismiss,
}: {
  event: TripEvent;
  onPress: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <View className="flex-1 justify-between rounded-xl border-2 border-dashed border-gold bg-surface px-2 py-1">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Sugestão: ${event.title}, ${timeRange(event)}${event.location ? `, ${event.location}` : ''}`}
        className="active:opacity-80"
      >
        <Text variant="caption" className="font-body-bold text-ember-text">
          Sugestão
        </Text>
        <Text variant="label" numberOfLines={1}>
          {event.title} · {timeRange(event)}
        </Text>
        {!!event.location && (
          <View className="flex-row items-center gap-1">
            <MapPin size={12} color={colors.muted} />
            <Text variant="caption" numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}
      </Pressable>
      <View className="flex-row gap-2">
        <SmallAction label="Aceitar" icon="accept" onPress={onAccept} />
        <SmallAction label="Ignorar" icon="dismiss" onPress={onDismiss} />
      </View>
    </View>
  );
}

function SmallAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: 'accept' | 'dismiss';
  onPress: () => void;
}) {
  const Icon = icon === 'accept' ? Check : X;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 6, bottom: 6 }}
      className={cn(
        'h-8 flex-row items-center gap-1 rounded-full px-3 active:opacity-80',
        icon === 'accept' ? 'bg-sun' : 'border border-line bg-surface',
      )}
    >
      <Icon size={14} color={colors.ink} strokeWidth={3} />
      <Text variant="caption" className="font-body-bold text-ink">
        {label}
      </Text>
    </Pressable>
  );
}
