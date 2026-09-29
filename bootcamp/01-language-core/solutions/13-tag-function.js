// ─────────────────────────────────────────────────────────────────────────
//  13 · html tag — SOLUTION                                  ★★★ stretch
//  run: node 13-tag-function.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a tag function is just a function whose first argument is
//  the array of literal chunks and whose rest parameter collects the
//  interpolated values. Since strings.length === values.length + 1, a
//  reduce with NO initial value starts at strings[0] and then alternates
//  value/chunk — no off-by-one bookkeeping.
//
//  render() is separate from escape() on purpose: nullish values become
//  '' (so `${undefined}` does not print "undefined"), arrays recurse so
//  lists of children work, and only leaves get String()-ed and escaped.
//
//  The security point: the static chunks are code YOU wrote and are left
//  alone; the values are data someone else may control, so they are the
//  only thing escaped.

import { test, eq } from '../../_lib/check.js';

const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function render(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(render).join('');
  return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

export function html(strings, ...values) {
  return strings.reduce(
    (out, chunk, index) => out + render(values[index - 1]) + chunk
  );
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
