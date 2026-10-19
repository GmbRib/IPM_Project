import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { Button, Text } from '@/components/ui';
import type { DocumentType } from '@/data/types';
import { DOCUMENT_TYPES } from '@/lib/labels';

const ADDABLE: DocumentType[] = ['cc', 'passport', 'driving', 'other'];

/** "+ Cartão de Cidadão", "+ Passaporte"… → the add-document form. */
export function AddDocumentButtons({ title }: { title: string }) {
  return (
    <View className="gap-2">
      <Text variant="label">{title}</Text>
      {ADDABLE.map((t) => (
        <Button
          key={t}
          title={DOCUMENT_TYPES[t].label}
          variant="secondary"
          icon={Plus}
          fullWidth
          className="justify-start"
          onPress={() => router.push({ pathname: '/document', params: { type: t } })}
        />
      ))}
    </View>
  );
}
