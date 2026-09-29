// ─────────────────────────────────────────────────────────────────────────
//  30 · a DI container, part 1                                   ★★☆ core
//  concepts: dependency injection · container · composition root
//  run: node exercises/30-di-container.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 10 injected collaborators by hand. That works until `main`
//  is forty lines of `new` in exactly the right order and one service
//  gets built twice by accident.
//
//  Build the registry that does the wiring for you:
//
//      const c = createContainer();
//      c.register('config', () => ({ url: 'postgres://…' }));
//      c.register('db', (config) => connect(config), ['config']);
//      c.register('repo', (db) => makeRepo(db), ['db']);
//
//      c.resolve('repo')   → builds config, then db, then repo
//      c.resolve('repo')   → the SAME repo, nothing rebuilt
//      c.has('repo')       → true
//      c.resolve('nope')   → throws 'not registered: nope'
//
//  Registering builds nothing — a container that constructs at
//  registration time is just a slower `new`. `register` returns the
//  container so the composition root reads as one block.
//
//  hint: `factory(...deps.map(resolve))` is the whole engine; the
//  memo of built instances is what makes them singletons

import { test, eq, ok, spy, throws } from '../../_lib/check.js';

export function createContainer() {
  // register(name, factory, deps = []) -> container
  // resolve(name) -> instance
  // has(name) -> boolean
  throw new Error('TODO');
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
