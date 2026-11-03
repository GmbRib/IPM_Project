import type { Role } from '@/data/types';

import { can, canEditItem, canTogglePacked, canViewItem, type TripAction } from '../permissions';

// The full matrix, written out as a table so it can be read (and checked) at a glance.
const EXPECTED: Record<TripAction, Record<Role, boolean>> = {
  'trip.edit': { owner: true, admin: true, member: false },
  'trip.delete': { owner: true, admin: false, member: false },
  'trip.invite': { owner: true, admin: true, member: false },
  'trip.leave': { owner: false, admin: true, member: true },
  'events.manage': { owner: true, admin: true, member: false },
  'members.manage': { owner: true, admin: false, member: false },
  'members.transfer': { owner: true, admin: false, member: false },
  'bags.viewOthers': { owner: true, admin: true, member: false },
  'bags.suggest': { owner: true, admin: true, member: false },
};

describe('can()', () => {
  for (const [action, roles] of Object.entries(EXPECTED)) {
    for (const [role, allowed] of Object.entries(roles)) {
      it(`${role} ${allowed ? 'may' : 'may not'} ${action}`, () => {
        expect(can(role as Role, action as TripAction)).toBe(allowed);
      });
    }
  }

  it('denies everything to someone who is not in the trip', () => {
    for (const action of Object.keys(EXPECTED)) {
      expect(can(null, action as TripAction)).toBe(false);
      expect(can(undefined, action as TripAction)).toBe(false);
    }
  });
});

describe('item rules', () => {
  const pedrosItem = { memberId: 'pedro' };
  const suggestedByAna = { memberId: 'pedro', suggestedBy: 'ana' };

  it('lets you see your own bag, and organisers see everyone’s', () => {
    expect(canViewItem(pedrosItem, 'pedro', 'member')).toBe(true);
    expect(canViewItem(pedrosItem, 'ana', 'owner')).toBe(true);
    expect(canViewItem(pedrosItem, 'rui', 'admin')).toBe(true);
    expect(canViewItem(pedrosItem, 'marta', 'member')).toBe(false);
  });

  it('lets organisers edit only what they suggested in someone else’s bag', () => {
    expect(canEditItem(suggestedByAna, 'ana', 'owner')).toBe(true);
    expect(canEditItem(pedrosItem, 'ana', 'owner')).toBe(false);
    expect(canEditItem(suggestedByAna, 'pedro', 'member')).toBe(true); // it's in his bag
    // Demoted to participant: no longer edits what they suggested.
    expect(canEditItem(suggestedByAna, 'ana', 'member')).toBe(false);
  });

  it('only lets the bag’s owner tick items off', () => {
    expect(canTogglePacked(pedrosItem, 'pedro')).toBe(true);
    expect(canTogglePacked(pedrosItem, 'ana')).toBe(false);
  });
});
