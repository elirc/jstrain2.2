// ─────────────────────────────────────────────────────────────────────────
//  31 · a DI container, part 2                                ★★★ stretch
//  concepts: dependency injection · scopes · cycle detection
//  run: node exercises/31-di-container-graph.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Part 1's container works right up to the day someone registers a
//  service that depends on itself and node prints 4,000 stack frames.
//  Add the three things a real container has:
//
//  1. scopes — `{ scope: 'transient' }` builds a new instance per
//     resolve; the default `'singleton'` keeps sharing one:
//         c.register('id', next, [], { scope: 'transient' });
//
//  2. cycle detection, with the path that caused it:
//         c.resolve('app')
//           → throws 'circular dependency: app -> repo -> app'
//     and a missing dependency must name who wanted it:
//           → throws 'not registered: logger (needed by app)'
//     (a missing name asked for directly is just 'not registered: x')
//
//  3. `dependenciesOf(name)` — the flattened graph, leaves first, each
//     name once, without `name` itself:
//         c.dependenciesOf('app')
//           → ['config', 'db', 'logger', 'repo', 'mailer']
//
//  A failed resolve must leave the container usable — resolve the same
//  broken service twice and the error must be identical.
//
//  hint: keep a stack of what is currently being built; push before the
//  dependencies, pop in a `finally`, and check membership to spot a loop

import { test, eq, ok, spy, throws } from '../../_lib/check.js';

export function createContainer() {
  // register(name, factory, deps = [], { scope = 'singleton' } = {})
  // resolve(name) · dependenciesOf(name) · has(name)
  throw new Error('TODO');
}

const wire = (c) =>
  c
    .register('config', () => ({ tag: 'config' }))
    .register('logger', () => ({ tag: 'logger' }))
    .register('db', () => ({ tag: 'db' }), ['config'])
    .register('repo', () => ({ tag: 'repo' }), ['db', 'logger'])
    .register('mailer', () => ({ tag: 'mailer' }), ['logger'])
    .register('app', () => ({ tag: 'app' }), ['repo', 'mailer']);

// ──────────────────────────── tests ──────────────────────────────────────

test('a transient is rebuilt on every resolve', () => {
  const c = createContainer();
  let n = 0;
  c.register('requestId', () => (n += 1), [], { scope: 'transient' });
  c.register('startedAt', () => 1700000000000);
  eq([c.resolve('requestId'), c.resolve('requestId')], [1, 2]);
  eq(c.resolve('startedAt'), c.resolve('startedAt'));
});

test('singletons are shared between dependents, transients are not', () => {
  const c = createContainer();
  c.register('db', () => ({ tag: 'db' }));
  c.register('id', () => ({ tag: 'id' }), [], { scope: 'transient' });
  c.register('users', (db, id) => ({ db, id }), ['db', 'id']);
  c.register('orders', (db, id) => ({ db, id }), ['db', 'id']);

  const users = c.resolve('users');
  const orders = c.resolve('orders');
  ok(users.db === orders.db, 'one db for the whole container');
  ok(users.id !== orders.id, 'a fresh id per construction');
});

test('a cycle is reported with the path that made it', () => {
  const c = createContainer();
  c.register('app', (repo) => ({ repo }), ['repo']);
  c.register('repo', (app) => ({ app }), ['app']);
  throws(() => c.resolve('app'), 'circular dependency: app -> repo -> app');
});

test('a service that depends on itself is a cycle too', () => {
  const c = createContainer();
  c.register('a', (a) => a, ['a']);
  throws(() => c.resolve('a'), 'circular dependency: a -> a');
});

test('a missing dependency names who asked for it', () => {
  const c = createContainer();
  c.register('app', (logger) => ({ logger }), ['logger']);
  throws(() => c.resolve('app'), 'not registered: logger (needed by app)');
  throws(() => c.resolve('ghost'), 'not registered: ghost');
});

test('the container survives a failed resolve', () => {
  const c = createContainer();
  c.register('a', (b) => b, ['b']);
  c.register('b', (a) => a, ['a']);
  c.register('clock', () => 'tick');
  throws(() => c.resolve('a'), 'circular dependency: a -> b -> a');
  eq(c.resolve('clock'), 'tick');
  throws(() => c.resolve('a'), 'circular dependency: a -> b -> a');
});

test('dependenciesOf flattens the graph, leaves first, once each', () => {
  const c = wire(createContainer());
  eq(c.dependenciesOf('app'), ['config', 'db', 'logger', 'repo', 'mailer']);
  eq(c.dependenciesOf('mailer'), ['logger']);
  eq(c.dependenciesOf('logger'), []);
});

test('a transient captured by a singleton is built once, forever', () => {
  const c = createContainer();
  const id = spy(() => ({ tag: 'id' }));
  c.register('id', id, [], { scope: 'transient' });
  c.register('service', (dep) => ({ dep }), ['id']);
  const first = c.resolve('service');
  const second = c.resolve('service');
  ok(first === second);
  ok(first.dep === second.dep);
  eq(id.callCount, 1);
});
