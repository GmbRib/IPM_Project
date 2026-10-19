import { CircleAlert, CircleCheck, Info, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

import { Text } from './Text';

const tones: Record<string, { box: string; icon: LucideIcon; color: string }> = {
  danger: { box: 'bg-danger-soft border-danger', icon: CircleAlert, color: colors.danger },
  info: { box: 'bg-sun-soft border-gold', icon: Info, color: colors['ember-text'] },
  success: { box: 'bg-success-soft border-success', icon: CircleCheck, color: colors.success },
};

type BannerProps = {
  tone?: 'danger' | 'info' | 'success';
  message: string;
  className?: string;
};

/** Inline message for form-level errors or notices. Announced by screen readers. */
export function Banner({ tone = 'info', message, className }: BannerProps) {
  const t = tones[tone];
  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      className={cn('flex-row items-start gap-3 rounded-2xl border p-3', t.box, className)}
    >
      <t.icon size={20} color={t.color} />
      <Text className="flex-1 text-[15px] leading-5">{message}</Text>
    </View>
  );
}
