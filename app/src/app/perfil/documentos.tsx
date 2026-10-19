import { router } from 'expo-router';
import { View } from 'react-native';

import { AddDocumentButtons } from '@/components/documents/AddDocumentButtons';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { Header, Screen, Text } from '@/components/ui';
import { useData } from '@/stores/data';

export default function MeusDocumentosScreen() {
  const documents = useData((s) => s.documents);

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
          <View className="gap-2">
            {[...documents]
              .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))
              .map((d) => (
                <DocumentCard
                  key={d.id}
                  doc={d}
                  onPress={() => router.push({ pathname: '/document', params: { id: d.id } })}
                />
              ))}
          </View>
        )}
        <AddDocumentButtons title="Adicionar documento" />
      </View>
    </Screen>
  );
}
