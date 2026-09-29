// ─────────────────────────────────────────────────────────────────────────
//  16 · the typeof type operator                            ★★★ stretch
//  concepts: typeof · keyof typeof · indexed access · ReturnType
//  run: node ../run.js exercises/16-typeof-operator.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  In a type position, `typeof someValue` means "the type TypeScript
//  inferred for that value" — nothing to do with the runtime `typeof`
//  operator. It is how you keep a type and the value it describes from
//  drifting apart: write the value once, derive everything else.
//
//      Config      the shape of `defaults`
//      ConfigKey   its keys: 'host' | 'port' | 'tls'
//      Port        the type of its `port` property
//      Client      whatever makeClient() returns
//
//      readKey('port')   → '5432'    stringifies any config value
//      withPort(6543)    → { host: 'localhost', port: 6543, tls: false }
//      makeClient(defaults).id       → 'localhost:5432'
//
//  makeClient is written for you — you only have to name its return type
//  without repeating it.
//
//  hint: `keyof typeof x` needs both operators, in that order; indexed
//  access is `(typeof x)['port']`; and the standard library already has
//  `ReturnType<F>` for the last one

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export const defaults = {
  host: 'localhost',
  port: 5432,
  tls: false,
};

export type Config = TODO;
export type ConfigKey = TODO;
export type Port = TODO;

export function readKey(key: ConfigKey): string {
  throw new Error('TODO');
}

export function withPort(port: Port): Config {
  throw new Error('TODO');
}

// provided: its return type is inferred, and Client must pick it up
export function makeClient(config: Config) {
  return { config, id: `${config.host}:${config.port}` };
}

export type Client = TODO;

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
