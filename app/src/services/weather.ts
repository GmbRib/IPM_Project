import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, format } from 'date-fns';

import { daysUntil, todayISO } from '@/data/selectors';
import type { Trip } from '@/data/types';

// Daily forecast for a trip's days (Open-Meteo, no API key). Cached per trip for an
// hour; when the network fails, the last cached forecast is used instead.

export type DayForecast = {
  date: string;
  code: number;
  max: number;
  min: number;
  rainChance: number;
  wind: number;
  uv: number;
};

export type ForecastResult =
  | { status: 'ready'; days: DayForecast[]; stale: boolean }
  /** More than FORECAST_WINDOW days away: "só fica disponível 10 dias antes". */
  | { status: 'too-early'; availableFrom: string }
  | { status: 'no-location' }
  | { status: 'past' }
  | { status: 'error' };

/** The app shows the forecast from this many days before the trip. */
export const FORECAST_WINDOW = 10;
/** Open-Meteo forecasts up to 16 days ahead. */
const MAX_AHEAD = 15;
const TTL_MS = 60 * 60 * 1000;

type Cached = { at: number; days: DayForecast[] };

export async function getTripForecast(trip: Trip, today = todayISO()): Promise<ForecastResult> {
  const { lat, lon } = trip.destination;
  if (lat == null || lon == null) return { status: 'no-location' };
  if (trip.endDate < today) return { status: 'past' };
  if (daysUntil(trip.startDate, today) > FORECAST_WINDOW) {
    return {
      status: 'too-early',
      availableFrom: format(addDays(new Date(trip.startDate), -FORECAST_WINDOW), 'yyyy-MM-dd'),
    };
  }

  const start = trip.startDate < today ? today : trip.startDate;
  const lastAvailable = format(addDays(new Date(today), MAX_AHEAD), 'yyyy-MM-dd');
  const end = trip.endDate > lastAvailable ? lastAvailable : trip.endDate;
  const key = `packsun:weather:${lat.toFixed(2)},${lon.toFixed(2)}:${start}:${end}`;

  const cachedRaw = await AsyncStorage.getItem(key).catch(() => null);
  const cached = cachedRaw ? (JSON.parse(cachedRaw) as Cached) : null;
  if (cached && Date.now() - cached.at < TTL_MS) {
    return { status: 'ready', days: cached.days, stale: false };
  }

  try {
    const days = await fetchDaily(lat, lon, start, end);
    await AsyncStorage.setItem(key, JSON.stringify({ at: Date.now(), days } satisfies Cached));
    return { status: 'ready', days, stale: false };
  } catch {
    if (cached) return { status: 'ready', days: cached.days, stale: true };
    return { status: 'error' };
  }
}

async function fetchDaily(lat: number, lon: number, start: string, end: string) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max',
    timezone: 'auto',
    start_date: start,
    end_date: end,
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`forecast ${res.status}`);
    const { daily: d } = (await res.json()) as {
      daily: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_probability_max: (number | null)[];
        wind_speed_10m_max: number[];
        uv_index_max: (number | null)[];
      };
    };
    return d.time.map((date, i) => ({
      date,
      code: d.weather_code[i],
      max: d.temperature_2m_max[i],
      min: d.temperature_2m_min[i],
      rainChance: d.precipitation_probability_max[i] ?? 0,
      wind: d.wind_speed_10m_max[i],
      uv: d.uv_index_max[i] ?? 0,
    }));
  } finally {
    clearTimeout(timer);
  }
}
