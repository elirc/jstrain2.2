// ─────────────────────────────────────────────────────────────────────────
//  14 · replace with a function — SOLUTION                      ★★☆ core
//  run: node 14-replace-with-function.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the replacer callback receives (match, ...groups), so the
//  replacement can depend on what was matched — that is the only way to
//  star out a word of the right length, or to bracket 'CAT' while keeping
//  its casing. A plain string replacement cannot see the match.
//  \b is a word BOUNDARY (a zero-width position between \w and non-\w),
//  which is what makes 'badger' safe while 'bad.' still matches.
//  new RegExp(...) builds a pattern from data — note the doubled
//  backslash in '\\b', because the escape has to survive the string
//  literal. The empty-list guard matters: joining nothing gives
//  /\b()\b/gi, which matches at every boundary and stars the whole text.
//  Real code should also escape regex metacharacters in the words.

import { test, eq } from '../../_lib/check.js';

export function censor(text, words) {
  if (words.length === 0) return text;
  const pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
  return text.replace(pattern, (match) => '*'.repeat(match.length));
}

export function highlight(text, term) {
  const pattern = new RegExp(term, 'gi');
  return text.replace(pattern, (match) => `[${match}]`);
}

export function expandTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.hasOwn(values, key) ? String(values[key]) : match
  );
}

// ──────────────────────────── tests ──────────────────────────────────────

test('censor masks each banned word with stars of the same length', () => {
  eq(censor('I hate this bad code', ['hate', 'bad']), 'I **** this *** code');
});

test('censor is case-insensitive', () => {
  eq(censor('BAD stuff', ['bad']), '*** stuff');
});

test('censor only matches whole words', () => {
  eq(censor('badger stew', ['bad']), 'badger stew');
});

test('censor with an empty word list changes nothing', () => {
  eq(censor('anything goes', []), 'anything goes');
});

test('highlight brackets every occurrence, keeping its casing', () => {
  eq(highlight('Cat cat CAT', 'cat'), '[Cat] [cat] [CAT]');
});

test('highlight leaves text without a match alone', () => {
  eq(highlight('dogs only', 'cat'), 'dogs only');
});

test('expandTemplate fills placeholders from the object', () => {
  eq(expandTemplate('Hi {name}, {n} new', { name: 'Ada', n: 3 }), 'Hi Ada, 3 new');
});

test('expandTemplate leaves unknown placeholders untouched', () => {
  eq(expandTemplate('Hi {nope}', {}), 'Hi {nope}');
  eq(expandTemplate('{a} and {b}', { a: 'x' }), 'x and {b}');
});
