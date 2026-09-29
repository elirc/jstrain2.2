// ─────────────────────────────────────────────────────────────────────────
//  12 · accumulator · drive — SOLUTION                     ★★★ stretch
//  run: node 12-two-way-generator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `const received = yield total;` is one statement doing
//  two things at two different times — it yields `total` now, and
//  months later (in generator time, one next() call) it evaluates to
//  whatever was sent in. That is the whole coroutine trick, and it is
//  what async/await is built on under the hood.
//
//  The priming call has no yield waiting for it yet, so its argument
//  is discarded — hence drive's bare `generator.next()` first. Off by
//  one here and every input lands on the wrong yield.
//
//  `?? 0` keeps a bare next() from turning the total into NaN, which
//  is the failure mode that makes a coroutine bug hard to read later.

import { test, eq } from '../../_lib/check.js';

// scaffolding: a command-driven generator to test drive against.
// Each next([op, n]) applies one command and yields the new total.
function* calculator() {
  let total = 0;
  while (true) {
    const [op, n] = (yield total) ?? [];
    if (op === 'add') total += n;
    else if (op === 'mul') total *= n;
    else if (op === 'reset') total = 0;
  }
}

export function* accumulator() {
  let total = 0;
  while (true) {
    const received = yield total;
    total += received ?? 0;
  }
}

export function drive(generator, inputs) {
  generator.next();
  const out = [];
  for (const input of inputs) {
    const step = generator.next(input);
    if (step.done) break;
    out.push(step.value);
  }
  return out;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the priming pull yields the starting total', () => {
  eq(accumulator().next(), { value: 0, done: false });
});

test('a sent value is added to the total', () => {
  const g = accumulator();
  g.next();
  eq(g.next(5), { value: 5, done: false });
});

test('the total accumulates across pulls', () => {
  const g = accumulator();
  g.next();
  g.next(5);
  eq(g.next(3).value, 8);
  eq(g.next(-8).value, 0);
});

test('the value sent to the FIRST next() is thrown away', () => {
  eq(accumulator().next(99).value, 0);
});

test('two accumulators keep separate totals', () => {
  const a = accumulator();
  const b = accumulator();
  a.next();
  b.next();
  a.next(10);
  eq(b.next(1).value, 1);
});

test('drive returns one yielded value per input', () => {
  eq(drive(accumulator(), [1, 2, 3]), [1, 3, 6]);
});

test('drive with no inputs returns nothing', () => {
  eq(drive(accumulator(), []), []);
});

test('drive works on any two-way generator', () => {
  eq(drive(calculator(), [['add', 2], ['mul', 5], ['reset']]), [2, 10, 0]);
});
