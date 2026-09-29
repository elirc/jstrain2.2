// ─────────────────────────────────────────────────────────────────────────
//  31 · resolve relative URLs — SOLUTION                     ★☆☆ warm-up
//  run: node 31-url-resolve.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `new URL(reference, base)` implements the whole RFC 3986
//  resolution algorithm — path climbing, absolute paths, protocol-relative
//  '//host' references, query-only and fragment-only references. Writing
//  it by hand with string concatenation reimplements a spec badly.
//  `.href` (or String(url)) is the normalised absolute form; return that
//  rather than the URL object so the value is comparable and loggable.
//  The rule worth memorising is the one in test three: everything after
//  the last '/' of the base is a FILE, not a directory. 'v1/users' + 'me'
//  is 'v1/me', and '/health' wipes the path entirely. That is why API
//  base URLs are conventionally written with a trailing slash.

import { test, eq } from '../../_lib/check.js';

export function resolveUrl(base, reference) {
  return new URL(reference, base).href;
}

export function resolveAll(base, references) {
  return references.map((reference) => resolveUrl(base, reference));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a bare name replaces the last segment of the base', () => {
  eq(resolveUrl('https://x.dev/v1/users', 'me'), 'https://x.dev/v1/me');
});

test('a base ending in a slash keeps its whole path', () => {
  eq(resolveUrl('https://x.dev/v1/', 'me'), 'https://x.dev/v1/me');
  eq(resolveUrl('https://x.dev/a/b', 'sub/deep'), 'https://x.dev/a/sub/deep');
});

test('a reference starting with / throws the base path away', () => {
  eq(resolveUrl('https://x.dev/v1/users', '/health'), 'https://x.dev/health');
});

test('../ climbs one directory', () => {
  eq(resolveUrl('https://x.dev/a/b/c', '../d'), 'https://x.dev/a/d');
  eq(resolveUrl('https://x.dev/a/b/c', './d'), 'https://x.dev/a/b/d');
});

test('an absolute reference ignores the base completely', () => {
  eq(
    resolveUrl('https://x.dev/v1/', 'https://other.dev/z'),
    'https://other.dev/z'
  );
});

test('query-only and fragment-only references keep the path', () => {
  const base = 'https://x.dev/v1/users?page=2';
  eq(resolveUrl(base, '?page=3'), 'https://x.dev/v1/users?page=3');
  eq(resolveUrl(base, '#top'), 'https://x.dev/v1/users?page=2#top');
});

test('resolveAll walks a list against one base', () => {
  eq(
    resolveAll('https://x.dev/docs/guide/', ['intro', '../index.html', '//cdn.dev/a.png']),
    [
      'https://x.dev/docs/guide/intro',
      'https://x.dev/docs/index.html',
      'https://cdn.dev/a.png',
    ]
  );
  eq(resolveAll('https://x.dev/', []), []);
});
