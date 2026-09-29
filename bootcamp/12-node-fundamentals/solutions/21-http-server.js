// ─────────────────────────────────────────────────────────────────────────
//  21 · an http server — SOLUTION                            ★★★ stretch
//  run: node 21-http-server.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one handler, one `send` helper, and routing on
//  url.pathname. Parsing req.url through the URL class is what makes
//  '/health?cacheBust=1' still match '/health' — `req.url === '/health'`
//  is the comparison that works in every manual test and fails the first
//  time a browser appends a query string.
//  The base argument to new URL is required and irrelevant: req.url is
//  relative, so URL needs somewhere to hang it, and only pathname and
//  searchParams are read back out.
//  res.end() must be called exactly once per request — miss it and the
//  client hangs until it times out. Returning `send(...)` from each
//  branch is a cheap way to guarantee you never fall through into a
//  second response.
//  Note what createHelloServer does NOT do: listen. A function that both
//  builds and starts a server cannot be tested on a random port, and a
//  server nobody closed keeps the process alive forever.

import { test, eq, ok } from '../../_lib/check.js';
import http from 'node:http';

// Provided: start the server on a free loopback port, run the test
// against it, then shut it down no matter what happened.
async function withServer(server, run) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return await run(server.address().port, server);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

export function createHelloServer() {
  return http.createServer((req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    const url = new URL(req.url, 'http://127.0.0.1');

    if (url.pathname === '/health') return send(200, { status: 'ok' });

    if (url.pathname === '/hello') {
      const name = url.searchParams.get('name') ?? 'world';
      return send(200, { greeting: `hello, ${name}` });
    }

    return send(404, { error: 'not found' });
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('GET /health answers 200 with a status body', async () => {
  await withServer(createHelloServer(), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    eq(res.status, 200);
    eq(await res.json(), { status: 'ok' });
  });
});

test('responses are declared as JSON', async () => {
  await withServer(createHelloServer(), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    ok(res.headers.get('content-type').includes('application/json'));
    await res.json();
  });
});

test('it listens on the loopback address and an ephemeral port', async () => {
  await withServer(createHelloServer(), async (port, server) => {
    ok(port > 0);
    eq(server.address().address, '127.0.0.1');
  });
});

test('GET /hello greets the world by default', async () => {
  await withServer(createHelloServer(), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/hello`);
    eq(res.status, 200);
    eq(await res.json(), { greeting: 'hello, world' });
  });
});

test('GET /hello?name=ada greets ada', async () => {
  await withServer(createHelloServer(), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/hello?name=ada`);
    eq(await res.json(), { greeting: 'hello, ada' });
  });
});

test('an unknown path is a 404 with an error body', async () => {
  await withServer(createHelloServer(), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/nope`);
    eq(res.status, 404);
    eq(await res.json(), { error: 'not found' });
  });
});

test('a query string does not break the route match', async () => {
  await withServer(createHelloServer(), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/health?cacheBust=1`);
    eq(res.status, 200);
    eq(await res.json(), { status: 'ok' });
  });
});
