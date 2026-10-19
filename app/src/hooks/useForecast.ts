import { useCallback, useEffect, useState } from 'react';

import type { Trip } from '@/data/types';
import { getTripForecast, type ForecastResult } from '@/services/weather';

/** Forecast for a trip; `null` while loading. `retry` refetches after an error. */
export function useForecast(trip: Trip | null) {
  const [loaded, setLoaded] = useState<{ key: string; result: ForecastResult } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = trip
    ? `${trip.id}:${trip.startDate}:${trip.endDate}:${trip.destination.lat}:${trip.destination.lon}:${attempt}`
    : '';

  useEffect(() => {
    if (!trip) return;
    let alive = true;
    getTripForecast(trip).then((result) => alive && setLoaded({ key, result }));
    return () => {
      alive = false;
    };
    // `key` captures everything about the trip that matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  // A result for another trip (or an older attempt) counts as still loading.
  return { result: loaded?.key === key ? loaded.result : null, retry };
}
