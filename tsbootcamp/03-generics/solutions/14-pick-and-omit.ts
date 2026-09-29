// ─────────────────────────────────────────────────────────────────────────
//  14 · pick & omit — SOLUTION                            ★★★ stretch
//  run: node ../run.js solutions/14-pick-and-omit.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole trick is where K comes from. `keys: readonly
//  K[]` makes TS infer K from the ELEMENTS of the array literal, so
//  `['id', 'name']` gives `K = 'id' | 'name'` — one type parameter
//  holding a union of literal key names. `Pick<T, K>` then distributes
//  over that union and produces `{ id: number; name: string }`.
//
//  Type `keys: string[]` instead and every typo compiles while the return
//  type collapses to something useless. Type it `(keyof T)[]` and typos
//  are caught but K is gone — you would have to return the whole T.
//
//  Both bodies need one assertion. The accumulator cannot satisfy
//  `Pick<T, K>` until the loop has filled it, and `delete` cannot prove
//  it produced `Omit<T, K>`. Cast once, at the boundary, with the
//  signature carrying the truth.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

const user = { id: 1, name: 'Ada', admin: true, password: 'hunter2' };

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) out[key] = obj[key];
  return out;
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Omit<T, K> {
  const out = { ...obj };
  for (const key of keys) delete out[key];
  return out as Omit<T, K>;
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
