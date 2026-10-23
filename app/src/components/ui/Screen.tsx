import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  /** Tab screens drop the bottom edge: the tab bar already handles it. */
  edges?: Edge[];
  className?: string;
};

/** Page container: cream background, safe areas and the standard side padding (20). */
export function Screen({
  children,
  scroll = false,
  edges = ['top', 'bottom'],
  className,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  // Without the bottom edge (tab screens) the last content must still clear the tab
  // bar, which on iOS floats over the screen and is part of the bottom inset.
  const bottomRoom = edges.includes('bottom') ? 32 : insets.bottom + 32;

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.cream }}>
      {scroll ? (
        <ScrollView
          contentContainerClassName={cn('px-5', className)}
          contentContainerStyle={{ paddingBottom: bottomRoom }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {children}
        </ScrollView>
      ) : (
        <View className={cn('flex-1 px-5', className)}>{children}</View>
      )}
    </SafeAreaView>
  );
}
