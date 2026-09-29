// ─────────────────────────────────────────────────────────────────────────
//  02 · hoisting and the TDZ                               ★★☆ core
//  concepts: hoisting · temporal dead zone
//  run: node 02-hoisting-and-tdz.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A function declaration is available everywhere in its scope, even
//  above the line that declares it. A function stored in a `const` is
//  not: the binding exists but is unusable until the line runs — that gap
//  is the temporal dead zone (TDZ), and touching it throws.
//
//  Write probeHoisting() so it tries to use each of the three definitions
//  at the BOTTOM of the function and reports what happened:
//
//      probeHoisting()  → {
//        declared:        'declared',       // the call just works
//        typeofDeclared:  'function',
//        expressed:       'ReferenceError', // the error's constructor name
//        arrowed:         'ReferenceError',
//        typeofExpressed: 'ReferenceError', // even typeof throws in a TDZ
//      }
//
//  hint: try { ... } catch (e) { e.constructor.name }

import { test, eq } from '../../_lib/check.js';

export function probeHoisting() {
  // TODO: build and return the report described above, using only the
  // three definitions below. Do not move them.
  throw new Error('TODO');

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
