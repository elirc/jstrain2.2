// ─────────────────────────────────────────────────────────────────────────
//  01 · makeIterator — SOLUTION                             ★☆☆ warm-up
//  run: node 01-manual-iterator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the iterator is a closure over a cursor. `i` lives in
//  makeIterator's scope, so each call to makeIterator gets its own
//  cursor — that is why two iterators over the same array don't
//  interfere. Once `i` runs past the end we keep answering
//  `{ value: undefined, done: true }` forever; an iterator never
//  un-finishes.
//
//  drain is the shape you will write a hundred times: pull once, loop
//  while `!done`, push, pull again. Classic wrong turn: checking
//  `step.value` for truthiness instead of `step.done` — then a legit
//  `0` or `''` ends your loop early.

import { test, eq, ok } from '../../_lib/check.js';

export function makeIterator(items) {
  let i = 0;
  return {
    next() {
      if (i < items.length) return { value: items[i++], done: false };
      return { value: undefined, done: true };
    },
  };
}

export function drain(iterator) {
  const out = [];
  let step = iterator.next();
  while (!step.done) {
    out.push(step.value);
    step = iterator.next();
  }
  return out;
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
