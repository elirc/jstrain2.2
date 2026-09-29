// ─────────────────────────────────────────────────────────────────────────
//  27 · splitting without losing the delimiter                ★☆☆ warm-up
//  concepts: split with a capturing group
//  run: node 27-split-keep-delimiters.js
// ─────────────────────────────────────────────────────────────────────────
//
//  split() throws the separator away — unless the pattern has a capture
//  group, in which case what the group matched is spliced back into the
//  result. That one rule turns split into a lossless splitter.
//
//      '12+7*3'.split(/[+*]/)    → ['12', '7', '3']       separator gone
//      '12+7*3'.split(/([+*])/)  → ['12', '+', '7', '*', '3']
//
//  Build both splitters. Drop the empty strings split leaves behind when
//  a delimiter starts or ends the input, and keep everything else.
//
//      splitKeepingOps('12+7*3')     → ['12', '+', '7', '*', '3']
//      splitKeepingOps('42')         → ['42']
//      splitKeepingOps('-5+2')       → ['-', '5', '+', '2']
//      splitKeepingTags('a<b>c</b>') → ['a', '<b>', 'c', '</b>']
//
//  Operators are + - * / ; a tag is a '<' … '>' run with no '>' inside.

import { test, eq } from '../../_lib/check.js';

export function splitKeepingOps(expression) {
  throw new Error('TODO');
}

export function splitKeepingTags(markup) {
  throw new Error('TODO');
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
