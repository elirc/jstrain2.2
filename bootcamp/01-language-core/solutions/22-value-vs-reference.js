// ─────────────────────────────────────────────────────────────────────────
//  22 · immutable updates — SOLUTION                            ★★☆ core
//  run: node 22-value-vs-reference.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: copy every level you modify, and only those levels.
//  addTag spreads the post (level 1) AND builds a new tags array (level
//  2); anything it does not touch is shared by reference, which is fine
//  because nothing will mutate it.
//
//  `post.tags ?? []` handles the missing-array case without turning an
//  existing empty array into a new one unnecessarily.
//
//  The classic wrong turn is `const next = { ...post }; next.tags.push(
//  tag);` — the spread copied the REFERENCE to tags, so push mutates the
//  original array too. With frozen input it throws; without freezing it
//  silently corrupts the caller's data, which is worse.

import { test, eq, ok } from '../../_lib/check.js';

export function addTag(post, tag) {
  return { ...post, tags: [...(post.tags ?? []), tag] };
}

export function bump(state, key, delta) {
  const counts = { ...(state.counts ?? {}) };
  counts[key] = (counts[key] ?? 0) + delta;
  return { ...state, counts };
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
