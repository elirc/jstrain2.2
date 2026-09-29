// ─────────────────────────────────────────────────────────────────────────
//  36 · findLast, findLastIndex and at — SOLUTION          ★☆☆ warm-up
//  run: node 36-findlast-and-at.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `findLast` walks from the end and stops at the first hit,
//  so it is one pass and no copy — `[...list].reverse().find(fn)` is two
//  allocations and `list.reverse().find(fn)` is a bug, because `reverse`
//  mutates the caller's array. `findLastIndex` returns -1 for "not found",
//  the same sentinel as `indexOf`, which is why you compare with `=== -1`
//  and never with truthiness (index 0 is falsy). `at` exists because
//  `list[-1]` is a property lookup on a key named "-1", not an index, and
//  it quietly gives `undefined` forever.

import { test, eq, ok } from '../../_lib/check.js';

const READINGS = Object.freeze([
  Object.freeze({ hour: 0, tempC: 8,  status: 'ok' }),
  Object.freeze({ hour: 1, tempC: 9,  status: 'stale' }),
  Object.freeze({ hour: 2, tempC: 11, status: 'ok' }),
  Object.freeze({ hour: 3, tempC: 14, status: 'stale' }),
  Object.freeze({ hour: 4, tempC: 13, status: 'ok' }),
]);

export function latestOk(readings) {
  return readings.findLast((r) => r.status === 'ok');
}

export function lastStaleIndex(readings) {
  return readings.findLastIndex((r) => r.status === 'stale');
}

export function edges(readings) {
  return {
    first: readings.at(0),
    last: readings.at(-1),
    secondLast: readings.length >= 2 ? readings.at(-2) : undefined,
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('latestOk finds the newest healthy reading, not the oldest', () => {
  eq(latestOk(READINGS).hour, 4);
});

test('latestOk is undefined when nothing is healthy', () => {
  eq(latestOk(READINGS.filter((r) => r.status === 'stale')), undefined);
});

test('latestOk of an empty list is undefined', () => {
  eq(latestOk([]), undefined);
});

test('lastStaleIndex reports a position, not a reading', () => {
  eq(lastStaleIndex(READINGS), 3);
});

test('lastStaleIndex is -1 when every reading is healthy', () => {
  eq(lastStaleIndex(READINGS.filter((r) => r.status === 'ok')), -1);
});

test('edges picks both ends and the runner-up', () => {
  const { first, last, secondLast } = edges(READINGS);
  eq(first.hour, 0);
  eq(last.hour, 4);
  eq(secondLast.hour, 3);
  ok(last === READINGS[4]);
});

test('a one-reading list has no runner-up', () => {
  eq(edges([READINGS[2]]), {
    first: READINGS[2],
    last: READINGS[2],
    secondLast: undefined,
  });
});

test('an empty list has no edges at all', () => {
  eq(edges([]), { first: undefined, last: undefined, secondLast: undefined });
});
