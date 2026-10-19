import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';

const variants = {
  title: 'font-display-xbold text-[28px] leading-[34px] text-ink',
  heading: 'font-display text-xl leading-7 text-ink',
  body: 'font-body text-base leading-6 text-ink',
  label: 'font-body-semibold text-[15px] leading-5 text-ink',
  caption: 'font-body text-[13px] leading-[18px] text-muted',
  link: 'font-body-bold text-base leading-6 text-ember-text',
} as const;

export type TextVariant = keyof typeof variants;

type TextProps = RNTextProps & { variant?: TextVariant; className?: string };

/** App text. Always use this instead of react-native's Text so fonts stay consistent. */
export function Text({ variant = 'body', className, ...props }: TextProps) {
  return (
    <RNText
      accessibilityRole={variant === 'title' || variant === 'heading' ? 'header' : undefined}
      className={cn(variants[variant], className)}
      {...props}
    />
  );
}
