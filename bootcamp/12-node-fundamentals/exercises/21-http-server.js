// ─────────────────────────────────────────────────────────────────────────
//  21 · an http server                                       ★★★ stretch
//  concepts: node:http · routing · JSON responses · fetch
//  run: node 21-http-server.js
// ─────────────────────────────────────────────────────────────────────────
//
//  No framework, no dependencies: http.createServer takes one function
//  and calls it with (req, res) for every request. Everything Express
//  does is a convenience on top of these two objects.
//
//      createHelloServer()   → an http.Server (NOT listening yet)
//
//        GET /health         → 200 {"status":"ok"}
//        GET /hello          → 200 {"greeting":"hello, world"}
//        GET /hello?name=ada → 200 {"greeting":"hello, ada"}
//        anything else       → 404 {"error":"not found"}
//
//  Every response is JSON with a 'content-type: application/json' header.
//  Return the server without calling listen — the tests start it on port
//  0 (the OS picks a free port) and shut it down afterwards.
//
//  hint: req.url is a PATH PLUS QUERY STRING ('/health?x=1'), never the
//  full URL. `new URL(req.url, 'http://127.0.0.1')` splits it into
//  pathname and searchParams for you.

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
  throw new Error('TODO');
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
