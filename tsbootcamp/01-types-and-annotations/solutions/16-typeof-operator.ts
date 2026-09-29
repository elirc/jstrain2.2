// ─────────────────────────────────────────────────────────────────────────
//  16 · the typeof type operator — SOLUTION                 ★★★ stretch
//  run: node ../run.js solutions/16-typeof-operator.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: there are two worlds in a TypeScript file — values and
//  types — and `typeof` is the bridge from a value into the type world.
//  Four derivations, each removing a chance for drift:
//
//    Config     = typeof defaults          the whole inferred shape
//    ConfigKey  = keyof typeof defaults    read it inside-out: typeof
//                                          first, then keyof
//    Port       = Config['port']           indexed access; the brackets
//                                          take a TYPE, so `Config['port']`
//                                          and `(typeof defaults)['port']`
//                                          are the same thing
//    Client     = ReturnType<typeof makeClient>
//
//  `ReturnType<F>` needs a function TYPE, and `makeClient` is a value —
//  hence `typeof makeClient` inside it. That combination (`ReturnType<
//  typeof fn>`) is one of the most-used lines in real TypeScript: it
//  names a factory's output without writing the shape twice.
//
//  Add a field to `defaults` and every one of these updates. Type the
//  config by hand instead and you have two sources of truth, which is
//  the wrong turn this exercise exists to prevent.
//
//  Note what `Config` is NOT: because `defaults` widened normally, it is
//  `{ host: string; port: number; tls: boolean }`, not the literal
//  values. Add `as const` (exercise 12) when you want those pinned too.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export const defaults = {
  host: 'localhost',
  port: 5432,
  tls: false,
};

export type Config = typeof defaults;
export type ConfigKey = keyof typeof defaults;
export type Port = Config['port'];

export function readKey(key: ConfigKey): string {
  return String(defaults[key]);
}

export function withPort(port: Port): Config {
  return { ...defaults, port };
}

// provided: its return type is inferred, and Client must pick it up
export function makeClient(config: Config) {
  return { config, id: `${config.host}:${config.port}` };
}

export type Client = ReturnType<typeof makeClient>;

// ─────────────────────────── runtime tests ───────────────────────────────

test('readKey stringifies whichever value it finds', () => {
  eq(readKey('port'), '5432');
  eq(readKey('host'), 'localhost');
  eq(readKey('tls'), 'false');
});

test('withPort overrides only the port', () => {
  eq(withPort(6543), { host: 'localhost', port: 6543, tls: false });
});

test('withPort does not mutate the defaults', () => {
  withPort(6543);
  eq(defaults.port, 5432);
});

test('makeClient builds an id from host and port', () => {
  eq(makeClient(defaults).id, 'localhost:5432');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<Config, { host: string; port: number; tls: boolean }>>;
type _2 = Expect<Equal<ConfigKey, 'host' | 'port' | 'tls'>>;
type _3 = Expect<Equal<Port, number>>;
type _4 = Expect<Equal<Client, { config: Config; id: string }>>;

function _typeTests() {
  readKey('host');
  readKey('tls');

  // @ts-expect-error — 'user' is not a key of the defaults object
  readKey('user');

  // @ts-expect-error — the port is a number
  withPort('6543');

  const client: Client = makeClient(defaults);
  const id: string = client.id;
  use(id);
}
use(_typeTests);
