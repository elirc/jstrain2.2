// ─────────────────────────────────────────────────────────────────────────
//  08 · word wrap — SOLUTION                                 ★★★ stretch
//  run: node 08-word-wrap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a greedy accumulator. Keep the line you are building;
//  for each word ask "does it still fit?" — line.length + 1 + word.length
//  <= width, where the +1 is the space you are about to add. If it fits,
//  append; if not, push the finished line and start a new one with the
//  word. An empty line always takes the word, which is what gives a word
//  longer than the width a line of its own instead of an infinite loop.
//  Two classic wrong turns: forgetting to push the final line (the last
//  words vanish), and comparing line.length + word.length without the
//  space, which lets lines run one character over.

import { test, eq } from '../../_lib/check.js';

export function wordWrap(text, width) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  for (const word of words) {
    if (line === '') {
      line = word;
    } else if (line.length + 1 + word.length <= width) {
      line += ' ' + word;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== '') lines.push(line);

  return lines;
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
