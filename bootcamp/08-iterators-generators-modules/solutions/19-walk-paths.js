// ─────────────────────────────────────────────────────────────────────────
//  19 · walkPaths · flattenConfig — SOLUTION                   ★★☆ core
//  run: node 19-walk-paths.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the recursion carries state DOWN in a parameter and
//  hands results UP through `yield*`. A default parameter (`prefix = ''`)
//  keeps that plumbing out of the caller's face, which is the standard
//  trick for recursive generators.
//
//  Nothing is ever collected: `yield* walkPaths(child, path)` splices a
//  child's values into your own stream one at a time, so a 40,000-file
//  tree costs one path string at a time instead of an array of 40,000.
//
//  flattenConfig is the same walk over a different data model, and its
//  only real decision is "what counts as a branch". A bare
//  `typeof value === 'object'` is the classic wrong turn: it says yes
//  to null, and Object.entries(null) throws — and yes to arrays, which
//  then flatten into 'db.ports.0' keys nobody asked for.

import { test, eq } from '../../_lib/check.js';

// scaffolding: sample data, a plain-object test, take() from earlier.
// Do not edit.
const PROJECT = {
  name: 'app',
  children: [
    { name: 'index.js' },
    {
      name: 'src',
      children: [
        { name: 'main.js' },
        { name: 'lib', children: [{ name: 'util.js' }] },
      ],
    },
    { name: 'empty', children: [] },
    { name: 'README.md' },
  ],
};

const CONFIG = {
  port: 8080,
  db: { host: 'localhost', creds: { user: 'root' }, ports: [5432, 5433] },
  debug: false,
  cache: {},
  fallback: null,
};

const isPlainObject = (v) =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function* take(n, iterable) {
  if (n <= 0) return;
  let taken = 0;
  for (const value of iterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
}

export function* walkPaths(node, prefix = '') {
  const path = prefix ? `${prefix}/${node.name}` : node.name;
  if (!node.children) {
    yield path;
    return;
  }
  for (const child of node.children) yield* walkPaths(child, path);
}

export function* flattenConfig(config, prefix = '') {
  for (const [key, value] of Object.entries(config)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value)) yield* flattenConfig(value, path);
    else yield [path, value];
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('walkPaths yields every file path, depth first', () => {
  eq(
    [...walkPaths(PROJECT)],
    [
      'app/index.js',
      'app/src/main.js',
      'app/src/lib/util.js',
      'app/README.md',
    ]
  );
});

test('a lone file is its own path', () => {
  eq([...walkPaths({ name: 'solo.txt' })], ['solo.txt']);
});

test('an empty folder contributes no paths', () => {
  const tree = { name: 'app', children: [{ name: 'empty', children: [] }] };
  eq([...walkPaths(tree)], []);
});

test('walkPaths is lazy — the first paths cost no full walk', () => {
  eq([...take(2, walkPaths(PROJECT))], ['app/index.js', 'app/src/main.js']);
});

test('flattenConfig turns nesting into dotted keys', () => {
  eq(
    [...flattenConfig(CONFIG)],
    [
      ['port', 8080],
      ['db.host', 'localhost'],
      ['db.creds.user', 'root'],
      ['db.ports', [5432, 5433]],
      ['debug', false],
      ['fallback', null],
    ]
  );
});

test('an array is a value, not a branch to walk into', () => {
  eq([...flattenConfig({ ports: [1, 2] })], [['ports', [1, 2]]]);
});

test('null is a value even though typeof calls it an object', () => {
  eq([...flattenConfig({ a: null, b: { c: null } })], [
    ['a', null],
    ['b.c', null],
  ]);
});

test('objects with nothing in them contribute nothing', () => {
  eq([...flattenConfig({})], []);
  eq([...flattenConfig({ a: {}, b: 1 })], [['b', 1]]);
});
