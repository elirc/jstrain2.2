// ─────────────────────────────────────────────────────────────────────────
//  04 · template engine                                     ★★★ capstone
//  concepts: regex · recursion · scope objects · escaping
//  time: 45–55 min · 4 stages · 23 tests
//  run: node 04-template-engine.js
// ─────────────────────────────────────────────────────────────────────────
//
//  THE PITCH
//  Handlebars/Mustache in one file. Server-rendered HTML, email bodies and
//  every CLI scaffolder you have ever run are this: text with holes, a data
//  object, and one very important default — escape everything, because the
//  data came from a user. You will also meet the reason templating engines
//  are recursive: blocks nest.
//
//  STAGES — do them in order, run the file after each one
//    1. {{name}} ........... interpolation, dot paths, missing keys
//    2. escaping ........... escape by default, {{{raw}}} to opt out
//    3. {{#if}} ............ conditional blocks, and finding the {{/if}}
//    4. {{#each}} .......... loops with {{this}} and {{@index}}, nested
//
//  THE SPEC
//
//      render('Hi {{user.name}}!', { user: { name: 'Ada' } })
//        → 'Hi Ada!'
//      render('{{missing}}', {})            → ''          (never 'undefined')
//      render('{{bio}}', { bio: '<b>x</b>' })
//        → '&lt;b&gt;x&lt;/b&gt;'                          (escaped)
//      render('{{{bio}}}', { bio: '<b>x</b>' })
//        → '<b>x</b>'                                      (raw, opted out)
//
//      render('{{#if admin}}danger{{/if}}', { admin: true })  → 'danger'
//      render('{{#each xs}}[{{this}}]{{/each}}', { xs: [1, 2] })
//        → '[1][2]'
//      render('{{#each xs}}{{@index}}={{this}} {{/each}}', { xs: ['a'] })
//        → '0=a '
//
//    An empty array counts as FALSY for {{#if}} — "if there are items".
//    Inside {{#each}} the item's own fields shadow the outer data, but the
//    outer data is still readable: with { title: 'T', xs: [{ n: 1 }] },
//    the body can use {{title}} and {{n}} and {{this.n}}.
//
//    Blocks nest. {{#each}} bodies contain {{#if}} bodies, so you cannot
//    find the closing tag with indexOf — you have to count openers and
//    closers, and a block body is rendered by calling render on it again.
//
//  hint (stage 2): one pass, not five. `str.replace(/[&<>"']/g, ...)` looks
//  at each character once, so '&' can never be escaped twice. Chained
//  .replace() calls have to do '&' first or they mangle their own output.

import { test, eq } from '../../_lib/check.js';

// stage 2 — & < > " ' → &amp; &lt; &gt; &quot; &#39;
export function escapeHtml(text) {
  throw new Error('TODO');
}

// stages 1–2 — fill {{tags}} in a block-free fragment.
export function interpolate(text, data) {
  throw new Error('TODO');
}

// stages 1–4 — the public API: blocks first, then interpolation.
export function render(template, data) {
  throw new Error('TODO');
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
