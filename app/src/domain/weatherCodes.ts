import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';

// WMO weather codes (as returned by Open-Meteo) → PT label and icon.

export function describeWeather(code: number): { label: string; icon: LucideIcon } {
  if (code === 0) return { label: 'Sol', icon: Sun };
  if (code <= 2) return { label: 'Pouco nublado', icon: CloudSun };
  if (code === 3) return { label: 'Nublado', icon: Cloud };
  if (code <= 48) return { label: 'Nevoeiro', icon: CloudFog };
  if (code <= 57) return { label: 'Chuvisco', icon: CloudDrizzle };
  if (code <= 67 || (code >= 80 && code <= 82)) return { label: 'Chuva', icon: CloudRain };
  if (code <= 77 || code === 85 || code === 86) return { label: 'Neve', icon: CloudSnow };
  return { label: 'Trovoada', icon: CloudLightning };
}

export const formatTemp = (celsius: number, unit: 'C' | 'F' = 'C') =>
  `${Math.round(unit === 'F' ? celsius * 1.8 + 32 : celsius)}°`;
