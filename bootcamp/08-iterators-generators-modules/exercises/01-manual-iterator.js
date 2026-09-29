// ─────────────────────────────────────────────────────────────────────────
//  01 · makeIterator                                       ★☆☆ warm-up
//  concepts: iterator protocol · next()
//  run: node 01-manual-iterator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Before for-of, before generators, there is one tiny contract: an
//  ITERATOR is any object with a `next()` method that hands back
//  `{ value, done }`. Build one by hand so the rest of the module is
//  never magic.
//
//      const it = makeIterator(['a', 'b']);
//      it.next()   → { value: 'a', done: false }
//      it.next()   → { value: 'b', done: false }
//      it.next()   → { value: undefined, done: true }
//      it.next()   → { value: undefined, done: true }   (stays done)
//
//  Then write drain(iterator): pull until done, collect the values.
//
//      drain(makeIterator([1, 2, 3]))   → [1, 2, 3]

import { test, eq, ok } from '../../_lib/check.js';

export function makeIterator(items) {
  throw new Error('TODO');
}

export function drain(iterator) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('next() hands back the first value with done false', () => {
  eq(makeIterator(['a', 'b']).next(), { value: 'a', done: false });
});

test('walks the values in order', () => {
  const it = makeIterator([10, 20]);
  eq(it.next(), { value: 10, done: false });
  eq(it.next(), { value: 20, done: false });
});

test('reports done once the values run out', () => {
  const it = makeIterator(['only']);
  it.next();
  eq(it.next(), { value: undefined, done: true });
});

test('stays done on every later call', () => {
  const it = makeIterator([]);
  eq(it.next(), { value: undefined, done: true });
  eq(it.next(), { value: undefined, done: true });
});

test('two iterators over the same array are independent', () => {
  const items = [1, 2, 3];
  const a = makeIterator(items);
  const b = makeIterator(items);
  eq(a.next().value, 1);
  eq(a.next().value, 2);
  eq(b.next().value, 1);
});

test('drain collects every value', () => {
  eq(drain(makeIterator([1, 2, 3])), [1, 2, 3]);
});

test('drain of a half-used iterator returns only what is left', () => {
  const it = makeIterator(['a', 'b', 'c']);
  it.next();
  eq(drain(it), ['b', 'c']);
});

test('drain of an exhausted iterator is empty', () => {
  const it = makeIterator([1]);
  ok(drain(it).length === 1);
  eq(drain(it), []);
});
