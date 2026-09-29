// ─────────────────────────────────────────────────────────────────────────
//  30 · a DI container, part 1 — SOLUTION                        ★★☆ core
//  concepts: dependency injection · container · composition root
//  run: node solutions/30-di-container.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — move the knowledge of "what is built from what" out of the
//  services and into one registry, so wiring is data instead of code.
//  The engine is three lines: look up the definition, resolve each
//  dependency (recursively), call the factory with the results. Because
//  resolution is depth-first, the graph builds bottom-up with no
//  ordering rules to maintain by hand — add a dependency to a factory
//  and the container reorders itself.
//  The instance memo is what makes services singletons *within a
//  container*. Note the difference from exercise 12's module-level
//  singleton: the state lives in the container, so a test gets a fresh
//  world by making a new container instead of calling a reset hook.
//  That is the same reason tests register fakes here — the container IS
//  the seam.
//  Laziness matters too. Registering must not construct anything, or
//  importing your app opens a database connection during unit tests.
//  When NOT to use: small apps. Ten `new` calls in `main.js` are
//  explicit and greppable; a container is worth it when the graph is
//  deep, or when the same graph has three wirings (prod/test/CLI).
//  In the wild: NestJS providers, InversifyJS, Angular injectors, Spring
//  beans, .NET `IServiceCollection`, Awilix.
//  Part 2 adds the parts that bite: scopes, cycle detection, and what
//  happens to the container after a failed resolve.

import { test, eq, ok, spy, throws } from '../../_lib/check.js';

export function createContainer() {
  const definitions = new Map();
  const instances = new Map();

  const container = {
    register(name, factory, deps = []) {
      definitions.set(name, { factory, deps });
      return container; // chainable composition root
    },

    has: (name) => definitions.has(name),

    resolve(name) {
      const definition = definitions.get(name);
      if (!definition) throw new Error(`not registered: ${name}`);
      if (instances.has(name)) return instances.get(name);

      const args = definition.deps.map((dep) => container.resolve(dep));
      const instance = definition.factory(...args);
      instances.set(name, instance);
      return instance;
    },
  };

  return container;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolve runs the factory and hands back what it made', () => {
  const c = createContainer();
  c.register('clock', () => ({ now: () => 1700000000000 }));
  eq(c.resolve('clock').now(), 1700000000000);
  eq(c.has('clock'), true);
  eq(c.has('nope'), false);
});

test('dependencies arrive as arguments, in the order declared', () => {
  const c = createContainer();
  c.register('db', () => ({ tag: 'db' }));
  c.register('logger', () => ({ tag: 'logger' }));
  const factory = spy((db, logger) => ({ db, logger }));
  c.register('repo', factory, ['db', 'logger']);

  const repo = c.resolve('repo');
  eq(factory.callCount, 1);
  eq(factory.calls[0].map((dep) => dep.tag), ['db', 'logger']);
  eq(repo.logger.tag, 'logger');
});

test('a service is built once and shared by everyone', () => {
  const c = createContainer();
  const build = spy(() => ({ id: 'the-one' }));
  c.register('db', build);
  c.register('users', (db) => ({ db }), ['db']);
  c.register('orders', (db) => ({ db }), ['db']);

  ok(c.resolve('db') === c.resolve('db'));
  ok(c.resolve('users').db === c.resolve('orders').db);
  eq(build.callCount, 1);
});

test('nothing is built until something is resolved', () => {
  const c = createContainer();
  const config = spy(() => ({}));
  const db = spy(() => ({}));
  c.register('config', config);
  c.register('db', db, ['config']);
  eq([config.callCount, db.callCount], [0, 0]);
  c.resolve('db');
  eq([config.callCount, db.callCount], [1, 1]);
});

test('a deep chain is built bottom-up', () => {
  const marks = [];
  const track = (name) => () => {
    marks.push(name);
    return { name };
  };
  const c = createContainer();
  c.register('config', track('config'));
  c.register('db', track('db'), ['config']);
  c.register('repo', track('repo'), ['db']);
  c.register('service', track('service'), ['repo']);
  c.resolve('service');
  eq(marks, ['config', 'db', 'repo', 'service']);
});

test('resolving an unregistered name says which one', () => {
  const c = createContainer();
  throws(() => c.resolve('mailer'), 'not registered: mailer');
});

test('register returns the container, so wiring reads as one block', () => {
  const c = createContainer();
  const same = c
    .register('a', () => 'A')
    .register('b', (a) => `${a}B`, ['a'])
    .register('c', (b) => `${b}C`, ['b']);
  ok(same === c);
  eq(c.resolve('c'), 'ABC');
});

test('two containers are independent worlds', () => {
  const live = createContainer().register('clock', () => 'real');
  const test1 = createContainer().register('clock', () => 'fake');
  eq([live.resolve('clock'), test1.resolve('clock')], ['real', 'fake']);
  eq(live.has('nothing'), false);
});
