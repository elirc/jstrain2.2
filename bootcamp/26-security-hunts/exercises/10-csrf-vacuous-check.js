// ─────────────────────────────────────────────────────────────────────────
//  10 · the CSRF check that checks nothing               ★★★ stretch
//  concepts: security · CSRF · vacuous comparison
//  run: node 10-csrf-vacuous-check.js
// ─────────────────────────────────────────────────────────────────────────
//
//  assertCsrf(session, request) is the middleware that stands in front
//  of every state-changing route. Safe methods pass through; anything
//  else must arrive with the token the server put in the session, or
//  the request is refused with an Error whose message contains 'csrf':
//
//      assertCsrf({ csrfToken: 'abc' }, post('abc'))  → returns
//      assertCsrf({ csrfToken: 'abc' }, post('xyz'))  → throws 'csrf'
//
//  A pen-tester filed the report: a page on their own domain, a form
//  posting to /api/transfer, no token anywhere — and the transfer went
//  through. Every test the team had written was green.
//
//  The code below is fully written — and a security hole. 2 tests fail,
//  both describing a request that carries no token at all. Find the
//  flaw and fix it with the smallest change.
//
//  hint: the check asks "are these two the same?" — and it is perfectly
//  happy when the answer is "yes, both absent". What must be true about
//  the expected value BEFORE comparing it to anything is worth asking.

import { test, eq, throws } from '../../_lib/check.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function assertCsrf(session, request) {
  if (SAFE_METHODS.has(request.method)) return;
  if (request.body.csrfToken !== session.csrfToken) {
    throw new Error('csrf token mismatch');
  }
}

// ─── request helpers ──────────────────────────────────────────────────────

const post = (csrfToken) => ({
  method: 'POST',
  body: csrfToken === undefined ? {} : { csrfToken, amount: 500 },
});

// ──────────────────────────── tests ──────────────────────────────────────

test('a POST carrying the session token is allowed', () => {
  eq(assertCsrf({ csrfToken: 'abc123' }, post('abc123')), undefined);
});

test('a POST carrying the wrong token is refused', () => {
  throws(() => assertCsrf({ csrfToken: 'abc123' }, post('xyz789')), 'csrf');
});

test('a POST carrying no token is refused', () => {
  throws(() => assertCsrf({ csrfToken: 'abc123' }, post(undefined)), 'csrf');
});

test('safe methods pass without a token', () => {
  eq(assertCsrf({ csrfToken: 'abc123' }, { method: 'GET', body: {} }), undefined);
  eq(assertCsrf({ csrfToken: 'abc123' }, { method: 'HEAD', body: {} }), undefined);
});

test('a session with no token yet cannot authorise anything', () => {
  throws(() => assertCsrf({}, post(undefined)), 'csrf');
});

test('two empty tokens are not a match', () => {
  throws(() => assertCsrf({ csrfToken: '' }, post('')), 'csrf');
});
