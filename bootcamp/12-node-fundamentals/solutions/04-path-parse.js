// ─────────────────────────────────────────────────────────────────────────
//  04 · path parse & relative — SOLUTION                      ★★☆ core
//  run: node 04-path-parse.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: parse → tweak → format is the safe way to edit a path.
//  Note that path.format ignores `base` when you give it `name` + `ext`,
//  which is exactly what changeExtension wants.
//  toPosix splits on path.sep and rejoins with '/' — the standard trick
//  for putting a path in a log line, a URL or a snapshot assertion.
//  isInside is the security one. `child.startsWith(parent)` says yes to
//  '/repo/src-extra', so instead ask path.relative for the route: a real
//  descendant produces a non-empty relative path that neither starts with
//  '..' nor is absolute (absolute means "different drive", no route).

import { test, eq } from '../../_lib/check.js';
import path from 'node:path';

export function changeExtension(filePath, newExt) {
  const { dir, name } = path.parse(filePath);
  const ext = newExt === '' || newExt.startsWith('.') ? newExt : `.${newExt}`;
  return path.format({ dir, name, ext });
}

export function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

export function relativeTo(fromDir, toPath) {
  return toPosix(path.relative(fromDir, toPath));
}

export function isInside(parentDir, childPath) {
  const rel = path.relative(parentDir, childPath);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
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
