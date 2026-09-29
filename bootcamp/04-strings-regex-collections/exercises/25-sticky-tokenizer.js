// ─────────────────────────────────────────────────────────────────────────
//  25 · a tokenizer with the sticky flag                         ★★☆ core
//  concepts: sticky /y · lastIndex · token tables
//  run: node 25-sticky-tokenizer.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A /g regex searches FORWARD until it finds something. A /y (sticky)
//  regex matches at re.lastIndex or fails — no searching. That is exactly
//  what a tokenizer wants: at position i, one of my rules must match, or
//  the input is bad.
//
//      tokenize('x = 2 + 3.5')
//        → [{ type: 'name',   value: 'x' },
//           { type: 'op',     value: '=' },
//           { type: 'number', value: '2' },
//           { type: 'op',     value: '+' },
//           { type: 'number', value: '3.5' }]
//
//      tokenize('a $ b')  → throws  'unexpected character $ at 2'
//
//  Walk the source from index 0. Try each rule in TOKENS order; the first
//  that matches wins. Advance past what it matched, and push a token
//  UNLESS its type is 'space'. If no rule matches, throw an Error whose
//  message contains 'unexpected character', the character, and its index.
//
//  hint: set re.lastIndex = i yourself before every re.exec(source) — a
//  sticky regex that fails resets lastIndex to 0, so you cannot trust the
//  value it is left at.

import { test, eq, throws } from '../../_lib/check.js';

// Provided scaffolding: the rules, in priority order. Every pattern is
// sticky, so each one can only match AT lastIndex — never further along.
const TOKENS = [
  ['space', /\s+/y],
  ['number', /\d+(?:\.\d+)?/y],
  ['name', /[A-Za-z_]\w*/y],
  ['op', /[+\-*\/=]/y],
  ['paren', /[()]/y],
];

export function tokenize(source) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('splits an assignment into typed tokens', () => {
  eq(tokenize('x = 2'), [
    { type: 'name', value: 'x' },
    { type: 'op', value: '=' },
    { type: 'number', value: '2' },
  ]);
});

test('drops whitespace but keeps everything else in order', () => {
  eq(
    tokenize('  a  +   b  ').map((t) => t.value),
    ['a', '+', 'b']
  );
});

test('reads a decimal number as a single token', () => {
  eq(tokenize('3.5'), [{ type: 'number', value: '3.5' }]);
  eq(tokenize('12').length, 1);
});

test('works with no whitespace at all', () => {
  eq(
    tokenize('(a+1)').map((t) => t.type),
    ['paren', 'name', 'op', 'number', 'paren']
  );
});

test('an empty or blank source tokenizes to nothing', () => {
  eq(tokenize(''), []);
  eq(tokenize('   '), []);
});

test('a name may contain digits and underscores after the first letter', () => {
  eq(tokenize('_total2'), [{ type: 'name', value: '_total2' }]);
});

test('throws on a character no rule matches, naming the index', () => {
  throws(() => tokenize('a $ b'), 'unexpected character');
  throws(() => tokenize('a $ b'), 'at 2');
});

test('sticky means "match here or fail" — it never skips ahead', () => {
  throws(() => tokenize('1 ?2'), 'at 2');
});
