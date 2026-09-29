// ─────────────────────────────────────────────────────────────────────────
//  08 · json path                                           ★★★ capstone
//  concepts: recursion · immutability · structural sharing · security
//  time: 30–40 min · 4 stages · 24 tests
//  run: node 08-json-path.js
// ─────────────────────────────────────────────────────────────────────────
//
//  THE PITCH
//  lodash's get/set/unset, and the machinery under every immutable state
//  update you have ever written by hand. Two ideas are worth the hour: a
//  path is DATA (parse it once into a list of keys, then everything else
//  is a loop), and an immutable set clones only the spine — the branches
//  you did not touch keep their identity, which is what makes
//  `prev.items === next.items` a valid "nothing changed here" check.
//
//  STAGES — do them in order, run the file after each one
//    1. parsePath + getPath .. 'a.b[0].c' → keys, then walk them
//    2. safe reads ........... missing paths, defaults, falsy values
//    3. setPath .............. immutable writes + structural sharing
//    4. deletePath + select .. immutable delete, and projection
//
//  THE SPEC
//
//      parsePath('a.b[0].c')  → ['a', 'b', 0, 'c']   (indexes are numbers)
//      getPath({ a: { b: [{ c: 7 }] } }, 'a.b[0].c')          → 7
//      getPath({}, 'a.b.c', 'none')                           → 'none'
//      getPath({ a: null }, 'a', 'none')                      → null
//
//      setPath({ a: { b: 1 } }, 'a.b', 2)   → a NEW { a: { b: 2 } }
//      setPath({}, 'a[0].b', 1)             → { a: [{ b: 1 }] }
//      deletePath({ a: { b: 1, c: 2 } }, 'a.b')  → { a: { c: 2 } }
//      select(user, ['name', 'address.city'])
//        → { name: 'Ada', address: { city: 'London' } }
//
//    setPath NEVER mutates. It clones each container along the path and
//    reuses everything else by reference — the tests check that with ===.
//    Two more rules that follow from "reuse what did not change":
//      · writing the value that is already there returns the SAME object
//      · a numeric key creates an array, a string key creates an object
//
//    Security, stage 3: refuse to write to '__proto__', 'constructor' or
//    'prototype'. A deep-set helper fed a path from JSON is how prototype
//    pollution gets into real products — lodash has shipped that CVE more
//    than once.
//
//  hint (stage 3): setPath is naturally recursive — clone this level, set
//  `clone[key] = setPath(obj[key], restOfTheKeys, value)`, return the
//  clone. The base case is "no keys left: the value IS the result".

import { test, eq, ok, throws } from '../../_lib/check.js';

// stage 1 — 'a.b[0].c' → ['a','b',0,'c']. An array path passes through.
export function parsePath(path) {
  throw new Error('TODO');
}

// stages 1–2 — safe deep read; `fallback` when the path leads nowhere.
export function getPath(obj, path, fallback) {
  throw new Error('TODO');
}

// stage 3 — immutable deep write, cloning only along the path.
export function setPath(obj, path, value) {
  throw new Error('TODO');
}

// stage 4 — immutable deep delete; array elements are spliced out.
export function deletePath(obj, path) {
  throw new Error('TODO');
}

// stage 4 — project a few paths into a fresh, still-nested object.
export function select(obj, paths) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// ── stage 1: parsePath + getPath ─────────────────────────────────────────

test('parsePath splits a dotted path', () => {
  eq(parsePath('a.b.c'), ['a', 'b', 'c']);
});

test('parsePath turns [0] into a real number', () => {
  eq(parsePath('a.b[0].c'), ['a', 'b', 0, 'c']);
});

test('parsePath handles leading and consecutive indexes', () => {
  eq(parsePath('[0][1]'), [0, 1]);
  eq(parsePath('grid[2][3].value'), ['grid', 2, 3, 'value']);
});

test('parsePath passes an array path straight through', () => {
  eq(parsePath(''), []);
  const keys = ['a', 0];
  ok(parsePath(keys) === keys);
});

test('getPath walks objects and arrays', () => {
  const data = { a: { b: [{ c: 7 }, { c: 8 }] } };
  eq(getPath(data, 'a.b[0].c'), 7);
  eq(getPath(data, 'a.b[1].c'), 8);
  eq(getPath(data, 'a.b').length, 2);
});

// ── stage 2: safe reads ──────────────────────────────────────────────────

test('a missing key reads as undefined', () => {
  eq(getPath({ a: 1 }, 'b'), undefined);
});

test('the fallback is used when the path leads nowhere', () => {
  eq(getPath({ a: 1 }, 'b.c.d', 'none'), 'none');
  eq(getPath({}, 'a[3].b', 'none'), 'none');
});

test('a null halfway down does not throw', () => {
  eq(getPath({ a: null }, 'a.b.c', 'none'), 'none');
  eq(getPath(null, 'a', 'none'), 'none');
  eq(getPath(undefined, 'a.b', 'none'), 'none');
});

test('an existing null wins over the fallback', () => {
  eq(getPath({ a: null }, 'a', 'none'), null);
});

test('falsy values are returned, not replaced', () => {
  const data = { zero: 0, empty: '', no: false };
  eq(getPath(data, 'zero', 'none'), 0);
  eq(getPath(data, 'empty', 'none'), '');
  eq(getPath(data, 'no', 'none'), false);
});

test('reading through a primitive is safe too', () => {
  eq(getPath(42, 'a.b', 'none'), 'none');
  eq(getPath('text', 'length'), 4);
});

// ── stage 3: setPath, immutably ──────────────────────────────────────────

test('setPath returns a new object with the value set', () => {
  const before = { a: { b: 1 } };
  const after = setPath(before, 'a.b', 2);
  eq(after, { a: { b: 2 } });
  eq(before, { a: { b: 1 } });
  ok(after !== before);
});

test('branches you did not touch keep their identity', () => {
  const before = { keep: { deep: [1, 2] }, edit: { x: 1 } };
  const after = setPath(before, 'edit.x', 2);
  ok(after.keep === before.keep);
  ok(after.edit !== before.edit);
  eq(after.edit.x, 2);
});

test('every container on the path is a fresh one', () => {
  const before = { a: { b: { c: 1 } } };
  const after = setPath(before, 'a.b.c', 2);
  ok(after.a !== before.a);
  ok(after.a.b !== before.a.b);
});

test('missing objects are created along the way', () => {
  eq(setPath({}, 'a.b.c', 1), { a: { b: { c: 1 } } });
  eq(setPath({ a: 1 }, 'b.c', 2), { a: 1, b: { c: 2 } });
});

test('a numeric key creates an array, not an object', () => {
  const made = setPath({}, 'list[0].name', 'ada');
  eq(made, { list: [{ name: 'ada' }] });
  ok(Array.isArray(made.list));
});

test('writing inside an array keeps it an array', () => {
  const before = { xs: [1, 2, 3] };
  const after = setPath(before, 'xs[1]', 9);
  eq(after, { xs: [1, 9, 3] });
  ok(Array.isArray(after.xs));
  ok(after.xs !== before.xs);
  eq(before.xs, [1, 2, 3]);
});

test('writing the value that is already there changes nothing', () => {
  const before = { a: { b: 1 } };
  ok(setPath(before, 'a.b', 1) === before);
});

test('setPath refuses to write through __proto__', () => {
  const safe = setPath({}, 'a.b', 1);
  eq(safe, { a: { b: 1 } });
  throws(() => setPath({}, '__proto__.polluted', 1), '__proto__');
  eq({}.polluted, undefined);
});

// ── stage 4: deletePath and select ───────────────────────────────────────

test('deletePath removes a key without mutating', () => {
  const before = { a: { b: 1, c: 2 }, keep: { x: 1 } };
  const after = deletePath(before, 'a.b');
  eq(after, { a: { c: 2 }, keep: { x: 1 } });
  eq(before, { a: { b: 1, c: 2 }, keep: { x: 1 } });
  ok(after.keep === before.keep);
});

test('deleting something that is not there returns the same object', () => {
  const before = { a: 1 };
  ok(deletePath(before, 'nope') === before);
  ok(deletePath(before, 'b.c.d') === before);
});

test('deleting an array element shortens the array', () => {
  const before = { xs: ['a', 'b', 'c'] };
  const after = deletePath(before, 'xs[1]');
  eq(after, { xs: ['a', 'c'] });
  eq(before.xs, ['a', 'b', 'c']);
});

test('select projects a few paths into a nested object', () => {
  const user = {
    id: 1,
    name: 'Ada',
    address: { city: 'London', zip: 'SW1' },
    tags: ['maths', 'engines'],
  };
  eq(select(user, ['name', 'address.city', 'tags[0]']), {
    name: 'Ada',
    address: { city: 'London' },
    tags: ['maths'],
  });
});

test('select skips paths that are not there', () => {
  const user = { name: 'Ada' };
  eq(select(user, ['name', 'address.city']), { name: 'Ada' });
  eq(select(user, []), {});
});
