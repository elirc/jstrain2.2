// ─────────────────────────────────────────────────────────────────────────
//  19 · an API client                                        ★★★ stretch
//  concepts: fetch · typed errors · AbortSignal · retries with backoff
//  run: node 19-api-client.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You have written the server all module. Now write the thing that
//  calls it, and make it behave when the network does not.
//
//      const api = apiClient('http://host/v1',
//                     { retries: 2, backoffMs: 100, timeoutMs: 5000 });
//
//      await api.get('/notes')            → the parsed JSON body
//      await api.post('/notes', { text }) → sends JSON, returns the reply
//
//    · a 2xx  → the parsed body (a 204 with no body → null)
//    · any other status → throw an HttpError with .status and .body
//      (fetch does NOT throw on 404 — that part is on you)
//    · 5xx and network failures → retry, up to `retries` extra attempts,
//      waiting backoffMs, then 2×, then 4×
//    · 4xx → never retried; the request itself is wrong
//    · every attempt carries AbortSignal.timeout(timeoutMs)
//
//  hint: `new URL('/notes', 'http://host/v1')` throws away the /v1 —
//  trim the ends and join the strings yourself

import { test, eq, ok, rejects, spy, sleep } from '../../_lib/check.js';
import http from 'node:http';

// Provided: start a server, hand its base URL to the test, close it after.
async function withServer(handler, run) {
  const server = http.createServer((req, res) => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch(() => {
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.end();
        }
      });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return await run(`http://127.0.0.1:${server.address().port}`, server);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

// Provided: the error type the client throws for any non-2xx answer.
export class HttpError extends Error {
  constructor(status, body, url) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
    this.url = url;
  }
}

export function apiClient(baseUrl, options = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: a server that answers under /v1 and can be told to fail.
function apiServer(options = {}) {
  const { failTimes = 0, failStatus = 500, slowMs = 0, seen = () => {} } = options;
  let failures = 0;
  return async (req, res) => {
    seen(req.method, req.url);
    if (slowMs > 0) await sleep(slowMs);

    if (!req.url.startsWith('/v1/')) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'wrong base path', url: req.url }));
      return;
    }
    if (failures < failTimes) {
      failures += 1;
      res.writeHead(failStatus, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'try again' }));
      return;
    }
    if (req.url === '/v1/missing') {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'no such note' }));
      return;
    }
    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          echo: JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'),
          contentType: req.headers['content-type'] ?? null,
        })
      );
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ notes: ['buy milk'] }));
  };
}

const fast = { retries: 2, backoffMs: 1, timeoutMs: 1000 };

test('get parses the JSON body of a 2xx', async () => {
  await withServer(apiServer(), async (base) => {
    const api = apiClient(`${base}/v1`, fast);
    eq(await api.get('/notes'), { notes: ['buy milk'] });
  });
});

test('the base path is not thrown away by the join', async () => {
  await withServer(apiServer(), async (base) => {
    const api = apiClient(`${base}/v1`, fast);
    eq(await api.get('/notes'), { notes: ['buy milk'] }, 'new URL() ate the /v1');
    eq(await api.get('notes'), { notes: ['buy milk'] }, 'with or without the slash');
  });
});

test('post sends a JSON body and says so', async () => {
  await withServer(apiServer(), async (base) => {
    const api = apiClient(`${base}/v1`, fast);
    const reply = await api.post('/notes', { text: 'buy milk' });
    eq(reply.echo, { text: 'buy milk' });
    ok(reply.contentType.startsWith('application/json'));
  });
});

test('a 404 becomes an HttpError carrying the status and the body', async () => {
  await withServer(apiServer(), async (base) => {
    const api = apiClient(`${base}/v1`, fast);
    let caught;
    try {
      await api.get('/missing');
    } catch (err) {
      caught = err;
    }
    ok(caught instanceof HttpError, 'fetch does not throw on 404 — you have to');
    eq(caught.status, 404);
    eq(caught.body, { error: 'no such note' });
    ok(caught.message.includes('404'));
  });
});

test('a 500 is retried, and the retry that works is the answer', async () => {
  const seen = spy();
  await withServer(apiServer({ failTimes: 2, seen }), async (base) => {
    const api = apiClient(`${base}/v1`, fast);
    eq(await api.get('/notes'), { notes: ['buy milk'] });
    eq(seen.callCount, 3, 'two failures, then the good one');
  });
});

test('it gives up after the last retry and throws the final error', async () => {
  const seen = spy();
  await withServer(apiServer({ failTimes: 99, seen }), async (base) => {
    const api = apiClient(`${base}/v1`, { retries: 2, backoffMs: 1 });
    let caught;
    try {
      await api.get('/notes');
    } catch (err) {
      caught = err;
    }
    ok(caught instanceof HttpError);
    eq(caught.status, 500);
    eq(seen.callCount, 3, 'the first try plus two retries');
  });
});

test('a 400 is never retried — the request itself is wrong', async () => {
  const seen = spy();
  await withServer(apiServer({ failTimes: 99, failStatus: 400, seen }), async (base) => {
    const api = apiClient(`${base}/v1`, fast);
    await rejects(() => api.get('/notes'), '400');
    eq(seen.callCount, 1);
  });
});

test('a server that never answers hits the timeout', async () => {
  await withServer(apiServer({ slowMs: 300 }), async (base) => {
    const api = apiClient(`${base}/v1`, { retries: 0, timeoutMs: 40 });
    let caught;
    try {
      await api.get('/notes');
    } catch (err) {
      caught = err;
    }
    ok(caught !== undefined, 'it must not hang forever');
    eq(caught.name, 'TimeoutError');
  });
});
