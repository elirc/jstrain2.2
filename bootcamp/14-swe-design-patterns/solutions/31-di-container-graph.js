// ─────────────────────────────────────────────────────────────────────────
//  31 · a DI container, part 2 — SOLUTION                      ★★★ stretch
//  concepts: dependency injection · scopes · cycle detection
//  run: node solutions/31-di-container-graph.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — the same registry as part 1, hardened for the graph
//  problems that only show up once a team is registering services.
//  The resolving stack is the trick. Push a name before resolving its
//  dependencies, pop it in a `finally`, and "is this name already on the
//  stack?" is your cycle check — with the stack itself as the error
//  message, which is the difference between a five-minute fix and an
//  afternoon. The `finally` is not tidiness: without it the first failed
//  resolve poisons the container and the second attempt reports a
//  nonsense path like `a -> b -> a -> b -> a`. That is the test that
//  catches most attempts.
//  Naming the requester (`needed by app`) costs one parameter and
//  removes the "not registered: logger — registered by whom, wanted by
//  whom?" archaeology.
//  The last test is the classic scope bug, called a *captive
//  dependency*: a transient injected into a singleton is constructed
//  once and then lives as long as its captor. Your per-request id is now
//  a per-process id, and nothing errors. Real containers (ASP.NET Core)
//  throw at validation time for exactly this.
//  When NOT to use: a cycle usually means the design is wrong, not that
//  you need lazy proxies to break it. `A ↔ B` is normally one missing
//  third thing, or an event that should be published instead of a call.
//  In the wild: ASP.NET Core scope validation, NestJS circular-dependency
//  errors and `forwardRef`, Spring's `BeanCurrentlyInCreationException`,
//  Awilix `RESOLUTION_MODE`, Guice's scoping annotations.

import { test, eq, ok, spy, throws } from '../../_lib/check.js';

export function createContainer() {
  const definitions = new Map();
  const instances = new Map();
  const resolving = []; // what is under construction, in order

  const build = (name, requestedBy) => {
    const definition = definitions.get(name);
    if (!definition) {
      throw new Error(
        requestedBy
          ? `not registered: ${name} (needed by ${requestedBy})`
          : `not registered: ${name}`
      );
    }
    if (resolving.includes(name)) {
      throw new Error(
        `circular dependency: ${[...resolving, name].join(' -> ')}`
      );
    }
    if (definition.scope === 'singleton' && instances.has(name)) {
      return instances.get(name);
    }

    resolving.push(name);
    try {
      const args = definition.deps.map((dep) => build(dep, name));
      const instance = definition.factory(...args);
      if (definition.scope === 'singleton') instances.set(name, instance);
      return instance;
    } finally {
      resolving.pop(); // or the next resolve inherits a poisoned stack
    }
  };

  const container = {
    register(name, factory, deps = [], { scope = 'singleton' } = {}) {
      definitions.set(name, { factory, deps, scope });
      return container;
    },

    has: (name) => definitions.has(name),

    resolve: (name) => build(name, undefined),

    dependenciesOf(name) {
      const flattened = [];
      const seen = new Set();

      const walk = (current, path) => {
        if (path.includes(current)) {
          throw new Error(
            `circular dependency: ${[...path, current].join(' -> ')}`
          );
        }
        const definition = definitions.get(current);
        if (!definition) throw new Error(`not registered: ${current}`);
        for (const dep of definition.deps) walk(dep, [...path, current]);
        if (current !== name && !seen.has(current)) {
          seen.add(current);
          flattened.push(current); // post-order: leaves land first
        }
      };

      walk(name, []);
      return flattened;
    },
  };

  return container;
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
