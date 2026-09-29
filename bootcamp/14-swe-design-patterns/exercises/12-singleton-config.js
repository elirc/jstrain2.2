// ─────────────────────────────────────────────────────────────────────────
//  12 · config singleton                                        ★★☆ core
//  concepts: singleton · module state · test isolation
//  run: node exercises/12-singleton-config.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every module in the app wants the same config object and the same
//  logger. In JS you do not need a Singleton class — a module-scoped
//  `let` plus a getter is the whole pattern.
//
//      getConfig()               → the one config; created on first call
//                                  from { env: 'development', retries: 3,
//                                         apiUrl: 'http://localhost:3000' }
//      configure({ retries: 5 }) → merges into that same object, returns it
//      getLogger()               → the one logger: { lines, info(message) }
//                                  info pushes `[${env}] ${message}`,
//                                  reading env from the live config
//      resetForTests()           → drop both, so the next call rebuilds
//
//  The reset is not optional. Shared mutable state that survives between
//  tests is how one test's `configure` breaks a test in another file.
//
//  hint: `let instance = null;` at module scope, and
//  `if (!instance) instance = { ...DEFAULTS };` inside the getter

import { test, eq, ok } from '../../_lib/check.js';

export function getConfig() {
  throw new Error('TODO');
}

export function configure(patch) {
  throw new Error('TODO');
}

export function getLogger() {
  throw new Error('TODO');
}

export function resetForTests() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('getConfig always hands back the very same object', () => {
  resetForTests();
  const first = getConfig();
  ok(first === getConfig(), 'a second instance was created');
  first.retries = 7;
  eq(getConfig().retries, 7);
});

test('it starts from the defaults', () => {
  resetForTests();
  eq(getConfig(), {
    env: 'development',
    retries: 3,
    apiUrl: 'http://localhost:3000',
  });
});

test('configure merges into the live instance and returns it', () => {
  resetForTests();
  const held = getConfig();
  const returned = configure({ retries: 5 });
  eq(held.retries, 5);
  eq(held.apiUrl, 'http://localhost:3000');
  ok(returned === held);
});

test('the logger is a singleton too', () => {
  resetForTests();
  ok(getLogger() === getLogger());
  getLogger().info('one');
  getLogger().info('two');
  eq(getLogger().lines.length, 2);
});

test('the logger reads the shared config, not a copy of it', () => {
  resetForTests();
  configure({ env: 'production' });
  getLogger().info('boot');
  eq(getLogger().lines, ['[production] boot']);
});

test('resetForTests restores the defaults', () => {
  resetForTests();
  configure({ env: 'production', retries: 99 });
  resetForTests();
  eq(getConfig().env, 'development');
  eq(getConfig().retries, 3);
});

test('resetForTests clears the logger — this is the test-pollution fix', () => {
  resetForTests();
  getLogger().info('noise from an earlier test');
  resetForTests();
  eq(getLogger().lines, []);
});
