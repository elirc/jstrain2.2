// ─────────────────────────────────────────────────────────────────────────
//  08 · json path — SOLUTION                                ★★★ capstone
//  concepts: recursion · immutability · structural sharing · security
//  time: 30–40 min · 4 stages · 24 tests
//  run: node 08-json-path.js
// ─────────────────────────────────────────────────────────────────────────
//
//  WALKTHROUGH
//
//  Architecture. parsePath turns a string into a list of keys ONCE, and
//  every other function is a walk over that list. Parsing at the boundary
//  and working in data afterwards is the single biggest simplification in
//  this file — get, set, delete and select share one notion of "a path",
//  and none of them contains a regex.
//
//  Stage 1 — the parser is one regex, /[^.[\]]+/g: "runs of anything that
//  is not a dot or a bracket". It handles 'a.b[0].c', '[0][1]' and 'a'
//  without a single special case, and an all-digits segment becomes a
//  number so callers can tell an index from a key.
//
//  Stage 2 — getPath is a loop with a null guard, and the interesting
//  decision is the default: it applies only when the result is undefined,
//  so a stored `null`, `0`, `''` or `false` is returned as-is. Using
//  `value ?? fallback` at the end would be wrong for null and `||` would
//  be wrong for all four — this is where "safe deep get" helpers usually
//  quietly break.
//
//  Stage 3 — setPath is STRUCTURAL SHARING. Clone the container at this
//  level, recurse into the rest of the path, and reuse every sibling by
//  reference. That is what React, Redux and Immer all do: a "copy" of a
//  1,000-key state object is one shallow clone per level of depth, so
//  `prev.items === next.items` still answers "did items change?" in O(1).
//  Two refinements make it real:
//    · if the value is already there, return the ORIGINAL object — no new
//      identity, so nothing downstream re-renders.
//    · the container to create when nothing exists depends on the key:
//      a number wants an array, a string wants an object.
//  And the guard: '__proto__' as a key is prototype pollution, a real CVE
//  class in exactly this kind of helper. Refuse it loudly.
//
//  Stage 4 — deletePath is setPath with a different leaf step, and the
//  same "return the original if nothing changed" rule. select is four
//  lines because getPath and setPath already exist — small, sharp
//  functions compose; a big generic one would not.
//
//  Classic wrong turn: `JSON.parse(JSON.stringify(obj))` before editing.
//  It "works", loses Dates, undefined, Maps and functions, costs a full
//  deep copy per keystroke, and destroys every identity check downstream.

import { test, eq, ok, throws } from '../../_lib/check.js';

// stage 3 — keys that let a caller reach Object.prototype.
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function assertSafeKey(key) {
  if (UNSAFE_KEYS.has(key)) {
    throw new Error(`refusing to write to "${key}" (prototype pollution)`);
  }
}

// stage 1 — "runs of anything that is not a dot or a bracket".
export function parsePath(path) {
  if (Array.isArray(path)) return path;
  const keys = [];
  for (const [segment] of String(path).matchAll(/[^.[\]]+/g)) {
    keys.push(/^\d+$/.test(segment) ? Number(segment) : segment);
  }
  return keys;
}

// stages 1–2 — walk, bailing out the moment there is nothing to read.
export function getPath(obj, path, fallback) {
  let value = obj;
  for (const key of parsePath(path)) {
    if (value === null || value === undefined) return fallback;
    value = value[key];
  }
  return value === undefined ? fallback : value;
}

// stage 3 — a number wants an array, a string wants an object.
function cloneContainer(obj, key) {
  if (Array.isArray(obj)) return obj.slice();
  if (obj !== null && typeof obj === 'object') return { ...obj };
  return typeof key === 'number' ? [] : {};
}

// stage 3 — clone this level, recurse, reuse everything else.
export function setPath(obj, path, value) {
  const keys = parsePath(path);
  if (keys.length === 0) return value; // base case: the value IS the result

  const [key, ...rest] = keys;
  assertSafeKey(key);

  const child = obj === null || obj === undefined ? undefined : obj[key];
  const nextChild = rest.length === 0 ? value : setPath(child, rest, value);

  // nothing moved here → hand back the original, identity and all
  if (
    obj !== null &&
    obj !== undefined &&
    Object.is(child, nextChild) &&
    key in Object(obj)
  ) {
    return obj;
  }

  const clone = cloneContainer(obj, key);
  clone[key] = nextChild;
  return clone;
}

// stage 4 — setPath's shape with a delete at the leaf.
export function deletePath(obj, path) {
  const keys = parsePath(path);
  if (keys.length === 0) return obj;
  if (obj === null || typeof obj !== 'object') return obj;

  const [key, ...rest] = keys;
  assertSafeKey(key);

  if (rest.length === 0) {
    if (Array.isArray(obj)) {
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0 || index >= obj.length) {
        return obj;
      }
      return [...obj.slice(0, index), ...obj.slice(index + 1)];
    }
    if (!Object.hasOwn(obj, key)) return obj;
    const clone = { ...obj };
    delete clone[key];
    return clone;
  }

  const child = obj[key];
  const nextChild = deletePath(child, rest);
  if (Object.is(child, nextChild)) return obj; // nothing was removed
  const clone = Array.isArray(obj) ? obj.slice() : { ...obj };
  clone[key] = nextChild;
  return clone;
}

// stage 4 — read with one, write with the other. That is the whole thing.
export function select(obj, paths) {
  return paths.reduce((picked, path) => {
    const value = getPath(obj, path);
    return value === undefined ? picked : setPath(picked, path, value);
  }, {});
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
