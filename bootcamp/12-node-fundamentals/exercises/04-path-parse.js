// ─────────────────────────────────────────────────────────────────────────
//  04 · path parse & relative                                ★★☆ core
//  concepts: path.parse/format · resolve · relative · separators
//  run: node 04-path-parse.js
// ─────────────────────────────────────────────────────────────────────────
//
//  path.parse() explodes a path into { root, dir, base, name, ext } and
//  path.format() puts one back together. path.relative(from, to) answers
//  "how do I get from here to there?".
//
//      changeExtension('src/app.ts', '.js')  → 'src/app.js'
//      changeExtension('notes.md', 'txt')    → 'notes.txt'  (dot optional)
//      toPosix('src\\lib\\a.js')             → 'src/lib/a.js'
//      relativeTo('/repo/src', '/repo/docs/readme.md')
//                                            → '../docs/readme.md'
//      isInside('/repo/src', '/repo/src/app/main.js')   → true
//      isInside('/repo/src', '/repo/docs/readme.md')    → false
//
//  relativeTo returns a '/'-separated string on every platform, so build
//  it on top of toPosix. isInside is how you stop a user-supplied path
//  from escaping your upload folder.
//
//  hint: path.relative returns something starting with '..' when you have
//  to walk upwards — and an absolute path when there is no route at all.

import { test, eq } from '../../_lib/check.js';
import path from 'node:path';

export function changeExtension(filePath, newExt) {
  throw new Error('TODO');
}

export function toPosix(filePath) {
  throw new Error('TODO');
}

export function relativeTo(fromDir, toPath) {
  throw new Error('TODO');
}

export function isInside(parentDir, childPath) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('changeExtension swaps the extension', () => {
  eq(changeExtension(path.join('src', 'app.ts'), '.js'), path.join('src', 'app.js'));
});

test('changeExtension accepts an extension without a dot', () => {
  eq(changeExtension('notes.md', 'txt'), 'notes.txt');
});

test('changeExtension adds an extension when there was none', () => {
  eq(changeExtension('LICENSE', '.txt'), 'LICENSE.txt');
});

test('toPosix normalises separators for display', () => {
  eq(toPosix(path.join('src', 'lib', 'index.js')), 'src/lib/index.js');
});

test('relativeTo walks up and back down', () => {
  eq(
    relativeTo(path.resolve('/repo/src'), path.resolve('/repo/docs/readme.md')),
    '../docs/readme.md'
  );
});

test('relativeTo is empty for the same directory', () => {
  eq(relativeTo(path.resolve('/repo'), path.resolve('/repo')), '');
});

test('isInside is true only for real descendants', () => {
  const parent = path.resolve('/repo/src');
  eq(isInside(parent, path.resolve('/repo/src/app/main.js')), true);
  eq(isInside(parent, path.resolve('/repo/docs/readme.md')), false);
  eq(isInside(parent, parent), false);
});

test('isInside is not fooled by a shared name prefix', () => {
  const parent = path.resolve('/repo/src');
  eq(isInside(parent, path.resolve('/repo/src-extra/a.js')), false);
});
