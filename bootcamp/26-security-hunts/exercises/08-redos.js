// ─────────────────────────────────────────────────────────────────────────
//  08 · the validator that stops the server                   ★★☆ core
//  concepts: security · ReDoS · catastrophic backtracking
//  run: node 08-redos.js
// ─────────────────────────────────────────────────────────────────────────
//
//  isValidTagList(input) validates the tag box on the article editor.
//  A valid list is one or more lowercase tags separated by commas,
//  with optional spaces around each comma — and nothing else:
//
//      isValidTagList('js, node, sql')  → true
//      isValidTagList('js,,node')       → false
//
//  It shipped, and one afternoon every request in the process started
//  timing out. The CPU was pinned at 100%; the event loop was not
//  blocked on I/O, it was blocked on this function, on one input,
//  from one visitor.
//
//  The code below is fully written — and a security hole. 2 tests fail:
//  one input it should reject in microseconds and does not reject in
//  any useful amount of time, and one it wrongly accepts. Find the
//  flaw and fix it with the smallest change.
//
//  hint: count the ways the regex engine can split `aaaa` between the
//  inner `+` and the outer `+`. On a string it can ALMOST match, an
//  engine that backtracks has to try every one of them before it is
//  allowed to say no — and "every one of them" doubles per character.

import { test, eq, ok } from '../../_lib/check.js';

export function isValidTagList(input) {
  return /^(\s*[a-z]+\s*,?)+$/.test(input);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('accepts a single tag', () => {
  eq(isValidTagList('js'), true);
});

test('accepts a comma-separated list, spaces optional', () => {
  eq(isValidTagList('js,node'), true);
  eq(isValidTagList('js, node, sql'), true);
});

test('rejects an empty list and a non-letter tag', () => {
  eq(isValidTagList(''), false);
  eq(isValidTagList('js, 42'), false);
});

test('rejects a trailing comma', () => {
  eq(isValidTagList('js, node,'), false);
});

test('rejects a long malformed list without hanging', () => {
  const attack = 'a'.repeat(26) + '!';
  const started = performance.now();
  eq(isValidTagList(attack), false);
  const elapsed = performance.now() - started;
  ok(elapsed < 150, `took ${elapsed.toFixed(0)}ms — should be sub-millisecond`);
});
