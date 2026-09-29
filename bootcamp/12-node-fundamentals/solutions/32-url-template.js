// ─────────────────────────────────────────────────────────────────────────
//  32 · fill a URL template — SOLUTION                          ★★☆ core
//  run: node 32-url-template.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one regex with a capture group and a replacer function
//  handles every placeholder, repeats included — no loop over the param
//  names, which would also let an unknown '{x}' slip through silently.
//  encodeURIComponent, not encodeURI: the value is one path SEGMENT, so
//  '/' inside it must become %2F. encodeURI leaves slashes alone and a
//  user called 'a/b' would silently invent a new route.
//  Throwing on a missing value is the point of the exercise. The naive
//  version leaves the literal '{id}' in the URL and you find out from a
//  404 in production instead of a stack trace in development.
//  expandUrl collects the names the template consumed first, so the
//  leftovers — and only the leftovers — become query params. URL does the
//  base resolution (exercise 31) and searchParams does the escaping.

import { test, eq, throws } from '../../_lib/check.js';

const PLACEHOLDER = /\{(\w+)\}/g;

export function fillTemplate(template, params) {
  return template.replace(PLACEHOLDER, (whole, name) => {
    const value = params?.[name];
    if (value === undefined || value === null) {
      throw new Error(`missing value for template placeholder: ${name}`);
    }
    return encodeURIComponent(String(value));
  });
}

export function expandUrl(base, template, params = {}) {
  const used = new Set([...template.matchAll(PLACEHOLDER)].map((m) => m[1]));
  const url = new URL(fillTemplate(template, params), base);
  for (const [key, value] of Object.entries(params)) {
    if (used.has(key) || value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }
  return url.href;
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
