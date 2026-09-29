// ─────────────────────────────────────────────────────────────────────────
//  09 · JSON body parser                                        ★★☆ core
//  concepts: middleware · content-type · 400 vs 500
//  run: node 09-body-json.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Write `express.json()`: a middleware that reads the body, parses it,
//  and hands the rest of the chain a ready-made `req.body`.
//
//      app.use(jsonBody({ limit: 1024 }));
//
//      content-type: application/json  + '{"text":"hi"}'
//          → req.body = { text: 'hi' }, then next()
//      content-type: application/json; charset=utf-8
//          → still JSON, still parsed
//      content-type: text/plain
//          → not mine: leave req.body alone and next()
//      a body that will not parse (including an empty one)
//          → 400 { error: 'invalid json' }, chain stops
//      a body over the limit
//          → 413 { error: 'payload too large' }, chain stops
//
//  hint: the content-type header arrives as
//  'application/json; charset=utf-8' — compare with startsWith, not ===

import { test, eq, spy } from '../../_lib/check.js';
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

// Provided: sendJson (01), the middleware runner (05) and readText (08).
function sendJson(res, status, data) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
  });
  res.end(body);
}

function createApp() {
  const stack = [];
  const app = {
    use(fn) {
      stack.push(fn);
      return app;
    },
    handler(req, res) {
      const dispatch = (index) => {
        if (index >= stack.length) return sendJson(res, 404, { error: 'not found' });
        let called = false;
        const next = () => {
          if (called) return;
          called = true;
          if (res.writableEnded) return;
          dispatch(index + 1);
        };
        Promise.resolve()
          .then(() => stack[index](req, res, next))
          .catch((err) => {
            if (!res.writableEnded) sendJson(res, 500, { error: err.message });
          });
      };
      dispatch(0);
    },
  };
  return app;
}

async function readText(req, options = {}) {
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

export function jsonBody(options = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: an app that parses the body and echoes back what it found.
function appWith(parser, reached = () => {}) {
  const app = createApp();
  app.use(parser);
  app.use((req, res) => {
    reached(req.body);
    sendJson(res, 200, { body: req.body ?? null, type: typeof req.body });
  });
  return app;
}

const asJson = (value) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: typeof value === 'string' ? value : JSON.stringify(value),
});

test('a JSON body arrives on req.body', async () => {
  await withServer(appWith(jsonBody()).handler, async (request) => {
    const res = await request('/notes', asJson({ text: 'buy milk' }));
    eq(res.status, 200);
    eq(res.json(), { body: { text: 'buy milk' }, type: 'object' });
  });
});

test('arrays and nested objects come through intact', async () => {
  await withServer(appWith(jsonBody()).handler, async (request) => {
    const payload = { tags: ['a', 'b'], meta: { deep: { n: 1 } } };
    eq((await request('/', asJson(payload))).json().body, payload);
  });
});

test('a charset on the content-type still counts as JSON', async () => {
  await withServer(appWith(jsonBody()).handler, async (request) => {
    const res = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ ok: true }),
    });
    eq(res.json().body, { ok: true });
  });
});

test('a malformed body is a 400 and never reaches the route', async () => {
  const reached = spy();
  await withServer(appWith(jsonBody(), reached).handler, async (request) => {
    const res = await request('/', asJson('{ not json'));
    eq(res.status, 400);
    eq(res.json(), { error: 'invalid json' });
    eq(reached.callCount, 0);
  });
});

test('an empty body with a JSON content-type is a 400 too', async () => {
  await withServer(appWith(jsonBody()).handler, async (request) => {
    const res = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '',
    });
    eq(res.status, 400);
    eq(res.json(), { error: 'invalid json' });
  });
});

test('a body over the limit is a 413', async () => {
  await withServer(appWith(jsonBody({ limit: 20 })).handler, async (request) => {
    const res = await request('/', asJson({ text: 'x'.repeat(100) }));
    eq(res.status, 413);
    eq(res.json(), { error: 'payload too large' });
  });
});

test('a request that is not JSON is left alone', async () => {
  await withServer(appWith(jsonBody()).handler, async (request) => {
    const res = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'just text',
    });
    eq(res.status, 200);
    eq(res.json(), { body: null, type: 'undefined' });
  });
});

test('a GET with no body flows straight through', async () => {
  const reached = spy();
  await withServer(appWith(jsonBody(), reached).handler, async (request) => {
    eq((await request('/notes')).status, 200);
    eq(reached.callCount, 1);
    eq(reached.calls[0][0], undefined);
  });
});
