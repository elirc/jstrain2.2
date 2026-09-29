// ─────────────────────────────────────────────────────────────────────────
//  05 · el() — a tag map factory — SOLUTION                ★★★ stretch
//  run: node ../run.js solutions/05-element-factory.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one interface, `PropsMap`, is the only thing anyone edits.
//  `Tag` is `keyof` it, `ElMap` maps each tag to its node shape, and `El`
//  indexes that map. Adding a `<button>` means adding one line to
//  PropsMap — the factory, the union and every narrowing update
//  themselves. That is what "data-driven types" buys you.
//
//  Why `ElMap[Tag]` and not `{ tag: Tag; props: PropsMap[Tag] }`? Because
//  the second is ONE object type whose two fields vary independently, so
//  `case 'div':` narrows `node.tag` and leaves `node.props` as the full
//  union. Indexing a mapped type with its own key union distributes and
//  produces a real discriminated union, which `switch` can narrow.
//
//  Overloads vs generic: you could write three overloads instead —
//  `el(tag: 'div', props: { id?: string }, ...): El<'div'>` and so on.
//  For three tags they read beautifully; for the ~110 HTML tags they are
//  unmaintainable, and every new tag is a signature. The generic version
//  costs exactly one `as El<K>` in the body: for an unresolved K the
//  compiler cannot prove the literal is the right member of the union,
//  even though it always is. That single assertion is the price of the
//  whole call-site experience — a fine trade, and one you should be able
//  to defend out loud.
//
//  `switch` on `node.tag` with no `default` and a full set of cases makes
//  the function exhaustive: add a tag to PropsMap and this body stops
//  compiling ("not all code paths return"), which is the reminder you
//  want.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

// the map is the source of truth — everything else is derived from it
export interface PropsMap {
  div: { id?: string };
  a: { href: string };
  img: { src: string; alt: string };
}

export type Tag = keyof PropsMap;
export type ElMap = {
  [K in Tag]: { tag: K; props: PropsMap[K]; children: Child[] };
};
export type El<K extends Tag = Tag> = ElMap[K];
export type Child = El | string;

export function el<K extends Tag>(
  tag: K,
  props: PropsMap[K],
  ...children: Child[]
): El<K> {
  return { tag, props, children } as El<K>;
}

export function render(node: Child): string {
  if (typeof node === 'string') return node;
  switch (node.tag) {
    case 'div': {
      const id = node.props.id === undefined ? '' : ` id="${node.props.id}"`;
      return `<div${id}>${node.children.map(render).join('')}</div>`;
    }
    case 'a':
      return `<a href="${node.props.href}">${node.children.map(render).join('')}</a>`;
    case 'img':
      return `<img src="${node.props.src}" alt="${node.props.alt}">`;
  }
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('builds a node out of its tag, props and children', () => {
  const node = el('a', { href: '/x' }, 'go');
  eq(node.tag, 'a');
  eq(node.props.href, '/x');
  eq(node.children, ['go']);
});

test('renders a div, and skips an absent optional prop', () => {
  eq(render(el('div', {}, 'hi')), '<div>hi</div>');
  eq(render(el('div', { id: 'main' }, 'hi')), '<div id="main">hi</div>');
});

test('renders an anchor with its href', () => {
  eq(render(el('a', { href: '/docs' }, 'docs')), '<a href="/docs">docs</a>');
});

test('renders an img as a void element', () => {
  eq(render(el('img', { src: 'cat.png', alt: 'a cat' })), '<img src="cat.png" alt="a cat">');
});

test('renders a nested tree, strings and all', () => {
  const tree = el('div', { id: 'root' }, 'hello ', el('a', { href: '/x' }, 'x'));
  eq(render(tree), '<div id="root">hello <a href="/x">x</a></div>');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _e1 = Expect<Equal<Tag, 'div' | 'a' | 'img'>>;
type _e2 = Expect<Equal<El<'a'>['props'], { href: string }>>;
type _e3 = Expect<Equal<El<'img'>['tag'], 'img'>>;

function _typeTests() {
  const link = el('a', { href: '/x' });
  const tag: 'a' = link.tag;
  const href: string = link.props.href;
  use(tag, href);

  // @ts-expect-error — an anchor needs an href
  el('a', {});

  // @ts-expect-error — 'span' is not in the tag map
  el('span', {});

  // @ts-expect-error — src and alt belong to img, not div
  el('div', { src: 'x', alt: 'y' });

  // @ts-expect-error — a div's props have no href
  el('div', {}).props.href;
}
use(_typeTests);
