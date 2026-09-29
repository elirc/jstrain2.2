// ─────────────────────────────────────────────────────────────────────────
//  02 · resolveConfig — SOLUTION                            ★☆☆ warm-up
//  run: node ../run.js solutions/02-readonly-required.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Required<T>` is `{ [K in keyof T]-?: T[K] }`. The `-?`
//  does two things people forget it does: it removes the question mark AND
//  it strips `undefined` out of the property type, which is why
//  `resolveConfig({}).port` is `number` and not `number | undefined`.
//
//  `Readonly<T>` is the same loop with a `readonly` modifier added. Note
//  that `readonly` is compile-time only — `Object.freeze` is what actually
//  stops the write at runtime, and the two are independent. `Object.freeze`
//  even returns `Readonly<T>` for you, so the annotation and the runtime
//  agree here.
//
//  Two-type pattern worth stealing: RawConfig at the edge (everything
//  optional), ResolvedConfig everywhere inside. Defaults get applied in
//  exactly one place instead of at every read site.

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface RawConfig {
  host?: string;
  port?: number;
  retries?: number;
}

export const DEFAULTS = { host: 'localhost', port: 8080, retries: 3 };

export type ResolvedConfig = Required<RawConfig>;
export type FrozenConfig = Readonly<ResolvedConfig>;

export function resolveConfig(raw: RawConfig): ResolvedConfig {
  return {
    host: raw.host ?? DEFAULTS.host,
    port: raw.port ?? DEFAULTS.port,
    retries: raw.retries ?? DEFAULTS.retries,
  };
}

export function freezeConfig(config: ResolvedConfig): FrozenConfig {
  return Object.freeze({ ...config });
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
