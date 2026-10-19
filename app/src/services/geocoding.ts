import type { Destination } from '@/data/types';

// City search for the "Para onde vais?" field (Open-Meteo geocoding, no API key).

type GeoResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
};

export type Place = Destination & { id: number; region?: string };

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=pt&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`geocoding ${res.status}`);
  const json = (await res.json()) as { results?: GeoResult[] };
  return (json.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    country: r.country ?? '',
    countryCode: r.country_code,
    region: r.admin1 && r.admin1 !== r.name ? r.admin1 : undefined,
    lat: r.latitude,
    lon: r.longitude,
  }));
}
