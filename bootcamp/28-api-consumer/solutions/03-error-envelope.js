// ─────────────────────────────────────────────────────────────────────────
//  03 · turn responses into a Result — SOLUTION                 ★★☆ core
//  concepts: error envelopes · Result type · status handling
//  run: node 03-error-envelope.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Two failure modes collapse into one value. The try/catch catches the
//  NETWORK failure (fetch rejects — DNS, connection refused, timeout);
//  inside, the status check separates HTTP success from HTTP error. Only
//  a 2xx gets its body parsed — parsing a 500's body as your success
//  type is the bug this prevents, since an error payload has a different
//  shape and quietly poisons everything downstream.
//  Returning a Result envelope ({ ok, data } | { ok, error }) instead of
//  throwing means callers branch on a value rather than wrapping every
//  call in try/catch, and the two error KINDS ('http' vs 'network') let
//  them react differently — retry a network blip (exercise 01), surface
//  a 404, log a 500.
//  The status ranges are the contract: 2xx success, 4xx your fault
//  (don't retry), 5xx server's fault (maybe retry). Classic wrong turn:
//  `if (!res.ok) throw` then `await res.json()` unconditionally — you
//  lose the status and parse error bodies as data.

import { test, eq } from '../../_lib/check.js';

export async function request(doFetch) {
  try {
    const res = await doFetch();
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, data: await res.json() };
    }
    return { ok: false, error: { kind: 'http', status: res.status } };
  } catch (err) {
    return { ok: false, error: { kind: 'network', message: err.message } };
  }
}

const respond = (status, body) => async () => ({
  status,
  json: async () => body,
});
const networkError = (msg) => async () => {
  throw new Error(msg);
};

// ──────────────────────────── tests ──────────────────────────────────────

test('a 200 yields ok:true with the parsed body', async () => {
  eq(await request(respond(200, { id: 1 })), { ok: true, data: { id: 1 } });
});

test('a 201 counts as success too', async () => {
  const out = await request(respond(201, { created: true }));
  eq(out.ok, true);
  eq(out.data, { created: true });
});

test('a 404 is a structured http error, not a throw', async () => {
  eq(await request(respond(404, { message: 'nope' })), {
    ok: false,
    error: { kind: 'http', status: 404 },
  });
});

test('a 500 does not get parsed as success data', async () => {
  const out = await request(respond(500, { oops: true }));
  eq(out.ok, false);
  eq(out.error.kind, 'http');
  eq('data' in out, false);
});

test('a network rejection becomes a network error envelope', async () => {
  const out = await request(networkError('ECONNREFUSED'));
  eq(out.ok, false);
  eq(out.error.kind, 'network');
  eq(out.error.message, 'ECONNREFUSED');
});
