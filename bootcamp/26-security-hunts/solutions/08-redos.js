// ─────────────────────────────────────────────────────────────────────────
//  08 · the validator that stops the server — SOLUTION         ★★☆ core
//  concepts: security · ReDoS · catastrophic backtracking
//  run: node 08-redos.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Vulnerability: ReDoS — regular-expression denial of service. The
//  pattern `^(\s*[a-z]+\s*,?)+$` nests a `+` inside a `+` with the
//  comma optional, so `aaaa` can be carved up as one group of four,
//  two of two, four of one, and every arrangement in between. On a
//  string that ALMOST matches — 26 letters and then a `!` — the engine
//  must exhaust all of them before it may answer "no", and the count
//  doubles with every extra character. One 30-byte request, one pinned
//  core, one dead process: no payload, no injection, just arithmetic.
//  The tell: a quantifier applied to a group that itself ends in a
//  quantifier, with an optional separator — `(a+)+`, `(\s*\w+)*`,
//  `(\w+,?)+`. When two parts of a pattern can both claim the same
//  character, matching stops being linear.
//  The minimal fix: make the split unambiguous — one tag, then any
//  number of "comma then tag" units, with the separator REQUIRED
//  inside the repeated group:
//      return /^[a-z]+(?:\s*,\s*[a-z]+)*$/.test(input);
//  Now every character belongs to exactly one part of the pattern,
//  there is nothing to backtrack over, and the trailing comma the old
//  pattern shrugged at is rejected by construction — the same sloppiness
//  caused both failures.
//  In the wild: e-mail and URL validators copied off the internet, log
//  and user-agent parsers, markdown/HTML tag matchers — anywhere a
//  regex runs on input the user typed. Defenses beyond the rewrite:
//  cap the input length before matching, and keep validation regexes
//  boring enough to read.

import { test, eq, ok } from '../../_lib/check.js';

export function isValidTagList(input) {
  return /^[a-z]+(?:\s*,\s*[a-z]+)*$/.test(input);
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
