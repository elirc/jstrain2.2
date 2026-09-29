// ─────────────────────────────────────────────────────────────────────────
//  33 · normalize() and accent-insensitive search             ★★★ stretch
//  concepts: NFC vs NFD · \p{Diacritic} · search folding
//  run: node 33-accent-folding.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Unicode can spell 'café' two ways: one 'é' character (NFC), or 'e'
//  plus a combining accent (NFD, written 'café'). They look
//  identical on screen and === says false. normalize() is the referee,
//  and NFD is also the lever that strips accents: decompose, then delete
//  the combining marks.
//
//      'café' === 'café'         → false  ← same text on screen
//      sameText('café', 'café')  → true
//
//      fold('Crème Brûlée')                    → 'creme brulee'
//      matchesSearch('Crème Brûlée', 'creme')  → true
//      matchesSearch('cafe latte', 'café')     → true
//
//  fold lowercases and drops accents so two spellings of the same word
//  land on one key. matchesSearch folds BOTH sides and asks includes().
//  sameText compares two strings for "is this the same text", accents
//  included — that is a normalize() job, not a fold() job.
//
//  hint: text.normalize('NFD') splits 'é' into 'e' + U+0301, and
//  /\p{Diacritic}/gu (the u flag is required) matches the leftover mark.
//  Letters with no decomposition — ø, ß — survive folding unchanged, and
//  that is correct behaviour, not a bug to patch around.

import { test, eq } from '../../_lib/check.js';

export function fold(text) {
  throw new Error('TODO');
}

export function matchesSearch(haystack, needle) {
  throw new Error('TODO');
}

export function sameText(a, b) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// 'café' is the DECOMPOSED spelling: plain 'e' plus a combining
// acute accent. It prints as café and is not === to the composed one.
const DECOMPOSED = 'café';

test('fold strips accents and lowercases', () => {
  eq(fold('Crème Brûlée'), 'creme brulee');
  eq(fold('ÀÉÎÕÜ'), 'aeiou');
});

test('fold leaves plain ASCII alone', () => {
  eq(fold('hello world'), 'hello world');
  eq(fold(''), '');
});

test('fold treats the composed and decomposed spellings the same', () => {
  eq(fold('café'), fold(DECOMPOSED));
  eq(fold('café'), 'cafe');
});

test('fold leaves a letter that does not decompose', () => {
  eq(fold('Bjørn'), 'bjørn');
  eq(fold('Straße'), 'straße');
});

test('matchesSearch ignores accents and case in the haystack', () => {
  eq(matchesSearch('Crème Brûlée', 'creme'), true);
  eq(matchesSearch('Crème Brûlée', 'BRULEE'), true);
});

test('matchesSearch ignores accents in the needle too', () => {
  eq(matchesSearch('cafe latte', 'café'), true);
  eq(matchesSearch('Crème Brûlée', 'tea'), false);
});

test('sameText sees through the two spellings that === cannot', () => {
  eq('café' === DECOMPOSED, false);
  eq(sameText('café', DECOMPOSED), true);
});

test('sameText still says no to genuinely different text', () => {
  eq(sameText('café', 'cafe'), false);
  eq(sameText('café', 'Café'), false);
});
