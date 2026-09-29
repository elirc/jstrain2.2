// ─────────────────────────────────────────────────────────────────────────
//  02 · request context                                      ★☆☆ warm-up
//  concepts: URL · URLSearchParams · header casing
//  run: node 02-request-context.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Node hands you `req.url` as a raw string: '/search?q=cats'. Every
//  framework's first move is to parse that once into a small, boring
//  object the rest of the code can trust. Build that object.
//
//      parseQuery('?q=cats&page=2')  → { q: 'cats', page: '2' }
//      parseQuery('?tag=js&tag=node')→ { tag: ['js', 'node'] }
//      parseQuery('?debug')          → { debug: '' }
//
//      makeContext(req) → {
//        method,          // always upper-case: 'GET'
//        path,            // pathname only, trailing slash trimmed ('/'
//                         // stays '/')
//        query,           // parseQuery of the search string
//        header(name),    // case-insensitive lookup, undefined if absent
//      }
//
//  hint: new URL(req.url, 'http://internal.invalid') — the base is
//  throwaway, you only read .pathname and .search back out

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

export function parseQuery(search) {
  throw new Error('TODO');
}

export function makeContext(req) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('parseQuery turns a search string into an object', () => {
  eq(parseQuery('?q=cats&page=2'), { q: 'cats', page: '2' });
  eq(parseQuery('q=cats'), { q: 'cats' });
  eq(parseQuery(''), {});
});

test('a repeated key becomes an array, a single key stays a string', () => {
  eq(parseQuery('?tag=js&tag=node'), { tag: ['js', 'node'] });
  eq(parseQuery('?tag=js'), { tag: 'js' });
});

test('query values are decoded, and a bare key is an empty string', () => {
  eq(parseQuery('?q=hello%20there'), { q: 'hello there' });
  eq(parseQuery('?q=hello+there'), { q: 'hello there' });
  eq(parseQuery('?debug'), { debug: '' });
});

test('the context splits the path from the query string', () => {
  const ctx = makeContext({ method: 'GET', url: '/search?q=cats', headers: {} });
  eq(ctx.path, '/search');
  eq(ctx.query, { q: 'cats' });
});

test('the method is upper-cased', () => {
  eq(makeContext({ method: 'post', url: '/notes', headers: {} }).method, 'POST');
});

test('a trailing slash is normalised away, but "/" survives', () => {
  const at = (url) => makeContext({ method: 'GET', url, headers: {} }).path;
  eq(at('/notes/'), '/notes');
  eq(at('/notes'), '/notes');
  eq(at('/'), '/');
  eq(at('/?q=1'), '/');
});

test('header lookup ignores case', () => {
  const ctx = makeContext({
    method: 'GET',
    url: '/',
    headers: { 'content-type': 'application/json' },
  });
  eq(ctx.header('Content-Type'), 'application/json');
  eq(ctx.header('content-type'), 'application/json');
  eq(ctx.header('x-missing'), undefined);
});

test('it works on a real request off the wire', async () => {
  await withServer(
    (req, res) => {
      const ctx = makeContext(req);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        method: ctx.method,
        path: ctx.path,
        query: ctx.query,
        accept: ctx.header('Accept'),
      }));
    },
    async (request) => {
      const res = await request('/notes/?tag=a&tag=b', {
        headers: { accept: 'application/json' },
      });
      const seen = res.json();
      eq(seen.method, 'GET');
      eq(seen.path, '/notes');
      eq(seen.query, { tag: ['a', 'b'] });
      ok(seen.accept.includes('application/json'));
    }
  );
});
