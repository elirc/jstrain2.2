// ─────────────────────────────────────────────────────────────────────────
//  23 · walking a directory tree                           ★★★ stretch
//  concepts: recursion · trees · accumulators
//  run: node 23-tree-traversal.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Real recursion is rarely a countdown — it is a tree. A node is either
//  a file `{ name, type: 'file', size }` or a directory
//  `{ name, type: 'dir', children: [...] }`.
//
//      totalSize(projectTree)              → 210
//      listPaths(projectTree)              → ['src/index.js',
//                                             'src/lib/util.js',
//                                             'src/lib/deep/tiny.js']
//      findPath(projectTree, 'util.js')    → 'src/lib/util.js'
//      findPath(projectTree, 'nope')       → null
//
//  listPaths returns FILE paths only, depth first, joined with '/'.
//  findPath matches files and directories alike and returns the first
//  match in that same depth-first order, or null.
//
//  hint: pass the path built so far down the recursive call

import { test, eq, ok } from '../../_lib/check.js';

export function totalSize(node) {
  throw new Error('TODO');
}

export function listPaths(node) {
  throw new Error('TODO');
}

export function findPath(node, name) {
  throw new Error('TODO');
}

// ── given: the tree used by the tests ──
const projectTree = {
  name: 'src',
  type: 'dir',
  children: [
    { name: 'index.js', type: 'file', size: 120 },
    {
      name: 'lib',
      type: 'dir',
      children: [
        { name: 'util.js', type: 'file', size: 80 },
        {
          name: 'deep',
          type: 'dir',
          children: [{ name: 'tiny.js', type: 'file', size: 10 }],
        },
      ],
    },
    { name: 'empty', type: 'dir', children: [] },
  ],
};

// ──────────────────────────── tests ──────────────────────────────────────

test('totalSize adds up every file in the tree', () => {
  eq(totalSize(projectTree), 210);
});

test('totalSize handles a lone file and an empty directory', () => {
  eq(totalSize({ name: 'a.js', type: 'file', size: 7 }), 7);
  eq(totalSize({ name: 'empty', type: 'dir', children: [] }), 0);
});

test('listPaths lists the files depth first', () => {
  eq(listPaths(projectTree), [
    'src/index.js',
    'src/lib/util.js',
    'src/lib/deep/tiny.js',
  ]);
});

test('listPaths leaves directories out of the list', () => {
  const paths = listPaths(projectTree);
  ok(!paths.includes('src/lib'), 'directories are not files');
  ok(!paths.includes('src/empty'), 'empty directories add nothing');
});

test('listPaths of a single file is just its name', () => {
  eq(listPaths({ name: 'a.js', type: 'file', size: 1 }), ['a.js']);
  eq(listPaths({ name: 'empty', type: 'dir', children: [] }), []);
});

test('findPath finds a deeply nested file', () => {
  eq(findPath(projectTree, 'util.js'), 'src/lib/util.js');
  eq(findPath(projectTree, 'tiny.js'), 'src/lib/deep/tiny.js');
});

test('findPath also matches directories, including the root', () => {
  eq(findPath(projectTree, 'deep'), 'src/lib/deep');
  eq(findPath(projectTree, 'src'), 'src');
});

test('findPath returns null when nothing matches', () => {
  eq(findPath(projectTree, 'nope.js'), null);
  eq(findPath({ name: 'a.js', type: 'file', size: 1 }, 'b.js'), null);
});
