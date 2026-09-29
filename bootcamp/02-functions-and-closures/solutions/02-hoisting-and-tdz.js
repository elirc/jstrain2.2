// ─────────────────────────────────────────────────────────────────────────
//  02 · hoisting and the TDZ — SOLUTION                    ★★☆ core
//  run: node 02-hoisting-and-tdz.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: when the engine enters a scope it creates every binding in
//  it up front. Function declarations are created AND initialised with the
//  function, so calling one early works. `let`/`const` bindings are
//  created but left uninitialised until their line runs; any touch before
//  that — including `typeof` — throws a ReferenceError. That is the
//  temporal dead zone. The classic wrong turn is believing `typeof x` is
//  always safe: it is safe for *undeclared* names, not for TDZ ones.

import { test, eq } from '../../_lib/check.js';

export function probeHoisting() {
  const report = {};

  try {
    report.declared = declared();
  } catch (e) {
    report.declared = e.constructor.name;
  }

  try {
    report.typeofDeclared = typeof declared;
  } catch (e) {
    report.typeofDeclared = e.constructor.name;
  }

  try {
    report.expressed = expressed();
  } catch (e) {
    report.expressed = e.constructor.name;
  }

  try {
    report.arrowed = arrowed();
  } catch (e) {
    report.arrowed = e.constructor.name;
  }

  try {
    report.typeofExpressed = typeof expressed;
  } catch (e) {
    report.typeofExpressed = e.constructor.name;
  }

  return report;

  // ── given: leave these exactly where they are ──
  function declared() {
    return 'declared';
  }
  const expressed = function () {
    return 'expressed';
  };
  const arrowed = () => 'arrowed';
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a function declaration can be called before its line', () => {
  eq(probeHoisting().declared, 'declared');
});

test('a declaration is already a function above its line', () => {
  eq(probeHoisting().typeofDeclared, 'function');
});

test('a const function expression is in the TDZ above its line', () => {
  eq(probeHoisting().expressed, 'ReferenceError');
});

test('a const arrow is in the TDZ too — arrows are not special', () => {
  eq(probeHoisting().arrowed, 'ReferenceError');
});

test('typeof does not protect you inside a TDZ', () => {
  eq(probeHoisting().typeofExpressed, 'ReferenceError');
});

test('the whole report has exactly the five expected keys', () => {
  eq(Object.keys(probeHoisting()).sort(), [
    'arrowed',
    'declared',
    'expressed',
    'typeofDeclared',
    'typeofExpressed',
  ]);
});
