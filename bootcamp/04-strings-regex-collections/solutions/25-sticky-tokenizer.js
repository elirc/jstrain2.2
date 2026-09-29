// ─────────────────────────────────────────────────────────────────────────
//  25 · a tokenizer with the sticky flag — SOLUTION              ★★☆ core
//  run: node 25-sticky-tokenizer.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the loop owns the cursor. For each rule, park lastIndex on
//  it, exec, and either advance or move to the next rule. Because the
//  regexes are sticky, exec can only succeed AT the cursor — with /g it
//  would scan forward and happily "find" the next number three characters
//  past the garbage you wanted to reject.
//  Two details make this safe to run twice: lastIndex is assigned before
//  every exec (a failed sticky match resets it to 0, a successful one
//  leaves it past the match — never assume either), and m.index is not
//  needed at all because a sticky match always starts at the cursor.
//  Rule order is the priority order: 'space' first so it is cheap to skip,
//  'number' before 'name' so 3.5 is not read as a name.
//  The classic wrong turn is `while (matched)` without advancing i on a
//  zero-length match — every pattern here consumes at least one character,
//  which is what keeps the loop finite.

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
  const tokens = [];
  let i = 0;

  outer: while (i < source.length) {
    for (const [type, re] of TOKENS) {
      re.lastIndex = i;
      const m = re.exec(source);
      if (m === null) continue;
      if (type !== 'space') tokens.push({ type, value: m[0] });
      i += m[0].length;
      continue outer;
    }
    throw new Error(`unexpected character ${source[i]} at ${i}`);
  }

  return tokens;
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
