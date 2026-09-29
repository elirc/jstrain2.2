// ─────────────────────────────────────────────────────────────────────────
//  14 · pick & omit                                       ★★★ stretch
//  concepts: keyof unions · using the built-in utility types
//  run: node ../run.js exercises/14-pick-and-omit.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Runtime functions whose return TYPES are computed from the arguments.
//
//      pick(user, ['id', 'name'])   → { id: 1, name: 'Ada' }
//                                     typed { id: number; name: string }
//      omit(user, ['password'])     → everything except password
//
//  `K extends keyof T` is inferred from the array literal, so K is the
//  UNION of the keys you listed — `'id' | 'name'`. Hand that to the
//  built-in `Pick<T, K>` / `Omit<T, K>` and the caller gets a type that
//  names exactly the keys that survived.
//
//  (Using the built-ins is the right call here. Writing `Pick` and `Omit`
//  from scratch is module 04's job — this one is about wiring the type
//  parameters up so the built-ins have something precise to chew on.)
//
//  hint: keys is an ARRAY of K, not a single K — `keys: readonly K[]`;
//  and both bodies need one cast to build the object up

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

const user = { id: 1, name: 'Ada', admin: true, password: 'hunter2' };

export function pick(obj: TODO, keys: TODO): TODO {
  throw new Error('TODO');
}

export function omit(obj: TODO, keys: TODO): TODO {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('keeps only the listed keys', () => {
  eq(pick(user, ['id', 'name']), { id: 1, name: 'Ada' });
});

test('picking nothing gives an empty object', () => {
  eq(pick(user, []), {});
});

test('drops the listed keys', () => {
  eq(omit(user, ['password', 'admin']), { id: 1, name: 'Ada' });
});

test('omit does not mutate the original', () => {
  omit(user, ['password']);
  eq(user.password, 'hunter2');
});

test('pick returns a fresh object', () => {
  ok(pick(user, ['id']) !== user);
});

// ──────────────────────────── type tests ─────────────────────────────────

type User = typeof user;
type _r1 = Expect<
  Equal<ReturnType<typeof pick<User, 'id' | 'name'>>, { id: number; name: string }>
>;
type _r2 = Expect<
  Equal<
    ReturnType<typeof omit<User, 'password'>>,
    { id: number; name: string; admin: boolean }
  >
>;

function _typeTests() {
  const small = pick(user, ['id', 'name']);
  type _p = Expect<Equal<typeof small, { id: number; name: string }>>;
  use(small);

  // @ts-expect-error — password was left behind, so it is not on the result
  small.password;

  const safe = omit(user, ['password']);
  type _o = Expect<Equal<typeof safe, { id: number; name: string; admin: boolean }>>;
  use(safe);

  // @ts-expect-error — omit removed it from the type, not just the object
  safe.password;

  // @ts-expect-error — 'email' is not a key of user
  pick(user, ['id', 'email']);
}
use(_typeTests);
