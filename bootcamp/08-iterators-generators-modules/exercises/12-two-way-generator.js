// ─────────────────────────────────────────────────────────────────────────
//  12 · accumulator · drive                                ★★★ stretch
//  concepts: gen.next(value) · yield as an expression
//  run: node 12-two-way-generator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `yield` is an EXPRESSION. It sends a value out, and when the
//  consumer calls next(x) the paused `yield` evaluates to x. Values
//  flow both ways.
//
//      const g = accumulator();
//      g.next()    → { value: 0, done: false }   running total so far
//      g.next(5)   → { value: 5, done: false }
//      g.next(3)   → { value: 8, done: false }
//
//  The first next() is the PRIMING pull: it runs the body up to the
//  first yield, and whatever you passed to it lands nowhere.
//
//      accumulator().next(99)   → { value: 0, done: false }   99 is lost
//
//  Then drive(generator, inputs): prime it, send each input in turn,
//  and return the array of values it yielded back.
//
//      drive(accumulator(), [1, 2, 3])   → [1, 3, 6]
//
//  hint: `const received = yield total;` — read that line as "hand
//        total out, and later become whatever gets sent in"

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
  throw new Error('TODO');
}

export function drive(generator, inputs) {
  throw new Error('TODO');
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
