// ─────────────────────────────────────────────────────────────────────────
//  03 · route table                                             ★★☆ core
//  concepts: routing · status codes · Allow header
//  run: node 03-route-table.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Turn a list of routes into one request handler. Match on method AND
//  path — exactly, no params yet — and tell the two failure modes apart:
//
//      routes = [{ method: 'GET', path: '/notes', handler }, ...]
//      createRouteHandler(routes) → (req, res) => ...
//
//      GET /notes    matches   → run its handler
//      GET /nope     no such path        → 404 { error: 'not found' }
//      PUT /notes    path yes, method no → 405 { error: 'method not
//                                          allowed' } + Allow header
//
//  The Allow header lists every method registered for THAT path, sorted
//  and comma-separated: 'DELETE, GET, POST'. Query strings and trailing
//  slashes must not stop a match.
//
//  hint: filter by path first — the list you get back is what tells you
//  405 from 404

import { test, eq, ok } from '../../_lib/check.js';
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

// Provided: the path half of makeContext from exercise 02.
function pathOf(req) {
  const url = new URL(req.url, 'http://internal.invalid');
  return url.pathname.replace(/\/+$/, '') || '/';
}

export function createRouteHandler(routes) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

const routes = [
  {
    method: 'GET',
    path: '/health',
    handler: (req, res) => sendJson(res, 200, { status: 'ok' }),
  },
  {
    method: 'GET',
    path: '/notes',
    handler: (req, res) => sendJson(res, 200, { notes: [] }),
  },
  {
    method: 'POST',
    path: '/notes',
    handler: (req, res) => sendJson(res, 201, { created: true }),
  },
  {
    method: 'DELETE',
    path: '/notes',
    handler: (req, res) => sendJson(res, 200, { cleared: true }),
  },
];

test('a registered method and path reach their handler', async () => {
  await withServer(createRouteHandler(routes), async (request) => {
    const res = await request('/health');
    eq(res.status, 200);
    eq(res.json(), { status: 'ok' });
  });
});

test('the same path with a different method gets its own handler', async () => {
  await withServer(createRouteHandler(routes), async (request) => {
    eq((await request('/notes')).json(), { notes: [] });
    const created = await request('/notes', { method: 'POST' });
    eq(created.status, 201);
    eq(created.json(), { created: true });
  });
});

test('an unknown path is a 404', async () => {
  await withServer(createRouteHandler(routes), async (request) => {
    const res = await request('/nope');
    eq(res.status, 404);
    eq(res.json(), { error: 'not found' });
  });
});

test('a known path with an unregistered method is a 405, not a 404', async () => {
  await withServer(createRouteHandler(routes), async (request) => {
    const res = await request('/notes', { method: 'PUT' });
    eq(res.status, 405);
    eq(res.json(), { error: 'method not allowed' });
  });
});

test('a 405 lists every method that path does support', async () => {
  await withServer(createRouteHandler(routes), async (request) => {
    const res = await request('/notes', { method: 'PUT' });
    eq(res.headers.get('allow'), 'DELETE, GET, POST');
  });
});

test('the Allow header only covers the path that was asked for', async () => {
  await withServer(createRouteHandler(routes), async (request) => {
    const res = await request('/health', { method: 'POST' });
    eq(res.status, 405);
    eq(res.headers.get('allow'), 'GET');
  });
});

test('a query string does not break the match', async () => {
  await withServer(createRouteHandler(routes), async (request) => {
    const res = await request('/health?cacheBust=1');
    eq(res.status, 200);
    eq(res.json(), { status: 'ok' });
  });
});

test('a trailing slash matches the route as registered', async () => {
  await withServer(createRouteHandler(routes), async (request) => {
    eq((await request('/notes/')).status, 200);
    ok((await request('/notes/', { method: 'PUT' })).status === 405);
  });
});
