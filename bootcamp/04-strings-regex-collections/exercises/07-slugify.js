// ─────────────────────────────────────────────────────────────────────────
//  07 · slugify                                                 ★★☆ core
//  concepts: regex replace · character classes · trimming
//  run: node 07-slugify.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Turn a post title into a URL slug: lowercase, only letters, digits and
//  single hyphens, no hyphen at either end.
//
//      slugify('Hello, World!')      → 'hello-world'
//      slugify('Top 10 JS Tips')     → 'top-10-js-tips'
//      slugify('  --Hi--  ')         → 'hi'
//      slugify('!!!')                → ''
//
//  Do it in three moves: lowercase, replace every RUN of non-[a-z0-9]
//  characters with one hyphen, then strip hyphens off both ends.
//
//  hint: [^a-z0-9]+ matches a run of "everything except" — and ^-+|-+$
//  with the g flag strips both ends in one pass.

import { test, eq } from '../../_lib/check.js';

export function slugify(title) {
  throw new Error('TODO');
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
