// ─────────────────────────────────────────────────────────────────────────
//  16 · live bindings — SOLUTION                           ★★★ stretch
//  run: node 16-live-bindings.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: snapshotVsLive is the whole lesson in four lines. The
//  moment you write `const snapshot = count` you have a dead copy;
//  `count` itself keeps tracking the exporter. CommonJS `require`
//  copies the value at require time, which is why the same code
//  written with require would report `live: 0` — a real difference you
//  will meet when porting code.
//
//  The binding is read-only: `count = 99` throws TypeError, because a
//  module owns its exports and importers only get a view. If you need
//  to change it, call a function the module exported for that purpose
//  (increment, reset) — the exporter's own code can write freely.
//
//  Both `./fixtures/counter.js` and `./fixtures/./counter.js` resolve
//  to one URL, so the module is instantiated once and both namespaces
//  are the same object. Module-level state is process-wide state.

import { test, eq } from '../../_lib/check.js';
import { count, increment, reset } from './fixtures/counter.js';
import * as counter from './fixtures/counter.js';
import * as counterAgain from './fixtures/./counter.js';

export function readLive() {
  return count;
}

export function snapshotVsLive() {
  const snapshot = count;
  increment(5);
  return { snapshot, live: count };
}

export function readThroughNamespace() {
  return counter.count;
}

export function tryAssign() {
  try {
    count = 99;
    return 'no error';
  } catch (error) {
    return error.constructor.name;
  }
}

export function sameInstance() {
  return counter === counterAgain;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the imported binding tracks the exporter variable', () => {
  reset();
  increment(2);
  eq(readLive(), 2);
});

test('a copied value freezes, the binding does not', () => {
  reset();
  eq(snapshotVsLive(), { snapshot: 0, live: 5 });
});

test('the namespace property is just as live', () => {
  reset();
  increment(3);
  eq(readThroughNamespace(), 3);
  eq(readLive(), 3);
});

test('assigning to an imported binding throws', () => {
  eq(tryAssign(), 'TypeError');
});

test('the failed assignment left the real value alone', () => {
  reset();
  increment(7);
  tryAssign();
  eq(readLive(), 7);
});

test('resetting through the module is visible through the import', () => {
  reset();
  increment(4);
  reset();
  eq(readLive(), 0);
});

test('the same file imported twice is one shared module', () => {
  eq(sameInstance(), true);
});
