// ─────────────────────────────────────────────────────────────────────────
//  32 · fill a URL template                                     ★★☆ core
//  concepts: encodeURIComponent · replace with a callback · URL
//  run: node 32-url-template.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every SDK describes its endpoints as templates — '/repos/{owner}/
//  {repo}/issues/{number}' — and then fills them per request. The whole
//  job is one substitution plus one encoding decision.
//
//      fillTemplate('/users/{id}', { id: 42 })       → '/users/42'
//      fillTemplate('/s/{q}', { q: 'red shoes/hi' }) → '/s/red%20shoes%2Fhi'
//      fillTemplate('/users/{id}', {})               → throws (names 'id')
//
//      expandUrl('https://api.dev/v1/', 'users/{id}', { id: 7, page: 2 })
//        → 'https://api.dev/v1/users/7?page=2'
//
//  Every value is encoded with encodeURIComponent — a slash inside a
//  value is data, not a path separator. A `{name}` with no matching value
//  is a bug, so throw and name it. expandUrl fills the template, resolves
//  it against the base, and turns the params the template did NOT use
//  into query parameters (URLSearchParams writes a space as '+', which
//  means the same thing as %20 in a query string).
//
//  hint: String.replace takes a function — `template.replace(/\{(\w+)\}/g,
//  (whole, name) => ...)` gives you each placeholder name in turn.

import { test, eq, throws } from '../../_lib/check.js';

export function fillTemplate(template, params) {
  throw new Error('TODO');
}

export function expandUrl(base, template, params = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('substitutes a single placeholder', () => {
  eq(fillTemplate('/users/{id}', { id: 42 }), '/users/42');
});

test('substitutes several placeholders, repeats included', () => {
  eq(
    fillTemplate('/repos/{owner}/{repo}/issues/{n}', {
      owner: 'elirc',
      repo: 'jstrain',
      n: 7,
    }),
    '/repos/elirc/jstrain/issues/7'
  );
  eq(fillTemplate('{a}-{a}', { a: 'x' }), 'x-x');
});

test('encodes values instead of trusting them', () => {
  eq(fillTemplate('/s/{q}', { q: 'red shoes/hi' }), '/s/red%20shoes%2Fhi');
  eq(fillTemplate('/u/{name}', { name: 'café' }), '/u/caf%C3%A9');
  eq(fillTemplate('/u/{name}', { name: 'a&b=c' }), '/u/a%26b%3Dc');
});

test('non-string values are stringified first', () => {
  eq(fillTemplate('/p/{n}/{flag}', { n: 0, flag: false }), '/p/0/false');
});

test('a missing value throws and names the placeholder', () => {
  throws(() => fillTemplate('/users/{id}', {}), 'id');
  throws(() => fillTemplate('/users/{id}', { id: undefined }), 'id');
});

test('a template with no placeholders comes back unchanged', () => {
  eq(fillTemplate('/health', { id: 1 }), '/health');
});

test('expandUrl resolves the filled path against the base', () => {
  eq(expandUrl('https://api.dev/v1/', 'users/{id}', { id: 7 }), 'https://api.dev/v1/users/7');
  // the trap: a leading slash replaces the base path, /v1 included
  eq(expandUrl('https://api.dev/v1/', '/users/{id}', { id: 7 }), 'https://api.dev/users/7');
});

test('params the template did not use become the query string', () => {
  eq(
    expandUrl('https://api.dev/v1/', 'users/{id}', { id: 7, page: 2, q: 'a b' }),
    'https://api.dev/v1/users/7?page=2&q=a+b'
  );
});
