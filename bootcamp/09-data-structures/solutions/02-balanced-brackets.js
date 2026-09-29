// ─────────────────────────────────────────────────────────────────────────
//  02 · balanced brackets — SOLUTION                          ★★☆ core
//  run: node 02-balanced-brackets.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: nesting is the stack's home turf. "Most recently opened
//  must close first" IS last-in-first-out, so the stack top is always the
//  bracket you owe. One pass, O(n) time and O(n) worst-case space (a string
//  of nothing but openers). An array with push/pop is the stack.
//  Three ways to be unbalanced, and you need all three checks: a closer
//  with an empty stack, a closer that does not match the top, and leftover
//  openers when the scan ends. The classic wrong turn is counting brackets
//  instead of stacking them — a counter says '([)]' is fine because the
//  totals match, but order is exactly what a counter throws away.

import { test, eq } from '../../_lib/check.js';

const CLOSER_TO_OPENER = { ')': '(', ']': '[', '}': '{' };
const OPENERS = new Set(['(', '[', '{']);

export function isBalanced(text) {
  const stack = [];
  for (const ch of text) {
    if (OPENERS.has(ch)) {
      stack.push(ch);
    } else if (ch in CLOSER_TO_OPENER) {
      if (stack.pop() !== CLOSER_TO_OPENER[ch]) return false;
    }
  }
  return stack.length === 0;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('accepts a simple matched pair', () => {
  eq(isBalanced('()'), true);
});

test('accepts correctly nested mixed brackets', () => {
  eq(isBalanced('{[()]}'), true);
});

test('rejects a closer that does not match the top of the stack', () => {
  eq(isBalanced('(]'), false);
});

test('rejects crossed brackets that overlap instead of nesting', () => {
  eq(isBalanced('([)]'), false);
});

test('rejects an opener that is never closed', () => {
  eq(isBalanced('(()'), false);
});

test('rejects a closer that arrives with nothing open', () => {
  eq(isBalanced(')('), false);
});

test('treats the empty string as balanced', () => {
  eq(isBalanced(''), true);
});

test('application: checks a code snippet and ignores non-bracket text', () => {
  const good = 'function f(a) { return [a, { id: 1 }]; }';
  const bad = 'function f(a) { return [a, { id: 1 }; }';
  eq(isBalanced(good), true);
  eq(isBalanced(bad), false);
});
