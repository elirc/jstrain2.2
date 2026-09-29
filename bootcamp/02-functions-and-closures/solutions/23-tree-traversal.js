// ─────────────────────────────────────────────────────────────────────────
//  23 · walking a directory tree — SOLUTION                ★★★ stretch
//  run: node 23-tree-traversal.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the shape of the data drives the shape of the code — a
//  node is a file or a directory, so every function is one branch per
//  case. The path is threaded DOWN as an extra parameter with a default
//  (`prefix = ''`), which keeps the public signature clean while the
//  recursion carries its context; building the path on the way back up
//  would be far messier. findPath must stop at the first hit, so it uses
//  an explicit loop with an early return rather than map/filter — a
//  reminder that "recursive" does not have to mean "no loops".

import { test, eq, ok } from '../../_lib/check.js';

export function totalSize(node) {
  if (node.type === 'file') return node.size;
  return node.children.reduce((sum, child) => sum + totalSize(child), 0);
}

export function listPaths(node, prefix = '') {
  const path = prefix === '' ? node.name : `${prefix}/${node.name}`;
  if (node.type === 'file') return [path];
  return node.children.flatMap((child) => listPaths(child, path));
}

export function findPath(node, name, prefix = '') {
  const path = prefix === '' ? node.name : `${prefix}/${node.name}`;
  if (node.name === name) return path;
  if (node.type === 'file') return null;
  for (const child of node.children) {
    const hit = findPath(child, name, path);
    if (hit !== null) return hit;
  }
  return null;
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
