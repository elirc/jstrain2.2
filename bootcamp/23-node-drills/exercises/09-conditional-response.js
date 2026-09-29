// ─────────────────────────────────────────────────────────────────────────
//  09 · deciding 200 vs 304                                     ★★☆ core
//  concepts: If-None-Match · ETag comparison · Vary · HEAD
//  run: node 09-conditional-response.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Module 18 wired conditional GET into a server. This is the decision
//  itself, alone: no sockets, no framework, just headers in and a
//  response out. It is the part worth being able to write cold, because
//  it is the part that gets it wrong.
//
//  Build `respondTo(req, resource)`:
//
//      req      → { method, headers }        headers are lower-case
//      resource → { body, contentType, etag?, vary? }
//      returns  → { status, headers, body }
//
//      respondTo({ method: 'GET', headers: {} },
//                { body: 'hi', contentType: 'text/plain', etag: '"v1"' })
//        → { status: 200,
//            headers: { etag: '"v1"', 'content-type': 'text/plain',
//                       'content-length': '2' },
//            body: 'hi' }
//
//  The rules:
//    · If-None-Match may be a list, may carry whitespace, and may be `*`,
//      which matches any representation the resource actually has
//    · comparison is weak: `W/"v1"` and `"v1"` are the same validator
//    · a resource with no etag can never be validated — always 200
//    · a 304 has no body, and none of the entity headers (no
//      content-type, no content-length) — but it repeats etag and vary
//    · `vary`, when the resource declares one, is echoed on both answers
//    · content-length counts bytes
//    · HEAD answers exactly like GET, with an empty body; any other
//      method is 405 with `allow: 'GET, HEAD'` and no body

import { test, eq, ok } from '../../_lib/check.js';

export function respondTo(req, resource) {
  throw new Error('TODO');
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
