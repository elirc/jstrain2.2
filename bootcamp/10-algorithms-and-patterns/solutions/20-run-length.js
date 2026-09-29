// ─────────────────────────────────────────────────────────────────────────
//  20 · encode / decode — SOLUTION                          ★★☆ core
//  concepts: pattern: run detection (group consecutive) · round-tripping
//  run: node 20-run-length.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: run detection. One pass with an index; at each
//  new character, advance a second cursor while it keeps matching. That
//  inner loop does NOT make it quadratic: every character is consumed
//  exactly once across the whole scan. Time O(n), space O(n) output.
//  decode is the mirror image: read one character, then read digits while
//  they are digits — the multi-digit count is where naive solutions
//  break, because `code[i + 1]` alone stops at 'z1' of 'z12'.
//  Build the pieces in an array and `join('')` at the end rather than
//  `out += ...` in a hot loop; string concatenation in a loop is fine in
//  modern V8 but the array form is the habit that survives other
//  languages.
//  Naive alternative: a regex like /(.)\1*/g does the grouping for you —
//  worth knowing, but interviewers ask for the manual scan because it is
//  the same shape as "group consecutive duplicates" and "compress
//  sorted runs".

import { test, eq } from '../../_lib/check.js';

export function encode(text) {
  const parts = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    let run = 1;
    while (i + run < text.length && text[i + run] === ch) run += 1;
    parts.push(ch, String(run));
    i += run;
  }
  return parts.join('');
}

export function decode(code) {
  const parts = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    i += 1;
    let digits = '';
    while (i < code.length && code[i] >= '0' && code[i] <= '9') {
      digits += code[i];
      i += 1;
    }
    parts.push(ch.repeat(Number(digits)));
  }
  return parts.join('');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('encode collapses runs of repeats', () => {
  eq(encode('aaabbc'), 'a3b2c1');
});

test('encode writes a count of 1 for lone characters', () => {
  eq(encode('abc'), 'a1b1c1');
});

test('encode handles a run longer than nine', () => {
  eq(encode('zzzzzzzzzzzz'), 'z12');
});

test('encode handles empty text and one character', () => {
  eq(encode(''), '');
  eq(encode('q'), 'q1');
});

test('decode expands counts back into runs', () => {
  eq(decode('a3b2c1'), 'aaabbc');
});

test('decode reads multi-digit counts', () => {
  eq(decode('z12'), 'z'.repeat(12));
  eq(decode('a10b2'), 'aaaaaaaaaabb');
});

test('decode handles empty input', () => {
  eq(decode(''), '');
});

test('encode and decode round-trip', () => {
  const text = 'mississippi';
  eq(encode(text), 'm1i1s2i1s2i1p2i1');
  eq(decode(encode(text)), text);
});
