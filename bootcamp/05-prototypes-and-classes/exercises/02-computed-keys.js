// ─────────────────────────────────────────────────────────────────────────
//  02 · computed keys                                      ★☆☆ warm-up
//  concepts: computed property names · Object.hasOwn · rest/spread
//  run: node 02-computed-keys.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Object keys can be computed at runtime with square brackets, both when
//  you build an object and when you destructure one.
//
//  1. tally(words) — count how often each word appears.
//
//      tally(['a', 'b', 'a'])   → { a: 2, b: 1 }
//      tally([])                → {}
//
//  2. renameKey(obj, from, to) — a NEW object with one key renamed. If
//     `from` is not an own key, return a plain copy.
//
//      renameKey({ id: 1, nm: 'Ada' }, 'nm', 'name')
//                               → { id: 1, name: 'Ada' }
//
//  hint: every object inherits `toString` — so `counts[word] || 0` lies

import { test, eq } from '../../_lib/check.js';

export function tally(words) {
  throw new Error('TODO');
}

export function renameKey(obj, from, to) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('tally counts repeated words', () => {
  eq(tally(['a', 'b', 'a', 'a']), { a: 3, b: 1 });
});

test('tally returns an empty object for an empty list', () => {
  eq(tally([]), {});
});

test('tally is not fooled by inherited property names', () => {
  eq(tally(['toString', 'valueOf', 'toString']), {
    toString: 2,
    valueOf: 1,
  });
});

test('renameKey renames one key and keeps the rest', () => {
  eq(renameKey({ id: 1, nm: 'Ada' }, 'nm', 'name'), { id: 1, name: 'Ada' });
});

test('renameKey leaves the original object untouched', () => {
  const original = { nm: 'Ada' };
  const renamed = renameKey(original, 'nm', 'name');
  eq(original, { nm: 'Ada' });
  eq(renamed, { name: 'Ada' });
});

test('renameKey copies unchanged when the key is missing', () => {
  const original = { id: 1 };
  const copy = renameKey(original, 'nope', 'name');
  eq(copy, { id: 1 });
  eq(copy === original, false);
});
