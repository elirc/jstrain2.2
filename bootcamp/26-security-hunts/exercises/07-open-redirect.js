// ─────────────────────────────────────────────────────────────────────────
//  07 · the login that sends you somewhere else               ★★☆ core
//  concepts: security · open redirect · URL parsing
//  run: node 07-open-redirect.js
// ─────────────────────────────────────────────────────────────────────────
//
//  After login the app bounces you back to where you were, taken from
//  `?next=`. safeRedirect(next) returns a same-site destination —
//  path plus query — or '/' when the value is anything else:
//
//      safeRedirect('/orders?page=2')      → '/orders?page=2'
//      safeRedirect('https://evil.test')   → '/'
//
//  A phishing mail went out linking to the REAL login page with a
//  crafted `next`, and users who signed in landed on a clone of the
//  dashboard that asked them to "confirm" their password.
//
//  The code below is fully written — and a security hole. 3 tests fail:
//  they pass destinations that leave the site. Find the flaw and fix it
//  with the smallest change. Keep the legitimate cases working.
//
//  hint: "starts with a slash" and "stays on this site" are not the
//  same claim. A browser reads `//host` as a full URL, and a scheme
//  does not have to be spelled `http`. What would happen if you parsed
//  the value against your own origin and looked at what came out?

import { test, eq } from '../../_lib/check.js';

const SITE = 'https://app.example';

export function safeRedirect(next) {
  if (!next) return '/';
  if (next.startsWith('http')) return '/'; // no absolute URLs
  return next;
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
