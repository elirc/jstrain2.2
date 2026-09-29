// ─────────────────────────────────────────────────────────────────────────
//  27 · lazy and audited proxies                                 ★★☆ core
//  concepts: proxy · lazy initialization · transparent wrapping
//  run: node exercises/27-proxy-lazy-audit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Boot time is 400ms because the module builds a database client that
//  most requests never touch. And when it IS touched, nobody can tell
//  which config keys production actually reads.
//
//  Two proxies, both invisible to the caller:
//
//  1. lazy(factory) — build the real object on FIRST use, once:
//         const build = () => connectExpensively();
//         const db = lazy(build);      // nothing happened yet
//         db.host                      → builds it, returns 'db.internal'
//         db.query('select 1')         → same instance, no rebuild
//
//  2. audited(target, log) — record every property touch:
//         const conf = audited({ retries: 0 }, log);
//         conf.retries                 → log saw ('get', 'retries')
//         conf.retries = 3             → log saw ('set', 'retries', 3)
//
//  They must stack: `audited(lazy(build), log)` still builds once.
//
//  hint: `Reflect.get(target, key)` is "do what would have happened";
//  and remember `'host' in db` is a `has` trap, not a `get`

import { test, eq, ok, spy } from '../../_lib/check.js';

export function lazy(factory) {
  throw new Error('TODO');
}

export function audited(target, log) {
  throw new Error('TODO');
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
