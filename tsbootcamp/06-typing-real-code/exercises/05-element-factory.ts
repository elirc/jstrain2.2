// ─────────────────────────────────────────────────────────────────────────
//  05 · el() — a tag map factory                           ★★★ stretch
//  concepts: key maps · mapped unions · discriminated narrowing
//  run: node ../run.js exercises/05-element-factory.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  This is how `document.createElement` and every JSX runtime feel
//  magic: one function whose props AND result change per tag, driven by
//  a map. No DOM here — the nodes are plain objects and `render` turns
//  them into a string.
//
//      el('a', { href: '/x' }, 'go')
//        → { tag: 'a', props: { href: '/x' }, children: ['go'] }
//
//      render(el('div', { id: 'main' }, 'hi', el('img', { src: 's', alt: 'a' })))
//        → '<div id="main">hi<img src="s" alt="a"></div>'
//
//  `El` has to be a UNION of one object type per tag, not one object type
//  with a union of tags — otherwise `switch (node.tag)` inside `render`
//  narrows the tag but not the props, and `node.props.href` will not
//  compile.
//
//  hint: build the union with a mapped type over the tags and then index
//  it: `{ [K in Tag]: {...} }[Tag]`. Returning `El<K>` for a generic K
//  needs one `as` — the compiler cannot check a member of a mapped union
//  it has not resolved yet.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

// the map is the source of truth — everything else is derived from it
export interface PropsMap {
  div: { id?: string };
  a: { href: string };
  img: { src: string; alt: string };
}

export type Tag = TODO;
export type ElMap = TODO;
export type El<K extends Tag = Tag> = TODO;
export type Child = TODO;

export function el(tag: TODO, props: TODO, ...children: TODO[]): TODO {
  throw new Error('TODO');
}

export function render(node: TODO): TODO {
  throw new Error('TODO');
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
