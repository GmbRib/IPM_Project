import { View } from 'react-native';

import { AddDocumentButtons } from '@/components/documents/AddDocumentButtons';
import { DocumentList } from '@/components/documents/DocumentList';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { Button, Screen, Text } from '@/components/ui';
import { useData } from '@/stores/data';
import { useSession } from '@/stores/session';

export default function OnboardingStep2() {
  const userId = useSession((s) => s.user?.id);
  const updateUser = useSession((s) => s.updateUser);
  const documents = useData((s) => s.documents).filter((d) => d.userId === userId);
  const finish = () => updateUser({ onboarded: true });

  return (
    <Screen scroll>
      <OnboardingHeader
        step={2}
        title="Os teus documentos"
        subtitle="Avisamos-te se algum expirar antes de uma viagem."
      />

      <View className="gap-6">
        {documents.length > 0 && (
          <View className="gap-2">
            <Text variant="label">Documentos adicionados</Text>
            <DocumentList documents={documents} />
          </View>
        )}

        <AddDocumentButtons
          title={documents.length > 0 ? 'Adicionar outro documento' : 'Adicionar documentos'}
        />

        <View className="gap-2">
          <Button title="Concluir" fullWidth onPress={finish} />
          {documents.length === 0 && (
            <Button title="Saltar por agora" variant="ghost" onPress={finish} />
          )}
        </View>
      </View>
    </Screen>
  );
}
