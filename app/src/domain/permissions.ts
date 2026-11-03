import type { ID, PackingItem, Role } from '@/data/types';

// Who may do what in a shared trip (RBAC). The server enforces this on every request
// (src/server/actions.ts); the app uses the same rules to decide what to show.

export type TripAction =
  | 'trip.edit'
  | 'trip.delete'
  | 'trip.invite'
  | 'trip.leave'
  | 'events.manage'
  | 'members.manage'
  | 'members.transfer'
  | 'bags.viewOthers'
  | 'bags.suggest';

const MATRIX: Record<TripAction, readonly Role[]> = {
  'trip.edit': ['owner', 'admin'],
  'trip.delete': ['owner'],
  'trip.invite': ['owner', 'admin'],
  // The organiser can't just leave: they hand the trip over first.
  'trip.leave': ['admin', 'member'],
  'events.manage': ['owner', 'admin'],
  // Promote/demote co-organisers and remove people.
  'members.manage': ['owner'],
  'members.transfer': ['owner'],
  'bags.viewOthers': ['owner', 'admin'],
  'bags.suggest': ['owner', 'admin'],
};

/** Whether someone with `role` in a trip may do `action`. No role = not a member = no. */
export function can(role: Role | null | undefined, action: TripAction): boolean {
  return !!role && MATRIX[action].includes(role);
}

/** Your own bag, or anyone's if you're an organiser. */
export function canViewItem(item: Pick<PackingItem, 'memberId'>, userId: ID, role?: Role | null) {
  return item.memberId === userId || can(role, 'bags.viewOthers');
}

/** Your own items, or ones you suggested to someone else (while you're still an organiser). */
export function canEditItem(
  item: Pick<PackingItem, 'memberId' | 'suggestedBy'>,
  userId: ID,
  role?: Role | null,
) {
  return item.memberId === userId || (item.suggestedBy === userId && can(role, 'bags.suggest'));
}

/** Only the person who packs the bag ticks things off. */
export const canTogglePacked = (item: Pick<PackingItem, 'memberId'>, userId: ID) =>
  item.memberId === userId;

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Organizador',
  admin: 'Co-organizador',
  member: 'Participante',
};
