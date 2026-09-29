// ─────────────────────────────────────────────────────────────────────────
//  32 · code points, not code units                              ★★☆ core
//  concepts: UTF-16 surrogate pairs · for..of over a string · Array.from
//  run: node 32-codepoints-and-emoji.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A JS string is a list of 16-bit code units. Anything above U+FFFF —
//  every emoji — is stored as TWO of them, a surrogate pair. So .length
//  lies, s[i] can hand you half a character, and split('') shreds them:
//
//      'a😀b'.length            → 4    (three characters!)
//      'ab😀'.split('').reverse().join('')
//                               → '\ude00\ud83dba'  ← two broken halves
//
//  Spread and for..of iterate a string by CODE POINT, which is the fix.
//
//      chars('a😀b')       → ['a', '😀', 'b']
//      charLength('a😀b')  → 3
//      reverseSafe('ab😀') → '😀ba'
//
//  This is the code-point layer, not the "what a human calls a character"
//  layer: a family emoji is one glyph built from five code points glued
//  with zero-width joiners, and reversing it would still scramble it.
//  That job belongs to Intl.Segmenter.
//
//  hint: [...text] and Array.from(text) both split on code points; so
//  does for (const ch of text). Only text.split('') is unsafe.

import { test, eq, ok } from '../../_lib/check.js';

export function chars(text) {
  throw new Error('TODO');
}

export function charLength(text) {
  throw new Error('TODO');
}

export function reverseSafe(text) {
  throw new Error('TODO');
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
