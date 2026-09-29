// ─────────────────────────────────────────────────────────────────────────
//  08 · reading the body — SOLUTION                            ★★☆ core
//  run: node 08-body-text.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `req` is a Readable stream, which is why every framework's
//  body parser is async. Collect the chunks into an array, then
//  Buffer.concat once and decode once. Decoding each chunk as it arrives
//  (`text += chunk.toString()`) works on every ASCII test you will write
//  and corrupts the first emoji that lands on a chunk boundary — the
//  bytes of one character get split across two toString() calls and each
//  half becomes U+FFFD.
//  The limit is the point of the exercise. Without one, `POST /notes`
//  with a 4 GB body is a one-line denial of service: your process buys
//  the memory for every byte a stranger cares to send. Count bytes as
//  they arrive (chunk.length on a Buffer IS bytes) and bail the moment
//  you cross the line — checking Content-Length instead is security
//  theatre, because the client writes that header and can lie.
//  413 Payload Too Large is the honest answer. Note that you must still
//  RESPOND: aborting the socket without a status leaves the client
//  guessing whether the network died or the request was rejected.
//  A stream is consumed exactly once. The second read returns '' — the
//  bytes are gone, not buffered somewhere for later. That is why body
//  parsing belongs in ONE middleware that stashes the result on req.

import { test, eq, ok, spy } from '../../_lib/check.js';
import http from 'node:http';

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

// Provided: sendJson from exercise 01.
function sendJson(res, status, data) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
  });
  res.end(body);
}

export async function readText(req, options = {}) {
  const limit = options.limit ?? 1024;
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      throw Object.assign(new Error('payload too large'), { status: 413 });
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: a handler that echoes whatever readText gives it, and turns a
// 413 into a 413 response.
function echoHandler({ limit = 1024, seen = () => {} } = {}) {
  return async (req, res) => {
    let text;
    try {
      text = await readText(req, { limit });
    } catch (err) {
      if (err.status === 413) {
        return sendJson(res, 413, { error: 'payload too large' });
      }
      throw err;
    }
    seen(text);
    sendJson(res, 200, { text, chars: text.length });
  };
}

test('it collects a request body into a string', async () => {
  await withServer(echoHandler(), async (request) => {
    const res = await request('/', { method: 'POST', body: 'hello there' });
    eq(res.status, 200);
    eq(res.json(), { text: 'hello there', chars: 11 });
  });
});

test('a request with no body reads as the empty string', async () => {
  await withServer(echoHandler(), async (request) => {
    eq((await request('/')).json(), { text: '', chars: 0 });
  });
});

test('multi-byte characters survive the round trip', async () => {
  await withServer(echoHandler(), async (request) => {
    const res = await request('/', { method: 'POST', body: 'héllo 👋 café' });
    eq(res.json().text, 'héllo 👋 café');
  });
});

test('a body over the limit is a 413', async () => {
  await withServer(echoHandler({ limit: 20 }), async (request) => {
    const res = await request('/', { method: 'POST', body: 'x'.repeat(50) });
    eq(res.status, 413);
    eq(res.json(), { error: 'payload too large' });
  });
});

test('the handler never sees a body that blew the limit', async () => {
  const seen = spy();
  await withServer(echoHandler({ limit: 20, seen }), async (request) => {
    await request('/', { method: 'POST', body: 'x'.repeat(50) });
    eq(seen.callCount, 0);
    await request('/', { method: 'POST', body: 'small' });
    eq(seen.callCount, 1);
  });
});

test('the limit counts bytes, not characters', async () => {
  await withServer(echoHandler({ limit: 12 }), async (request) => {
    // 8 characters, 16 bytes of UTF-8 — over a 12 byte limit.
    const res = await request('/', { method: 'POST', body: '👋👋👋👋' });
    eq(res.status, 413);
    // 4 characters, 8 bytes — under it.
    const fits = await request('/', { method: 'POST', body: '👋👋' });
    eq(fits.status, 200);
    eq(fits.json(), { text: '👋👋', chars: 4 });
  });
});

test('a stream can only be read once', async () => {
  const handler = async (req, res) => {
    const first = await readText(req);
    const second = await readText(req);
    sendJson(res, 200, { first, second });
  };
  await withServer(handler, async (request) => {
    const res = await request('/', { method: 'POST', body: 'only once' });
    eq(res.json(), { first: 'only once', second: '' });
    ok(res.json().second !== 'only once', 'the bytes are gone after the first read');
  });
});
