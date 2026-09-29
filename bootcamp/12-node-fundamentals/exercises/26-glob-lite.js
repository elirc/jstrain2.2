// ─────────────────────────────────────────────────────────────────────────
//  26 · glob-lite                                            ★★★ stretch
//  concepts: pattern → RegExp · escaping · walking a tree
//  run: node 26-glob-lite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every build tool takes patterns like 'src/**/*.test.js'. Under the
//  hood a glob is compiled to a regular expression once and then run
//  against the paths you already walked. Build that compiler.
//
//      matchGlob('*.js', 'app.js')            → true
//      matchGlob('*.js', 'src/app.js')        → false   ('*' stops at '/')
//      matchGlob('src/**/*.js', 'src/a.js')   → true    ('**' can be zero)
//      matchGlob('src/**/*.js', 'src/x/y.js') → true
//      matchGlob('a?c.txt', 'abc.txt')        → true
//      await globFiles(root, '**/*.md')       → ['docs/a.md', 'readme.md']
//
//  The three wildcards: `?` is exactly one character that is not '/',
//  `*` is any run of characters (possibly empty) that contains no '/',
//  and a `**` segment stands for zero or more whole path segments.
//  Everything else is literal — including '.', '+' and '(' — and the
//  match is anchored: the pattern must cover the whole path.
//  globFiles walks the tree and returns matching FILES only, as sorted
//  '/'-joined paths relative to root.
//
//  hint: split the pattern on '/' and compile it segment by segment. A
//  '**' segment that is not last becomes "zero or more segments, each
//  followed by a slash" — the trailing slash belongs INSIDE that group.

import { test, eq } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Provided: temp dir per test + a tree builder (string = file contents,
// null = empty directory).
const TMP_ROOT = path.join(import.meta.dirname, '..', 'tmp-test');

async function withTempDir(run) {
  const dir = path.join(TMP_ROOT, randomUUID());
  await fs.mkdir(dir, { recursive: true });
  try {
    return await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true, maxRetries: 3 });
    await fs.rmdir(TMP_ROOT).catch(() => {});
  }
}

async function makeTree(dir, spec) {
  for (const [rel, contents] of Object.entries(spec)) {
    const full = path.join(dir, ...rel.split('/'));
    await fs.mkdir(path.dirname(full), { recursive: true });
    if (contents === null) await fs.mkdir(full, { recursive: true });
    else await fs.writeFile(full, contents, 'utf8');
  }
}

export function matchGlob(pattern, filePath) {
  throw new Error('TODO');
}

export async function globFiles(root, pattern) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a pattern with no wildcards matches only itself', () => {
  eq(matchGlob('src/app.js', 'src/app.js'), true);
  eq(matchGlob('src/app.js', 'src/app.jsx'), false);
  eq(matchGlob('src/app.js', 'lib/src/app.js'), false);
});

test('* matches anything inside one segment', () => {
  eq(matchGlob('*.js', 'app.js'), true);
  eq(matchGlob('*.js', '.js'), true);
  eq(matchGlob('src/*.js', 'src/app.js'), true);
  eq(matchGlob('app.*', 'app.test.js'), true);
});

test('* never crosses a slash', () => {
  eq(matchGlob('*.js', 'src/app.js'), false);
  eq(matchGlob('src/*.js', 'src/lib/app.js'), false);
});

test('? matches exactly one character', () => {
  eq(matchGlob('a?c.txt', 'abc.txt'), true);
  eq(matchGlob('a?c.txt', 'ac.txt'), false);
  eq(matchGlob('a?c.txt', 'abbc.txt'), false);
  eq(matchGlob('?/b', 'a/b'), true);
});

test('** spans zero or more directories', () => {
  eq(matchGlob('src/**/*.js', 'src/app.js'), true);
  eq(matchGlob('src/**/*.js', 'src/lib/app.js'), true);
  eq(matchGlob('src/**/*.js', 'src/lib/deep/app.js'), true);
  eq(matchGlob('src/**/*.js', 'lib/app.js'), false);
  eq(matchGlob('**/*.test.js', 'x.test.js'), true);
  eq(matchGlob('**', 'a/b/c.txt'), true);
});

test('regex metacharacters in the pattern are literal', () => {
  eq(matchGlob('data.txt', 'data0txt'), false);
  eq(matchGlob('a+b.txt', 'a+b.txt'), true);
  eq(matchGlob('a+b.txt', 'ab.txt'), false);
  eq(matchGlob('v(1).txt', 'v(1).txt'), true);
});

test('globFiles returns the matching files, sorted and relative', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, {
      'readme.md': '',
      'docs/a.md': '',
      'docs/deep/b.md': '',
      'src/app.js': '',
    });
    eq(await globFiles(dir, '**/*.md'), [
      'docs/a.md',
      'docs/deep/b.md',
      'readme.md',
    ]);
    eq(await globFiles(dir, 'docs/*.md'), ['docs/a.md']);
  });
});

test('globFiles skips directories and can match nothing', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, { 'src': null, 'notes.md': '' });
    eq(await globFiles(dir, '**/*.js'), []);
    eq(await globFiles(dir, 'src'), []);
    eq(await globFiles(dir, '*'), ['notes.md']);
  });
});
