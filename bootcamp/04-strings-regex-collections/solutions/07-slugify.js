// ─────────────────────────────────────────────────────────────────────────
//  07 · slugify — SOLUTION                                      ★★☆ core
//  run: node 07-slugify.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three passes, each one line.
//    toLowerCase()               — so the class only needs a-z;
//    /[^a-z0-9]+/g → '-'         — a NEGATED class ([^...]) plus the +
//                                  quantifier turns each run of junk into
//                                  exactly one hyphen. Without the +, 'a,
//                                  b' would give 'a--b';
//    /^-+|-+$/g → ''             — alternation with both anchors strips
//                                  the leading and trailing hyphens that
//                                  the middle pass just created.
//  The classic wrong turn is replacing spaces only, then being surprised
//  by 'Hello, World!' → 'hello,-world!'.

import { test, eq } from '../../_lib/check.js';

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('lowercases and hyphenates words', () => {
  eq(slugify('Hello World'), 'hello-world');
});

test('drops punctuation', () => {
  eq(slugify('Hello, World!'), 'hello-world');
});

test('collapses a run of separators into one hyphen', () => {
  eq(slugify('a   b'), 'a-b');
  eq(slugify('why?! really'), 'why-really');
});

test('strips hyphens from both ends', () => {
  eq(slugify('  --Hi--  '), 'hi');
});

test('keeps digits', () => {
  eq(slugify('Top 10 JS Tips'), 'top-10-js-tips');
});

test('returns an empty string when nothing survives', () => {
  eq(slugify('!!!'), '');
  eq(slugify(''), '');
});
