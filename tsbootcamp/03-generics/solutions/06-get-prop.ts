// ─────────────────────────────────────────────────────────────────────────
//  06 · getProp — SOLUTION                                ★★☆ core
//  run: node ../run.js solutions/06-get-prop.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `K extends keyof T` is the constraint that makes the
//  whole thing safe. It says K is one of T's actual key names, which
//  gives `obj[key]` a meaning — the indexed access type `T[K]`. Because K
//  is inferred from the literal `'id'`, the return type is `number` and
//  not `number | string | boolean`.
//
//  Two shortcuts that both lose the point: `key: string` (any typo
//  compiles) and `: T[keyof T]` as the return type (every read comes back
//  as the union of all property types). Precision comes from keeping K a
//  separate parameter.
//
//  `keysOf` needs a cast. `Object.keys` is typed `string[]` on purpose —
//  a value can carry extra keys at runtime, so TS refuses to promise the
//  list is exactly `keyof T`. Own the assertion, comment it, move on.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

const user = { id: 1, name: 'Ada', admin: true };

export function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

export function keysOf<T extends object>(obj: T): (keyof T)[] {
  // safe here: we only ever call it on plain object literals
  return Object.keys(obj) as (keyof T)[];
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('reads a number property', () => {
  eq(getProp(user, 'id'), 1);
});

test('reads a string property', () => {
  eq(getProp(user, 'name'), 'Ada');
});

test('reads a nested object by reference', () => {
  const row = { meta: { hits: 2 } };
  eq(getProp(row, 'meta'), { hits: 2 });
});

test('keysOf lists every own key', () => {
  eq(keysOf(user), ['id', 'name', 'admin']);
});

test('keysOf on an empty object is empty', () => {
  eq(keysOf({}), []);
});

// ──────────────────────────── type tests ─────────────────────────────────

type User = typeof user;
type _r1 = Expect<Equal<ReturnType<typeof getProp<User, 'name'>>, string>>;
type _r2 = Expect<Equal<ReturnType<typeof keysOf<User>>, ('id' | 'name' | 'admin')[]>>;

function _typeTests() {
  const id = getProp(user, 'id');
  type _i = Expect<Equal<typeof id, number>>;

  const admin = getProp(user, 'admin');
  type _a = Expect<Equal<typeof admin, boolean>>;
  use(id, admin);

  // @ts-expect-error — 'email' is not a key of user
  getProp(user, 'email');

  // @ts-expect-error — name is a string, and a string is not a number
  const wrong: number = getProp(user, 'name');
  use(wrong);

  const keys = keysOf(user);
  type _k = Expect<Equal<typeof keys, ('id' | 'name' | 'admin')[]>>;
  use(keys);

  // @ts-expect-error — keysOf wants an object, not a primitive
  keysOf(42);
}
use(_typeTests);
