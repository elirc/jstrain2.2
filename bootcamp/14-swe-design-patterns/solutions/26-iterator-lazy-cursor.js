// ─────────────────────────────────────────────────────────────────────────
//  26 · a lazy cursor — SOLUTION                                 ★★☆ core
//  concepts: iterator · laziness · pull-based pipelines
//  run: node solutions/26-iterator-lazy-cursor.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — the other half of the iterator pattern: instead of exposing
//  a walk (exercise 25), COMPOSE walks, so a pipeline describes work and
//  the consumer decides how much of it ever happens.
//  Each stage wraps the previous one in a new iterable and returns a new
//  cursor. Nothing executes in `map`/`filter`/`take` — they only build
//  the chain. `toArray` (or `for...of`) is the one place that pulls, and
//  the pull travels backwards down the chain one value at a time. That
//  is why `parse` runs twice instead of six times, and why an infinite
//  counter terminates.
//  Two details do all the work:
//  · Wrap in `{ *[Symbol.iterator]() {...} }`, not in a called generator.
//    A generator OBJECT is a one-shot iterator; walking the cursor twice
//    would silently return nothing the second time.
//  · `take` must `yield` and THEN check its count. Checking first pulls
//    one extra value from the source — invisible on an array, fatal on a
//    source where "pull" means an HTTP request or a blocking read.
//  When NOT to use: small in-memory arrays. `.filter().map()` is
//  clearer, and the per-value generator machinery is slower than a tight
//  array loop. Laziness pays when the source is huge, remote, infinite,
//  or expensive per element.
//  In the wild: Java streams, .NET LINQ (`IEnumerable`), Python
//  generators/itertools, Rust iterator adapters, Lodash `_.chain().lazy`,
//  RxJS operators (push-based cousin), and the TC39 iterator-helpers
//  proposal that gives JS `.map/.filter/.take` natively.

import { test, eq, spy } from '../../_lib/check.js';

const mapped = (source, fn) => ({
  *[Symbol.iterator]() {
    for (const value of source) yield fn(value);
  },
});

const filtered = (source, keep) => ({
  *[Symbol.iterator]() {
    for (const value of source) if (keep(value)) yield value;
  },
});

const taken = (source, n) => ({
  *[Symbol.iterator]() {
    if (n <= 0) return;
    let count = 0;
    for (const value of source) {
      yield value;
      count += 1;
      if (count >= n) return; // stop BEFORE pulling one more
    }
  },
});

export function cursor(source) {
  return {
    [Symbol.iterator]: () => source[Symbol.iterator](),
    map: (fn) => cursor(mapped(source, fn)),
    filter: (keep) => cursor(filtered(source, keep)),
    take: (n) => cursor(taken(source, n)),
    toArray: () => [...source],
  };
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
