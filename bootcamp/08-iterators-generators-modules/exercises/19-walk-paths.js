// ─────────────────────────────────────────────────────────────────────────
//  19 · walkPaths · flattenConfig                              ★★☆ core
//  concepts: yield* composition · carrying a prefix down a recursion
//  run: node 19-walk-paths.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two jobs, one shape: walk a nested thing and hand out the LEAVES,
//  each labelled with the path you took to reach it.
//
//      walkPaths(PROJECT)
//          → 'app/index.js', 'app/src/main.js', 'app/src/lib/util.js'
//        a node is { name } for a file, { name, children } for a folder;
//        folders themselves are not yielded, empty folders yield nothing
//
//      flattenConfig({ db: { host: 'x' }, debug: false })
//          → ['db.host', 'x'], ['debug', false]
//        only plain objects are branches — arrays, null and primitives
//        are values, however deep they look
//
//  Both generators take a second parameter that accumulates the path so
//  far. Give it a default so the caller never has to pass it.
//
//  hint: recurse with `yield* walkPaths(child, path)` — the child's
//        values flow straight out through you, no arrays in between

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
  throw new Error('TODO');
}

export function* flattenConfig(config, prefix = '') {
  throw new Error('TODO');
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
