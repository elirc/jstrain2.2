// ─────────────────────────────────────────────────────────────────────────
//  03 · turn responses into a Result                            ★★☆ core
//  concepts: error envelopes · Result type · status handling
//  run: node 03-error-envelope.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Raw fetch responses are a trap: `await res.json()` on a 500 gives you
//  an error body typed as your success shape, and network throws are a
//  different failure path than HTTP errors. Normalize BOTH into one
//  envelope your callers can branch on without try/catch everywhere.
//
//  Build request(doFetch) where doFetch() resolves to a fake response
//  { status, json() } or REJECTS on a network error. Return:
//    · 2xx            → { ok: true,  data: <parsed body> }
//    · other status   → { ok: false, error: { kind: 'http', status } }
//    · fetch rejected → { ok: false, error: { kind: 'network', message } }
//  request NEVER throws — every outcome is a value.
//
//      200 → { ok: true, data: {...} }
//      404 → { ok: false, error: { kind: 'http', status: 404 } }
//      throw → { ok: false, error: { kind: 'network', message: '...' } }
//
//  hint: wrap the whole thing in try/catch for the network case; inside,
//  branch on res.status >= 200 && res.status < 300. Only parse the body
//  on success.

import { test, eq } from '../../_lib/check.js';

export async function request(doFetch) {
  throw new Error('TODO');
}

// ── fake responses ───────────────────────────────────────────────────────
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
