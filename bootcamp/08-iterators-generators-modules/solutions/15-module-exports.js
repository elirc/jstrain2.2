// ─────────────────────────────────────────────────────────────────────────
//  15 · named vs default exports — SOLUTION                 ★☆☆ warm-up
//  run: node 15-module-exports.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `import greet, { shout as yell }` is two imports in one
//  line — the default (any local name you like) and a named export
//  renamed with `as`. Renaming is free because a named import is a
//  binding, not a copy.
//
//  `import * as greeting` gives the module namespace object, where the
//  default export appears under the key "default". Its properties are
//  non-writable, so assigning to one throws a TypeError in module code
//  (modules are always strict mode — the same assignment in a sloppy
//  script would fail silently, which is worse).

import { test, eq } from '../../_lib/check.js';
import greet, { NAME, shout as yell } from './fixtures/greeting.js';
import * as greeting from './fixtures/greeting.js';

// greet + yell are the fixture's default and named exports;
// `greeting` is the whole module as one object.

export function greetLoud(who) {
  return yell(greet(who));
}

export function exportNames() {
  return Object.keys(greeting).sort();
}

export function defaultIsSame() {
  return greet === greeting.default;
}

export function tryMutateNamespace() {
  // assign something to greeting.NAME and report what happened:
  // the error's constructor name, or 'no error' if it went through.
  try {
    greeting.NAME = 'patched';
    return 'no error';
  } catch (error) {
    return error.constructor.name;
  }
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
