// ─────────────────────────────────────────────────────────────────────────
//  04 · template engine — SOLUTION                          ★★★ capstone
//  concepts: regex · recursion · scope objects · escaping
//  time: 45–55 min · 4 stages · 23 tests
//  run: node 04-template-engine.js
// ─────────────────────────────────────────────────────────────────────────
//
//  WALKTHROUGH
//
//  Architecture. Two layers, and keeping them apart is the whole trick:
//    · interpolate() — flat text in, flat text out. Knows about {{x}},
//      {{{x}}} and escaping. Knows nothing about blocks.
//    · render() — finds the FIRST block, splits the template into
//      before / body / after, renders each piece, concatenates. `before`
//      goes to interpolate, `body` and `after` go back through render.
//  That recursion is what makes nesting work without any extra code.
//
//  Stage 1 — resolve() is a reduce over the dot path with a null guard, so
//  {{a.b.c}} on missing data yields undefined instead of throwing. Missing
//  values render as '' — a template that prints "undefined" to a customer
//  is the most embarrassing bug in this file.
//
//  Stage 2 — escape by default, opt out loudly. `{{{x}}}` is deliberately
//  ugly so that "this value is trusted HTML" is visible in review. The
//  single-pass replace over a character class is what makes escaping
//  idempotent-safe: each character is examined once, so the '&' you emit
//  for '<' can never be re-escaped. The regex tries the triple-brace
//  alternative first — alternation is ordered, and {{{x}}} would otherwise
//  match {{ ... }} with a stray brace.
//
//  Stage 3 — finding the closing tag is a DEPTH COUNT, not an indexOf.
//  Scan forward for any {{#...}} or {{/...}}, +1 and -1, and the tag that
//  brings the depth to zero is yours. This is the same balanced-delimiter
//  scan you would write for brackets in a parser.
//
//  Stage 4 — {{#each}} is a scope-chain problem. For each item build a
//  fresh context: `{ ...parent, ...item, this: item, '@index': i }`. Spread
//  order IS the shadowing rule — the item wins over the parent — and
//  storing 'this' and '@index' as ordinary keys means resolve() needs no
//  special cases for them.
//
//  Classic wrong turn: one giant regex with /s and .*? to grab a block
//  body. It works until a template has two blocks or a nested one, then it
//  matches from the first opener to the LAST closer and quietly deletes
//  half the page.

import { test, eq } from '../../_lib/check.js';

const ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

// stage 2 — one pass over the dangerous characters, so nothing is
// escaped twice.
export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ENTITIES[ch]);
}

// stage 1 — 'a.b.c' walked safely; anything missing becomes undefined.
function resolve(data, path) {
  return path
    .split('.')
    .reduce((value, key) => (value == null ? undefined : value[key]), data);
}

// stage 1–2 — triple braces FIRST: alternation is ordered.
const TAG = /\{\{\{\s*([\w.@$]+)\s*\}\}\}|\{\{\s*([\w.@$]+)\s*\}\}/g;

export function interpolate(text, data) {
  return text.replace(TAG, (_match, rawPath, escapedPath) => {
    const value = resolve(data, rawPath ?? escapedPath);
    if (value === null || value === undefined) return '';
    return rawPath ? String(value) : escapeHtml(value);
  });
}

// stage 3 — an empty list is falsy: {{#if items}} reads as "if there are
// items", which is what a template author means every single time.
const isTruthy = (value) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value);

// stage 4 — the scope chain, as one object. Spread order = shadowing.
function itemScope(parent, item, index) {
  const fields =
    item !== null && typeof item === 'object' && !Array.isArray(item) ? item : null;
  return { ...parent, ...fields, this: item, '@index': index };
}

const BLOCK_OPEN = /\{\{#(if|each)\s+([\w.@$]+)\s*\}\}/;
const ANY_TAG = /\{\{#(?:if|each)\s+[\w.@$]+\s*\}\}|\{\{\/(if|each)\}\}/g;

// stage 3 — balanced-delimiter scan: +1 on an opener, -1 on a closer.
function findClose(template, from) {
  ANY_TAG.lastIndex = from;
  let depth = 1;
  let match;
  while ((match = ANY_TAG.exec(template)) !== null) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) return { start: match.index, end: ANY_TAG.lastIndex };
  }
  throw new Error('render: a block was never closed');
}

export function render(template, data) {
  const open = BLOCK_OPEN.exec(template);
  if (open === null) return interpolate(template, data); // stages 1–2

  const [tag, type, path] = open;
  const bodyStart = open.index + tag.length;
  const close = findClose(template, bodyStart);
  const before = template.slice(0, open.index);
  const body = template.slice(bodyStart, close.start);
  const after = template.slice(close.end);
  const value = resolve(data, path);

  let middle = '';
  if (type === 'if') {
    if (isTruthy(value)) middle = render(body, data); // stage 3
  } else {
    const items = Array.isArray(value) ? value : []; // stage 4
    middle = items
      .map((item, index) => render(body, itemScope(data, item, index)))
      .join('');
  }

  return interpolate(before, data) + middle + render(after, data);
}

// ──────────────────────────── tests ──────────────────────────────────────

// ── stage 1: {{interpolation}} ───────────────────────────────────────────

test('replaces a tag with the matching value', () => {
  eq(render('Hi {{name}}!', { name: 'Ada' }), 'Hi Ada!');
});

test('text without tags comes back unchanged', () => {
  eq(render('just words', { name: 'Ada' }), 'just words');
  eq(render('', {}), '');
});

test('resolves dot paths', () => {
  const data = { user: { profile: { city: 'Rome' } } };
  eq(render('{{user.profile.city}}', data), 'Rome');
});

test('a missing key renders as nothing, never "undefined"', () => {
  eq(render('[{{nope}}]', {}), '[]');
  eq(render('[{{a.b.c}}]', { a: {} }), '[]');
});

test('spaces inside the braces are allowed', () => {
  eq(render('{{ name }}', { name: 'Ada' }), 'Ada');
});

test('0 and false render, null and undefined render as nothing', () => {
  const data = { n: 0, flag: false, nil: null, un: undefined };
  eq(render('{{n}}|{{flag}}|{{nil}}|{{un}}', data), '0|false||');
});

// ── stage 2: escaping, and {{{raw}}} to opt out ──────────────────────────

test('escapeHtml handles the five characters that matter', () => {
  eq(escapeHtml('<a href="x">Tom & Jerry\'s</a>'),
    '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;');
});

test('values are escaped by default', () => {
  eq(render('{{bio}}', { bio: '<script>alert(1)</script>' }),
    '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('escaping happens once — & does not eat the other entities', () => {
  eq(render('{{s}}', { s: '<b>' }), '&lt;b&gt;');
  eq(render('{{s}}', { s: 'a & b' }), 'a &amp; b');
});

test('{{{triple}}} inserts the value untouched', () => {
  eq(render('{{{bio}}}', { bio: '<b>hi</b>' }), '<b>hi</b>');
  eq(render('{{{missing}}}', {}), '');
});

test('interpolate fills a fragment on its own', () => {
  eq(interpolate('hi {{name}}', { name: '<b>' }), 'hi &lt;b&gt;');
});

// ── stage 3: {{#if}} blocks ──────────────────────────────────────────────

test('an if block keeps its body when the value is truthy', () => {
  eq(render('{{#if admin}}danger{{/if}}', { admin: true }), 'danger');
});

test('an if block drops its body when the value is falsy', () => {
  eq(render('{{#if admin}}danger{{/if}}', { admin: false }), '');
  eq(render('{{#if admin}}danger{{/if}}', {}), '');
});

test('an empty array is falsy — "if there are items"', () => {
  eq(render('{{#if items}}some{{/if}}', { items: [] }), '');
  eq(render('{{#if items}}some{{/if}}', { items: [1] }), 'some');
});

test('the condition can be a dot path', () => {
  eq(render('{{#if user.admin}}hi{{/if}}', { user: { admin: true } }), 'hi');
});

test('text around and between blocks survives', () => {
  const out = render('A{{#if a}}B{{/if}}C{{#if b}}D{{/if}}E', { a: 1, b: 0 });
  eq(out, 'ABCE');
});

test('tags inside an if body are still interpolated', () => {
  eq(render('{{#if on}}v={{v}}{{/if}}', { on: true, v: 7 }), 'v=7');
});

// ── stage 4: {{#each}} blocks ────────────────────────────────────────────

test('each repeats its body once per item, with {{this}}', () => {
  eq(render('{{#each xs}}[{{this}}]{{/each}}', { xs: [1, 2, 3] }), '[1][2][3]');
});

test('{{@index}} is the position in the list', () => {
  eq(render('{{#each xs}}{{@index}}:{{this}} {{/each}}', { xs: ['a', 'b'] }),
    '0:a 1:b ');
});

test('object items expose their own fields', () => {
  const data = { rows: [{ name: 'ada' }, { name: 'grace' }] };
  eq(render('{{#each rows}}{{name}}/{{this.name}} {{/each}}', data),
    'ada/ada grace/grace ');
});

test('an empty list renders nothing at all', () => {
  eq(render('start{{#each xs}}x{{/each}}end', { xs: [] }), 'startend');
  eq(render('start{{#each xs}}x{{/each}}end', {}), 'startend');
});

test('the outer data is still readable inside the loop', () => {
  const data = { title: 'List', xs: ['a', 'b'] };
  eq(render('{{#each xs}}{{title}}:{{this}} {{/each}}', data), 'List:a List:b ');
});

test('blocks nest — an if inside an each', () => {
  const data = {
    items: [
      { label: 'a', done: true },
      { label: 'b', done: false },
    ],
  };
  const tpl = '{{#each items}}{{#if done}}[x] {{/if}}{{label}}; {{/each}}';
  eq(render(tpl, data), '[x] a; b; ');
});
