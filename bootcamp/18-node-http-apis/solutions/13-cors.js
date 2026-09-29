// ─────────────────────────────────────────────────────────────────────────
//  13 · CORS — SOLUTION                                        ★★☆ core
//  run: node 13-cors.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: this is the `cors` package, and the first thing to
//  understand is that CORS is enforced by the BROWSER, not by you. Your
//  server answers every request either way; the headers you add are
//  permission slips the browser reads before letting the page see the
//  response. curl ignores all of it. So does anything that is not a
//  browser — CORS is not authentication and never was.
//  Reflect the origin, do not echo it blindly. `Access-Control-Allow-
//  Origin: <whatever the client sent>` combined with credentials is a
//  standing invitation for any site to read your API as the logged-in
//  user. Check the whitelist first, then reflect the exact string.
//  `Vary: Origin` is the one everybody forgets. Without it a shared cache
//  can store the response for app.test and serve it, permission slip and
//  all, to evil.test.
//  The preflight is a separate request the browser invents: OPTIONS with
//  Access-Control-Request-Method, sent before anything it considers
//  non-simple (a PUT, a JSON content-type, a custom header). Answer it
//  with 204 and the methods/headers you allow, and never let it reach a
//  route handler — it is a protocol question about a request that has not
//  happened yet. Max-Age lets the browser stop asking for a while.

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

// Provided: sendJson (01) and the middleware runner (05).
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
        stack[index](req, res, next);
      };
      dispatch(0);
    },
  };
  return app;
}

export function cors(options = {}) {
  const origins = options.origins ?? [];
  const methods = options.methods ?? ['GET', 'POST'];
  const headers = options.headers ?? ['content-type'];
  const maxAge = options.maxAge ?? 600;

  return (req, res, next) => {
    const origin = req.headers.origin;
    const allowed = typeof origin === 'string' && origins.includes(origin);

    if (allowed) {
      res.setHeader('access-control-allow-origin', origin);
      res.setHeader('vary', 'Origin');
    }

    const isPreflight =
      req.method === 'OPTIONS' && req.headers['access-control-request-method'];

    if (isPreflight) {
      if (allowed) {
        res.setHeader('access-control-allow-methods', methods.join(', '));
        res.setHeader('access-control-allow-headers', headers.join(', '));
        res.setHeader('access-control-max-age', String(maxAge));
      }
      res.writeHead(204);
      res.end();
      return;
    }

    next();
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

const ALLOWED = 'https://app.test';
const EVIL = 'https://evil.test';

function appWith(reached = () => {}) {
  const app = createApp();
  app.use(
    cors({
      origins: [ALLOWED, 'http://localhost:5173'],
      methods: ['GET', 'POST', 'DELETE'],
      headers: ['content-type', 'authorization'],
      maxAge: 600,
    })
  );
  app.use((req, res) => {
    reached(req.method);
    sendJson(res, 200, { notes: [] });
  });
  return app;
}

const preflight = (origin, method = 'DELETE') => ({
  method: 'OPTIONS',
  headers: { origin, 'access-control-request-method': method },
});

test('an allowed origin is reflected back exactly', async () => {
  await withServer(appWith().handler, async (request) => {
    const res = await request('/notes', { headers: { origin: ALLOWED } });
    eq(res.status, 200);
    eq(res.headers.get('access-control-allow-origin'), ALLOWED);
    eq(res.json(), { notes: [] });
  });
});

test('an origin that is not on the list gets no permission slip', async () => {
  await withServer(appWith().handler, async (request) => {
    const res = await request('/notes', { headers: { origin: EVIL } });
    eq(res.status, 200, 'the server still answers — the browser is the one that blocks');
    eq(res.headers.get('access-control-allow-origin'), null);
  });
});

test('Vary: Origin goes with the reflected header', async () => {
  await withServer(appWith().handler, async (request) => {
    const res = await request('/notes', { headers: { origin: ALLOWED } });
    eq(res.headers.get('vary'), 'Origin');
  });
});

test('a request with no Origin at all is untouched', async () => {
  const reached = spy();
  await withServer(appWith(reached).handler, async (request) => {
    const res = await request('/notes');
    eq(res.status, 200);
    eq(res.headers.get('access-control-allow-origin'), null);
    eq(reached.callCount, 1);
  });
});

test('a preflight is answered 204 with the methods and headers allowed', async () => {
  await withServer(appWith().handler, async (request) => {
    const res = await request('/notes', preflight(ALLOWED));
    eq(res.status, 204);
    eq(res.body, '');
    eq(res.headers.get('access-control-allow-origin'), ALLOWED);
    eq(res.headers.get('access-control-allow-methods'), 'GET, POST, DELETE');
    eq(res.headers.get('access-control-allow-headers'), 'content-type, authorization');
  });
});

test('the preflight caches for max-age seconds', async () => {
  await withServer(appWith().handler, async (request) => {
    const res = await request('/notes', preflight(ALLOWED));
    eq(res.headers.get('access-control-max-age'), '600');
  });
});

test('a preflight never reaches the route handler', async () => {
  const reached = spy();
  await withServer(appWith(reached).handler, async (request) => {
    await request('/notes', preflight(ALLOWED));
    eq(reached.callCount, 0);
    await request('/notes', { headers: { origin: ALLOWED } });
    eq(reached.callCount, 1);
  });
});

test('a preflight from an unknown origin gets 204 and nothing else', async () => {
  await withServer(appWith().handler, async (request) => {
    const res = await request('/notes', preflight(EVIL));
    eq(res.status, 204);
    eq(res.headers.get('access-control-allow-origin'), null);
    eq(res.headers.get('access-control-allow-methods'), null);
  });
});
