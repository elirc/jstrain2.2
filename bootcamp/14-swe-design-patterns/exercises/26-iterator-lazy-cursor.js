// ─────────────────────────────────────────────────────────────────────────
//  26 · a lazy cursor                                            ★★☆ core
//  concepts: iterator · laziness · pull-based pipelines
//  run: node exercises/26-iterator-lazy-cursor.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `lines.filter(isError).map(parse)[0]` parses a million lines to keep
//  one. Array methods are EAGER: each step builds a whole new array
//  before the next step starts.
//
//  Build a cursor: the same operations, but nothing happens until
//  somebody consumes it, and then only as much as they asked for.
//
//      cursor(lines).filter(isError).map(parse).take(2).toArray()
//        → two parsed errors, and `parse` ran exactly twice
//
//      cursor(counter()).map((n) => n * n).take(4).toArray()
//        → [1, 4, 9, 16]   // an infinite source, and it terminates
//
//  A cursor is itself iterable, so `for...of` works on any stage. A
//  cursor over a re-iterable source must be walkable twice.
//
//  hint: each step returns a NEW cursor whose iteration starts fresh on
//  every walk — build it around something re-iterable, not around a
//  generator you already started; and `take` must stop pulling the
//  moment it has enough

import { test, eq, spy } from '../../_lib/check.js';

export function cursor(source) {
  // -> { map(fn), filter(keep), take(n), toArray(), [Symbol.iterator]() }
  throw new Error('TODO');
}

const LOG_LINES = [
  'INFO  boot',
  'WARN  slow query 120ms',
  'ERROR payment failed',
  'INFO  ok',
  'ERROR db timeout',
  'INFO  done',
];

const isError = (line) => line.startsWith('ERROR');

function* counter(from = 1) {
  for (let n = from; ; n += 1) yield n;
}

// a source that reports every value pulled out of it
function* traced(values, onPull) {
  for (const value of values) {
    onPull(value);
    yield value;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('map and filter build a view, toArray runs it', () => {
  eq(
    cursor([1, 2, 3, 4])
      .map((n) => n * 2)
      .filter((n) => n > 4)
      .toArray(),
    [6, 8]
  );
});

test('nothing runs until something consumes it', () => {
  const pull = spy();
  const shout = spy((line) => line.toUpperCase());
  cursor(traced(LOG_LINES, pull)).map(shout).filter(isError);
  eq(pull.callCount, 0);
  eq(shout.callCount, 0);
});

test('take pulls only what it needs', () => {
  const pull = spy();
  const first = cursor(traced(LOG_LINES, pull)).take(2).toArray();
  eq(first, ['INFO  boot', 'WARN  slow query 120ms']);
  eq(pull.callCount, 2);
});

test('take terminates on an infinite source', () => {
  eq(
    cursor(counter())
      .map((n) => n * n)
      .take(4)
      .toArray(),
    [1, 4, 9, 16]
  );
});

test('map only sees the values that survived the filter', () => {
  const parse = spy((line) => line.slice(6));
  const errors = cursor(LOG_LINES).filter(isError).map(parse).toArray();
  eq(errors, ['payment failed', 'db timeout']);
  eq(parse.callCount, 2);
});

test('a cursor is iterable at every stage', () => {
  const seen = [];
  for (const line of cursor(LOG_LINES).filter(isError)) seen.push(line);
  eq(seen, ['ERROR payment failed', 'ERROR db timeout']);
});

test('order of operations changes the answer', () => {
  eq(cursor(LOG_LINES).take(2).filter(isError).toArray(), []);
  eq(cursor(LOG_LINES).filter(isError).take(2).toArray().length, 2);
});

test('a cursor over a re-iterable source can be walked twice', () => {
  const view = cursor(LOG_LINES).filter(isError).map((l) => l.length);
  eq(view.toArray(), [20, 16]);
  eq(view.toArray(), [20, 16]);
});
