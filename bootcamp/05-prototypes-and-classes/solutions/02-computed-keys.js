// ─────────────────────────────────────────────────────────────────────────
//  02 · computed keys — SOLUTION                           ★☆☆ warm-up
//  run: node 02-computed-keys.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `{ [expr]: value }` evaluates `expr` and uses the result
//  as the key; `const { [expr]: v, ...rest } = obj` does the same on the
//  way out. That pairing is all `renameKey` needs.
//
//  The trap in `tally` is the prototype chain, and it is the whole reason
//  this module exists: `{}` inherits from Object.prototype, so
//  `counts['toString']` is a FUNCTION before you ever wrote to it, and
//  `counts[w] || 0` quietly produces NaN. `Object.hasOwn` asks the only
//  question that matters — is this key on the object ITSELF?
//  (`Object.create(null)` is the other fix: an object with no prototype.)

import { test, eq } from '../../_lib/check.js';

export function tally(words) {
  const counts = {};
  for (const word of words) {
    const seen = Object.hasOwn(counts, word) ? counts[word] : 0;
    counts[word] = seen + 1;
  }
  return counts;
}

export function renameKey(obj, from, to) {
  if (!Object.hasOwn(obj, from)) return { ...obj };
  const { [from]: value, ...rest } = obj;
  return { ...rest, [to]: value };
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
