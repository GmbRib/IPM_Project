import { MapPin, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { IconButton, Text, TextField } from '@/components/ui';
import type { Destination } from '@/data/types';
import { searchPlaces, type Place } from '@/services/geocoding';
import colors from '@/theme/colors';

type Props = {
  value: Destination | null;
  onChange: (d: Destination | null) => void;
  error?: string;
};

const DEBOUNCE_MS = 300;

/** "Destino": type a city, pick a result. Works offline too (without weather). */
export function DestinationField({ value, onChange, error }: Props) {
  const [query, setQuery] = useState('');
  const [found, setResults] = useState<Place[]>([]);
  const [searchStatus, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  // Only search while nothing is chosen and there's something to search for.
  const searching = !value && query.trim().length >= 2;

  useEffect(() => {
    if (!searching) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus('loading');
      try {
        setResults(await searchPlaces(query, controller.signal));
        setStatus('idle');
      } catch {
        if (!controller.signal.aborted) setStatus('error');
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searching]);

  if (value) {
    return (
      <View className="gap-1.5">
        <Text variant="label">Destino</Text>
        <View className="min-h-12 flex-row items-center gap-3 rounded-2xl border-2 border-gold bg-sun-soft pl-4">
          <MapPin size={20} color={colors.ember} />
          <View className="flex-1">
            <Text variant="label" className="font-body-bold">
              {value.name}
            </Text>
            {value.country ? <Text variant="caption">{value.country}</Text> : null}
          </View>
          <IconButton
            icon={X}
            accessibilityLabel={`Mudar destino (${value.name})`}
            onPress={() => {
              setQuery(value.name);
              onChange(null);
            }}
          />
        </View>
      </View>
    );
  }

  const trimmed = query.trim();
  const results = searching ? found : [];
  const status = searching ? searchStatus : 'idle';
  return (
    <View className="gap-2">
      <TextField
        label="Destino"
        required
        value={query}
        onChangeText={setQuery}
        placeholder="Cidade, ex.: Genebra"
        autoCapitalize="words"
        autoCorrect={false}
        error={error}
        trailing={
          status === 'loading' ? <ActivityIndicator color={colors.ember} className="mr-4" /> : null
        }
      />
      {results.length > 0 && (
        <View className="overflow-hidden rounded-2xl border border-line bg-surface">
          {results.map((p, i) => (
            <Pressable
              key={p.id}
              onPress={() =>
                onChange({
                  name: p.name,
                  country: p.country,
                  countryCode: p.countryCode,
                  lat: p.lat,
                  lon: p.lon,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={[p.name, p.region, p.country].filter(Boolean).join(', ')}
              className={`min-h-12 flex-row items-center gap-3 px-4 py-2 active:bg-sun-soft ${i ? 'border-t border-line' : ''}`}
            >
              <MapPin size={18} color={colors.muted} />
              <View className="flex-1">
                <Text variant="label">{p.name}</Text>
                <Text variant="caption">{[p.region, p.country].filter(Boolean).join(', ')}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      {status === 'error' && trimmed.length >= 2 && (
        <Pressable
          onPress={() => onChange({ name: trimmed, country: '' })}
          accessibilityRole="button"
          className="rounded-2xl border border-gold bg-sun-soft p-3 active:opacity-80"
        >
          <Text className="text-[15px] leading-5">
            Sem ligação para procurar cidades.{' '}
            <Text className="font-body-bold text-ember-text">Usar “{trimmed}” mesmo assim</Text>{' '}
            (sem previsão do tempo).
          </Text>
        </Pressable>
      )}
      {status === 'idle' && results.length === 0 && trimmed.length >= 2 && (
        <Text variant="caption">Nenhuma cidade encontrada com esse nome.</Text>
      )}
    </View>
  );
}
