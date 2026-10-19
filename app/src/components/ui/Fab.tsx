import { Plus, type LucideIcon } from 'lucide-react-native';

import colors from '@/theme/colors';

import { PressableScale } from './PressableScale';

type FabProps = {
  accessibilityLabel: string;
  onPress: () => void;
  icon?: LucideIcon;
};

/** Floating round button in the bottom-right corner (main "create" action). */
export function Fab({ accessibilityLabel, onPress, icon: Icon = Plus }: FabProps) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="absolute bottom-5 right-5 h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-sun "
      style={{
        elevation: 4,
        shadowColor: colors.ink,
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      }}
    >
      <Icon size={28} color={colors.ink} strokeWidth={2.5} />
    </PressableScale>
  );
}
