// ─────────────────────────────────────────────────────────────────────────
//  22 · immutable updates                                       ★★☆ core
//  concepts: value vs reference · Object.freeze · copy-on-write
//  run: node 22-value-vs-reference.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Primitives are copied when you pass them around; objects and arrays
//  are not — you get another handle on the same thing. So "update" means
//  "build a new one", every level you touch.
//
//      addTag({ title: 'x', tags: ['a'] }, 'b')
//      → { title: 'x', tags: ['a', 'b'] }   and the input still has ['a']
//
//      addTag({ title: 'x' }, 'b')      → { title: 'x', tags: ['b'] }
//
//      bump({ counts: { a: 1 } }, 'a', 2)  → { counts: { a: 3 } }
//      bump({ counts: {} }, 'new', 1)      → { counts: { new: 1 } }
//
//  The tests pass FROZEN inputs, inner objects included — any push or
//  assignment into them throws in strict mode (and every ES module is
//  strict). If your code mutates, you will see a TypeError, not a
//  wrong value.
//
//  hint: `{ ...post }` copies one level. The nested array needs its own
//  `[...]`, or both objects end up pointing at the same array.

import { test, eq, ok } from '../../_lib/check.js';

export function addTag(post, tag) {
  throw new Error('TODO');
}

export function bump(state, key, delta) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('addTag returns a new post with the tag appended', () => {
  const post = Object.freeze({ title: 'x', tags: Object.freeze(['a']) });
  eq(addTag(post, 'b'), { title: 'x', tags: ['a', 'b'] });
});

test('addTag leaves the original post untouched', () => {
  const post = Object.freeze({ title: 'x', tags: Object.freeze(['a']) });
  const next = addTag(post, 'b');
  eq(post.tags, ['a']);
  ok(next !== post, 'must be a new object');
});

test('the tags array is rebuilt, not shared', () => {
  const post = Object.freeze({ title: 'x', tags: Object.freeze(['a']) });
  const next = addTag(post, 'b');
  ok(next.tags !== post.tags, 'the nested array must be a new array too');
});

test('addTag copes with a post that has no tags yet', () => {
  eq(addTag(Object.freeze({ title: 'x' }), 'b'), { title: 'x', tags: ['b'] });
});

test('bump increases an existing count without mutating', () => {
  const state = Object.freeze({
    counts: Object.freeze({ a: 1, b: 5 }),
    label: 'hits',
  });
  eq(bump(state, 'a', 2), { counts: { a: 3, b: 5 }, label: 'hits' });
  eq(state.counts, { a: 1, b: 5 });
});

test('bump starts a missing key at zero', () => {
  const state = Object.freeze({ counts: Object.freeze({}) });
  eq(bump(state, 'new', 1), { counts: { new: 1 } });
  eq(bump(state, 'new', 0), { counts: { new: 0 } });
});

test('bump rebuilds both levels', () => {
  const state = Object.freeze({ counts: Object.freeze({ a: 1 }) });
  const next = bump(state, 'a', 1);
  ok(next !== state, 'new state object');
  ok(next.counts !== state.counts, 'new counts object');
});
