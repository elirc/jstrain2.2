// ─────────────────────────────────────────────────────────────────────────
//  12 · config singleton — SOLUTION                             ★★☆ core
//  concepts: singleton · module state · test isolation
//  run: node solutions/12-singleton-config.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — guarantee one instance and one access point for it. ES
//  modules are already singletons (the module body runs once, no matter
//  how many files import it), so the pattern collapses to a module-level
//  `let` plus a lazy getter. No `getInstance()` ceremony required.
//  The honest tradeoff: a singleton is a global variable wearing a
//  jacket. It couples every user to one instance, it hides a dependency
//  (nothing in a function's signature says it reads config), and it
//  leaks state between tests — which is exactly why `resetForTests`
//  exists, and why forgetting it produces "passes alone, fails in the
//  suite" bugs.
//  When NOT to use: anything with per-request or per-user state, and
//  anything you want to fake in tests — inject it instead (exercise 10).
//  Config and loggers are the fair uses: read-mostly, process-wide.
//  In the wild: `console`, Node's `process`, a Prisma client held in a
//  module-level variable, `document`.

import { test, eq, ok } from '../../_lib/check.js';

const DEFAULTS = Object.freeze({
  env: 'development',
  retries: 3,
  apiUrl: 'http://localhost:3000',
});

let config = null;
let logger = null;

export function getConfig() {
  if (!config) config = { ...DEFAULTS };
  return config;
}

export function configure(patch) {
  return Object.assign(getConfig(), patch);
}

export function getLogger() {
  if (!logger) {
    logger = {
      lines: [],
      info(message) {
        logger.lines.push(`[${getConfig().env}] ${message}`);
      },
    };
  }
  return logger;
}

export function resetForTests() {
  config = null;
  logger = null;
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
