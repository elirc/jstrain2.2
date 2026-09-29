// ─────────────────────────────────────────────────────────────────────────
//  33 · normalize() and accent-insensitive search — SOLUTION  ★★★ stretch
//  run: node 33-accent-folding.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: fold is a three-step pipeline. NFD decomposes 'é' into
//  'e' + U+0301; /\p{Diacritic}/gu deletes the mark that is now a
//  character of its own; toLowerCase finishes the job. Order matters only
//  in that the strip must come after the decomposition — on NFC input
//  there is no separate mark to match, so the regex would find nothing.
//  The u flag is not optional: without it \p{...} is not a property
//  escape at all, just a literal 'p' repeated — a silent no-op.
//  matchesSearch folds BOTH sides. Folding only the haystack is the
//  classic wrong turn: the user types 'café' with the accent, the
//  haystack has been folded to 'cafe', and the search finds nothing.
//  sameText is the other question entirely — "is this the same text?" —
//  so it normalizes to NFC (the canonical composed form) and compares.
//  It keeps case and accents, unlike fold.
//  Known limit: NFD only splits what Unicode defines a decomposition for.
//  'ø' and 'ß' have none, so they survive. A real search index would add
//  a small replacement table on top for those.

import { test, eq } from '../../_lib/check.js';

export function fold(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function matchesSearch(haystack, needle) {
  return fold(haystack).includes(fold(needle));
}

export function sameText(a, b) {
  return a.normalize('NFC') === b.normalize('NFC');
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
