// ─────────────────────────────────────────────────────────────────────────
//  06 · markdown-lite — SOLUTION                            ★★★ capstone
//  concepts: line parsing · state machines · escaping · regex
//  time: 40–50 min · 4 stages · 24 tests
//  run: node 06-markdown-lite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  WALKTHROUGH
//
//  Architecture. Two passes that never touch each other's job:
//    · mdToHtml — the BLOCK pass. Walks lines with a hand-managed index
//      and decides "heading, list, or paragraph". Each branch consumes as
//      many lines as it needs and pushes one finished block.
//    · renderInline — the INLINE pass. Runs on the TEXT of a block, so
//      every block gets bold/code/links for free and none of them has to
//      know about the others.
//  Real parsers do exactly this (block tokens first, inline second); it is
//  why you can put a link inside a list item without any extra code.
//
//  Stage 1 — the block loop is a hand-rolled `while` over `lines`, not a
//  for-of, because a paragraph or a list eats several lines per step.
//  "Take lines while they still belong to me" is the whole state machine.
//
//  Stage 2 — order inside renderInline is load-bearing. Links first (their
//  text may contain emphasis), then `**` before `*` — reverse those two and
//  '**a**' is read as an empty italic wrapped around another one.
//
//  Stage 3 — a list is "consume while the line starts with '- '". The inner
//  loop advances the same `i` the outer loop uses, which is precisely why
//  the index is managed by hand.
//
//  Stage 4 — escape FIRST, then add markup. Do it the other way round and
//  you escape the '<' of the '<strong>' you just generated. And code spans
//  are split out before emphasis runs, using String.split with a capturing
//  group: odd indexes are the code contents, even indexes are ordinary
//  text. No flags, no state machine, no scanning — the split IS the
//  tokenizer.
//
//  Classic wrong turn: one pass of chained .replace() over the whole
//  document with /m flags. It seems to work for two minutes, then a '*' in
//  a code sample turns half a paragraph italic, and there is no place left
//  to fix it.

import { test, eq } from '../../_lib/check.js';

const ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

// stage 4 — one pass, so '&' can never be escaped twice.
export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ENTITIES[ch]);
}

// stage 2 — links before emphasis, ** before *.
function emphasise(text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// stages 2 + 4 — escape, split the code spans out, decorate the rest.
export function renderInline(text) {
  return escapeHtml(text)
    .split(/`([^`]+)`/)
    .map((piece, i) => (i % 2 === 1 ? `<code>${piece}</code>` : emphasise(piece)))
    .join('');
}

const HEADING = /^(#{1,3})\s+(.*)$/;
const LIST_ITEM = /^-\s+(.*)$/;

// stages 1 + 3 — the block pass.
export function mdToHtml(markdown) {
  const lines = String(markdown).split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i += 1; // blank lines only ever separate blocks
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      const level = heading[1].length;
      blocks.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    if (LIST_ITEM.test(line)) {
      const items = [];
      while (i < lines.length && LIST_ITEM.test(lines[i])) {
        items.push(`<li>${renderInline(LIST_ITEM.exec(lines[i])[1])}</li>`);
        i += 1;
      }
      blocks.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // a paragraph runs until a blank line or the start of another block
    const paragraph = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !HEADING.test(lines[i]) &&
      !LIST_ITEM.test(lines[i])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
  }

  return blocks.join('\n');
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
