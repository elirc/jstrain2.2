// ─────────────────────────────────────────────────────────────────────────
//  03 · path basics                                        ★☆☆ warm-up
//  concepts: node:path · join · basename · extname
//  run: node 03-path-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Never build a path with string concatenation. `node:path` knows the
//  separator for the machine it is running on ('\' on Windows, '/'
//  everywhere else) and cleans up '.' and '..' as it goes.
//
//      joinParts('src', 'lib', 'index.js')  → 'src/lib/index.js'
//                                             ('src\lib\index.js' on Win)
//      fileName('src/lib/index.js')         → 'index.js'
//      fileStem('report.final.pdf')         → 'report.final'
//      extension('photo.JPG')               → 'jpg'   (lowercase, no dot)
//
//  extension() returns '' when there is no extension at all.

import { test, eq } from '../../_lib/check.js';
import path from 'node:path';

export function joinParts(...parts) {
  throw new Error('TODO');
}

export function fileName(filePath) {
  throw new Error('TODO');
}

export function fileStem(filePath) {
  throw new Error('TODO');
}

export function extension(filePath) {
  throw new Error('TODO');
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
