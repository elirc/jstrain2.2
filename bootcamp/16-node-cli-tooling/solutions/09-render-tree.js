// ─────────────────────────────────────────────────────────────────────────
//  09 · tree renderer — SOLUTION                           ★★★ stretch
//  run: node 09-render-tree.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two different strings per level, and confusing them is
//  the whole difficulty. The CONNECTOR ('├── ' or '└── ') decorates the
//  child's own line. The PREFIX ('│   ' or '    ') is what that child
//  hands down to its descendants, and it depends on whether the child was
//  last: a last child has no more siblings below it, so its column must
//  go blank rather than keep drawing a spine down past the end of the
//  branch.
//  Because the prefix is built as an argument and passed down, recursion
//  needs no global state — each level appends four characters to what it
//  was given. Both strings are four characters wide, which is what keeps
//  the columns aligned all the way down.
//  The root is special-cased: it has no connector, only a name.

import { test, eq } from '../../_lib/check.js';

function walk(children, prefix, lines) {
  children.forEach((child, i) => {
    const last = i === children.length - 1;
    lines.push(`${prefix}${last ? '└── ' : '├── '}${child.name}`);
    walk(child.children ?? [], `${prefix}${last ? '    ' : '│   '}`, lines);
  });
}

export function renderTree(node) {
  const lines = [node.name];
  walk(node.children ?? [], '', lines);
  return lines.join('\n');
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
