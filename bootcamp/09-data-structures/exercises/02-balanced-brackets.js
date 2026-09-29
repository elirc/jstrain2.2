// ─────────────────────────────────────────────────────────────────────────
//  02 · balanced brackets                                     ★★☆ core
//  concepts: stacks · parsing · string scanning
//  run: node 02-balanced-brackets.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every editor that greys out a mismatched brace runs this algorithm.
//  Scan the text once. Opening brackets go on a stack; a closing bracket
//  must match whatever is on top. Anything that is not a bracket is noise.
//
//      isBalanced('{[()]}')          → true
//      isBalanced('(]')              → false   (wrong closer)
//      isBalanced('([)]')            → false   (crossed, not nested)
//      isBalanced('if (a[0]) { }')   → true    (letters are ignored)
//      isBalanced('(')               → false   (never closed)
//      isBalanced('')                → true
//
//  Handle three bracket kinds: () [] {}.
//
//  hint: a lookup object { ')': '(', ']': '[', '}': '{' } turns "does this
//  closer match?" into one comparison

import { test, eq } from '../../_lib/check.js';

export function isBalanced(text) {
  throw new Error('TODO');
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
