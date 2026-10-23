import { format, parseISO } from 'date-fns';
import { Image } from 'expo-image';
import { ChevronRight, CircleCheck, CircleX, TriangleAlert } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { documentStatus, type DocumentStatus } from '@/data/selectors';
import type { TravelDocument } from '@/data/types';
import { cn } from '@/lib/cn';
import { DOCUMENT_TYPES } from '@/lib/labels';
import colors from '@/theme/colors';

/** How each document status looks (shared by the card and the detail sheet). */
export const DOCUMENT_STATUS: Record<
  DocumentStatus,
  { label: string; icon: typeof CircleCheck; color: string; text: string }
> = {
  valid: { label: 'Válido', icon: CircleCheck, color: colors.success, text: 'text-success' },
  expiring: {
    label: 'Expira em breve',
    icon: TriangleAlert,
    color: colors['ember-text'],
    text: 'text-ember-text',
  },
  expired: { label: 'Expirado', icon: CircleX, color: colors.danger, text: 'text-danger' },
};

type Props = {
  doc: TravelDocument;
  onPress?: () => void;
  /** What tapping does, for screen readers (e.g. "Abre para ver"). */
  hint?: string;
};

/** One saved document: photo or type icon, name, number, expiry and status. */
export function DocumentCard({ doc, onPress, hint = 'Abre para editar' }: Props) {
  const type = DOCUMENT_TYPES[doc.type];
  const status = DOCUMENT_STATUS[documentStatus(doc)];
  const expires = format(parseISO(doc.expiresAt), 'dd/MM/yyyy');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${doc.name}, número ${doc.number}, válido até ${expires}, ${status.label}`}
      accessibilityHint={hint}
      className="flex-row items-center gap-3 rounded-card border border-line bg-surface p-3 active:opacity-80"
    >
      <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-sun-soft">
        {doc.photoUri ? (
          <Image
            source={{ uri: doc.photoUri }}
            style={{ width: 56, height: 56 }}
            contentFit="cover"
          />
        ) : (
          <type.icon size={26} color={colors.ember} />
        )}
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="label" numberOfLines={1}>
          {doc.name}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          Nº {doc.number} · até {expires}
        </Text>
        <View className="flex-row items-center gap-1">
          <status.icon size={14} color={status.color} />
          <Text variant="caption" className={cn('font-body-bold', status.text)}>
            {status.label}
          </Text>
        </View>
      </View>
      {onPress && <ChevronRight size={20} color={colors.muted} />}
    </Pressable>
  );
}
