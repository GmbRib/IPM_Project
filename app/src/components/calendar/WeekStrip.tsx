import { parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { IconButton, Text } from '@/components/ui';
import type { ISODate, Trip, TripEvent } from '@/data/types';
import {
  dayLabel,
  shiftDays,
  tripsOn,
  visibleEventsOn,
  WEEKDAY_SHORT,
  weekOf,
} from '@/lib/calendar';
import { cn } from '@/lib/cn';

type Props = {
  selected: ISODate;
  today: ISODate;
  trips: Trip[];
  events: TripEvent[];
  onSelect: (day: ISODate) => void;
};

/** One week (Mon–Sun) of tappable days, with ‹ › to move a week. */
export function WeekStrip({ selected, today, trips, events, onSelect }: Props) {
  const week = weekOf(selected);

  return (
    <View className="flex-row items-center">
      <IconButton
        icon={ChevronLeft}
        accessibilityLabel="Semana anterior"
        onPress={() => onSelect(shiftDays(selected, -7))}
        className="-ml-2"
      />
      <View className="flex-1 flex-row">
        {week.map((day, i) => {
          const isSelected = day === selected;
          const inTrip = tripsOn(trips, day).length > 0;
          const hasEvents = visibleEventsOn(events, day).length > 0;
          return (
            <Pressable
              key={day}
              onPress={() => onSelect(day)}
              accessibilityRole="button"
              accessibilityLabel={dayLabel(day)}
              accessibilityState={{ selected: isSelected }}
              className={cn(
                'mx-0.5 flex-1 items-center gap-0.5 rounded-2xl py-1.5',
                isSelected ? 'bg-ink' : inTrip ? 'bg-sun-soft' : 'active:bg-sun-soft',
              )}
            >
              <Text variant="caption" className={cn('font-body-bold', isSelected && 'text-cream')}>
                {WEEKDAY_SHORT[i]}
              </Text>
              <Text
                variant="label"
                className={cn(
                  'font-body-bold',
                  isSelected ? 'text-cream' : day === today && 'text-ember-text',
                )}
              >
                {parseISO(day).getDate()}
              </Text>
              <View
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  hasEvents ? (isSelected ? 'bg-sun' : 'bg-ember') : 'bg-transparent',
                )}
              />
            </Pressable>
          );
        })}
      </View>
      <IconButton
        icon={ChevronRight}
        accessibilityLabel="Semana seguinte"
        onPress={() => onSelect(shiftDays(selected, 7))}
        className="-mr-2"
      />
    </View>
  );
}
