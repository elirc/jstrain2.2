// ─────────────────────────────────────────────────────────────────────────
//  27 · splitting without losing the delimiter — SOLUTION     ★☆☆ warm-up
//  run: node 27-split-keep-delimiters.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a capturing group in the split pattern is the whole
//  trick — split emits the text between separators AND whatever each
//  group captured, in order. Take the group away and the operators
//  vanish; that is the difference between a lossy and a lossless split.
//  split always reports the text on both sides of a separator, even when
//  that text is empty, so '-5+2' starts with '' and '<b>x</b>' ends with
//  one. filter(Boolean) removes exactly those — and nothing else, because
//  the only falsy value split can produce here is the empty string.
//  Note '-' lives inside the character class as the escaped \- so it is
//  not read as a range, and the tag pattern uses [^>]+ rather than .+ so
//  '<a><b>' does not swallow both tags in one greedy match.

import { test, eq } from '../../_lib/check.js';

export function splitKeepingOps(expression) {
  return expression.split(/([+\-*/])/).filter(Boolean);
}

export function splitKeepingTags(markup) {
  return markup.split(/(<[^>]+>)/).filter(Boolean);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('keeps the operators as pieces of their own', () => {
  eq(splitKeepingOps('12+7*3'), ['12', '+', '7', '*', '3']);
});

test('an expression with no operator is a single piece', () => {
  eq(splitKeepingOps('42'), ['42']);
});

test('drops the empty piece a leading delimiter creates', () => {
  eq(splitKeepingOps('-5+2'), ['-', '5', '+', '2']);
});

test('joining the pieces gives back the original string', () => {
  const source = '100/4-3*2';
  eq(splitKeepingOps(source).join(''), source);
});

test('an empty expression splits to no pieces', () => {
  eq(splitKeepingOps(''), []);
});

test('splitKeepingTags separates tags from text', () => {
  eq(splitKeepingTags('a<b>c</b>'), ['a', '<b>', 'c', '</b>']);
});

test('splitKeepingTags is lossless too', () => {
  const source = '<p>hi <em>there</em></p>';
  eq(splitKeepingTags(source).join(''), source);
});

test('markup with no tags is a single piece', () => {
  eq(splitKeepingTags('plain text'), ['plain text']);
});
