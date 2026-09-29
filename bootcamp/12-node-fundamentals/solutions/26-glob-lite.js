// ─────────────────────────────────────────────────────────────────────────
//  26 · glob-lite — SOLUTION                                 ★★★ stretch
//  run: node 26-glob-lite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: compile per SEGMENT, not per character. Splitting on '/'
//  first is what makes "'*' stops at a slash" fall out for free — inside
//  a segment '*' becomes [^/]* and '?' becomes [^/].
//  Escape the literals BEFORE substituting the wildcards, and leave '*'
//  and '?' out of the escape class; escaping afterwards would turn your
//  own [^/]* into literal brackets.
//  A '**' segment is the only one allowed to cross slashes: as the last
//  segment it is `.*`, otherwise `(?:[^/]+/)*` — zero or more segments,
//  each carrying its own trailing slash. That inner slash is why
//  'src/**/*.js' still matches 'src/app.js'; writing `.*` + '/' instead
//  demands at least one directory and quietly loses the top level.
//  Anchors matter: without ^ and $ 'app' would match 'my-app.js'.

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

function segmentToSource(segment) {
  return segment
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]');
}

function globToRegExp(pattern) {
  const segments = pattern.split('/');
  let source = '^';
  segments.forEach((segment, i) => {
    const last = i === segments.length - 1;
    if (segment === '**') {
      source += last ? '.*' : '(?:[^/]+/)*';
    } else {
      source += segmentToSource(segment) + (last ? '' : '/');
    }
  });
  return new RegExp(source + '$');
}

export function matchGlob(pattern, filePath) {
  return globToRegExp(pattern).test(filePath);
}

export async function globFiles(root, pattern) {
  const re = globToRegExp(pattern);
  const hits = [];

  async function walk(dir, prefix) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(path.join(dir, entry.name), rel);
      else if (entry.isFile() && re.test(rel)) hits.push(rel);
    }
  }

  await walk(root, '');
  return hits.sort();
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
