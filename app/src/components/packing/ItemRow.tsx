import { Check, History, Pencil, ShoppingCart } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { IconButton, Text } from '@/components/ui';
import type { PackingItem } from '@/data/types';
import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

type Props = { item: PackingItem; onToggle: () => void; onEdit: () => void };

/** One packing item: tap to mark as packed; pencil to edit. */
export function ItemRow({ item, onToggle, onEdit }: Props) {
  return (
    <View className="min-h-14 flex-row items-center">
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.packed }}
        accessibilityLabel={`${item.name}${item.quantity > 1 ? `, ${item.quantity} unidades` : ''}${item.buyLater ? ', comprar mais tarde' : ''}`}
        accessibilityHint={item.packed ? 'Marcar como por arrumar' : 'Marcar como arrumado'}
        className="min-h-14 flex-1 flex-row items-center gap-3 py-2 active:opacity-70"
      >
        <View
          className={cn(
            'h-7 w-7 items-center justify-center rounded-full border-2',
            item.packed ? 'border-success bg-success' : 'border-muted bg-surface',
          )}
        >
          {item.packed && (
            <Animated.View entering={ZoomIn.springify().damping(12)}>
              <Check size={16} color={colors.surface} strokeWidth={3} />
            </Animated.View>
          )}
        </View>
        <View className="flex-1 gap-0.5">
          <Text className={cn(item.packed && 'text-muted line-through')}>
            {item.name}
            {item.quantity > 1 && (
              <Text className="font-body-bold text-muted"> ×{item.quantity}</Text>
            )}
          </Text>
          {(item.buyLater || item.source === 'history') && (
            <View className="flex-row flex-wrap gap-1.5">
              {item.buyLater && <Badge icon="buy" label="Comprar" />}
              {item.source === 'history' && (
                <Badge icon="history" label="Esqueceste da última vez" />
              )}
            </View>
          )}
        </View>
      </Pressable>
      <IconButton
        icon={Pencil}
        accessibilityLabel={`Editar ${item.name}`}
        color={colors.muted}
        onPress={onEdit}
      />
    </View>
  );
}

function Badge({ icon, label }: { icon: 'buy' | 'history'; label: string }) {
  const Icon = icon === 'buy' ? ShoppingCart : History;
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-sun-soft px-2 py-0.5">
      <Icon size={12} color={colors['ember-text']} />
      <Text variant="caption" className="font-body-bold text-ember-text">
        {label}
      </Text>
    </View>
  );
}
