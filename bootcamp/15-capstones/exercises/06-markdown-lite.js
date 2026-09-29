// ─────────────────────────────────────────────────────────────────────────
//  06 · markdown-lite                                       ★★★ capstone
//  concepts: line parsing · state machines · escaping · regex
//  time: 40–50 min · 4 stages · 24 tests
//  run: node 06-markdown-lite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  THE PITCH
//  `marked` and `markdown-it` in miniature — the thing behind every README
//  preview, every comment box and every static-site generator. The lesson
//  underneath: a document has BLOCK structure (paragraphs, headings, lists)
//  and INLINE structure (bold, code, links), and every markdown parser
//  worth reading keeps those two passes strictly apart.
//
//  STAGES — do them in order, run the file after each one
//    1. blocks ............. paragraphs and # ## ### headings
//    2. inline ............. **bold** *italic* `code` [text](url)
//    3. lists .............. consecutive "- " lines → one <ul>
//    4. escaping ........... raw HTML is text, and code spans are literal
//
//  THE SPEC
//
//      mdToHtml('hello')            → '<p>hello</p>'
//      mdToHtml('# Title')          → '<h1>Title</h1>'
//      mdToHtml('a\nb')             → '<p>a b</p>'      (one paragraph)
//      mdToHtml('a\n\nb')           → '<p>a</p>\n<p>b</p>'
//      mdToHtml('- one\n- two')     → '<ul><li>one</li><li>two</li></ul>'
//
//    Blocks are joined with '\n'. Inline rules apply inside headings and
//    list items too — which is exactly why they are a separate function.
//
//      renderInline('**a** *b* `c` [d](/e)')
//        → '<strong>a</strong> <em>b</em> <code>c</code> <a href="/e">d</a>'
//
//    Stage 4 — the source is TEXT, not HTML. '<script>' in a comment must
//    come out as '&lt;script&gt;', and '*' inside a code span must stay a
//    literal star. Escape first, then apply the inline rules, and pull the
//    code spans out of the way before the emphasis rules ever see them.
//
//  hint (stage 3): a `while (i < lines.length)` loop with a hand-managed
//  `i` beats a for-of here — a list is "keep taking lines while they start
//  with '- '", which needs to consume more than one line per step.
//
//  hint (stage 4): `text.split(/`([^`]+)`/)` returns the plain pieces at
//  even indexes and the code contents at odd ones. That one line separates
//  "code" from "not code" with no state machine at all.

import { test, eq } from '../../_lib/check.js';

// stage 4 — & < > " ' → entities, in a single pass.
export function escapeHtml(text) {
  throw new Error('TODO');
}

// stages 2 + 4 — inline markup for one fragment of text.
export function renderInline(text) {
  throw new Error('TODO');
}

// stages 1 + 3 — the block pass: split into lines, emit HTML blocks.
export function mdToHtml(markdown) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// ── stage 1: paragraphs and headings ─────────────────────────────────────

test('a plain line becomes a paragraph', () => {
  eq(mdToHtml('hello there'), '<p>hello there</p>');
});

test('#, ## and ### become h1, h2 and h3', () => {
  eq(mdToHtml('# One'), '<h1>One</h1>');
  eq(mdToHtml('## Two'), '<h2>Two</h2>');
  eq(mdToHtml('### Three'), '<h3>Three</h3>');
});

test('#### is not a heading — h1 to h3 only', () => {
  eq(mdToHtml('#### Four'), '<p>#### Four</p>');
});

test('a blank line starts a new paragraph', () => {
  eq(mdToHtml('one\n\ntwo'), '<p>one</p>\n<p>two</p>');
});

test('consecutive lines join into one paragraph', () => {
  eq(mdToHtml('one\ntwo\nthree'), '<p>one two three</p>');
});

test('empty input and stray blank lines produce nothing', () => {
  eq(mdToHtml(''), '');
  eq(mdToHtml('\n\n\n'), '');
  eq(mdToHtml('\n\nhi\n\n'), '<p>hi</p>');
});

// ── stage 2: inline markup ───────────────────────────────────────────────

test('**bold** becomes strong', () => {
  eq(mdToHtml('say **loudly** now'), '<p>say <strong>loudly</strong> now</p>');
});

test('*italic* becomes em', () => {
  eq(mdToHtml('say *softly* now'), '<p>say <em>softly</em> now</p>');
});

test('`code` becomes a code span', () => {
  eq(mdToHtml('run `npm test` now'), '<p>run <code>npm test</code> now</p>');
});

test('[text](url) becomes a link', () => {
  eq(mdToHtml('see [the docs](/docs) now'),
    '<p>see <a href="/docs">the docs</a> now</p>');
});

test('bold is not parsed as two italics', () => {
  eq(renderInline('**a**'), '<strong>a</strong>');
  eq(renderInline('*a*'), '<em>a</em>');
  eq(renderInline('**a** and *b*'), '<strong>a</strong> and <em>b</em>');
});

test('inline markup works inside a heading', () => {
  eq(mdToHtml('## The **big** one'), '<h2>The <strong>big</strong> one</h2>');
});

// ── stage 3: lists ───────────────────────────────────────────────────────

test('a single "- " line becomes a one-item list', () => {
  eq(mdToHtml('- alone'), '<ul><li>alone</li></ul>');
});

test('consecutive items collapse into one list', () => {
  eq(mdToHtml('- one\n- two\n- three'),
    '<ul><li>one</li><li>two</li><li>three</li></ul>');
});

test('a blank line ends the list, so a second list is a second ul', () => {
  eq(mdToHtml('- one\n\n- two'),
    '<ul><li>one</li></ul>\n<ul><li>two</li></ul>');
});

test('inline markup works inside list items', () => {
  eq(mdToHtml('- a **b** [c](/d)'),
    '<ul><li>a <strong>b</strong> <a href="/d">c</a></li></ul>');
});

test('a paragraph right after a list is a separate block', () => {
  eq(mdToHtml('- one\nafter'), '<ul><li>one</li></ul>\n<p>after</p>');
});

// ── stage 4: escaping and the tricky interactions ────────────────────────

test('escapeHtml turns the dangerous characters into entities', () => {
  eq(escapeHtml('<b>&</b>'), '&lt;b&gt;&amp;&lt;/b&gt;');
});

test('raw HTML in the source is escaped, not passed through', () => {
  eq(mdToHtml('<script>alert(1)</script>'),
    '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
});

test('& becomes &amp; exactly once', () => {
  eq(mdToHtml('AT&T'), '<p>AT&amp;T</p>');
});

test('a star inside a code span stays a literal star', () => {
  eq(mdToHtml('use `a * b` here'), '<p>use <code>a * b</code> here</p>');
  eq(mdToHtml('`**not bold**`'), '<p><code>**not bold**</code></p>');
});

test('angle brackets inside a code span are escaped', () => {
  eq(mdToHtml('`<div>`'), '<p><code>&lt;div&gt;</code></p>');
});

test('link text is escaped but the anchor still works', () => {
  eq(mdToHtml('[a<b](/x)'), '<p><a href="/x">a&lt;b</a></p>');
});

test('a whole small document', () => {
  const md = [
    '# Title',
    '',
    'Hello **world** and `code`.',
    '',
    '- one',
    '- two *emph*',
    '',
    'See [docs](/docs).',
  ].join('\n');
  const html = [
    '<h1>Title</h1>',
    '<p>Hello <strong>world</strong> and <code>code</code>.</p>',
    '<ul><li>one</li><li>two <em>emph</em></li></ul>',
    '<p>See <a href="/docs">docs</a>.</p>',
  ].join('\n');
  eq(mdToHtml(md), html);
});
