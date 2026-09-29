// ─────────────────────────────────────────────────────────────────────────
//  14 · module augmentation lite                           ★★★ stretch
//  concepts: declaration merging · declare module · plugin registries
//  run: node ../run.js exercises/14-module-augmentation.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `./fixtures/registry.ts` is a complete plugin registry — a Map plus a
//  typed `get`/`register` pair — and it is deliberately born EMPTY:
//  `interface PluginRegistry {}` means `PluginName` is `never`, so right
//  now nothing can be registered at all.
//
//  Your job is to teach it about two plugins from THIS file, without
//  editing the fixture. Interfaces merge across files: reopen one from
//  another module with `declare module '<specifier>' { ... }` and your
//  members are added to the original.
//
//      setup();
//      get('logger').log('hi')   → ['hi']    (typed as string[])
//      get('timer').tick()       → 1
//      names()                   → ['logger', 'timer']
//      get('cache')              → compile error: no such plugin
//
//  This is how Express grows `req.user`, how Vite types `import.meta.env`
//  and how every "register your own X" library works.
//
//  hint: the specifier inside `declare module` must be spelled exactly
//  like your import — `'./fixtures/registry.ts'`, extension and all. An
//  augmentation can only ADD members, and only to a file that is already
//  a module

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';
import { register, get, names, reset, type PluginName } from './fixtures/registry.ts';

type TODO = any; // replace every TODO below with real types

export interface LoggerPlugin {
  log: TODO;
  lines: TODO;
}

export interface TimerPlugin {
  tick: TODO;
  elapsed: TODO;
}

// TODO: augment the registry from here, so that PluginRegistry gains
//   logger: LoggerPlugin
//   timer: TimerPlugin
// (one `declare module` block — nothing else in this file changes)

export function createLogger(): TODO {
  throw new Error('TODO');
}

export function createTimer(): TODO {
  throw new Error('TODO');
}

export function setup(): TODO {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('setup puts both plugins in the registry', () => {
  setup();
  eq([...names()].sort(), ['logger', 'timer']);
});

test('the logger accumulates every line it was given', () => {
  setup();
  const logger = get('logger');
  eq(logger.log('one'), ['one']);
  eq(logger.log('two'), ['one', 'two']);
  eq(logger.lines(), ['one', 'two']);
});

test('the timer counts ticks and reports elapsed time', () => {
  setup();
  const timer = get('timer');
  eq(timer.tick(), 1);
  eq(timer.tick(), 2);
  eq(timer.elapsed(), 20);
});

test('setup starts from a clean registry each time', () => {
  setup();
  get('logger').log('stale');
  setup();
  eq(get('logger').lines(), []);
});

test('getting a plugin nobody registered throws', () => {
  setup();
  reset();
  throws(() => get('timer'), 'no plugin registered: timer');
  ok(names().length === 0, 'expected an empty registry');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _p1 = Expect<Equal<PluginName, 'logger' | 'timer'>>;
type _p2 = Expect<Equal<ReturnType<LoggerPlugin['log']>, string[]>>;

function _typeTests() {
  const lines: string[] = get('logger').log('hello');
  const ticks: number = get('timer').tick();
  use(lines, ticks);

  // @ts-expect-error — nothing named 'cache' is in the registry
  get('cache');

  // @ts-expect-error — the timer plugin has no log method
  get('timer').log('x');

  // @ts-expect-error — the logger's log takes a string
  register('logger', { log: (n: number) => [], lines: () => [] });
}
use(_typeTests);
