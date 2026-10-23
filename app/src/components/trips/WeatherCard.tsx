import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Droplets, RefreshCw, Sun, Wind } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { BottomSheet, Button, Card, Text } from '@/components/ui';
import type { Trip } from '@/data/types';
import { describeWeather, formatTemp } from '@/domain/weatherCodes';
import { useForecast } from '@/hooks/useForecast';
import { dayTitle } from '@/lib/calendar';
import { cn } from '@/lib/cn';
import type { DayForecast } from '@/services/weather';
import colors from '@/theme/colors';

const weekday = (iso: string) => {
  const s = format(parseISO(iso), 'EEE', { locale: pt }).replace('.', '');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** "Previsão do tempo em …": one card per day; tap a day for details. */
export function WeatherCard({ trip, unit }: { trip: Trip; unit: 'C' | 'F' }) {
  const { result, retry } = useForecast(trip);
  // Kept while the sheet fades out, so its content doesn't vanish mid-animation.
  const [selected, setSelected] = useState<DayForecast | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const title = `Previsão do tempo em ${trip.destination.name}`;

  let body;
  if (!result) {
    body = (
      <View className="h-24 items-center justify-center">
        <ActivityIndicator color={colors.ember} accessibilityLabel="A carregar a previsão" />
      </View>
    );
  } else if (result.status === 'too-early') {
    body = (
      <Text className="text-muted">
        Só fica disponível 10 dias antes, a partir de{' '}
        {format(parseISO(result.availableFrom), "d 'de' MMMM", { locale: pt })}.
      </Text>
    );
  } else if (result.status === 'no-location') {
    body = (
      <Text className="text-muted">Sem localização do destino, não conseguimos ver o tempo.</Text>
    );
  } else if (result.status === 'past') {
    return null;
  } else if (result.status === 'error') {
    body = (
      <View className="gap-2">
        <Text className="text-muted">Sem ligação para ver a previsão.</Text>
        <Button
          title="Tentar outra vez"
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onPress={retry}
          className="self-start"
        />
      </View>
    );
  } else {
    // Up to 4 days fit side by side; longer trips scroll sideways.
    const fits = result.days.length <= 4;
    const days = result.days.map((d) => {
      const w = describeWeather(d.code);
      return (
        <Pressable
          key={d.date}
          onPress={() => {
            setSelected(d);
            setSheetOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${format(parseISO(d.date), 'EEEE', { locale: pt })}: ${w.label}, máxima ${formatTemp(d.max, unit)}, mínima ${formatTemp(d.min, unit)}`}
          accessibilityHint="Mostra mais detalhes"
          className={cn(
            'items-center gap-1 rounded-2xl border border-line bg-cream px-1 py-2.5 active:bg-sun-soft',
            fits ? 'flex-1' : 'w-24',
          )}
        >
          <Text variant="label" className="font-body-bold">
            {weekday(d.date)}
          </Text>
          <w.icon size={26} color={colors.ember} />
          <Text variant="caption" numberOfLines={2} className="text-center">
            {w.label}
          </Text>
          <Text variant="label">
            {formatTemp(d.max, unit)} <Text variant="caption">{formatTemp(d.min, unit)}</Text>
          </Text>
        </Pressable>
      );
    });
    body = (
      <>
        {fits ? (
          <View className="flex-row gap-2">{days}</View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {days}
          </ScrollView>
        )}
        {result.stale && (
          <Text variant="caption" className="mt-2">
            Sem ligação: a mostrar a última previsão guardada.
          </Text>
        )}
      </>
    );
  }

  return (
    <Card title={title}>
      {body}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={selected ? dayTitle(selected.date) : undefined}
      >
        {selected && <DayDetail day={selected} unit={unit} />}
      </BottomSheet>
    </Card>
  );
}

function DayDetail({ day, unit }: { day: DayForecast; unit: 'C' | 'F' }) {
  const w = describeWeather(day.code);
  const rows = [
    { icon: Droplets, label: 'Probabilidade de chuva', value: `${day.rainChance}%` },
    { icon: Wind, label: 'Vento máximo', value: `${Math.round(day.wind)} km/h` },
    { icon: Sun, label: 'Índice UV', value: String(Math.round(day.uv)) },
  ];
  return (
    <View className="gap-4 pb-2">
      <View className="flex-row items-center gap-4">
        <w.icon size={48} color={colors.ember} />
        <View>
          <Text variant="heading">{w.label}</Text>
          <Text>
            Máx. {formatTemp(day.max, unit)} · Mín. {formatTemp(day.min, unit)}
          </Text>
        </View>
      </View>
      {rows.map((r) => (
        <View key={r.label} className="flex-row items-center gap-3">
          <r.icon size={20} color={colors.muted} />
          <Text className="flex-1">{r.label}</Text>
          <Text variant="label" className="font-body-bold">
            {r.value}
          </Text>
        </View>
      ))}
      {day.rainChance >= 50 && (
        <Text variant="caption">
          Leva guarda-chuva: já está na tua mala se a criaste com esta previsão.
        </Text>
      )}
    </View>
  );
}
