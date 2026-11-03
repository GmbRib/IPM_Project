import { roleOf } from '@/data/selectors';
import type { ID, Role } from '@/data/types';
import { useData } from '@/stores/data';
import { useSession } from '@/stores/session';

/** The signed-in user's role on a trip; null when there's no trip or they're not on it. */
export function useTripRole(tripId: ID | undefined): Role | null {
  const userId = useSession((s) => s.user?.id);
  return useData((s) => (tripId ? roleOf(s.members, tripId, userId) : null));
}

/** Same, for screens that list several trips: (tripId) => role. */
export function useTripRoles() {
  const userId = useSession((s) => s.user?.id);
  const members = useData((s) => s.members);
  return (tripId: ID | undefined) => (tripId ? roleOf(members, tripId, userId) : null);
}
