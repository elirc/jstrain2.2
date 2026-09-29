// ─────────────────────────────────────────────────────────────────────────
//  27 · lazy and audited proxies — SOLUTION                      ★★☆ core
//  concepts: proxy · lazy initialization · transparent wrapping
//  run: node solutions/27-proxy-lazy-audit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — stand in for an object and control access to it, while
//  looking exactly like the thing you replaced.
//  Exercise 16 used proxies to CHANGE behaviour (validate, default,
//  negative indexes). These two change nothing observable — that is the
//  proxy pattern proper: virtual proxy (build on demand) and protection/
//  logging proxy (watch the door). If a caller can tell the difference,
//  the proxy is broken.
//  `init()` with `instance ??= factory()` is the whole lazy trick: every
//  trap funnels through it, so whichever access happens first pays for
//  construction and nobody else does. Put the memo in the closure, never
//  on the proxy target, or a caller can clear it.
//  Trap coverage is the subtle part. `get` alone leaves `'host' in db`
//  answering from an empty `{}` — the object never wakes up and the
//  branch silently takes the wrong path. Cover `get`, `set`, `has` at
//  minimum, and add `ownKeys`/`getOwnPropertyDescriptor` if callers
//  spread or `Object.keys` the thing.
//  When NOT to use: proxies are slow on hot paths and they lie in the
//  debugger — stepping into a "property read" that opens a socket is a
//  bad afternoon. A plain `getDb()` function is often the honest answer.
//  In the wild: Vue 3 reactivity, MobX observables, Immer drafts, ORM
//  lazy relations (Prisma/Hibernate), `node:test` mocks, Jest module
//  proxies, service meshes doing the same trick over a network.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function lazy(factory) {
  let instance = null;
  const init = () => (instance ??= factory());

  return new Proxy(
    {},
    {
      get: (_, key) => Reflect.get(init(), key),
      set: (_, key, value) => Reflect.set(init(), key, value),
      has: (_, key) => Reflect.has(init(), key),
      ownKeys: () => Reflect.ownKeys(init()),
      getOwnPropertyDescriptor: (_, key) =>
        Reflect.getOwnPropertyDescriptor(init(), key),
    }
  );
}

export function audited(target, log) {
  return new Proxy(target, {
    get(object, key) {
      log('get', key);
      return Reflect.get(object, key);
    },
    set(object, key, value) {
      log('set', key, value);
      return Reflect.set(object, key, value);
    },
  });
}

const makeClient = () => ({
  host: 'db.internal',
  queries: 0,
  query(sql) {
    this.queries += 1;
    return `rows for ${sql}`;
  },
});

// ──────────────────────────── tests ──────────────────────────────────────

test('building the proxy does not build the object', () => {
  const build = spy(makeClient);
  const db = lazy(build);
  ok(db !== undefined);
  eq(build.callCount, 0);
});

test('the first property read builds it, exactly once', () => {
  const build = spy(makeClient);
  const db = lazy(build);
  eq(db.host, 'db.internal');
  eq(build.callCount, 1);
});

test('later reads reuse the same instance', () => {
  const build = spy(makeClient);
  const db = lazy(build);
  eq(db.query('select 1'), 'rows for select 1');
  eq(db.query('select 2'), 'rows for select 2');
  eq(db.queries, 2);
  eq(build.callCount, 1);
});

test('writes land on the real object', () => {
  const build = spy(makeClient);
  const db = lazy(build);
  db.host = 'replica.internal';
  eq(db.host, 'replica.internal');
  eq(build.callCount, 1);
});

test('`in` wakes it up too', () => {
  const build = spy(makeClient);
  const db = lazy(build);
  ok('host' in db);
  ok(!('missing' in db));
  eq(build.callCount, 1);
});

test('audited records every read and write, in order', () => {
  const log = spy();
  const conf = audited({ host: 'db.internal' }, log);
  eq(conf.host, 'db.internal');
  conf.host = 'db2';
  eq(conf.host, 'db2');
  eq(log.calls, [
    ['get', 'host'],
    ['set', 'host', 'db2'],
    ['get', 'host'],
  ]);
});

test('audited changes nothing it touches', () => {
  const raw = { retries: 0 };
  const conf = audited(raw, spy());
  conf.retries = 3;
  eq(raw.retries, 3);
  eq(conf.retries, 3);
});

test('the two stack: audited(lazy(build)) still builds once', () => {
  const build = spy(makeClient);
  const log = spy();
  const db = audited(lazy(build), log);
  eq(build.callCount, 0);
  eq(db.host, 'db.internal');
  eq(db.host, 'db.internal');
  eq(build.callCount, 1);
  eq(log.calls, [
    ['get', 'host'],
    ['get', 'host'],
  ]);
});
