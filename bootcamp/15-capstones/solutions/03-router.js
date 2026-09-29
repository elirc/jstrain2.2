// ─────────────────────────────────────────────────────────────────────────
//  03 · router — SOLUTION                                   ★★★ capstone
//  concepts: string parsing · arrays · scoring · pure functions
//  time: 30–40 min · 4 stages · 23 tests
//  run: node 03-router.js
// ─────────────────────────────────────────────────────────────────────────
//
//  WALKTHROUGH
//
//  Architecture. Three pure helpers and one tiny object. `splitPath` turns
//  both patterns and URLs into segment arrays, which makes every later
//  question ("do these line up?", "is this segment a param?") an array
//  problem instead of a regex problem. Real routers compile patterns to
//  regexes for speed; segment arrays are the same idea you can still read
//  at 3am, and they make precedence scoring trivial.
//
//  Stage 1 — normalise first. `path.split('/').filter(Boolean)` deletes the
//  leading, trailing and doubled slashes in one move, so '/about',
//  '/about/' and 'about' all become ['about']. Normalising inputs at the
//  edge is why the rest of the file has no special cases.
//
//  Stage 2 — matching is a zip. Equal segment counts, then walk the pairs:
//  ':id' captures, anything else must be equal. The length check IS the
//  "params don't cross slashes" rule — no lookahead needed.
//
//  Stage 3 — precedence is scoring, not ordering. Collect EVERY route that
//  matches, score each (static segment 2, param 1, catch-all -1), take the
//  best, break ties by registration order. The naive version — first match
//  wins — is the bug behind a thousand "/users/me hits the :id handler"
//  reports, and it makes route order load-bearing. Scoring makes the table
//  order-independent, which is exactly what React Router v6 changed to.
//
//  Stage 4 — one table, used backwards. buildPath is the reason routes get
//  names: templating '/users/' + id by hand all over a codebase is how you
//  end up with three different URL shapes for one page. Params you did not
//  spend in the path are not an error — they are the query string.
//
//  Classic wrong turn: matching with `url.startsWith(pattern)`. '/user'
//  then matches '/users/42/settings', and you will not notice until a
//  handler gets a params object full of undefined.
//
//  Module 18/04 builds the simpler server-side variant of this matching.

import { test, eq, ok, throws } from '../../_lib/check.js';

// stage 1 — '/a/b/' → ['a','b']; kills leading/trailing/double slashes.
const splitPath = (path) => String(path).split('/').filter((s) => s !== '');

// stage 1 — '+' is a legacy space; everything else is percent-decoding.
const decodeParam = (s) => decodeURIComponent(String(s).replace(/\+/g, ' '));

export function parseQuery(search) {
  const query = {};
  for (const pair of String(search).replace(/^\?/, '').split('&')) {
    if (pair === '') continue;
    const at = pair.indexOf('=');
    const key = at === -1 ? pair : pair.slice(0, at);
    const value = at === -1 ? '' : pair.slice(at + 1);
    query[decodeParam(key)] = decodeParam(value);
  }
  return query;
}

// stage 2 — returns the captured params, or null for "does not match".
function matchSegments(patternSegments, pathSegments) {
  if (patternSegments.length === 1 && patternSegments[0] === '*') return {};
  if (patternSegments.length !== pathSegments.length) return null;
  const params = {};
  for (let i = 0; i < patternSegments.length; i += 1) {
    const segment = patternSegments[i];
    if (segment.startsWith(':')) {
      params[segment.slice(1)] = decodeParam(pathSegments[i]);
    } else if (segment !== pathSegments[i]) return null;
  }
  return params;
}

// stage 3 — specificity as a number: static 2, param 1, catch-all last.
function scoreOf(patternSegments) {
  if (patternSegments.length === 1 && patternSegments[0] === '*') return -1;
  return patternSegments.reduce((n, s) => n + (s.startsWith(':') ? 1 : 2), 0);
}

export function createRouter() {
  const routes = [];

  return {
    addRoute(pattern, handler) {
      routes.push({ pattern, handler, segments: splitPath(pattern) });
      return this;
    },

    match(url) {
      const [rawPath, ...rest] = String(url).split('?');
      const query = parseQuery(rest.join('?'));
      const pathSegments = splitPath(rawPath);

      // stage 3 — every candidate, then the best one. `>` not `>=` keeps
      // the earliest registration on a tie.
      let best = null;
      for (const route of routes) {
        const params = matchSegments(route.segments, pathSegments);
        if (params === null) continue;
        const score = scoreOf(route.segments);
        if (best === null || score > best.score) best = { route, params, score };
      }
      if (best === null) return null;

      return {
        handler: best.route.handler,
        params: best.params,
        query,
        pattern: best.route.pattern,
      };
    },
  };
}

// stage 4 — spend the params on the path, then on the query string.
export function buildPath(pattern, params = {}) {
  const spent = new Set();
  const segments = splitPath(pattern).map((segment) => {
    if (!segment.startsWith(':')) return segment;
    const name = segment.slice(1);
    const value = params[name];
    if (value === undefined || value === null) {
      throw new Error(`buildPath: missing param "${name}" for ${pattern}`);
    }
    spent.add(name);
    return encodeURIComponent(String(value));
  });

  const path = `/${segments.join('/')}`;
  const extras = Object.keys(params).filter(
    (key) => !spent.has(key) && params[key] !== undefined
  );
  if (extras.length === 0) return path;

  const search = extras
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`)
    .join('&');
  return `${path}?${search}`;
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
