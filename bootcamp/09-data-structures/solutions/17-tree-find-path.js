// ─────────────────────────────────────────────────────────────────────────
//  17 · find the path to a node — SOLUTION                    ★★☆ core
//  run: node 17-tree-find-path.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the recursion returns a PATH or null, and null means "this
//  branch contributed nothing" — that is the backtracking. Ask each child
//  in turn; the first one that answers with a path gets your name prefixed
//  onto it and the answer bubbles straight up to the caller.
//  The classic wrong turn is pushing names onto one shared array as you
//  descend and forgetting to pop when a branch fails: the breadcrumb for
//  readme.md then comes back with every dead end you wandered through
//  first. Returning a fresh array per level makes that mistake impossible.
//  O(n) worst case — it may look at every node — and O(height) stack.
//  BFS would find the SHALLOWEST match instead of the leftmost one; if two
//  files share a name, that difference decides which one you show.

import { test, eq } from '../../_lib/check.js';

export const projectTree = {
  name: 'project',
  children: [
    {
      name: 'src',
      children: [
        { name: 'index.js', size: 120, children: [] },
        {
          name: 'util',
          children: [
            { name: 'dates.js', size: 90, children: [] },
            { name: 'money.js', size: 60, children: [] },
          ],
        },
      ],
    },
    {
      name: 'docs',
      children: [{ name: 'readme.md', size: 40, children: [] }],
    },
    { name: 'package.json', size: 30, children: [] },
  ],
};

export function findPath(node, name) {
  if (node.name === name) return [node.name];
  for (const child of node.children) {
    const below = findPath(child, name);
    if (below !== null) return [node.name, ...below];
  }
  return null;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the path to the root is just the root', () => {
  eq(findPath(projectTree, 'project'), ['project']);
});

test('finds a direct child', () => {
  eq(findPath(projectTree, 'src'), ['project', 'src']);
});

test('finds a deeply nested file', () => {
  eq(findPath(projectTree, 'dates.js'), [
    'project',
    'src',
    'util',
    'dates.js',
  ]);
});

test('returns null when the name is not in the tree', () => {
  eq(findPath(projectTree, 'ghost.js'), null);
});

test('dead-end branches leave nothing behind in the path', () => {
  eq(findPath(projectTree, 'readme.md'), ['project', 'docs', 'readme.md']);
  eq(findPath(projectTree, 'package.json'), ['project', 'package.json']);
});

test('a leaf tree finds itself and nothing else', () => {
  const leaf = { name: 'solo.txt', children: [] };
  eq(findPath(leaf, 'solo.txt'), ['solo.txt']);
  eq(findPath(leaf, 'other.txt'), null);
});

test('application: renders a breadcrumb trail', () => {
  const crumbs = findPath(projectTree, 'money.js');
  eq(crumbs.join(' / '), 'project / src / util / money.js');
  eq(crumbs.length - 1, 3, 'three levels below the root');
});
