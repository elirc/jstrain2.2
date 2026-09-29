// ─────────────────────────────────────────────────────────────────────────
//  08 · word wrap                                            ★★★ stretch
//  concepts: greedy algorithms · accumulators · string length
//  run: node 08-word-wrap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Wrap text to `width` columns the way a terminal does: fill each line
//  greedily, never split a word, return the lines as an array.
//
//      wordWrap('the quick brown fox jumps', 10)
//        → ['the quick', 'brown fox', 'jumps']
//
//      wordWrap('hi extraordinarily ok', 5)
//        → ['hi', 'extraordinarily', 'ok']     (long word gets its own line)
//
//      wordWrap('a  b\nc', 3)  → ['a b', 'c']  (whitespace is collapsed)
//      wordWrap('   ', 10)     → []
//
//  Walk the words, keeping the line you are building. A word fits if
//  line.length + 1 + word.length <= width — the +1 is the space you are
//  about to add. Do not forget to push the last line.
//
//  hint: split(/\s+/).filter(Boolean) gives you clean words from messy
//  input, including a leading-space string that would otherwise yield ''.

import { test, eq } from '../../_lib/check.js';

export function wordWrap(text, width) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('text that fits stays on one line', () => {
  eq(wordWrap('hello world', 20), ['hello world']);
});

test('fills each line greedily', () => {
  eq(wordWrap('the quick brown fox jumps', 10), [
    'the quick',
    'brown fox',
    'jumps',
  ]);
});

test('no line is wider than the width', () => {
  const lines = wordWrap('one two three four five six seven', 12);
  eq(
    lines.every((l) => l.length <= 12),
    true
  );
});

test('a word longer than the width gets a line of its own', () => {
  eq(wordWrap('hi extraordinarily ok', 5), ['hi', 'extraordinarily', 'ok']);
});

test('collapses newlines and double spaces', () => {
  eq(wordWrap('a  b\nc', 3), ['a b', 'c']);
});

test('empty or blank text wraps to no lines', () => {
  eq(wordWrap('', 10), []);
  eq(wordWrap('   ', 10), []);
});

test('joining the lines gives back every word in order', () => {
  const text = 'wrap this sentence at a narrow width please';
  eq(wordWrap(text, 9).join(' '), text);
});
