// ─────────────────────────────────────────────────────────────────────────
//  07 · pluck & setProp                                   ★★☆ core
//  concepts: keyof · indexed access · immutable updates
//  run: node ../run.js exercises/07-pluck-and-set-prop.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Same `T` / `K extends keyof T` pair as 06, now doing real work.
//
//      pluck(users, 'name')          → ['Ada', 'Linus']   typed string[]
//      pluck(users, 'id')            → [1, 2]             typed number[]
//      setProp(user, 'name', 'Bob')  → a NEW user object
//      setProp(user, 'id', 'seven')  → compile error, id is a number
//
//  `setProp` never mutates: it returns a fresh object with one key
//  replaced, and the value has to match the type stored at that key.
//
//  hint: the value parameter is not `unknown` and not `T[keyof T]` — it
//  is the type at exactly that one key

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

const users = [
  { id: 1, name: 'Ada', admin: true },
  { id: 2, name: 'Linus', admin: false },
];

export function pluck(items: TODO, key: TODO): TODO {
  throw new Error('TODO');
}

export function setProp(obj: TODO, key: TODO, value: TODO): TODO {
  throw new Error('TODO');
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
