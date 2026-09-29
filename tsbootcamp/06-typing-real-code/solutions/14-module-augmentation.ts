// ─────────────────────────────────────────────────────────────────────────
//  14 · module augmentation lite — SOLUTION                ★★★ stretch
//  run: node ../run.js solutions/14-module-augmentation.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: interfaces MERGE. Two declarations of the same interface
//  name in the same scope become one interface with the union of their
//  members — and `declare module '<specifier>' { ... }` lets you open that
//  scope from a different file. The fixture ships an empty
//  `PluginRegistry`; this file adds two keys to it; every consumer in the
//  program sees the merged result, including the fixture's own `register`
//  and `get`.
//
//  That is why `PluginName` — `keyof PluginRegistry`, computed inside the
//  fixture — is `'logger' | 'timer'` here and `never` in a program that
//  does not augment. The registry has no idea what plugins exist; it just
//  reads the interface.
//
//  Three rules that trip people up:
//    · the specifier must match how the module RESOLVES, so here it is
//      './fixtures/registry.ts' exactly as imported, extension and all;
//    · the augmenting file must itself be a module (have an import or
//      export), otherwise `declare module` means "declare an AMBIENT
//      module" — a completely different feature that silently stubs a
//      package instead of extending it;
//    · you can only ADD. Redeclaring `logger` with a different type is an
//      error, not an override.
//
//  Runtime and types are separate halves here: the Map is plain
//  JavaScript, the augmentation is erased entirely, and all it buys is
//  that `get('logger')` returns `LoggerPlugin` instead of `unknown`. That
//  split — one runtime container, a type-level index of what is in it —
//  is the whole plugin-registry pattern.

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';
import { register, get, names, reset, type PluginName } from './fixtures/registry.ts';

export interface LoggerPlugin {
  log(message: string): string[];
  lines(): string[];
}

export interface TimerPlugin {
  tick(): number;
  elapsed(): number;
}

declare module './fixtures/registry.ts' {
  interface PluginRegistry {
    logger: LoggerPlugin;
    timer: TimerPlugin;
  }
}

export function createLogger(): LoggerPlugin {
  const lines: string[] = [];
  return {
    log(message) {
      lines.push(message);
      return [...lines];
    },
    lines() {
      return [...lines];
    },
  };
}

export function createTimer(): TimerPlugin {
  let ticks = 0;
  return {
    tick: () => (ticks += 1),
    elapsed: () => ticks * 10,
  };
}

export function setup(): void {
  reset();
  register('logger', createLogger());
  register('timer', createTimer());
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
