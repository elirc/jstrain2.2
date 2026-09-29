// ─────────────────────────────────────────────────────────────────────────
//  13 · html tag                                             ★★★ stretch
//  concepts: tagged templates · escaping · variadic rest
//  run: node 13-tag-function.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Put a function name directly in front of a template literal and the
//  function receives the pieces instead of a finished string:
//
//      html`<p>${name}</p>`
//      → strings = ['<p>', '</p>'],  values = [name]
//
//  strings always has exactly one more element than values. Build the
//  string back up, but escape every INTERPOLATED value — that is how a
//  real templating layer stops HTML injection while leaving your own
//  markup alone.
//
//      html`<p>${'<b>hi</b>'}</p>`  → '<p>&lt;b&gt;hi&lt;/b&gt;</p>'
//      html`a & b`                  → 'a & b'   (static text untouched)
//      html`<i>${null}</i>`         → '<i></i>' (null/undefined → '')
//      html`<ul>${['<a>', 'b']}</ul>` → '<ul>&lt;a&gt;b</ul>'
//
//  hint: walk strings and slot values[i] between them; arrays recurse.

import { test, eq } from '../../_lib/check.js';

const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function html(strings, ...values) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the static text when there is nothing to interpolate', () => {
  eq(html`plain text`, 'plain text');
  eq(html``, '');
});

test('interpolates ordinary values', () => {
  eq(html`<p>${'hi'}</p>`, '<p>hi</p>');
  eq(html`n=${42}`, 'n=42');
  eq(html`${true}`, 'true');
});

test('escapes HTML in the values', () => {
  eq(html`<p>${'<b>hi</b>'}</p>`, '<p>&lt;b&gt;hi&lt;/b&gt;</p>');
  eq(html`${'<script>'}`, '&lt;script&gt;');
});

test('never escapes the static parts', () => {
  eq(html`a & b`, 'a & b');
  eq(html`<div>${'x'}</div>`, '<div>x</div>');
});

test('escapes quotes and ampersands too', () => {
  eq(html`${'Tom & "Jerry"'}`, 'Tom &amp; &quot;Jerry&quot;');
  eq(html`${"it's"}`, 'it&#39;s');
});

test('renders null and undefined as nothing', () => {
  eq(html`<i>${null}</i>`, '<i></i>');
  eq(html`<i>${undefined}</i>`, '<i></i>');
  eq(html`${0}`, '0');
});

test('joins array values, escaping each item', () => {
  eq(html`<ul>${['<a>', 'b']}</ul>`, '<ul>&lt;a&gt;b</ul>');
  eq(html`${[]}`, '');
});

test('handles several substitutions in a row', () => {
  eq(html`${1}${2}${3}`, '123');
  eq(html`${'a'}-${'b'}-`, 'a-b-');
});
