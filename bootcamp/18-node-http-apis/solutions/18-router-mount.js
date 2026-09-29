// ─────────────────────────────────────────────────────────────────────────
//  18 · mountable routers — SOLUTION                           ★★☆ core
//  run: node 18-router-mount.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: this is `express.Router()` plus `app.use('/api', router)`,
//  and the trick that makes it work is one line: the mount rewrites
//  req.path to the REMAINDER before delegating. That is why a router can
//  be written as if it owned the whole URL space — its routes say
//  '/notes', not '/api/v2/notes' — and can then be mounted anywhere, or
//  twice, without editing a single route.
//  A router is itself just a middleware: (req, res, next). Nothing new
//  gets invented, which is why routers nest — mount a router inside a
//  router and the remainder gets sliced again.
//  Match the prefix on segment boundaries. `startsWith('/api')` alone
//  also matches '/apiary', and the router then sees a path of 'ary'.
//  Either the path IS the prefix or it continues with a '/'.
//  Restore req.path on the way out. If the router claims nothing and the
//  request falls through to the next middleware, that middleware must see
//  the original path — leaving it truncated is a bug that only shows up
//  once someone adds a second mount.

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

// Provided: sendJson (01), pathOf (02), matchPath (04), and createApp
// (05) — which now sets req.path once, at the edge, so that mounts have
// something to slice.
function sendJson(res, status, data) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
  });
  res.end(body);
}

function pathOf(req) {
  const url = new URL(req.url, 'http://internal.invalid');
  return url.pathname.replace(/\/+$/, '') || '/';
}

function matchPath(pattern, pathname) {
  const wanted = pattern.split('/').filter(Boolean);
  const actual = pathname.split('/').filter(Boolean);
  if (wanted.length !== actual.length) return null;
  const params = {};
  for (let i = 0; i < wanted.length; i += 1) {
    const segment = wanted[i];
    if (segment.startsWith(':')) params[segment.slice(1)] = decodeURIComponent(actual[i]);
    else if (segment !== actual[i]) return null;
  }
  return params;
}

function createApp() {
  const stack = [];
  const app = {
    use(fn) {
      stack.push(fn);
      return app;
    },
    handler(req, res) {
      req.path = pathOf(req); // normalise once, at the edge (exercise 02)
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

export function createRouter() {
  const routes = [];

  const router = {
    get(path, handler) {
      routes.push({ method: 'GET', path, handler });
      return router;
    },

    post(path, handler) {
      routes.push({ method: 'POST', path, handler });
      return router;
    },

    handle(req, res, next) {
      const path = req.path ?? pathOf(req);
      const method = req.method.toUpperCase();
      for (const route of routes) {
        if (route.method !== method) continue;
        const params = matchPath(route.path, path);
        if (params === null) continue;
        req.params = params;
        return route.handler(req, res);
      }
      next();
    },
  };

  return router;
}

export function mount(prefix, router) {
  const base = prefix.replace(/\/+$/, ''); // '/api' stays, '/' becomes ''

  return (req, res, next) => {
    const current = req.path ?? pathOf(req);
    const inside = current === base || current.startsWith(`${base}/`);
    if (!inside) return next();

    const previous = req.path;
    req.path = current.slice(base.length) || '/';
    router.handle(req, res, () => {
      req.path = previous; // put it back for whoever comes after us
      next();
    });
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

function notesRouter(seen = () => {}) {
  return createRouter()
    .get('/', (req, res) => {
      seen(req.path);
      sendJson(res, 200, { notes: [] });
    })
    .get('/:id', (req, res) => {
      seen(req.path);
      sendJson(res, 200, { id: req.params.id });
    })
    .post('/', (req, res) => sendJson(res, 201, { created: true }));
}

test('a router works on its own, with no mount at all', async () => {
  const app = createApp();
  const health = createRouter();
  health.get('/health', (req, res) => sendJson(res, 200, { status: 'ok' }));
  app.use(health.handle);

  await withServer(app.handler, async (request) => {
    eq((await request('/health')).json(), { status: 'ok' });
    eq((await request('/nope')).status, 404);
  });
});

test('a mounted router answers under its prefix', async () => {
  const app = createApp();
  app.use(mount('/api', notesRouter()));

  await withServer(app.handler, async (request) => {
    eq((await request('/api')).json(), { notes: [] });
    eq((await request('/api/42')).json(), { id: '42' });
    eq((await request('/api', { method: 'POST' })).status, 201);
  });
});

test('the router sees the path with the prefix stripped off', async () => {
  const seen = spy();
  const app = createApp();
  app.use(mount('/api/v2', notesRouter(seen)));

  await withServer(app.handler, async (request) => {
    await request('/api/v2');
    eq(seen.calls[0][0], '/');
    await request('/api/v2/42');
    eq(seen.calls[1][0], '/42');
  });
});

test('params still work under a mount', async () => {
  const app = createApp();
  app.use(mount('/api', notesRouter()));

  await withServer(app.handler, async (request) => {
    eq((await request('/api/data%20science')).json(), { id: 'data science' });
  });
});

test('a path outside the prefix is passed along untouched', async () => {
  const app = createApp();
  app.use(mount('/api', notesRouter()));
  app.use((req, res) => sendJson(res, 200, { fellThrough: req.path ?? null }));

  await withServer(app.handler, async (request) => {
    eq((await request('/health')).json(), { fellThrough: '/health' });
    const near = await request('/apiary');
    eq(near.json(), { fellThrough: '/apiary' }, 'prefixes end at a slash');
  });
});

test('a path inside the prefix that no route claims falls through too', async () => {
  const reached = spy();
  const app = createApp();
  app.use(mount('/api', notesRouter()));
  app.use((req, res) => {
    reached(req.path);
    sendJson(res, 404, { error: 'no such route' });
  });

  await withServer(app.handler, async (request) => {
    const res = await request('/api/42/comments');
    eq(res.status, 404);
    eq(reached.calls[0][0], '/api/42/comments', 'req.path is restored on the way out');
  });
});

test('two routers can be mounted side by side', async () => {
  const admin = createRouter();
  admin.get('/', (req, res) => sendJson(res, 200, { area: 'admin' }));
  const app = createApp();
  app.use(mount('/api', notesRouter()));
  app.use(mount('/admin', admin));

  await withServer(app.handler, async (request) => {
    eq((await request('/api')).json(), { notes: [] });
    eq((await request('/admin')).json(), { area: 'admin' });
  });
});

test('mounting at "/" changes nothing about the paths', async () => {
  const app = createApp();
  const health = createRouter();
  health.get('/health', (req, res) => sendJson(res, 200, { status: 'ok' }));
  app.use(mount('/', health));

  await withServer(app.handler, async (request) => {
    eq((await request('/health')).json(), { status: 'ok' });
    eq((await request('/nope')).status, 404);
  });
});
