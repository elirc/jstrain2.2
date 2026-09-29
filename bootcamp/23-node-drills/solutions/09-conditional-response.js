// ─────────────────────────────────────────────────────────────────────────
//  09 · deciding 200 vs 304 — SOLUTION                          ★★☆ core
//  run: node 09-conditional-response.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the cheapest response is the one with no body. The client
//  kept the ETag you sent it and offers it back as If-None-Match; if it
//  still names the current representation, you answer 304 and the client
//  re-uses what it already has. Same freshness guarantee, none of the
//  bytes — this is why reloading an unchanged page costs a few hundred.
//  Three details do all the work here.
//  Parse the header as a LIST. It is `"a", "b", *`, not one token, and a
//  browser holding two variants will send both. `split(',')` plus trim
//  plus a filter for the empty string, and `*` handled as its own case.
//  Compare WEAKLY. RFC 7232 says If-None-Match uses the weak comparison
//  function, so `W/"v1"` and `"v1"` name the same representation — strip
//  the `W/` prefix from both sides before comparing. Compare raw strings
//  and a gzip proxy that weakened your tag turns every 304 into a 200.
//  Keep the quotes: an ETag is `"v1"`, quotes included. Send it bare and
//  well-behaved caches ignore it entirely.
//  Then the response shape. A 304 must not carry a body or the entity
//  headers that describe one — but it MUST repeat the ETag, or some
//  clients drop their cached validator and refetch the whole body next
//  time: you get the round trip AND the bytes. Vary rides along on both
//  answers because it tells the cache which request headers the response
//  depends on; omit it and a proxy serves your gzipped body to a client
//  that cannot read it.
//  Wrong turn: validating a resource that has no ETag. There is nothing
//  to compare, so `*` is not a match — 200 is the only honest answer.

import { test, eq, ok } from '../../_lib/check.js';

const weaken = (tag) => tag.replace(/^W\//, '');

function offeredTags(headers) {
  return String(headers['if-none-match'] ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function respondTo(req, resource) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return { status: 405, headers: { allow: 'GET, HEAD' }, body: '' };
  }

  const { body, contentType, etag, vary } = resource;
  const offered = offeredTags(req.headers);
  const validated =
    Boolean(etag) &&
    (offered.includes('*') ||
      offered.some((tag) => weaken(tag) === weaken(etag)));

  if (validated) {
    return {
      status: 304,
      headers: { etag, ...(vary ? { vary } : {}) },
      body: '',
    };
  }

  return {
    status: 200,
    headers: {
      ...(etag ? { etag } : {}),
      'content-type': contentType,
      'content-length': String(Buffer.byteLength(body, 'utf8')),
      ...(vary ? { vary } : {}),
    },
    body: req.method === 'HEAD' ? '' : body,
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

const DOC = { body: 'the original text', contentType: 'text/plain', etag: '"v1"' };
const get = (headers = {}) => ({ method: 'GET', headers });

test('a fresh GET is 200 with the body and its validators', () => {
  eq(respondTo(get(), DOC), {
    status: 200,
    headers: {
      etag: '"v1"',
      'content-type': 'text/plain',
      'content-length': '17',
    },
    body: 'the original text',
  });
});

test('content-length counts bytes, not characters', () => {
  const res = respondTo(get(), { ...DOC, body: 'hi 👋' });
  eq(res.headers['content-length'], '7');
});

test('the matching validator gets a 304 with no body', () => {
  const res = respondTo(get({ 'if-none-match': '"v1"' }), DOC);
  eq(res.status, 304);
  eq(res.body, '');
});

test('a 304 repeats the validators and drops the entity headers', () => {
  const doc = { ...DOC, vary: 'accept-encoding' };
  const fresh = respondTo(get(), doc);
  eq(fresh.headers.vary, 'accept-encoding');

  const res = respondTo(get({ 'if-none-match': '"v1"' }), doc);
  eq(res.headers, { etag: '"v1"', vary: 'accept-encoding' });
});

test('If-None-Match is a list, and * is a wildcard', () => {
  eq(respondTo(get({ 'if-none-match': '"old", "v1" , "older"' }), DOC).status, 304);
  eq(respondTo(get({ 'if-none-match': '*' }), DOC).status, 304);
  eq(respondTo(get({ 'if-none-match': '"old", "older"' }), DOC).status, 200);
  eq(respondTo(get({ 'if-none-match': '' }), DOC).status, 200);
});

test('the comparison is weak — W/"v1" is the same validator as "v1"', () => {
  eq(respondTo(get({ 'if-none-match': 'W/"v1"' }), DOC).status, 304);
  eq(respondTo(get({ 'if-none-match': '"v1"' }), { ...DOC, etag: 'W/"v1"' }).status, 304);
  eq(respondTo(get({ 'if-none-match': 'W/"v2"' }), DOC).status, 200);
});

test('a resource with no ETag can never be validated', () => {
  const plain = { body: 'no validator here', contentType: 'text/plain' };
  eq(respondTo(get({ 'if-none-match': '*' }), plain).status, 200);
  eq(respondTo(get({ 'if-none-match': '"v1"' }), plain).status, 200);
  ok(!('etag' in respondTo(get(), plain).headers), 'and it invents none');
});

test('HEAD is a GET with no body; anything else is 405', () => {
  const head = respondTo({ method: 'HEAD', headers: {} }, DOC);
  eq(head.status, 200);
  eq(head.body, '');
  eq(head.headers['content-length'], '17', 'HEAD still describes the body');

  const post = respondTo({ method: 'POST', headers: {} }, DOC);
  eq(post, { status: 405, headers: { allow: 'GET, HEAD' }, body: '' });
});
