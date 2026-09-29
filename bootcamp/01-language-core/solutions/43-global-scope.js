// ─────────────────────────────────────────────────────────────────────────
//  43 · globalThis and module scope — SOLUTION                  ★★☆ core
//  run: node 43-global-scope.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `name in globalThis` asks whether the property exists
//  without reading it, which matters for globals that are lazy getters.
//  `typeof globalThis[name] !== 'undefined'` is the usual alternative and
//  answers a slightly different question — a global explicitly set to
//  undefined exists but would report false.
//
//  The module-scope point is the one worth carrying away: in an ES module
//  nothing you declare reaches the global object, not even exports, and
//  top-level `this` is `undefined` rather than `module.exports`. (In a
//  CommonJS file it is `module.exports`, which is how you can tell the two
//  apart at runtime.)
//
//  withGlobal is try/finally with a memory: record whether the key EXISTED
//  as an own property, not just whether its value was undefined, so the
//  restore can choose between assignment and `delete`. Skip that and every
//  stubbed test leaves a permanent `globalThis.fetch = undefined` behind.

import { test, eq, ok, throws } from '../../_lib/check.js';

const TOP_LEVEL_THIS = this; // in an ES module this is NOT the global object
const MODULE_SECRET = 'not-global';
let issued = 0;

export function hasGlobal(name) {
  return name in globalThis;
}

export function withGlobal(name, value, fn) {
  const had = Object.hasOwn(globalThis, name);
  const previous = globalThis[name];
  globalThis[name] = value;
  try {
    return fn();
  } finally {
    if (had) globalThis[name] = previous;
    else delete globalThis[name];
  }
}

export function nextTicket() {
  issued += 1;
  return `T-${String(issued).padStart(3, '0')}`;
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
