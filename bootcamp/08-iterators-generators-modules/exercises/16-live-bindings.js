// ─────────────────────────────────────────────────────────────────────────
//  16 · live bindings                                      ★★★ stretch
//  concepts: ESM live bindings · module singletons
//  run: node 16-live-bindings.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `import { count }` does NOT copy a value. It binds a window onto
//  the exporting module's variable, and the window stays live: when
//  ./fixtures/counter.js changes `count`, your `count` changes too.
//  Read-only, though — the window opens one way.
//
//      readLive()        → whatever count is right now
//      snapshotVsLive()  → { snapshot: 0, live: 5 }
//          copy count into a local, increment(5), then report both
//      tryAssign()       → 'TypeError'   (attempt count = 99)
//      sameInstance()    → true
//
//  sameInstance compares two namespaces imported through two different
//  spellings of the same path. Modules are cached by resolved URL, so
//  a module is a singleton — which is why module-level state is shared
//  state, for better and for worse.
//
//  hint: for tryAssign, wrap the assignment in try/catch and return
//        error.constructor.name

import { test, eq } from '../../_lib/check.js';
import { count, increment, reset } from './fixtures/counter.js';
import * as counter from './fixtures/counter.js';
import * as counterAgain from './fixtures/./counter.js';

export function readLive() {
  throw new Error('TODO');
}

export function snapshotVsLive() {
  throw new Error('TODO');
}

export function readThroughNamespace() {
  throw new Error('TODO');
}

export function tryAssign() {
  throw new Error('TODO');
}

export function sameInstance() {
  throw new Error('TODO');
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
