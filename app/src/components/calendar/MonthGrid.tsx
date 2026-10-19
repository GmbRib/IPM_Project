import { parseISO } from 'date-fns';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import type { ISODate, Trip, TripEvent } from '@/data/types';
import {
  dayLabel,
  monthWeeks,
  rangeLabel,
  visibleEventsOn,
  WEEKDAY_SHORT,
  weekTripBars,
  type TripBar,
} from '@/lib/calendar';
import { cn } from '@/lib/cn';

const NUMBER_H = 30;
const BAR_H = 18;
const BAR_GAP = 2;
const DOTS_H = 14;

type Props = {
  month: Date;
  today: ISODate;
  trips: Trip[];
  events: TripEvent[];
  onDayPress: (day: ISODate) => void;
  onTripPress: (trip: Trip) => void;
};

/** Month grid (Mon–Sun). Trips are bars across their days; events are dots. */
export function MonthGrid({ month, today, trips, events, onDayPress, onTripPress }: Props) {
  const [width, setWidth] = useState(0);
  const cellW = width / 7;
  const monthIndex = month.getMonth();

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View
        className="flex-row border-b border-line pb-1"
        importantForAccessibility="no-hide-descendants"
      >
        {WEEKDAY_SHORT.map((d, i) => (
          <Text key={i} variant="caption" className="flex-1 text-center font-body-bold">
            {d}
          </Text>
        ))}
      </View>

      {width > 0 &&
        monthWeeks(month).map((week) => {
          const bars = weekTripBars(week, trips);
          const lanes = Math.max(1, ...bars.map((b) => b.lane + 1));
          const rowH = NUMBER_H + lanes * (BAR_H + BAR_GAP) + DOTS_H;

          return (
            <View key={week[0]} className="border-b border-line" style={{ height: rowH }}>
              <View className="absolute inset-0 flex-row">
                {week.map((day, col) => {
                  const dayEvents = visibleEventsOn(events, day);
                  const dayTrips = bars.filter((b) => b.startCol <= col && b.endCol >= col);
                  return (
                    <DayCell
                      key={day}
                      day={day}
                      isToday={day === today}
                      inMonth={parseISO(day).getMonth() === monthIndex}
                      eventCount={dayEvents.length}
                      hasPending={dayEvents.some((e) => e.status === 'pending')}
                      tripNames={dayTrips.map((b) => b.trip.destination.name)}
                      onPress={() => onDayPress(day)}
                    />
                  );
                })}
              </View>
              {bars.map((bar) => (
                <TripBarView
                  key={bar.trip.id}
                  bar={bar}
                  cellW={cellW}
                  onPress={() => onTripPress(bar.trip)}
                />
              ))}
            </View>
          );
        })}
    </View>
  );
}

function DayCell({
  day,
  isToday,
  inMonth,
  eventCount,
  hasPending,
  tripNames,
  onPress,
}: {
  day: ISODate;
  isToday: boolean;
  inMonth: boolean;
  eventCount: number;
  hasPending: boolean;
  tripNames: string[];
  onPress: () => void;
}) {
  const parts = [
    dayLabel(day),
    isToday && 'hoje',
    ...tripNames.map((n) => `viagem a ${n}`),
    eventCount === 1 ? '1 evento' : eventCount > 1 && `${eventCount} eventos`,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={parts.join(', ')}
      accessibilityHint="Abre o dia"
      className="flex-1 items-center active:bg-sun-soft"
    >
      <View
        className={cn('mt-1 h-7 w-7 items-center justify-center rounded-full', isToday && 'bg-ink')}
      >
        <Text
          variant="label"
          className={cn(
            isToday ? 'font-body-bold text-cream' : !inMonth && 'text-muted opacity-50',
          )}
        >
          {parseISO(day).getDate()}
        </Text>
      </View>
      {eventCount > 0 && (
        <View className="absolute bottom-1.5 flex-row gap-0.5">
          {Array.from({ length: Math.min(eventCount, 3) }, (_, i) => (
            <View
              key={i}
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                hasPending && i === eventCount - 1 ? 'border border-ember' : 'bg-ember',
              )}
            />
          ))}
        </View>
      )}
    </Pressable>
  );
}

function TripBarView({
  bar,
  cellW,
  onPress,
}: {
  bar: TripBar;
  cellW: number;
  onPress: () => void;
}) {
  const { trip, startCol, endCol, lane, startsHere, endsHere } = bar;
  const inset = 2;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Viagem a ${trip.destination.name}, ${rangeLabel(trip.startDate, trip.endDate)}`}
      accessibilityHint="Abre a viagem"
      hitSlop={{ top: 4, bottom: 4 }}
      className={cn(
        'absolute justify-center border border-gold bg-sun px-1.5 active:opacity-80',
        startsHere ? 'rounded-l-full' : 'border-l-0',
        endsHere ? 'rounded-r-full' : 'border-r-0',
      )}
      style={{
        top: NUMBER_H + lane * (BAR_H + BAR_GAP),
        height: BAR_H,
        left: startCol * cellW + (startsHere ? inset : 0),
        width: (endCol - startCol + 1) * cellW - (startsHere ? inset : 0) - (endsHere ? inset : 0),
      }}
    >
      <Text numberOfLines={1} className="font-body-bold text-[11px] leading-[14px]">
        {startsHere || startCol === 0 ? trip.destination.name : ''}
      </Text>
    </Pressable>
  );
}
