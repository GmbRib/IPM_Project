import { randomInt, randomUUID } from 'node:crypto';

import { addDays } from 'date-fns';
import { z } from 'zod';

import type {
  ID,
  PackingItem,
  PublicUser,
  Role,
  TravelDocument,
  Trip,
  TripEvent,
  TripInvite,
  TripMember,
  TripReview,
  User,
} from '@/data/types';
import {
  can,
  canEditItem,
  canTogglePacked,
  canViewItem,
  type TripAction,
} from '@/domain/permissions';

import type { Db, StoredUser } from './db';
import { checkPassword, hashPassword, newToken } from './passwords';
import * as s from './schemas';
import { buildSeed } from './seed';

// Everything the app can ask the server, one entry per action. Each one checks who is
// asking and what their role on the trip allows (src/domain/permissions.ts, the same rules
// the app uses to show or hide buttons). Handlers are synchronous and only touch `db`.

export type ApiErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'email_taken'
  | 'invalid_credentials'
  | 'invalid_code';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/** Everything the signed-in user may see, in one go. */
export type Snapshot = {
  rev: number;
  user: User;
  documents: TravelDocument[];
  trips: Trip[];
  members: TripMember[];
  /** The user and everyone on their trips (name and email only). */
  people: PublicUser[];
  /** Active codes of the trips the user may invite to. */
  invites: TripInvite[];
  /** Own bags, plus the others' bags on trips the user organises. */
  packing: PackingItem[];
  /** Personal events, plus the trips' agenda (pending suggestions only for organisers). */
  events: TripEvent[];
  /** Own reviews only: the Histórico is personal. */
  reviews: TripReview[];
};

type Ctx = { db: Db; me: StoredUser; token: string };

const publicAction = <S extends z.ZodType, O>(
  write: boolean,
  input: S,
  run: (db: Db, input: z.output<S>) => O,
) => ({ auth: false as const, write, input, run });

const action = <S extends z.ZodType, O>(
  write: boolean,
  input: S,
  run: (ctx: Ctx, input: z.output<S>) => O,
) => ({ auth: true as const, write, input, run });

// Helpers --------------------------------------------------------------------------------

const uid = () => randomUUID();
const now = () => new Date().toISOString();

const notFound = (message: string) => new ApiError(404, 'not_found', message);
const forbidden = () => new ApiError(403, 'forbidden', 'Não tens permissão para fazer isto.');

/** Patch semantics over JSON: a missing key keeps the value, `null` removes it. */
export function applyPatch<T extends object>(row: T, changes: object): T {
  const next: Record<string, unknown> = { ...(row as Record<string, unknown>) };
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) delete next[key];
    else if (value !== undefined) next[key] = value;
  }
  return next as T;
}

function replaceRow<T extends { id: ID }>(rows: T[], row: T) {
  rows[rows.findIndex((r) => r.id === row.id)] = row;
}

/** Removes in place: handlers work on the very arrays that get saved. */
function removeWhere<T>(rows: T[], drop: (row: T) => boolean) {
  for (let i = rows.length - 1; i >= 0; i--) if (drop(rows[i])) rows.splice(i, 1);
}

const toUser = ({ salt: _salt, passwordHash: _hash, ...user }: StoredUser): User => user;
const toPublic = ({ id, name, email }: User): PublicUser => ({ id, name, email });

function startSession(db: Db, user: StoredUser) {
  const token = newToken();
  db.sessions.push({ token, userId: user.id, createdAt: now() });
  return { token, user: toUser(user) };
}

const memberOf = (db: Db, tripId: ID, userId: ID) =>
  db.members.find((m) => m.tripId === tripId && m.userId === userId);

/** The caller's role on a trip. Trips they're not on don't exist for them (404, not 403). */
function roleOn(ctx: Ctx, tripId: ID): Role {
  const member = memberOf(ctx.db, tripId, ctx.me.id);
  if (!member) throw notFound('Viagem não encontrada.');
  return member.role;
}

function requireCan(ctx: Ctx, tripId: ID, what: TripAction) {
  const role = roleOn(ctx, tripId);
  if (!can(role, what)) throw forbidden();
  return role;
}

function checkDates(trip: Pick<Trip, 'startDate' | 'endDate'>) {
  if (trip.startDate > trip.endDate) {
    throw new ApiError(400, 'bad_request', 'A viagem não pode acabar antes de começar.');
  }
}

/** Someone else on the trip (owners act on others, never on themselves here). */
function otherMember(ctx: Ctx, tripId: ID, userId: ID) {
  const member = memberOf(ctx.db, tripId, userId);
  if (!member) throw notFound('Participante não encontrado.');
  if (userId === ctx.me.id) throw new ApiError(400, 'bad_request', 'Não podes fazer isto a ti.');
  return member;
}

/** Takes someone off a trip: their bag and review go; what they suggested stays. */
function dropMember(db: Db, tripId: ID, userId: ID) {
  removeWhere(db.members, (m) => m.tripId === tripId && m.userId === userId);
  removeWhere(db.packing, (i) => i.tripId === tripId && i.memberId === userId);
  removeWhere(db.reviews, (r) => r.tripId === tripId && r.userId === userId);
  for (const item of db.packing) {
    if (item.tripId === tripId && item.suggestedBy === userId) delete item.suggestedBy;
  }
}

function ownDocument(ctx: Ctx, id: ID) {
  const doc = ctx.db.documents.find((d) => d.id === id && d.userId === ctx.me.id);
  if (!doc) throw notFound('Documento não encontrado.');
  return doc;
}

function visibleItem(ctx: Ctx, id: ID) {
  const item = ctx.db.packing.find((i) => i.id === id);
  const role = item && memberOf(ctx.db, item.tripId, ctx.me.id)?.role;
  if (!item || !role || !canViewItem(item, ctx.me.id, role)) throw notFound('Item não encontrado.');
  return { item, role };
}

/** Trip events are managed by the organisers; personal events by their owner. */
function editableEvent(ctx: Ctx, id: ID) {
  const event = ctx.db.events.find((e) => e.id === id);
  if (!event || (!event.tripId && event.userId !== ctx.me.id)) {
    throw notFound('Evento não encontrado.');
  }
  if (event.tripId) requireCan(ctx, event.tripId, 'events.manage');
  return event;
}

// Invite codes: 6 characters, no look-alikes (0/O, 1/I/L), valid for a week.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_DAYS = 7;

function newCode(db: Db) {
  let code: string;
  do {
    code = Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('');
  } while (db.invites.some((i) => i.code === code));
  return code;
}

function findInvite(db: Db, code: string) {
  const invite = db.invites.find((i) => i.code === code && i.expiresAt > now());
  if (!invite || !db.trips.some((t) => t.id === invite.tripId)) {
    throw new ApiError(404, 'invalid_code', 'Este código não existe ou já expirou.');
  }
  return invite;
}

export function snapshot(db: Db, me: StoredUser): Snapshot {
  const roles = new Map(
    db.members.filter((m) => m.userId === me.id).map((m) => [m.tripId, m.role]),
  );
  const onTrip = (tripId: ID | undefined) => !!tripId && roles.has(tripId);
  const members = db.members.filter((m) => onTrip(m.tripId));
  const peopleIds = new Set([me.id, ...members.map((m) => m.userId)]);
  const time = now();

  return {
    rev: db.rev,
    user: toUser(me),
    documents: db.documents.filter((d) => d.userId === me.id),
    trips: db.trips.filter((t) => onTrip(t.id)),
    members,
    people: db.users.filter((u) => peopleIds.has(u.id)).map(toPublic),
    invites: db.invites.filter(
      (i) => can(roles.get(i.tripId), 'trip.invite') && i.expiresAt > time,
    ),
    packing: db.packing.filter(
      (i) => onTrip(i.tripId) && canViewItem(i, me.id, roles.get(i.tripId)),
    ),
    // Suggestions wait for an organiser to accept them: participants only see the agenda.
    events: db.events.filter((e) =>
      e.tripId
        ? onTrip(e.tripId) && (e.status === 'accepted' || can(roles.get(e.tripId), 'events.manage'))
        : e.userId === me.id,
    ),
    reviews: db.reviews.filter((r) => r.userId === me.id && onTrip(r.tripId)),
  };
}

const none = z.object({});
const { id, tripId, userId } = s.ids;

// Actions --------------------------------------------------------------------------------

export const actions = {
  'auth.register': publicAction(
    true,
    z.object({ email: s.email, password: s.password }),
    (db, input) => {
      if (db.users.some((u) => u.email === input.email)) {
        throw new ApiError(409, 'email_taken', 'Já existe uma conta com este email.');
      }
      const user: StoredUser = {
        id: uid(),
        email: input.email,
        name: '',
        conditions: { wheelchair: false, allergies: [], medication: [] },
        onboarded: false,
        createdAt: now(),
        ...hashPassword(input.password),
      };
      db.users.push(user);
      return startSession(db, user);
    },
  ),

  'auth.login': publicAction(
    true,
    z.object({ email: z.string().trim().toLowerCase(), password: z.string() }),
    (db, input) => {
      const user = db.users.find((u) => u.email === input.email);
      if (!user || !checkPassword(input.password, user)) {
        throw new ApiError(401, 'invalid_credentials', 'Email ou palavra-passe incorretos.');
      }
      return startSession(db, user);
    },
  ),

  'auth.logout': action(true, none, ({ db, token }) => {
    removeWhere(db.sessions, (session) => session.token === token);
    return null;
  }),

  /** The whole picture, or just `unchanged` when nothing was written since `rev`. */
  sync: action(false, z.object({ rev: z.number().int().nullish() }), ({ db, me }, input) =>
    input.rev === db.rev ? { rev: db.rev, unchanged: true as const } : snapshot(db, me),
  ),

  'user.update': action(true, z.object({ patch: s.userPatch }), ({ db, me }, { patch }) => {
    const updated = applyPatch(me, patch);
    replaceRow(db.users, updated);
    return toUser(updated);
  }),

  // Documents: always personal.

  'documents.create': action(true, z.object({ data: s.documentData }), (ctx, { data }) => {
    const doc = applyPatch({ id: uid(), userId: ctx.me.id } as TravelDocument, data);
    ctx.db.documents.push(doc);
    return doc;
  }),

  'documents.update': action(true, z.object({ id, patch: s.documentPatch }), (ctx, input) => {
    const updated = applyPatch(ownDocument(ctx, input.id), input.patch);
    replaceRow(ctx.db.documents, updated);
    return updated;
  }),

  'documents.remove': action(true, z.object({ id }), (ctx, input) => {
    ownDocument(ctx, input.id);
    removeWhere(ctx.db.documents, (d) => d.id === input.id);
    return null;
  }),

  // Trips and who is on them.

  /**
   * The creator becomes the organiser ("owner"). Their bag and the suggested events come in the
   * same request, so a trip is never left half-created.
   */
  'trips.create': action(
    true,
    z.object({
      data: s.tripData,
      items: z.array(s.bagItem).max(300).nullish(),
      events: z.array(s.tripEventData).max(50).nullish(),
    }),
    (ctx, input) => {
      const { data } = input;
      checkDates(data);
      if (data.basedOnTripId) roleOn(ctx, data.basedOnTripId);
      const trip = applyPatch({ id: uid(), createdBy: ctx.me.id, createdAt: now() } as Trip, data);
      const member: TripMember = {
        id: uid(),
        tripId: trip.id,
        userId: ctx.me.id,
        role: 'owner',
        joinedAt: trip.createdAt,
      };
      const items = (input.items ?? []).map((item): PackingItem => ({
        ...item,
        id: uid(),
        tripId: trip.id,
        memberId: ctx.me.id,
      }));
      const events = (input.events ?? []).map((event) =>
        applyPatch({ id: uid(), userId: ctx.me.id, tripId: trip.id } as TripEvent, event),
      );
      ctx.db.trips.push(trip);
      ctx.db.members.push(member);
      ctx.db.packing.push(...items);
      ctx.db.events.push(...events);
      return { trip, member, items, events };
    },
  ),

  'trips.update': action(true, z.object({ id, patch: s.tripPatch }), (ctx, input) => {
    requireCan(ctx, input.id, 'trip.edit');
    const trip = ctx.db.trips.find((t) => t.id === input.id)!;
    const updated = applyPatch(trip, input.patch);
    checkDates(updated);
    replaceRow(ctx.db.trips, updated);
    return updated;
  }),

  /** Deletes it for everyone, with every bag, event, code and review. */
  'trips.remove': action(true, z.object({ id }), (ctx, input) => {
    requireCan(ctx, input.id, 'trip.delete');
    const { db } = ctx;
    const ofTrip = (row: { tripId?: ID }) => row.tripId === input.id;
    removeWhere(db.trips, (t) => t.id === input.id);
    removeWhere(db.members, ofTrip);
    removeWhere(db.invites, ofTrip);
    removeWhere(db.packing, ofTrip);
    removeWhere(db.events, ofTrip);
    removeWhere(db.reviews, ofTrip);
    return null;
  }),

  /** The organiser can't leave: they hand the trip over or delete it. */
  'trips.leave': action(true, z.object({ tripId }), (ctx, input) => {
    requireCan(ctx, input.tripId, 'trip.leave');
    dropMember(ctx.db, input.tripId, ctx.me.id);
    return null;
  }),

  /** Make someone co-organiser ("admin") or participant again. */
  'members.setRole': action(
    true,
    z.object({ tripId, userId, role: z.enum(['admin', 'member']) }),
    (ctx, input) => {
      requireCan(ctx, input.tripId, 'members.manage');
      const member = otherMember(ctx, input.tripId, input.userId);
      member.role = input.role;
      return member;
    },
  ),

  'members.remove': action(true, z.object({ tripId, userId }), (ctx, input) => {
    requireCan(ctx, input.tripId, 'members.manage');
    otherMember(ctx, input.tripId, input.userId);
    dropMember(ctx.db, input.tripId, input.userId);
    return null;
  }),

  /** Hands the trip over: they become the organiser, the caller a co-organiser. */
  'members.transfer': action(true, z.object({ tripId, userId }), (ctx, input) => {
    requireCan(ctx, input.tripId, 'members.transfer');
    otherMember(ctx, input.tripId, input.userId).role = 'owner';
    memberOf(ctx.db, input.tripId, ctx.me.id)!.role = 'admin';
    return null;
  }),

  // Invites.

  /** The trip's current code (a new one with `renew`, which also cancels the old one). */
  'invites.create': action(
    true,
    z.object({ tripId, renew: z.boolean().nullish() }),
    (ctx, input) => {
      requireCan(ctx, input.tripId, 'trip.invite');
      const { db } = ctx;
      const time = now();
      removeWhere(
        db.invites,
        (i) => i.expiresAt <= time || (!!input.renew && i.tripId === input.tripId),
      );
      const current = db.invites.find((i) => i.tripId === input.tripId);
      if (current) return current;
      const invite: TripInvite = {
        id: uid(),
        tripId: input.tripId,
        code: newCode(db),
        createdBy: ctx.me.id,
        expiresAt: addDays(new Date(), INVITE_DAYS).toISOString(),
      };
      db.invites.push(invite);
      return invite;
    },
  ),

  /** What the join screen shows before the user accepts. */
  'invites.preview': action(false, z.object({ code: s.inviteCode }), ({ db, me }, input) => {
    const invite = findInvite(db, input.code);
    const trip = db.trips.find((t) => t.id === invite.tripId)!;
    const members = db.members.filter((m) => m.tripId === trip.id);
    const ownerId = members.find((m) => m.role === 'owner')?.userId;
    const { id: _id, createdBy: _by, createdAt: _at, basedOnTripId: _base, ...details } = trip;
    return {
      tripId: trip.id,
      trip: details,
      organizer: db.users.find((u) => u.id === ownerId)?.name ?? '',
      memberCount: members.length,
      alreadyMember: members.some((m) => m.userId === me.id),
    };
  }),

  /** Joins as participant with `items` as their bag (built on the phone, with their needs). */
  'invites.accept': action(
    true,
    z.object({ code: s.inviteCode, items: z.array(s.bagItem).max(300) }),
    ({ db, me }, input) => {
      const { tripId: joined } = findInvite(db, input.code);
      if (!memberOf(db, joined, me.id)) {
        db.members.push({
          id: uid(),
          tripId: joined,
          userId: me.id,
          role: 'member',
          joinedAt: now(),
        });
        db.packing.push(
          ...input.items.map((item) => ({ ...item, id: uid(), tripId: joined, memberId: me.id })),
        );
      }
      return { tripId: joined };
    },
  ),

  // Bags.

  /** Into your own bag, or (organisers) a suggestion into someone else's. */
  'packing.createMany': action(
    true,
    z.object({ items: z.array(s.itemData).max(300) }),
    (ctx, input) => {
      // Everything is checked before anything is added.
      const created = input.items.map((data): PackingItem => {
        const role = roleOn(ctx, data.tripId);
        if (data.memberId === ctx.me.id) return { ...data, id: uid() };
        if (!can(role, 'bags.suggest')) throw forbidden();
        if (!memberOf(ctx.db, data.tripId, data.memberId)) {
          throw notFound('Participante não encontrado.');
        }
        // Only the bag's owner packs it.
        return { ...data, id: uid(), suggestedBy: ctx.me.id, packed: false };
      });
      ctx.db.packing.push(...created);
      return created;
    },
  ),

  'packing.update': action(true, z.object({ id, patch: s.itemPatch }), (ctx, input) => {
    const { item, role } = visibleItem(ctx, input.id);
    const { packed, ...details } = input.patch;
    if (packed !== undefined && !canTogglePacked(item, ctx.me.id)) throw forbidden();
    if (Object.keys(details).length && !canEditItem(item, ctx.me.id, role)) throw forbidden();
    const updated = applyPatch(item, input.patch);
    replaceRow(ctx.db.packing, updated);
    return updated;
  }),

  'packing.remove': action(true, z.object({ id }), (ctx, input) => {
    const { item, role } = visibleItem(ctx, input.id);
    if (!canEditItem(item, ctx.me.id, role)) throw forbidden();
    removeWhere(ctx.db.packing, (i) => i.id === input.id);
    return null;
  }),

  // Events.

  'events.createMany': action(
    true,
    z.object({ events: z.array(s.eventData).max(50) }),
    (ctx, input) => {
      const created = input.events.map((data) => {
        if (data.tripId) requireCan(ctx, data.tripId, 'events.manage');
        return applyPatch({ id: uid(), userId: ctx.me.id } as TripEvent, data);
      });
      ctx.db.events.push(...created);
      return created;
    },
  ),

  'events.update': action(true, z.object({ id, patch: s.eventPatch }), (ctx, input) => {
    const event = editableEvent(ctx, input.id);
    if (input.patch.tripId) requireCan(ctx, input.patch.tripId, 'events.manage');
    const updated = applyPatch(event, input.patch);
    replaceRow(ctx.db.events, updated);
    return updated;
  }),

  'events.remove': action(true, z.object({ id }), (ctx, input) => {
    editableEvent(ctx, input.id);
    removeWhere(ctx.db.events, (e) => e.id === input.id);
    return null;
  }),

  // Reviews ("Como correu?"): one per person per trip.

  'reviews.save': action(true, z.object({ data: s.reviewData }), (ctx, { data }) => {
    roleOn(ctx, data.tripId);
    removeWhere(ctx.db.reviews, (r) => r.tripId === data.tripId && r.userId === ctx.me.id);
    const review: TripReview = { id: uid(), userId: ctx.me.id, ...data };
    ctx.db.reviews.push(review);
    return review;
  }),

  /** Development only: everyone's data back to the demo (and everyone signed out). */
  'dev.reset': action(true, none, ({ db }) => {
    if (process.env.NODE_ENV === 'production') throw forbidden();
    Object.assign(db, buildSeed(new Date()), { rev: db.rev });
    return null;
  }),
};

export type Actions = typeof actions;
export type ActionName = keyof Actions;
export type ActionInput<A extends ActionName> = z.input<Actions[A]['input']>;
export type ActionOutput<A extends ActionName> = ReturnType<Actions[A]['run']>;
