// ─────────────────────────────────────────────────────────────────────────
//  07 · pluck & setProp — SOLUTION                        ★★☆ core
//  run: node ../run.js solutions/07-pluck-and-set-prop.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `pluck` maps a `T[]` down one column, so the element type
//  of the result is the indexed access `T[K]` — one key in, one column
//  type out. `T[K][]` reads oddly at first: "array of (T at K)".
//
//  `setProp` puts `T[K]` in the VALUE position instead, which is what
//  rejects `setProp(user, 'id', 'seven')` while accepting
//  `setProp(user, 'name', 'Bob')` — the same two parameters, aimed the
//  other way.
//
//  The spread `{ ...obj, [key]: value }` type-checks against T because TS
//  models it as an intersection of T with the one overwritten key. If a
//  version of TS ever fights you there, `const copy = { ...obj };
//  copy[key] = value;` is the equivalent that always compiles.
//
//  Taking `items: readonly T[]` costs nothing and lets callers pass
//  frozen or `as const` data.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

const users = [
  { id: 1, name: 'Ada', admin: true },
  { id: 2, name: 'Linus', admin: false },
];

export function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

export function setProp<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K]
): T {
  return { ...obj, [key]: value };
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('plucks a string column', () => {
  eq(pluck(users, 'name'), ['Ada', 'Linus']);
});

test('plucks a number column', () => {
  eq(pluck(users, 'id'), [1, 2]);
});

test('plucking an empty list gives an empty list', () => {
  const empty: { id: number }[] = [];
  eq(pluck(empty, 'id'), []);
});

test('setProp replaces one key', () => {
  eq(setProp(users[0]!, 'name', 'Bob').name, 'Bob');
});

test('setProp leaves the original untouched', () => {
  const before = { id: 1, name: 'Ada', admin: true };
  setProp(before, 'name', 'Bob');
  eq(before.name, 'Ada');
});

test('setProp returns a different object, not the same one', () => {
  const before = { id: 1, name: 'Ada', admin: true };
  ok(setProp(before, 'admin', false) !== before);
});

// ──────────────────────────── type tests ─────────────────────────────────

type User = { id: number; name: string; admin: boolean };
type _r1 = Expect<Equal<ReturnType<typeof pluck<User, 'name'>>, string[]>>;
type _r2 = Expect<Equal<ReturnType<typeof setProp<User, 'admin'>>, User>>;

function _typeTests() {
  const names = pluck(users, 'name');
  type _n = Expect<Equal<typeof names, string[]>>;
  use(names);

  const updated = setProp(users[0]!, 'name', 'Bob');
  type _u = Expect<Equal<typeof updated, { id: number; name: string; admin: boolean }>>;
  use(updated);

  // @ts-expect-error — 'email' is not a key of these rows
  pluck(users, 'email');

  // @ts-expect-error — id holds a number, so a string value is rejected
  setProp(users[0]!, 'id', 'seven');

  // @ts-expect-error — the key must exist before you can set it
  setProp(users[0]!, 'nickname', 'Ada');
}
use(_typeTests);
