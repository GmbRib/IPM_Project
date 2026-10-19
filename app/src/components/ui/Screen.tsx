import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  /** Tab screens drop the bottom edge: the tab bar already handles it. */
  edges?: Edge[];
  className?: string;
};

/** Page container: cream background, safe areas and the standard side padding. */
export function Screen({
  children,
  scroll = false,
  edges = ['top', 'bottom'],
  className,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.cream }}>
      {scroll ? (
        <ScrollView
          contentContainerClassName={cn('px-5 pb-8', className)}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className={cn('flex-1 px-5', className)}>{children}</View>
      )}
    </SafeAreaView>
  );
}
