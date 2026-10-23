import { differenceInCalendarMonths, format, parseISO } from 'date-fns';
import { Image } from 'expo-image';
import { Pencil } from 'lucide-react-native';
import { View } from 'react-native';

import { BottomSheet, Button, Text } from '@/components/ui';
import { documentStatus } from '@/data/selectors';
import type { TravelDocument } from '@/data/types';
import { cn } from '@/lib/cn';
import { DOCUMENT_TYPES } from '@/lib/labels';
import colors from '@/theme/colors';

import { DOCUMENT_STATUS } from './DocumentCard';

type Props = {
  doc: TravelDocument | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
};

/** Read-only view of a document (photo, number, expiry), with "Editar" to change it. */
export function DocumentDetailSheet({ doc, open, onClose, onEdit }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title={doc?.name}>
      {doc && <Details doc={doc} onEdit={onEdit} />}
    </BottomSheet>
  );
}

function Details({ doc, onEdit }: { doc: TravelDocument; onEdit: () => void }) {
  const type = DOCUMENT_TYPES[doc.type];
  const status = DOCUMENT_STATUS[documentStatus(doc)];
  const expires = parseISO(doc.expiresAt);
  const monthsLeft = differenceInCalendarMonths(expires, new Date());
  const left =
    monthsLeft >= 24
      ? `faltam ${Math.floor(monthsLeft / 12)} anos`
      : monthsLeft >= 1
        ? `faltam ${monthsLeft} ${monthsLeft === 1 ? 'mês' : 'meses'}`
        : null;

  return (
    <View className="gap-4">
      {doc.photoUri ? (
        <Image
          source={{ uri: doc.photoUri }}
          style={{ width: '100%', aspectRatio: 1.6, borderRadius: 20 }}
          contentFit="cover"
          accessibilityLabel={`Foto do documento ${doc.name}`}
        />
      ) : (
        <View className="h-28 items-center justify-center gap-1 rounded-card bg-sun-soft">
          <type.icon size={40} color={colors.ember} />
          <Text variant="caption">Sem foto guardada</Text>
        </View>
      )}

      <View className="rounded-card border border-line bg-surface px-4">
        <Field label="Tipo" value={type.label} />
        <View className="h-px bg-line" />
        {/* Selectable, so the number can be copied into a booking form. */}
        <Field label="Número" value={doc.number} selectable />
        <View className="h-px bg-line" />
        <Field label="Validade" value={format(expires, 'dd/MM/yyyy')} />
      </View>

      <View className="flex-row items-center gap-1.5">
        <status.icon size={16} color={status.color} />
        <Text variant="label" className={cn('font-body-bold', status.text)}>
          {status.label}
        </Text>
        {!!left && <Text variant="caption">· {left}</Text>}
      </View>

      <Button title="Editar" icon={Pencil} fullWidth onPress={onEdit} />
    </View>
  );
}

function Field({
  label,
  value,
  selectable,
}: {
  label: string;
  value: string;
  selectable?: boolean;
}) {
  return (
    <View className="min-h-12 flex-row items-center justify-between gap-4 py-3">
      <Text variant="caption">{label}</Text>
      <Text variant="label" selectable={selectable} className="shrink text-right">
        {value}
      </Text>
    </View>
  );
}
