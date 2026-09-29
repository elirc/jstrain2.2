// ─────────────────────────────────────────────────────────────────────────
//  03 · path basics — SOLUTION                             ★☆☆ warm-up
//  run: node 03-path-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: every one of these is a one-liner once you know the API.
//  The trick worth remembering is `path.basename(p, path.extname(p))` —
//  basename takes a suffix to strip, so the stem falls out of the two
//  functions combined instead of a regex you have to debug.
//  Note what Node considers an extension: '.gitignore' has NONE (a
//  leading dot starts the name), and 'report.final.pdf' has exactly one
//  ('.pdf'). A hand-rolled `split('.')[1]` gets both of those wrong.

import { test, eq } from '../../_lib/check.js';
import path from 'node:path';

export function joinParts(...parts) {
  return path.join(...parts);
}

export function fileName(filePath) {
  return path.basename(filePath);
}

export function fileStem(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

export function extension(filePath) {
  return path.extname(filePath).replace(/^\./, '').toLowerCase();
}

// ──────────────────────────── tests ──────────────────────────────────────

test('joins parts with the platform separator', () => {
  eq(joinParts('src', 'lib', 'index.js'), ['src', 'lib', 'index.js'].join(path.sep));
});

test('collapses .. while joining', () => {
  eq(joinParts('src', 'lib', '..', 'index.js'), path.join('src', 'index.js'));
});

test('fileName is the last segment', () => {
  eq(fileName('src/lib/index.js'), 'index.js');
  eq(fileName(path.join('src', 'lib', 'index.js')), 'index.js');
});

test('fileStem drops only the last extension', () => {
  eq(fileStem('src/report.final.pdf'), 'report.final');
});

test('extension is lowercase and has no dot', () => {
  eq(extension('photo.JPG'), 'jpg');
  eq(extension('src/lib/index.js'), 'js');
});

test('a file with no extension has an empty extension', () => {
  eq(extension('Makefile'), '');
  eq(fileStem('Makefile'), 'Makefile');
});

test('a dotfile is all name and no extension', () => {
  eq(extension('.gitignore'), '');
  eq(fileStem('.gitignore'), '.gitignore');
});
