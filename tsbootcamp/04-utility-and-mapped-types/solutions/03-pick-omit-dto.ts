// ─────────────────────────────────────────────────────────────────────────
//  03 · public and private views — SOLUTION                 ★★☆ core
//  run: node ../run.js solutions/03-pick-omit-dto.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Pick<T, K>` is `{ [P in K]: T[P] }` and `Omit<T, K>` is
//  `Pick<T, Exclude<keyof T, K>>`. Both derive from User, so a new column
//  shows up in the derived types automatically — that is the whole reason
//  not to hand-write a second interface.
//
//  Which way round for secrets? Omit *looks* fail-safe because you name
//  the dangerous fields, but the failure mode is the one that matters: add
//  a `resetToken` column tomorrow and Omit quietly publishes it, while
//  Pick quietly drops it. For anything that leaves the process, prefer
//  Pick — an allow-list. Omit is for the ergonomic cases ("everything
//  except id, because the database generates it").
//
//  Runtime note: `const { passwordHash, email, ...rest } = user` is the
//  idiomatic value-level Omit, and it mirrors the type exactly.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'member';
  createdAt: string;
}

export type PublicUser = Omit<User, 'email' | 'passwordHash'>;
export type UserSummary = Pick<User, 'id' | 'name'>;
export type Credentials = Pick<User, 'email' | 'passwordHash'>;

export function toPublicUser(user: User): PublicUser {
  const { email, passwordHash, ...pub } = user;
  return pub;
}

export function toSummary(user: User): UserSummary {
  return { id: user.id, name: user.name };
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
