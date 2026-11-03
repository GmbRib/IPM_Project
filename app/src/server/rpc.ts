import { actions, ApiError } from './actions';
import { withDb, type Db, type StoredUser } from './db';

// One endpoint, POST /api/rpc, body { action, input }, "Authorization: Bearer <token>".
// Answers { data } or { error: { code, message } } with the matching HTTP status.

type AnyAction = {
  auth: boolean;
  write: boolean;
  input: { safeParse(raw: unknown): { success: boolean; data?: unknown; error?: unknown } };
  run: (ctx: never, input: never) => unknown;
};

function find(name: unknown): AnyAction {
  const def =
    typeof name === 'string' && Object.hasOwn(actions, name)
      ? (actions as Record<string, AnyAction>)[name]
      : undefined;
  if (!def) throw new ApiError(400, 'bad_request', 'Ação desconhecida.');
  return def;
}

/** Runs one action on `db` as the owner of `token`. The tests call this directly. */
export function dispatch(db: Db, name: string, rawInput: unknown, token: string | null) {
  const def = find(name);
  const parsed = def.input.safeParse(rawInput ?? {});
  if (!parsed.success) throw new ApiError(400, 'bad_request', 'Dados inválidos.');

  const run = def.run as (ctx: unknown, input: unknown) => unknown;
  if (!def.auth) return run(db, parsed.data);

  const session = token ? db.sessions.find((s) => s.token === token) : undefined;
  const me: StoredUser | undefined = session && db.users.find((u) => u.id === session.userId);
  if (!session || !me) {
    throw new ApiError(401, 'unauthorized', 'A tua sessão terminou. Entra outra vez.');
  }
  return run({ db, me, token }, parsed.data);
}

export async function handleRpc(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => null)) as {
      action?: unknown;
      input?: unknown;
    } | null;
    const def = find(body?.action);
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null;
    const data = await withDb(def.write, (db) =>
      dispatch(db, body!.action as string, body!.input, token),
    );
    return Response.json({ data: data ?? null });
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    console.error('[api/rpc]', error);
    return Response.json(
      { error: { code: 'server_error', message: 'Algo correu mal no servidor.' } },
      { status: 500 },
    );
  }
}
