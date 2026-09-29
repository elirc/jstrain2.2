// ─────────────────────────────────────────────────────────────────────────
//  07 · the login that sends you somewhere else — SOLUTION    ★★☆ core
//  concepts: security · open redirect · URL parsing
//  run: node 07-open-redirect.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Vulnerability: open redirect (unvalidated redirect). The guard was a
//  denylist of one string — "does it start with http" — and a denylist
//  of one string is a hole with a lid on it. `//evil.test` is a full
//  URL to a browser (protocol-relative: it reuses the current scheme),
//  `/\evil.test` is normalised to the same thing by every browser's URL
//  parser, and `javascript:` never mentions http at all.
//  The tell: user input reaching a `Location:` header after a check
//  written as "not the bad thing" instead of "is the one good thing".
//  The minimal fix: stop pattern-matching the string and let the URL
//  parser tell you where it actually points — resolve it against your
//  own origin and refuse anything that lands elsewhere:
//      const url = new URL(next, SITE);
//      if (url.origin !== SITE) return '/';
//      return url.pathname + url.search;
//  `new URL(next, SITE)` throws on nothing a browser would accept, and
//  it collapses backslashes, `..` segments, and stray schemes for you —
//  the same normalisation the browser will do, which is the point.
//  Returning `pathname + search` instead of the raw input is the second
//  half: you now emit a value you built, not one the attacker typed.
//  In the wild: `?next=` / `?returnUrl=` / `?redirect_uri=` on login and
//  logout, OAuth callbacks (where the allowlist is mandatory and exact),
//  and "continue shopping" links. Phishing's favourite primitive,
//  because the link really does start at your real domain.

import { test, eq } from '../../_lib/check.js';

const SITE = 'https://app.example';

export function safeRedirect(next) {
  if (!next) return '/';
  let url;
  try {
    url = new URL(next, SITE);
  } catch {
    return '/';
  }
  if (url.origin !== SITE) return '/';
  return url.pathname + url.search;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a plain in-site path is kept', () => {
  eq(safeRedirect('/dashboard'), '/dashboard');
});

test('an in-site path keeps its query string', () => {
  eq(safeRedirect('/orders?page=2'), '/orders?page=2');
});

test('a missing next falls back to the home page', () => {
  eq(safeRedirect(undefined), '/');
  eq(safeRedirect(''), '/');
});

test('an absolute URL to another site is refused', () => {
  eq(safeRedirect('https://evil.test/pwn'), '/');
});

test('a protocol-relative URL is refused', () => {
  eq(safeRedirect('//evil.test/pwn'), '/');
});

test('a backslash-smuggled host is refused', () => {
  eq(safeRedirect('/\\evil.test/pwn'), '/');
});

test('a javascript: destination is refused', () => {
  eq(safeRedirect('javascript:alert(document.cookie)'), '/');
});
