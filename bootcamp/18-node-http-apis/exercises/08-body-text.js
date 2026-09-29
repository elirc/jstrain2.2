// ─────────────────────────────────────────────────────────────────────────
//  08 · reading the body                                        ★★☆ core
//  concepts: streams · Buffer · limits · 413
//  run: node 08-body-text.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The request is a stream, so the body is not there when the handler
//  starts — you have to collect it. And you have to stop collecting at
//  some point, or a stranger's 4 GB upload is your process's memory.
//
//      await readText(req)                  → 'hello there'
//      await readText(req, { limit: 20 })    with 50 bytes on the wire
//          → throws an Error with .status === 413 and the message
//            'payload too large'
//      a request with no body                → ''
//
//  The limit is in BYTES. Default it to 1024. Do not trust the
//  Content-Length header — the client writes that number and can lie;
//  count what actually arrives.
//
//  hint: `for await (const chunk of req)` gives you Buffers; collect them
//  in an array and Buffer.concat(...).toString('utf8') once at the end

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
  throw new Error('TODO');
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
