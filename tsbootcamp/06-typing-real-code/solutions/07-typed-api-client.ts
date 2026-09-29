// ─────────────────────────────────────────────────────────────────────────
//  07 · a typed API client — SOLUTION                      ★★★ stretch
//  run: node ../run.js solutions/07-typed-api-client.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Endpoints` is a map from a route string to a little
//  record describing that route. Everything else is derived:
//  `Endpoint = keyof Endpoints`, `ResponseOf<E> = Endpoints[E]['response']`
//  — a chained indexed access — and `InitOf<E> = Omit<Endpoints[E],
//  'response'>`, which is "whatever is left once you take the answer
//  away". Add a route to the interface and every call site can use it
//  immediately; rename one and every stale call fails to compile.
//
//  `request` is generic in E, and E is inferred from the string literal
//  you pass. That single inference drives both the argument check and the
//  return type — the reason the API feels like it "knows".
//
//  The `as ResponseOf<E>` is the honest centre of this file. Data off a
//  socket is `unknown`; something has to promise it is a `User[]`. Doing
//  it once, in one named place, is the difference between a typed client
//  and a lie: this is exactly the line you would later replace with a
//  schema parse without touching a single caller. Note the shape of the
//  fix — the assertion lives at the boundary, and inference does the rest
//  inside.
//
//  Taking the transport as a parameter is the other half. `createClient`
//  never mentions `fetch`, so tests inject a fake and nothing is mocked
//  globally.

import { test, eq, rejects } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Role = 'admin' | 'member';
export interface User {
  id: number;
  name: string;
  role: Role;
}
export interface NewUser {
  name: string;
  role: Role;
}

// the whole API in one place
export interface Endpoints {
  'GET /users': { query: { role?: Role }; response: User[] };
  'GET /users/:id': { params: { id: number }; response: User };
  'POST /users': { body: NewUser; response: User };
  'DELETE /users/:id': { params: { id: number }; response: { deleted: number } };
}

export type Endpoint = keyof Endpoints;
export type ResponseOf<E extends Endpoint> = Endpoints[E]['response'];
export type InitOf<E extends Endpoint> = Omit<Endpoints[E], 'response'>;

// the transport, so the tests can hand in a fake one
export type Fetcher = (
  endpoint: string,
  init: Record<string, unknown>
) => Promise<unknown>;

export interface Client {
  request<E extends Endpoint>(endpoint: E, init: InitOf<E>): Promise<ResponseOf<E>>;
}

export function createClient(fetcher: Fetcher): Client {
  async function request<E extends Endpoint>(
    endpoint: E,
    init: InitOf<E>
  ): Promise<ResponseOf<E>> {
    const payload = await fetcher(endpoint, init);
    // the trust boundary — everything past here is typed
    return payload as ResponseOf<E>;
  }
  return { request };
}

// ── a fake server · complete, nothing to do here ─────────────────────────

export function createFakeFetcher(): Fetcher {
  let rows: User[] = [
    { id: 1, name: 'ada', role: 'admin' },
    { id: 2, name: 'bo', role: 'member' },
    { id: 3, name: 'cy', role: 'member' },
  ];
  let nextId = 4;

  return async (endpoint, init) => {
    const params = init.params as { id: number } | undefined;
    const query = init.query as { role?: Role } | undefined;
    switch (endpoint) {
      case 'GET /users':
        return query?.role ? rows.filter((u) => u.role === query.role) : [...rows];
      case 'GET /users/:id': {
        const found = rows.find((u) => u.id === params?.id);
        if (!found) throw new Error(`no user ${params?.id}`);
        return found;
      }
      case 'POST /users': {
        const created: User = { id: nextId++, ...(init.body as NewUser) };
        rows.push(created);
        return created;
      }
      case 'DELETE /users/:id': {
        const before = rows.length;
        rows = rows.filter((u) => u.id !== params?.id);
        return { deleted: before - rows.length };
      }
      default:
        throw new Error(`unknown endpoint: ${endpoint}`);
    }
  };
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('GET /users returns the whole list', async () => {
  const client = createClient(createFakeFetcher());
  const users = await client.request('GET /users', { query: {} });
  eq(users.map((u: User) => u.name), ['ada', 'bo', 'cy']);
});

test('GET /users narrows on the query it was given', async () => {
  const client = createClient(createFakeFetcher());
  const admins = await client.request('GET /users', { query: { role: 'admin' } });
  eq(admins.length, 1);
  eq(admins[0].name, 'ada');
});

test('GET /users/:id returns exactly one user', async () => {
  const client = createClient(createFakeFetcher());
  const user = await client.request('GET /users/:id', { params: { id: 2 } });
  eq(user.name, 'bo');
});

test('POST /users creates a user the next GET can see', async () => {
  const client = createClient(createFakeFetcher());
  const created = await client.request('POST /users', {
    body: { name: 'dee', role: 'member' },
  });
  eq(created.id, 4);
  const users = await client.request('GET /users', { query: {} });
  eq(users.length, 4);
});

test('DELETE /users/:id reports how many rows went', async () => {
  const client = createClient(createFakeFetcher());
  eq(await client.request('DELETE /users/:id', { params: { id: 1 } }), { deleted: 1 });
  eq(await client.request('DELETE /users/:id', { params: { id: 1 } }), { deleted: 0 });
});

test('a transport failure surfaces as a rejection', async () => {
  const client = createClient(createFakeFetcher());
  await rejects(client.request('GET /users/:id', { params: { id: 99 } }), 'no user 99');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _a1 = Expect<Equal<ResponseOf<'GET /users'>, User[]>>;
type _a2 = Expect<Equal<ResponseOf<'DELETE /users/:id'>, { deleted: number }>>;
type _a3 = Expect<Equal<InitOf<'POST /users'>, { body: NewUser }>>;

async function _typeTests() {
  const client = createClient(createFakeFetcher());

  const users: User[] = await client.request('GET /users', { query: {} });
  const one: User = await client.request('GET /users/:id', { params: { id: 1 } });
  use(users, one);

  // @ts-expect-error — there is no such endpoint in the map
  client.request('GET /nope', {});

  // @ts-expect-error — POST /users needs a body
  client.request('POST /users', {});

  // @ts-expect-error — a user id is a number
  client.request('GET /users/:id', { params: { id: '1' } });

  // @ts-expect-error — GET /users answers with a list, not one user
  const wrong: User = await client.request('GET /users', { query: {} });
  use(wrong);
}
use(_typeTests);
