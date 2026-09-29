// ─────────────────────────────────────────────────────────────────────────
//  03 · public and private views                            ★★☆ core
//  concepts: Pick · Omit · DTOs from one source of truth
//  run: node ../run.js exercises/03-pick-omit-dto.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  One User row, three audiences. The API response must never carry the
//  password hash or the email; a sidebar only needs id + name; the login
//  code only wants the two secret fields. Derive all three from User so
//  adding a column later cannot silently leak it.
//
//      toPublicUser(user)   → { id, name, role, createdAt }
//      toSummary(user)      → { id, name }
//
//  Rule of thumb: Pick when the safe list is short, Omit when the unsafe
//  list is short. For secrets, Omit is the one that fails safe... or does
//  it? Think about what happens when a new secret column appears.
//
//  hint: both take a UNION of key literals: Pick<User, 'id' | 'name'>

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'member';
  createdAt: string;
}

export type PublicUser = TODO;
export type UserSummary = TODO;
export type Credentials = TODO;

export function toPublicUser(user: User): PublicUser {
  throw new Error('TODO');
}

export function toSummary(user: User): UserSummary {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

const ada: User = {
  id: 'u1',
  name: 'Ada',
  email: 'ada@example.com',
  passwordHash: 'x'.repeat(16),
  role: 'admin',
  createdAt: '1843-01-01',
};

test('the public view keeps the harmless fields', () => {
  eq(toPublicUser(ada), {
    id: 'u1',
    name: 'Ada',
    role: 'admin',
    createdAt: '1843-01-01',
  });
});

test('the public view carries no secrets at all', () => {
  const pub = toPublicUser(ada) as Record<string, unknown>;
  ok(!('passwordHash' in pub));
  ok(!('email' in pub));
});

test('the summary is exactly two fields', () => {
  eq(toSummary(ada), { id: 'u1', name: 'Ada' });
});

test('neither view mutates the user', () => {
  toPublicUser(ada);
  toSummary(ada);
  eq(ada.email, 'ada@example.com');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<
    PublicUser,
    {
      id: string;
      name: string;
      role: 'admin' | 'member';
      createdAt: string;
    }
  >
>;
type _t2 = Expect<Equal<UserSummary, { id: string; name: string }>>;
type _t3 = Expect<
  Equal<Credentials, { email: string; passwordHash: string }>
>;
type _t4 = Expect<Equal<keyof PublicUser, 'id' | 'name' | 'role' | 'createdAt'>>;

function _typeTests() {
  const pub = toPublicUser(ada);
  const role: 'admin' | 'member' = pub.role;
  use(role);

  // @ts-expect-error — the hash is gone from the type, not just the object
  pub.passwordHash;

  // @ts-expect-error — and so is the email
  pub.email;

  // @ts-expect-error — the summary really is only id + name
  toSummary(ada).role;

  // @ts-expect-error — Credentials is only the two secret fields
  const creds: Credentials = { email: 'a@b.c', passwordHash: 'h', name: 'x' };
  use(creds);
}
use(_typeTests);
