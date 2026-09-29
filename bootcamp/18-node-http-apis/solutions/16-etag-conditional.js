// ─────────────────────────────────────────────────────────────────────────
//  16 · conditional GET — SOLUTION                           ★★★ stretch
//  run: node 16-etag-conditional.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the cheapest response is the one with no body. An ETag is
//  a fingerprint of the bytes you are about to send; the client keeps it
//  and sends it back as If-None-Match; if it still matches, you answer
//  304 Not Modified with no body and the client re-uses what it already
//  has. Same freshness guarantee, none of the bandwidth. This is what
//  Express's `etag` option does on every response, and it is why a
//  reload of an unchanged page transfers a few hundred bytes.
//  Hash the bytes, not the object: JSON.stringify of the same data can
//  order keys differently between two code paths, and then a fingerprint
//  that was supposed to be stable changes for no reason. sha1 is right
//  here — this is a change detector, not a security boundary.
//  The quotes are part of the grammar, not decoration: an ETag is
//  `"abc123"`, quotes included, and W/"abc123" marks a weak one. Send it
//  unquoted and well-behaved caches ignore it.
//  A 304 MUST NOT carry a body — that is the entire point — and it must
//  repeat the ETag so the client can keep validating. If-None-Match is
//  also allowed to be a list, or `*`, so parse it as a list.
//  The subtle bug: send the 304 without the ETag and some clients drop
//  their cached validator, then refetch the whole body every time — you
//  get the round trip AND the bytes.

import { test, eq, ok } from '../../_lib/check.js';
import http from 'node:http';
import { createHash } from 'node:crypto';

// Provided: the loopback harness from exercise 01.
async function withServer(handler, run) {
  const thrown = [];
  const server = http.createServer((req, res) => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch((err) => {
        thrown.push(err);
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.end();
        }
      });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path = '/', init) => {
    const res = await fetch(base + path, init);
    const body = await res.text();
    if (thrown.length) throw thrown.shift();
    return {
      status: res.status,
      headers: res.headers,
      body,
      json: () => JSON.parse(body),
    };
  };
  try {
    return await run(request, base);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

export function etagFor(body) {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
  return `"${createHash('sha1').update(bytes).digest('hex')}"`;
}

export function sendCached(req, res, body, contentType = 'text/plain; charset=utf-8') {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
  const etag = etagFor(bytes);

  const offered = String(req.headers['if-none-match'] ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (offered.includes('*') || offered.includes(etag)) {
    res.writeHead(304, { etag });
    res.end();
    return;
  }

  res.writeHead(200, {
    etag,
    'content-type': contentType,
    'content-length': String(bytes.length),
  });
  res.end(bytes);
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: a document that can be edited between requests.
function documentHandler(state) {
  return (req, res) => sendCached(req, res, state.body, 'text/plain; charset=utf-8');
}

test('an etag is a quoted, stable fingerprint of the bytes', () => {
  eq(etagFor('hello'), etagFor('hello'));
  ok(etagFor('hello').startsWith('"'), 'etags are quoted');
  ok(etagFor('hello').endsWith('"'));
  eq(etagFor('hello').length, 42, '40 hex characters of sha1 plus two quotes');
});

test('different bytes get different etags, identical bytes do not', () => {
  ok(etagFor('hello') !== etagFor('hello!'));
  eq(etagFor('hello'), etagFor(Buffer.from('hello', 'utf8')));
});

test('a first GET answers 200 with the body and an ETag', async () => {
  const state = { body: 'the original text' };
  await withServer(documentHandler(state), async (request) => {
    const res = await request('/doc');
    eq(res.status, 200);
    eq(res.body, 'the original text');
    eq(res.headers.get('etag'), etagFor('the original text'));
    eq(res.headers.get('content-length'), '17');
  });
});

test('sending the etag back gets a 304 with no body', async () => {
  const state = { body: 'the original text' };
  await withServer(documentHandler(state), async (request) => {
    const first = await request('/doc');
    const etag = first.headers.get('etag');

    const second = await request('/doc', { headers: { 'if-none-match': etag } });
    eq(second.status, 304);
    eq(second.body, '');
  });
});

test('the 304 repeats the etag so the client can keep validating', async () => {
  const state = { body: 'the original text' };
  await withServer(documentHandler(state), async (request) => {
    const etag = (await request('/doc')).headers.get('etag');
    const second = await request('/doc', { headers: { 'if-none-match': etag } });
    eq(second.headers.get('etag'), etag);
  });
});

test('a stale etag gets the whole body again', async () => {
  const state = { body: 'the original text' };
  await withServer(documentHandler(state), async (request) => {
    const res = await request('/doc', { headers: { 'if-none-match': '"an-old-hash"' } });
    eq(res.status, 200);
    eq(res.body, 'the original text');
  });
});

test('If-None-Match may be a list, or a bare *', async () => {
  const state = { body: 'the original text' };
  await withServer(documentHandler(state), async (request) => {
    const etag = (await request('/doc')).headers.get('etag');

    const list = await request('/doc', {
      headers: { 'if-none-match': `"stale-one", ${etag}, "stale-two"` },
    });
    eq(list.status, 304);

    const star = await request('/doc', { headers: { 'if-none-match': '*' } });
    eq(star.status, 304);
  });
});

test('editing the document invalidates the cached copy', async () => {
  const state = { body: 'version one' };
  await withServer(documentHandler(state), async (request) => {
    const etag = (await request('/doc')).headers.get('etag');
    eq((await request('/doc', { headers: { 'if-none-match': etag } })).status, 304);

    state.body = 'version two';
    const fresh = await request('/doc', { headers: { 'if-none-match': etag } });
    eq(fresh.status, 200);
    eq(fresh.body, 'version two');
    ok(fresh.headers.get('etag') !== etag, 'new bytes, new fingerprint');
  });
});
