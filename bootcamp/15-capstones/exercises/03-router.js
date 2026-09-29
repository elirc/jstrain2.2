// ─────────────────────────────────────────────────────────────────────────
//  03 · router                                              ★★★ capstone
//  concepts: string parsing · arrays · scoring · pure functions
//  time: 30–40 min · 4 stages · 23 tests
//  run: node 03-router.js
// ─────────────────────────────────────────────────────────────────────────
//
//  THE PITCH
//  The matching core of Express, Koa, Fastify and React Router, with the
//  server and the DOM removed. A router is a pure function from a URL
//  string to "which handler, with which params" — and once you see that,
//  routing stops being framework magic and becomes a sorting problem.
//
//  STAGES — do them in order, run the file after each one
//    1. static paths ......... exact segments + the query string
//    2. :params .............. capture segments into an object
//    3. precedence ........... static beats :param beats '*'
//    4. buildPath ............ reverse routing, pattern + params → URL
//
//  THE SPEC
//
//      const router = createRouter();
//      router.addRoute('/users/:id', 'showUser');
//      router.match('/users/42?tab=posts')
//        → { handler: 'showUser', params: { id: '42' },
//            query: { tab: 'posts' }, pattern: '/users/:id' }
//      router.match('/nope')            → null
//
//    A handler is whatever you passed in — a function in real life, a
//    string in these tests. Params are always strings and always decoded
//    ('/users/a%20b' → { id: 'a b' }). Leading and trailing slashes are
//    noise: '/about', '/about/' and 'about' are the same route.
//
//    Stage 3, precedence. Several patterns can match one URL:
//
//      '/users/me'   and '/users/:id'   → '/users/me' wins
//      '/:type/:id'  and '/users/:id'   → '/users/:id' wins
//      '*'           and anything else  → '*' only when nothing else fits
//
//    Score each segment (static beats param), sum, highest total wins,
//    ties go to whoever registered first.
//
//    Stage 4, reverse routing — the same table, used backwards:
//
//      buildPath('/users/:id', { id: 7 })            → '/users/7'
//      buildPath('/users/:id', { id: 7, tab: 'x' })  → '/users/7?tab=x'
//      buildPath('/users/:id', {})                   → throws
//
//  Module 18/04 builds the simpler server-side variant of this matching.
//
//  hint (stage 2): split the pattern and the path into segment arrays and
//  walk them together. If the lengths differ they cannot match — that one
//  check is what stops ':id' from swallowing a '/'.

import { test, eq, ok, throws } from '../../_lib/check.js';

// stage 1 — 'a=1&b=hello%20there' → { a: '1', b: 'hello there' }.
// A '+' means a space, a key with no '=' gets ''.
export function parseQuery(search) {
  throw new Error('TODO');
}

// stages 1–3 — returns { addRoute, match }.
export function createRouter() {
  throw new Error('TODO');
}

// stage 4 — pattern + params → path. Extra params become a query string.
export function buildPath(pattern, params = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// ── stage 1: static paths and the query string ───────────────────────────

test('matches a static path and returns its handler', () => {
  const router = createRouter();
  router.addRoute('/about', 'about');
  const found = router.match('/about');
  eq(found.handler, 'about');
  eq(found.params, {});
});

test('returns null when nothing matches', () => {
  const router = createRouter();
  router.addRoute('/about', 'about');
  eq(router.match('/contact'), null);
});

test('tells two static paths apart', () => {
  const router = createRouter();
  router.addRoute('/about', 'about');
  router.addRoute('/about/team', 'team');
  eq(router.match('/about/team').handler, 'team');
  eq(router.match('/about').handler, 'about');
});

test('a trailing slash does not change the route', () => {
  const router = createRouter();
  router.addRoute('/about', 'about');
  eq(router.match('/about/').handler, 'about');
  eq(router.match('about').handler, 'about');
});

test('parseQuery turns a search string into an object', () => {
  eq(parseQuery('a=1&b=2'), { a: '1', b: '2' });
  eq(parseQuery(''), {});
  eq(parseQuery('flag'), { flag: '' });
  eq(parseQuery('q=hello%20there'), { q: 'hello there' });
  eq(parseQuery('q=hello+there'), { q: 'hello there' });
});

test('match exposes the parsed query and an empty object without one', () => {
  const router = createRouter();
  router.addRoute('/search', 'search');
  eq(router.match('/search?q=cats&page=2').query, { q: 'cats', page: '2' });
  eq(router.match('/search').query, {});
});

// ── stage 2: :params ─────────────────────────────────────────────────────

test('captures a single :param', () => {
  const router = createRouter();
  router.addRoute('/users/:id', 'showUser');
  const found = router.match('/users/42');
  eq(found.handler, 'showUser');
  eq(found.params, { id: '42' });
});

test('captures several params in one pattern', () => {
  const router = createRouter();
  router.addRoute('/users/:userId/posts/:postId', 'showPost');
  eq(router.match('/users/7/posts/99').params, { userId: '7', postId: '99' });
});

test('params are strings, never numbers', () => {
  const router = createRouter();
  router.addRoute('/users/:id', 'showUser');
  eq(typeof router.match('/users/42').params.id, 'string');
});

test('a :param never swallows a slash', () => {
  const router = createRouter();
  router.addRoute('/files/:name', 'file');
  eq(router.match('/files/notes.txt').params, { name: 'notes.txt' });
  eq(router.match('/files/deep/notes.txt'), null);
});

test('param values are percent-decoded', () => {
  const router = createRouter();
  router.addRoute('/tags/:tag', 'tag');
  eq(router.match('/tags/data%20science').params, { tag: 'data science' });
});

test('params and query arrive together', () => {
  const router = createRouter();
  router.addRoute('/users/:id', 'showUser');
  const found = router.match('/users/42?tab=posts');
  eq(found.params, { id: '42' });
  eq(found.query, { tab: 'posts' });
});

// ── stage 3: precedence ──────────────────────────────────────────────────

test('a static segment beats a :param registered first', () => {
  const router = createRouter();
  router.addRoute('/users/:id', 'showUser');
  router.addRoute('/users/me', 'showMe');
  eq(router.match('/users/me').handler, 'showMe');
  eq(router.match('/users/42').handler, 'showUser');
});

test('the more specific pattern wins wherever the static part sits', () => {
  const router = createRouter();
  router.addRoute('/:type/:id', 'generic');
  router.addRoute('/users/:id', 'showUser');
  eq(router.match('/users/42').pattern, '/users/:id');
  eq(router.match('/posts/42').pattern, '/:type/:id');
});

test("'*' catches everything nothing else claimed", () => {
  const router = createRouter();
  router.addRoute('/about', 'about');
  router.addRoute('*', 'notFound');
  eq(router.match('/who/knows/where').handler, 'notFound');
  eq(router.match('/who/knows/where').params, {});
});

test("'*' never beats a route that really matches", () => {
  const router = createRouter();
  router.addRoute('*', 'notFound');
  router.addRoute('/about', 'about');
  router.addRoute('/users/:id', 'showUser');
  eq(router.match('/about').handler, 'about');
  eq(router.match('/users/1').handler, 'showUser');
});

test('the first registration wins a tie between equal patterns', () => {
  const router = createRouter();
  router.addRoute('/a/:x', 'first');
  router.addRoute('/a/:y', 'second');
  const found = router.match('/a/1');
  eq(found.handler, 'first');
  eq(found.params, { x: '1' });
});

// ── stage 4: buildPath (reverse routing) ─────────────────────────────────

test('buildPath fills params into a pattern', () => {
  eq(buildPath('/users/:id', { id: 'ada' }), '/users/ada');
  eq(buildPath('/users/:a/posts/:b', { a: '1', b: '2' }), '/users/1/posts/2');
});

test('buildPath stringifies non-strings', () => {
  eq(buildPath('/users/:id', { id: 7 }), '/users/7');
});

test('buildPath encodes characters that would break the URL', () => {
  eq(buildPath('/tags/:tag', { tag: 'data science' }), '/tags/data%20science');
  eq(buildPath('/tags/:tag', { tag: 'a/b' }), '/tags/a%2Fb');
});

test('buildPath throws when a param is missing', () => {
  const path = buildPath('/users/:id', { id: 1 });
  eq(path, '/users/1');
  throws(() => buildPath('/users/:id', {}), 'id');
});

test('leftover params become a query string', () => {
  eq(buildPath('/users/:id', { id: 1, tab: 'posts' }), '/users/1?tab=posts');
  eq(buildPath('/search', { q: 'cats' }), '/search?q=cats');
});

test('buildPath and match are inverses', () => {
  const router = createRouter();
  router.addRoute('/users/:userId/posts/:postId', 'showPost');
  const params = { userId: 'ada lovelace', postId: '99' };
  const url = buildPath('/users/:userId/posts/:postId', params);
  const found = router.match(url);
  ok(found !== null);
  eq(found.params, params);
});
