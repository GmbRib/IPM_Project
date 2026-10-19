import { twMerge } from 'tailwind-merge';

/**
 * Joins class names, skipping falsy values: cn('p-4', isActive && 'bg-sun').
 * Later classes win over earlier conflicting ones (cn('text-ink', 'text-danger') → 'text-danger'),
 * which NativeWind doesn't do on its own.
 */
export function cn(...classes: (string | false | null | undefined)[]) {
  return twMerge(classes.filter(Boolean).join(' '));
}
