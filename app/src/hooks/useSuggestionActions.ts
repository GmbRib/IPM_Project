import type { TripEvent } from '@/data/types';
import { useData } from '@/stores/data';
import { useUi } from '@/stores/ui';

/** Accept / ignore a suggested event, with feedback and "Anular". Same everywhere. */
export function useSuggestionActions() {
  const updateEvent = useData((s) => s.updateEvent);
  const showToast = useUi((s) => s.showToast);

  return {
    async accept(e: TripEvent) {
      await updateEvent(e.id, { status: 'accepted' });
      showToast({
        message: `"${e.title}" adicionado à tua agenda`,
        actionLabel: 'Anular',
        onAction: () => updateEvent(e.id, { status: 'pending' }),
      });
    },
    async dismiss(e: TripEvent) {
      await updateEvent(e.id, { status: 'dismissed' });
      showToast({
        message: `Sugestão "${e.title}" ignorada`,
        actionLabel: 'Anular',
        onAction: () => updateEvent(e.id, { status: 'pending' }),
      });
    },
  };
}
