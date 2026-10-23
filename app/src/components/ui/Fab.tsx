import { GlassView } from 'expo-glass-effect';
import { Plus, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGlass } from '@/lib/glass';
import colors from '@/theme/colors';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

type FabProps = {
  /** Short visible label, e.g. "Evento". The icon alone wasn't clear enough. */
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  icon?: LucideIcon;
};

/** Floating "+ Evento" / "+ Item" capsule in the bottom-right corner (main create action). */
export function Fab({ label, accessibilityLabel, onPress, icon: Icon = Plus }: FabProps) {
  const glass = useGlass();
  const insets = useSafeAreaInsets();
  // On tab screens the native tab bar is already part of the bottom safe area.
  const bottom = Math.max(insets.bottom, 12) + 12;

  const content = (
    <View className="flex-row items-center gap-1.5">
      <Icon size={22} color={colors.ink} strokeWidth={2.5} />
      <Text variant="label" className="font-body-bold text-base">
        {label}
      </Text>
    </View>
  );

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 20, bottom }}>
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        haptic
        className="rounded-full"
      >
        {glass ? (
          <GlassView
            colorScheme="light"
            tintColor="rgba(253,216,53,0.9)"
            style={{
              height: 56,
              borderRadius: 28,
              paddingHorizontal: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {content}
          </GlassView>
        ) : (
          <View
            className="h-14 items-center justify-center rounded-full border-2 border-b-[5px] border-ink bg-sun px-5"
            style={{
              elevation: 4,
              shadowColor: colors.ink,
              shadowOpacity: 0.2,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            {content}
          </View>
        )}
      </PressableScale>
    </View>
  );
}
