// ─────────────────────────────────────────────────────────────────────────
//  15 · named vs default exports                            ★☆☆ warm-up
//  concepts: ESM · import forms · namespace objects
//  run: node 15-module-exports.js
// ─────────────────────────────────────────────────────────────────────────
//
//  ./fixtures/greeting.js exports three things: NAME and shout by
//  name, and greet as the default. The imports are already written
//  above the TODOs — read them, then write the four one-liners.
//
//      greetLoud('ada')        → 'HELLO, ADA!'
//      exportNames()           → ['NAME', 'default', 'shout']
//      defaultIsSame()         → true
//      tryMutateNamespace()    → 'TypeError'
//
//  Two facts worth carrying home: a default export has no name of its
//  own (you pick one at the import site, and inside the namespace
//  object it is literally called "default"), and a namespace object is
//  read-only — you cannot patch a module from the outside.

import { test, eq } from '../../_lib/check.js';
import greet, { NAME, shout as yell } from './fixtures/greeting.js';
import * as greeting from './fixtures/greeting.js';

// greet + yell are the fixture's default and named exports;
// `greeting` is the whole module as one object.

export function greetLoud(who) {
  throw new Error('TODO');
}

export function exportNames() {
  throw new Error('TODO');
}

export function defaultIsSame() {
  throw new Error('TODO');
}

export function tryMutateNamespace() {
  // assign something to greeting.NAME and report what happened:
  // the error's constructor name, or 'no error' if it went through.
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('greetLoud runs the default export through the named one', () => {
  eq(greetLoud('ada'), 'HELLO, ADA!');
});

test('greetLoud works for any name', () => {
  eq(greetLoud('bo'), 'HELLO, BO!');
});

test('an alias is the same function under a different local name', () => {
  eq(greetLoud('x'), yell(greet('x')));
});

test('exportNames lists the named exports plus "default"', () => {
  eq(exportNames(), ['NAME', 'default', 'shout']);
});

test('the default import and namespace.default are one function', () => {
  eq(defaultIsSame(), true);
});

test('the module NAME is reachable both ways', () => {
  eq(NAME, greeting.NAME);
  eq(exportNames().includes('NAME'), true);
});

test('a namespace object cannot be patched from outside', () => {
  eq(tryMutateNamespace(), 'TypeError');
});
