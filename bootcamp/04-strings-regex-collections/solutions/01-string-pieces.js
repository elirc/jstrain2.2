// ─────────────────────────────────────────────────────────────────────────
//  01 · string pieces — SOLUTION                            ★☆☆ warm-up
//  run: node 01-string-pieces.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: every one of these is "find an index, then slice".
//  `at(-1)` is the modern way to read the last character — text[text.length
//  - 1] works too but reads worse and still gives undefined on ''.
//  `slice(0, -n)` counts from the end, which is why dropLast needs no
//  length arithmetic; slice also clamps, so an over-long n yields ''.
//  substring() would NOT work here: it treats a negative index as 0 and
//  silently swaps its arguments — the classic wrong turn.
//  fileExtension uses lastIndexOf so 'a.tar.gz' gives 'gz', not 'tar.gz',
//  and -1 (no dot) is the "return empty" branch.

import { test, eq } from '../../_lib/check.js';

export function lastChar(text) {
  return text.at(-1);
}

export function dropLast(text, n) {
  return text.slice(0, -n);
}

export function fileExtension(name) {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1);
}

export function isImage(name) {
  const lower = name.toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.gif'].some((ext) => lower.endsWith(ext));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('lastChar returns the final character', () => {
  eq(lastChar('node'), 'e');
});

test('lastChar returns undefined for an empty string', () => {
  eq(lastChar(''), undefined);
});

test('dropLast removes n characters from the end', () => {
  eq(dropLast('report.txt', 4), 'report');
});

test('dropLast returns empty when n is bigger than the string', () => {
  eq(dropLast('abc', 10), '');
});

test('fileExtension reads the part after the LAST dot', () => {
  eq(fileExtension('archive.tar.gz'), 'gz');
});

test('fileExtension returns empty when there is no dot', () => {
  eq(fileExtension('README'), '');
});

test('isImage accepts known extensions in any case', () => {
  eq(isImage('Photo.PNG'), true);
  eq(isImage('cat.jpg'), true);
});

test('isImage rejects other files', () => {
  eq(isImage('notes.txt'), false);
  eq(isImage('pngfile'), false);
});
