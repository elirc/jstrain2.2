// ─────────────────────────────────────────────────────────────────────────
//  08 · a builder that knows what you set — SOLUTION       ★★★ stretch
//  run: node ../run.js solutions/08-evolving-builder.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole idea is that a type parameter can carry STATE
//  through a chain of calls. `Builder<Set>` means "a builder for which
//  the keys in `Set` have been provided". `set` returns `Builder<Set | K>`,
//  so each link in the chain adds one literal to a growing union:
//
//      Builder<never>  →  Builder<'host'>  →  Builder<'host' | 'port'>
//
//  Then `build` is attached conditionally: `RequiredKey extends Set ?
//  { build(): Config } : {}`. Read it as "if every required key is
//  already in Set, this type also has a build method". Because `Set` is
//  concrete at each call site, the conditional resolves there and the
//  error a caller sees is the clean one: *Property 'build' does not exist
//  on type ...*. This is "make illegal states unrepresentable" applied to
//  a call sequence rather than to data — a half-built config is not a
//  value you can pass around, because it has no `build`.
//
//  The alternative encoding is a guard parameter:
//  `build(...guard: RequiredKey extends Set ? [] : [missing: Missing<Set>])`
//  which fails with "Expected 1 arguments, but got 0" and can name the
//  missing keys in the message. Pick whichever error you would rather
//  read at 2am.
//
//  The runtime is deliberately dull: one object, one `Partial<Config>`,
//  one assertion into `Builder<never>` at the door. `set` is annotated
//  `: unknown` purely to break the circular inference of an object whose
//  method returns the object itself — the cast at the end restores the
//  real contract.
//
//  Classic wrong turn: `build(): RequiredKey extends Set ? Config : never`.
//  It compiles, and it catches nothing — assigning `never` to anything is
//  legal, so the mistake surfaces as a confusing runtime undefined.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Config {
  host: string;
  port: number;
  secure: boolean;
  retries: number;
}

export type RequiredKey = 'host' | 'port';

export type Builder<Set extends keyof Config> = {
  set<K extends keyof Config>(key: K, value: Config[K]): Builder<Set | K>;
} & (RequiredKey extends Set ? { build(): Config } : {});

export function configBuilder(): Builder<never> {
  const values: Partial<Config> = {};

  // `: unknown` breaks the circular inference of a self-returning object
  function set<K extends keyof Config>(key: K, value: Config[K]): unknown {
    values[key] = value;
    return api;
  }

  function build(): Config {
    return { secure: false, retries: 3, ...values } as Config;
  }

  const api = { set, build };
  return api as unknown as Builder<never>;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('builds a config from the required keys plus defaults', () => {
  const config = configBuilder().set('host', 'db.local').set('port', 5432).build();
  eq(config, { host: 'db.local', port: 5432, secure: false, retries: 3 });
});

test('optional keys override the defaults', () => {
  const config = configBuilder()
    .set('host', 'x')
    .set('port', 1)
    .set('secure', true)
    .set('retries', 0)
    .build();
  eq(config.secure, true);
  eq(config.retries, 0);
});

test('setting the same key twice keeps the last value', () => {
  const config = configBuilder()
    .set('host', 'first')
    .set('port', 1)
    .set('host', 'second')
    .build();
  eq(config.host, 'second');
});

test('order does not matter, only coverage', () => {
  const config = configBuilder().set('port', 80).set('host', 'a').build();
  eq(config, { host: 'a', port: 80, secure: false, retries: 3 });
});

test('two builders do not share state', () => {
  const first = configBuilder().set('host', 'a').set('port', 1);
  const second = configBuilder().set('host', 'b').set('port', 2);
  eq(first.build().host, 'a');
  eq(second.build().host, 'b');
  ok(first.build() !== second.build(), 'expected separate configs');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _b1 = Expect<
  Equal<Builder<'host' | 'port'> extends { build(): Config } ? true : false, true>
>;
type _b2 = Expect<
  Equal<Builder<'host'> extends { build(): Config } ? true : false, false>
>;

function _typeTests() {
  const config: Config = configBuilder().set('host', 'x').set('port', 1).build();
  use(config);

  // @ts-expect-error — nothing has been set yet, so there is no build()
  configBuilder().build();

  // @ts-expect-error — host alone is not enough
  configBuilder().set('host', 'x').build();

  // @ts-expect-error — port is a number
  configBuilder().set('port', '8080');

  // @ts-expect-error — 'protocol' is not a config key
  configBuilder().set('protocol', 'https');
}
use(_typeTests);
