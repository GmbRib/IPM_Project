import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { documentStatus } from '@/data/selectors';
import type { TravelDocument } from '@/data/types';

import { DocumentCard } from './DocumentCard';
import { DocumentDetailSheet } from './DocumentDetailSheet';

const edit = (doc: TravelDocument) =>
  router.push({ pathname: '/document', params: { id: doc.id } });

/**
 * Saved documents. A valid one opens a read-only sheet first (with "Editar"); one that
 * is expiring or expired goes straight to editing, since that's what it needs.
 */
export function DocumentList({ documents }: { documents: TravelDocument[] }) {
  // Kept while the sheet slides away, so its content doesn't vanish mid-animation.
  const [selected, setSelected] = useState<TravelDocument | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <View className="gap-3">
        {documents.map((d) => {
          const valid = documentStatus(d) === 'valid';
          return (
            <DocumentCard
              key={d.id}
              doc={d}
              hint={valid ? 'Abre para ver' : 'Abre para editar'}
              onPress={() => {
                if (!valid) return edit(d);
                setSelected(d);
                setOpen(true);
              }}
            />
          );
        })}
      </View>
      <DocumentDetailSheet
        doc={selected}
        open={open}
        onClose={() => setOpen(false)}
        onEdit={() => {
          setOpen(false);
          if (selected) edit(selected);
        }}
      />
    </>
  );
}
