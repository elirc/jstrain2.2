// ─────────────────────────────────────────────────────────────────────────
//  32 · code points, not code units — SOLUTION                   ★★☆ core
//  run: node 32-codepoints-and-emoji.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: all three functions are the same one-line insight —
//  a string's iterator walks CODE POINTS, so [...text] keeps a surrogate
//  pair as one item while text.split('') cuts it in half. Once you have
//  the array, length and reverse() are ordinary array work.
//  That is the whole bug behind the classic "reverse a string" interview
//  answer: 'ab😀'.split('').reverse().join('') puts the low surrogate
//  before the high one and the result is two replacement characters, not
//  an emoji. The test asserts the two answers differ so the naive version
//  cannot sneak through.
//  Honest limit: this is code points, not grapheme clusters. 'é' typed as
//  e + a combining accent is two code points, and a ZWJ family emoji is
//  five — reverseSafe would still scramble those. When you need what a
//  human calls a character, reach for
//  new Intl.Segmenter('en-US', { granularity: 'grapheme' }).

import { test, eq, ok } from '../../_lib/check.js';

export function chars(text) {
  return [...text];
}

export function charLength(text) {
  return [...text].length;
}

export function reverseSafe(text) {
  return [...text].reverse().join('');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('chars splits plain text one character per item', () => {
  eq(chars('abc'), ['a', 'b', 'c']);
});

test('chars keeps a surrogate pair together', () => {
  eq(chars('a😀b'), ['a', '😀', 'b']);
});

test('charLength counts an emoji once, where .length counts twice', () => {
  eq(charLength('a😀b'), 3);
  eq('a😀b'.length, 4);
});

test('charLength matches .length for plain ASCII', () => {
  eq(charLength('hello'), 'hello'.length);
});

test('reverseSafe reverses plain text', () => {
  eq(reverseSafe('abc'), 'cba');
});

test('reverseSafe keeps the emoji intact, where split("") does not', () => {
  eq(reverseSafe('ab😀'), '😀ba');
  ok(reverseSafe('ab😀') !== 'ab😀'.split('').reverse().join(''));
});

test('reversing twice gives back the original', () => {
  const text = 'a😀b🎉c';
  eq(reverseSafe(reverseSafe(text)), text);
});

test('the empty string is handled everywhere', () => {
  eq(chars(''), []);
  eq(charLength(''), 0);
  eq(reverseSafe(''), '');
});
