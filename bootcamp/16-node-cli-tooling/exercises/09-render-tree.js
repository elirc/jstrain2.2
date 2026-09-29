// ─────────────────────────────────────────────────────────────────────────
//  09 · tree renderer                                      ★★★ stretch
//  concepts: recursion · accumulated prefixes · last-child logic
//  run: node 09-render-tree.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Draw what `tree` and `npm ls` draw. A node is { name, children? }.
//
//      renderTree({ name: 'project', children: [
//        { name: 'src', children: [{ name: 'index.js' },
//                                  { name: 'util.js' }] },
//        { name: 'package.json' },
//      ]})
//        →
//      project
//      ├── src
//      │   ├── index.js
//      │   └── util.js
//      └── package.json
//
//  The root has no connector. Every other node gets '├── ', or '└── ' if
//  it is the last of its siblings. Below a node, its descendants are
//  indented by four more characters: '│   ' if that node still has
//  siblings coming, '    ' if it was the last one. Return one string,
//  no trailing newline.
//
//  hint: two different four-character strings per level — one decorates
//  the node's own line, the other is handed down to its children

import { test, eq } from '../../_lib/check.js';

export function renderTree(node) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided fixture.
const PROJECT = {
  name: 'project',
  children: [
    { name: 'src', children: [{ name: 'index.js' }, { name: 'util.js' }] },
    { name: 'package.json' },
    { name: 'docs', children: [{ name: 'api.md' }] },
  ],
};

test('a lone node is just its name', () => {
  eq(renderTree({ name: 'solo' }), 'solo');
});

test('an empty children array behaves like a leaf', () => {
  eq(renderTree({ name: 'empty', children: [] }), 'empty');
});

test('an only child is drawn with the corner connector', () => {
  eq(renderTree({ name: 'root', children: [{ name: 'one' }] }),
    'root\n└── one');
});

test('siblings use the tee until the last one', () => {
  eq(
    renderTree({ name: 'root', children: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] }),
    ['root', '├── a', '├── b', '└── c'].join('\n')
  );
});

test('descendants of a non-last child keep the spine', () => {
  eq(
    renderTree({
      name: 'root',
      children: [
        { name: 'a', children: [{ name: 'a1' }] },
        { name: 'b' },
      ],
    }),
    ['root', '├── a', '│   └── a1', '└── b'].join('\n')
  );
});

test('descendants of the last child get spaces, not a spine', () => {
  eq(
    renderTree({
      name: 'root',
      children: [{ name: 'z', children: [{ name: 'z1' }, { name: 'z2' }] }],
    }),
    ['root', '└── z', '    ├── z1', '    └── z2'].join('\n')
  );
});

test('nesting three levels deep stays aligned', () => {
  eq(
    renderTree({
      name: 'a',
      children: [
        { name: 'b', children: [{ name: 'c', children: [{ name: 'd' }] }] },
        { name: 'e' },
      ],
    }),
    ['a', '├── b', '│   └── c', '│       └── d', '└── e'].join('\n')
  );
});

test('renders the whole project tree', () => {
  eq(
    renderTree(PROJECT),
    [
      'project',
      '├── src',
      '│   ├── index.js',
      '│   └── util.js',
      '├── package.json',
      '└── docs',
      '    └── api.md',
    ].join('\n')
  );
});
