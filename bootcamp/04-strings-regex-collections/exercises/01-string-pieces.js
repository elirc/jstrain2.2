// ─────────────────────────────────────────────────────────────────────────
//  01 · string pieces                                      ★☆☆ warm-up
//  concepts: strings · at · slice · lastIndexOf · endsWith
//  run: node 01-string-pieces.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Four one-liners that every codebase re-implements badly. Strings are
//  immutable — every one of these returns a NEW string.
//
//      lastChar('node')            → 'e'
//      lastChar('')                → undefined
//      dropLast('report.txt', 4)   → 'report'
//      fileExtension('a.tar.gz')   → 'gz'
//      fileExtension('README')     → ''
//      isImage('Photo.PNG')        → true
//
//  `at()` and `slice()` accept negative indexes (count from the end);
//  `substring()` does not — it silently turns -1 into 0.

import { test, eq } from '../../_lib/check.js';

export function lastChar(text) {
  throw new Error('TODO');
}

export function dropLast(text, n) {
  throw new Error('TODO');
}

export function fileExtension(name) {
  throw new Error('TODO');
}

export function isImage(name) {
  throw new Error('TODO');
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
