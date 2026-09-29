// ─────────────────────────────────────────────────────────────────────────
//  07 · a typed API client                                 ★★★ stretch
//  concepts: endpoint maps · indexed access · one cast at the boundary
//  run: node ../run.js exercises/07-typed-api-client.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Every team eventually writes this. One interface describes the whole
//  API — `'GET /users'` maps to what you must send and what comes back —
//  and `request` looks the answer up in that map. From then on, the
//  response type at every call site is free.
//
//      client.request('GET /users', { query: {} })        → User[]
//      client.request('GET /users/:id', { params: { id: 1 } }) → User
//      client.request('POST /users', { body: { name, role } }) → User
//      client.request('GET /nope', {})                    → compile error
//
//  Note what `request` does NOT do: validate. The fetcher hands back
//  `unknown` and exactly one assertion converts it. That assertion is the
//  trust boundary — one place to add a runtime schema check later, rather
//  than `any` sprayed through the app.
//
//  The tests inject a fake fetcher, which is the other reason to take the
//  transport as an argument.
//
//  hint: `Endpoints[E]['response']` is an indexed access — it reads a
//  property off a type the same way a value reads one off an object.
//  `Omit<Endpoints[E], 'response'>` gives you the request half

import { test, eq, rejects } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

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

export type Endpoint = TODO;
export type ResponseOf<E extends Endpoint> = TODO;
export type InitOf<E extends Endpoint> = TODO;

// the transport, so the tests can hand in a fake one
export type Fetcher = (
  endpoint: string,
  init: Record<string, unknown>
) => Promise<unknown>;

export interface Client {
  request: TODO;
}

export function createClient(fetcher: TODO): TODO {
  throw new Error('TODO');
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
