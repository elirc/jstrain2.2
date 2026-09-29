// ─────────────────────────────────────────────────────────────────────────
//  14 · replace with a function                                 ★★☆ core
//  concepts: replace callbacks · \b word boundary · new RegExp
//  run: node 14-replace-with-function.js
// ─────────────────────────────────────────────────────────────────────────
//
//  replace()'s second argument can be a FUNCTION. It gets the matched
//  text (and any capture groups) and returns the replacement — so the
//  replacement can depend on what was matched.
//
//      censor('I hate this bad code', ['hate', 'bad'])
//        → 'I **** this *** code'          (stars match the word length)
//      censor('badger stew', ['bad'])  → 'badger stew'   (whole words!)
//
//      highlight('Cat cat CAT', 'cat')  → '[Cat] [cat] [CAT]'
//
//      expandTemplate('Hi {name}, {n} new', { name: 'Ada', n: 3 })
//        → 'Hi Ada, 3 new'
//      expandTemplate('Hi {nope}', {})  → 'Hi {nope}'
//
//  censor is case-insensitive but preserves nothing — the word is gone.
//  highlight is case-insensitive and KEEPS the original casing, which is
//  only possible because the callback receives the actual match.
//
//  hint: new RegExp(`\\b(${words.join('|')})\\b`, 'gi') builds a pattern
//  from a list — but an empty list would build a pattern that matches
//  everywhere, so handle that case first.

import { test, eq } from '../../_lib/check.js';

export function censor(text, words) {
  throw new Error('TODO');
}

export function highlight(text, term) {
  throw new Error('TODO');
}

export function expandTemplate(template, values) {
  throw new Error('TODO');
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
