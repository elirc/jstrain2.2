// ─────────────────────────────────────────────────────────────────────────
//  10 · the CSRF check that checks nothing — SOLUTION      ★★★ stretch
//  concepts: security · CSRF · vacuous comparison
//  run: node 10-csrf-vacuous-check.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Vulnerability: cross-site request forgery, let through by a VACUOUS
//  check — a comparison that is trivially satisfied because both sides
//  are missing. `undefined !== undefined` is false, so a request with
//  no token, hitting a session that never got one, sailed past the
//  guard. The attacker does not need to steal or guess the token; they
//  need to send NO token, to a visitor whose session has none either.
//  The tell: an equality test on two values that may both be absent,
//  with no precondition on the expected side. The same shape ships
//  bugs far beyond CSRF — `user.role === requiredRole` when both are
//  undefined, `sig === expectedSig` when the signer was skipped, any
//  `if (a !== b) reject`. A security check must assert the secret
//  EXISTS before it asserts the two match.
//  The minimal fix: validate the expected value first, then compare a
//  real string to a real string:
//      const expected = session.csrfToken;
//      const got = request.body.csrfToken;
//      if (typeof expected !== 'string' || expected === '')
//        throw new Error('csrf: session has no token');
//      if (got !== expected) throw new Error('csrf token mismatch');
//  Fail closed: no token established means no state-changing request
//  is authorised, which is also the correct answer for a logged-out or
//  expired session.
//  In production, compare with `crypto.timingSafeEqual` over equal-length
//  buffers so response time leaks nothing, and pair the token with
//  `SameSite=Lax` cookies — defence in layers, because a single check is
//  a single point of failure.
//  In the wild: hand-rolled CSRF middleware, webhook signature checks
//  where a missing header compares equal to a missing secret, and
//  feature flags where "undefined equals undefined" quietly grants
//  everyone the admin experience.

import { test, eq, throws } from '../../_lib/check.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function assertCsrf(session, request) {
  if (SAFE_METHODS.has(request.method)) return;
  const expected = session.csrfToken;
  if (typeof expected !== 'string' || expected === '') {
    throw new Error('csrf: session has no token');
  }
  if (request.body.csrfToken !== expected) {
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
