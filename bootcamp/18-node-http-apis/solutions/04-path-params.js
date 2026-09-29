// ─────────────────────────────────────────────────────────────────────────
//  04 · path params — SOLUTION                                 ★★☆ core
//  run: node 04-path-params.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: matching '/users/:id' is a zip, not a regex. Split both
//  sides on '/', drop the empty pieces (which deletes leading, trailing
//  and doubled slashes in one move), and require equal lengths. That
//  length check IS the "a param never crosses a slash" rule — no
//  lookahead, no escaping, no regex to get wrong. Express compiles
//  patterns to regexes for speed; segment arrays are the same idea you
//  can still read at 3am.
//  Params are percent-decoded on the way out, because '/tags/data%20sci'
//  means the tag 'data sci' — but decode the SEGMENT, never the whole
//  path: decoding first would turn an encoded '%2F' into a real slash and
//  invent a segment the client never sent. That is the path-traversal
//  bug in miniature (see exercise 15).
//  Decorating req with .params is exactly what Express does. It is not
//  elegant, but it means every downstream handler has one place to look
//  and no extra argument to thread through.
//  First match wins here — the routing capstone in module 15 adds
//  specificity scoring so '/users/me' can beat '/users/:id' whatever the
//  registration order. Until you need that, order is the rule, and order
//  is easy to explain.

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

// Provided: sendJson and pathOf from exercises 01 and 02.
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

export function matchPath(pattern, pathname) {
  const wanted = pattern.split('/').filter(Boolean);
  const actual = pathname.split('/').filter(Boolean);
  if (wanted.length !== actual.length) return null;

  const params = {};
  for (let i = 0; i < wanted.length; i += 1) {
    const segment = wanted[i];
    if (segment.startsWith(':')) {
      params[segment.slice(1)] = decodeURIComponent(actual[i]);
    } else if (segment !== actual[i]) {
      return null;
    }
  }
  return params;
}

export function createRouteHandler(routes) {
  return (req, res) => {
    const path = pathOf(req);
    const method = req.method.toUpperCase();

    for (const route of routes) {
      if (route.method.toUpperCase() !== method) continue;
      const params = matchPath(route.path, path);
      if (params === null) continue;
      req.params = params;
      return route.handler(req, res);
    }

    return sendJson(res, 404, { error: 'not found' });
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

const routes = [
  {
    method: 'GET',
    path: '/users/:id',
    handler: (req, res) => sendJson(res, 200, { user: req.params.id }),
  },
  {
    method: 'GET',
    path: '/users/:userId/posts/:postId',
    handler: (req, res) => sendJson(res, 200, req.params),
  },
  {
    method: 'GET',
    path: '/health',
    handler: (req, res) => sendJson(res, 200, { status: 'ok' }),
  },
];

test('an exact static match captures no params', () => {
  eq(matchPath('/health', '/health'), {});
  eq(matchPath('/', '/'), {});
});

test('a pattern that does not line up returns null', () => {
  eq(matchPath('/health', '/healthz'), null);
  eq(matchPath('/users/:id', '/users'), null);
  eq(matchPath('/users', '/users/42'), null);
});

test('a :segment captures its value by name', () => {
  eq(matchPath('/users/:id', '/users/42'), { id: '42' });
  eq(typeof matchPath('/users/:id', '/users/42').id, 'string');
});

test('several params in one pattern all come back', () => {
  eq(matchPath('/users/:userId/posts/:postId', '/users/7/posts/99'), {
    userId: '7',
    postId: '99',
  });
});

test('a param never swallows a slash', () => {
  eq(matchPath('/files/:name', '/files/notes.txt'), { name: 'notes.txt' });
  eq(matchPath('/files/:name', '/files/deep/notes.txt'), null);
});

test('param values are percent-decoded', () => {
  eq(matchPath('/tags/:tag', '/tags/data%20science'), { tag: 'data science' });
});

test('the handler sees req.params on a real request', async () => {
  await withServer(createRouteHandler(routes), async (request) => {
    const one = await request('/users/42');
    eq(one.status, 200);
    eq(one.json(), { user: '42' });

    const nested = await request('/users/7/posts/99');
    eq(nested.json(), { userId: '7', postId: '99' });
  });
});

test('a path no route claims is a 404', async () => {
  await withServer(createRouteHandler(routes), async (request) => {
    const res = await request('/users/7/settings');
    eq(res.status, 404);
    eq(res.json(), { error: 'not found' });
    ok((await request('/health')).status === 200);
  });
});
