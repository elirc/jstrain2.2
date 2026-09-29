// ─────────────────────────────────────────────────────────────────────────
//  08 · cycle · fibonacci — SOLUTION                         ★★☆ core
//  run: node 08-cycle-fibonacci.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: cycle buffers the source once with `[...items]`, then
//  delegates to the buffer forever. Two reasons for the copy: a
//  generator source is one-shot, and re-reading a Set on every lap is
//  wasted work. The empty guard is not optional — `while (true) yield*
//  []` never yields and never returns, so it would spin the CPU until
//  the test times out.
//
//  fibonacci needs no array at all. Two locals, one swap per pull:
//  `[a, b] = [b, a + b]`. The generator's paused frame IS the memory,
//  which is why each fibonacci() call is independent.

import { test, eq } from '../../_lib/check.js';

// scaffolding: take() from exercise 07, and a source you can only
// walk once. Do not edit.
function* take(n, iterable) {
  if (n <= 0) return;
  let taken = 0;
  for (const value of iterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
}

function* onceOneTwo() {
  yield 1;
  yield 2;
}

export function* cycle(items) {
  const buffer = [...items];
  if (buffer.length === 0) return;
  while (true) yield* buffer;
}

export function* fibonacci() {
  let a = 0;
  let b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('cycle loops back to the start', () => {
  eq([...take(7, cycle(['a', 'b', 'c']))], ['a', 'b', 'c', 'a', 'b', 'c', 'a']);
});

test('cycle of a single item repeats it', () => {
  eq([...take(3, cycle(['x']))], ['x', 'x', 'x']);
});

test('cycle of an empty collection ends instead of spinning', () => {
  eq([...take(3, cycle([]))], []);
});

test('cycle works on any iterable, including a string', () => {
  eq([...take(4, cycle('ab'))], ['a', 'b', 'a', 'b']);
  eq([...take(3, cycle(new Set([7, 8])))], [7, 8, 7]);
});

test('cycle remembers a source that can only be walked once', () => {
  eq([...take(5, cycle(onceOneTwo()))], [1, 2, 1, 2, 1]);
});

test('fibonacci starts 0, 1 and adds the last two', () => {
  eq([...take(8, fibonacci())], [0, 1, 1, 2, 3, 5, 8, 13]);
});

test('fibonacci keeps going correctly', () => {
  const first20 = [...take(20, fibonacci())];
  eq(first20.length, 20);
  eq(first20[19], 4181);
});

test('each fibonacci() call starts a fresh sequence', () => {
  eq([...take(3, fibonacci())], [0, 1, 1]);
  eq([...take(3, fibonacci())], [0, 1, 1]);
});
