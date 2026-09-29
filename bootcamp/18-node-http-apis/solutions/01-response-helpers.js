// ─────────────────────────────────────────────────────────────────────────
//  01 · response helpers — SOLUTION                          ★☆☆ warm-up
//  run: node 01-response-helpers.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: this is `res.json()`, `res.redirect()` and `res.sendStatus`
//  from Express, minus the 40 lines of content-type sniffing. The whole
//  idea of a framework starts here: `res` is a stream with a status line,
//  and every helper you write is "set the headers, then end it exactly
//  once".
//  Serialise the body BEFORE writing the head — you need its byte length
//  for Content-Length, and you cannot set a header after writeHead has
//  flushed. Buffer.byteLength, not string.length: 'café' is 4 characters
//  and 5 bytes, and a Content-Length one byte short truncates the body on
//  the wire. (Node will happily let you lie; the client will not.)
//  204 means "no body, and I mean it": no Content-Type, no Content-Length,
//  nothing after the headers. Writing a body with a 204 is a protocol
//  error that some proxies punish by hanging the connection.
//  A redirect is a status plus a Location header. Nothing else is
//  required — the tiny HTML body real frameworks add is a courtesy for
//  humans reading the raw response.

import { test, eq, ok } from '../../_lib/check.js';
import http from 'node:http';

// Provided: start `handler` on a real loopback server, run some requests
// against it, then shut it down no matter what happened. `request()` does
// a real fetch and hands back { status, headers, body, json() }. If your
// handler throws, the error is re-thrown here instead of hanging the
// client.
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

export function sendJson(res, status, data) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
  });
  res.end(body);
}

export function redirect(res, location, status = 302) {
  res.writeHead(status, { location });
  res.end();
}

export function noContent(res) {
  res.writeHead(204);
  res.end();
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sendJson writes the status, the body and a JSON content-type', async () => {
  await withServer(
    (req, res) => sendJson(res, 201, { id: 1, text: 'buy milk' }),
    async (request) => {
      const res = await request('/');
      eq(res.status, 201);
      eq(res.json(), { id: 1, text: 'buy milk' });
      ok(res.headers.get('content-type').includes('application/json'));
    }
  );
});

test('sendJson can answer with an error status too', async () => {
  await withServer(
    (req, res) => sendJson(res, 404, { error: 'not found' }),
    async (request) => {
      const res = await request('/nope');
      eq(res.status, 404);
      eq(res.json(), { error: 'not found' });
    }
  );
});

test('content-length counts bytes, not characters', async () => {
  const data = { note: 'café ☕' };
  await withServer(
    (req, res) => sendJson(res, 200, data),
    async (request) => {
      const res = await request('/');
      const expected = Buffer.byteLength(JSON.stringify(data), 'utf8');
      eq(res.headers.get('content-length'), String(expected));
      eq(res.json(), data);
    }
  );
});

test('redirect defaults to 302 and sets Location', async () => {
  await withServer(
    (req, res) => redirect(res, '/target'),
    async (request) => {
      const res = await request('/old', { redirect: 'manual' });
      eq(res.status, 302);
      eq(res.headers.get('location'), '/target');
    }
  );
});

test('redirect takes an explicit status for permanent moves', async () => {
  await withServer(
    (req, res) => redirect(res, 'https://example.test/new', 301),
    async (request) => {
      const res = await request('/old', { redirect: 'manual' });
      eq(res.status, 301);
      eq(res.headers.get('location'), 'https://example.test/new');
    }
  );
});

test('noContent answers 204 with an empty body and no content-type', async () => {
  await withServer(
    (req, res) => noContent(res),
    async (request) => {
      const res = await request('/', { method: 'DELETE' });
      eq(res.status, 204);
      eq(res.body, '');
      eq(res.headers.get('content-type'), null);
    }
  );
});
