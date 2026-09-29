// ─────────────────────────────────────────────────────────────────────────
//  06 · getProp                                           ★★☆ core
//  concepts: keyof · indexed access types
//  run: node ../run.js exercises/06-get-prop.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `keyof T` is the union of T's key names. `T[K]` is the type stored at
//  key K — an indexed access type. Together they turn a property read
//  into something the compiler can follow:
//
//      getProp(user, 'id')     → 1        typed number
//      getProp(user, 'name')   → 'Ada'    typed string
//      getProp(user, 'email')  → compile error, no such key
//      keysOf(user)            → ['id', 'name', 'admin']
//
//  Two type parameters: T for the object, K for the key — and K has to be
//  constrained to `keyof T`, or `obj[key]` will not compile.
//
//  hint: `Object.keys` is typed `string[]`, not `(keyof T)[]`; one cast,
//  with a comment, is the accepted price

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

const user = { id: 1, name: 'Ada', admin: true };

export function getProp(obj: TODO, key: TODO): TODO {
  throw new Error('TODO');
}

export function keysOf(obj: TODO): TODO {
  throw new Error('TODO');
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
