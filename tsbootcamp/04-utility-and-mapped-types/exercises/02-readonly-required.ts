// ─────────────────────────────────────────────────────────────────────────
//  02 · resolveConfig                                       ★☆☆ warm-up
//  concepts: Required · Readonly · defaults at the boundary
//  run: node ../run.js exercises/02-readonly-required.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Config arrives half-empty from a file, and every reader downstream then
//  writes `config.port ?? 8080` forever. Fix it at the boundary: resolve
//  the defaults ONCE and hand out a type where nothing is optional and
//  nothing is writable.
//
//      resolveConfig({ port: 3000 })
//        → { host: 'localhost', port: 3000, retries: 3 }
//
//  Build ResolvedConfig (no optional keys) and FrozenConfig (nothing
//  assignable), then the two functions.
//
//  hint: `??` not `||` — a port of 0 and `retries: 0` are real values

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface RawConfig {
  host?: string;
  port?: number;
  retries?: number;
}

export const DEFAULTS = { host: 'localhost', port: 8080, retries: 3 };

export type ResolvedConfig = TODO;
export type FrozenConfig = TODO;

export function resolveConfig(raw: RawConfig): ResolvedConfig {
  throw new Error('TODO');
}

export function freezeConfig(config: ResolvedConfig): FrozenConfig {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('fills in every missing field', () => {
  eq(resolveConfig({}), { host: 'localhost', port: 8080, retries: 3 });
});

test('keeps the fields that were supplied', () => {
  eq(resolveConfig({ port: 3000 }), {
    host: 'localhost',
    port: 3000,
    retries: 3,
  });
});

test('keeps a zero — it is a value, not a missing field', () => {
  eq(resolveConfig({ retries: 0 }).retries, 0);
});

test('freezeConfig really freezes', () => {
  const frozen = freezeConfig(resolveConfig({}));
  ok(Object.isFrozen(frozen));
});

test('writing to a frozen config throws in module code', () => {
  const frozen = freezeConfig(resolveConfig({})) as { port: number };
  throws(() => {
    frozen.port = 1;
  });
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<ResolvedConfig, { host: string; port: number; retries: number }>
>;
type _t2 = Expect<
  Equal<
    FrozenConfig,
    { readonly host: string; readonly port: number; readonly retries: number }
  >
>;

function _typeTests() {
  // the whole point: no `?? 8080` needed downstream
  const port: number = resolveConfig({}).port;
  use(port);

  const frozen = freezeConfig(resolveConfig({}));

  // @ts-expect-error — a frozen config is read-only
  frozen.port = 9;

  // @ts-expect-error — a raw config still has holes; it is not resolved
  const wrong: ResolvedConfig = {} as RawConfig;
  use(wrong);

  // @ts-expect-error — resolved means every key is present
  const partial: ResolvedConfig = { host: 'localhost', port: 1 };
  use(partial);
}
use(_typeTests);
