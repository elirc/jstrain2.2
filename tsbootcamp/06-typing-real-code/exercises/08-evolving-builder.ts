// ─────────────────────────────────────────────────────────────────────────
//  08 · a builder that knows what you set                  ★★★ stretch
//  concepts: accumulating type params · conditional intersections
//  run: node ../run.js exercises/08-evolving-builder.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A builder whose TYPE changes as you use it. Each `.set()` returns a
//  builder that remembers one more key, and `.build()` only exists once
//  the required keys — host and port — are among them.
//
//      configBuilder().set('host', 'x').set('port', 1).build()   → Config
//      configBuilder().set('host', 'x').build()   → error: no build()
//      configBuilder().build()                    → error: no build()
//      configBuilder().set('port', '8080')        → error: port is number
//
//  The state lives in a type parameter: `Builder<Set>` where `Set` is the
//  union of keys set so far. `set` widens it — `Builder<Set | K>` — and
//  the union grows one literal at a time as you chain.
//
//  `build` then has to be present or absent depending on `Set`. Two ways
//  to do that; the readable one attaches it with a conditional
//  intersection, so the error is "Property 'build' does not exist".
//
//  hint: `type Builder<Set> = { set(...): ... } & (RequiredKey extends
//  Set ? { build(): Config } : {})`. In the implementation, give the
//  runtime object a plain type and assert it into `Builder<never>` once
//  — the types are a compile-time protocol, the runtime is one object

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface Config {
  host: string;
  port: number;
  secure: boolean;
  retries: number;
}

export type RequiredKey = 'host' | 'port';

export type Builder<Set extends keyof Config> = TODO;

export function configBuilder(): TODO {
  throw new Error('TODO');
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
