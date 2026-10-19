import { useLocalSearchParams } from 'expo-router';

import { DocumentForm } from '@/components/documents/DocumentForm';
import { Header, Screen } from '@/components/ui';
import type { DocumentType } from '@/data/types';
import { DOCUMENT_TYPES } from '@/lib/labels';
import { useData } from '@/stores/data';

/** /document?type=passport (new) or /document?id=… (edit). */
export default function DocumentScreen() {
  const { id, type } = useLocalSearchParams<{ id?: string; type?: DocumentType }>();
  const doc = useData((s) => s.documents.find((d) => d.id === id));
  const newType = type && type in DOCUMENT_TYPES ? type : 'cc';

  return (
    <Screen scroll>
      <Header
        leading="back"
        title={doc ? 'Editar documento' : 'Adicionar documento'}
        subtitle={doc ? undefined : DOCUMENT_TYPES[newType].label}
      />
      <DocumentForm key={doc?.id ?? newType} doc={doc} type={newType} />
    </Screen>
  );
}
