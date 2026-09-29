// ─────────────────────────────────────────────────────────────────────────
//  17 · find the path to a node                               ★★☆ core
//  concepts: recursion · backtracking · path building
//  run: node 17-tree-find-path.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every breadcrumb trail, every "reveal in sidebar", every stack trace
//  through a nested config is this function: not just "is it in there?"
//  but "how do I get to it from the root?".
//
//      findPath(projectTree, 'dates.js')
//        → ['project', 'src', 'util', 'dates.js']
//
//      findPath(projectTree, 'project')   → ['project']
//      findPath(projectTree, 'ghost.js')  → null
//
//  Return the names from the root down to the match, inclusive, or null
//  when the name is not in the tree. The first match wins.
//
//  hint: recurse on each child; when a child returns a path, put your own
//  name in front of it — a branch that finds nothing must contribute
//  nothing

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
  throw new Error('TODO');
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
