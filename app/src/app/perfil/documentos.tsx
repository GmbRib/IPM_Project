import { router } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { DocumentList } from '@/components/documents/DocumentList';
import { BottomSheet, Button, Header, Screen, Text } from '@/components/ui';
import type { DocumentType } from '@/data/types';
import { DOCUMENT_TYPES } from '@/lib/labels';
import { useData } from '@/stores/data';
import colors from '@/theme/colors';

const TYPES: DocumentType[] = ['cc', 'passport', 'driving', 'other'];

export default function MeusDocumentosScreen() {
  const documents = useData((s) => s.documents);
  const [choosing, setChoosing] = useState(false);

  return (
    <Screen scroll>
      <Header leading="back" title="Os meus documentos" />
      <View className="gap-6">
        {documents.length === 0 ? (
          <Text className="text-muted">
            Guarda aqui os teus documentos de viagem. Avisamos-te se algum expirar antes de uma
            viagem.
          </Text>
        ) : (
          <DocumentList
            documents={[...documents].sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))}
          />
        )}
        <Button
          title="Adicionar documento"
          icon={Plus}
          fullWidth
          onPress={() => setChoosing(true)}
        />
      </View>

      {/* One clear action; the document type is chosen here instead of four buttons. */}
      <BottomSheet open={choosing} onClose={() => setChoosing(false)} title="Que documento?">
        <View className="overflow-hidden rounded-card border border-line bg-surface">
          {TYPES.map((t, i) => {
            const type = DOCUMENT_TYPES[t];
            return (
              <Pressable
                key={t}
                onPress={() => {
                  setChoosing(false);
                  router.push({ pathname: '/document', params: { type: t } });
                }}
                accessibilityRole="button"
                accessibilityLabel={type.label}
                className={`min-h-16 flex-row items-center gap-3 px-4 active:bg-sun-soft ${i ? 'border-t border-line' : ''}`}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-sun-soft">
                  <type.icon size={20} color={colors.ember} />
                </View>
                <Text variant="label" className="flex-1">
                  {type.label}
                </Text>
                <ChevronRight size={20} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </Screen>
  );
}
