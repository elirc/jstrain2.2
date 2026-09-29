// ─────────────────────────────────────────────────────────────────────────
//  43 · globalThis and module scope                             ★★☆ core
//  concepts: globalThis · module scope · top-level this in ESM
//  run: node 43-global-scope.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `globalThis` is the one name for the global object everywhere — window
//  in a browser, global in Node, self in a worker. What surprises people
//  is what is NOT on it: everything you declare at the top of a module.
//  Module scope is its own scope, and nothing leaks out of it.
//
//      hasGlobal('setTimeout')      → true
//      hasGlobal('window')          → false   (this is Node)
//      hasGlobal('MODULE_SECRET')   → false   (declared right below!)
//
//  withGlobal(name, value, fn) installs a global for exactly the length of
//  one call — the honest way to stub `fetch` in a test — and puts things
//  back afterwards, whether fn returns or throws. If the name was not
//  there before, it must be gone again, not left as undefined.
//
//      withGlobal('fetch', stub, () => globalThis.fetch())  → the stub's
//      hasGlobal('fetch') afterwards                        → as before
//
//  nextTicket() returns 'T-001', then 'T-002', ... counting with the
//  module-level `issued` below: private to this file, alive for the whole
//  process.
//
//  hint: `name in globalThis` asks the question without reading the value;
//  Object.hasOwn tells you whether to restore or to delete. try/finally is
//  what makes "afterwards" mean afterwards.

import { test, eq, ok, throws } from '../../_lib/check.js';

const TOP_LEVEL_THIS = this; // in an ES module this is NOT the global object
const MODULE_SECRET = 'not-global';
let issued = 0;

export function hasGlobal(name) {
  throw new Error('TODO');
}

export function withGlobal(name, value, fn) {
  throw new Error('TODO');
}

export function nextTicket() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('hasGlobal sees the globals Node really provides', () => {
  eq(hasGlobal('setTimeout'), true);
  eq(hasGlobal('console'), true);
  eq(hasGlobal('JSON'), true);
  eq(hasGlobal('structuredClone'), true);
  eq(hasGlobal('globalThis'), true);
});

test('hasGlobal does not invent the browser ones', () => {
  eq(hasGlobal('window'), false);
  eq(hasGlobal('document'), false);
  eq(hasGlobal('alert'), false);
  eq(hasGlobal('definitelyNotDefined'), false);
});

test('a module-level binding is not a global', () => {
  eq(MODULE_SECRET, 'not-global');
  eq(hasGlobal('MODULE_SECRET'), false);
  eq(hasGlobal('issued'), false);
  eq(hasGlobal('hasGlobal'), false, 'not even the exports');
});

test('top-level this is undefined in an ES module', () => {
  eq(hasGlobal('globalThis'), true);
  eq(TOP_LEVEL_THIS, undefined);
  ok(globalThis !== undefined, 'globalThis still works, of course');
});

test('withGlobal installs a value for the length of one call', () => {
  const seen = withGlobal('__jsTrainStub', () => 'stubbed', () =>
    globalThis.__jsTrainStub()
  );
  eq(seen, 'stubbed');
});

test('a name that was not there before is deleted, not undefined', () => {
  withGlobal('__jsTrainStub', 1, () => null);
  eq(hasGlobal('__jsTrainStub'), false);
  eq(Object.hasOwn(globalThis, '__jsTrainStub'), false);
});

test('an existing value is restored, even when the callback throws', () => {
  globalThis.__jsTrainProbe = 'original';
  eq(withGlobal('__jsTrainProbe', 'temp', () => globalThis.__jsTrainProbe),
    'temp');
  eq(globalThis.__jsTrainProbe, 'original');
  throws(() => withGlobal('__jsTrainProbe', 'temp', () => {
    throw new Error('boom');
  }), 'boom');
  eq(globalThis.__jsTrainProbe, 'original');
  delete globalThis.__jsTrainProbe;
});

test('module state persists between calls and belongs to this file', () => {
  eq(nextTicket(), 'T-001');
  eq(nextTicket(), 'T-002');
  eq(nextTicket(), 'T-003');
  eq(hasGlobal('issued'), false);
});
