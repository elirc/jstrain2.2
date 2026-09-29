// ─────────────────────────────────────────────────────────────────────────
//  14 · get by path — CAPSTONE                              ★★★ stretch
//  concepts: recursive Get<T, P> · a runtime function typed by it
//  run: node ../run.js exercises/14-get-by-path.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Everything in this module, in one function. PathKeys (exercise 13) is
//  provided; write Get, then the three-line runtime walk that it types.
//
//      Get<Config, 'server.host'>  → string
//      Get<Config, 'server'>       → { host: string; port: number }
//      Get<Config, 'server.nope'>  → never
//
//      get(config, 'server.port')  → 5432, typed number
//      get(config, 'server.nope')  → compile error, not undefined
//
//  The signature is given: PathKeys constrains what a caller may ask for,
//  Get says what comes back. Your Get must eat one segment per pass and
//  return never for a segment that isn't a key.
//
//  hint: `P extends \`${infer K}.${infer Rest}\`` splits head from tail;
//        the runtime side needs one cast — types can't follow a loop

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal, type IsNever } from '../../_lib/type-assert.ts';

// provided — exercise 13's answer
type PathKeys<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? K | `${K}.${PathKeys<T[K]>}` : K;
    }[keyof T & string]
  : never;

interface Config {
  server: { host: string; port: number };
  flags: { beta: boolean };
  name: string;
}

type TODO = any; // replace every TODO below with real types

export type Get<T, P extends string> = TODO;

export function get<T, P extends PathKeys<T> & string>(obj: T, path: P): Get<T, P> {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

const config: Config = {
  server: { host: 'localhost', port: 5432 },
  flags: { beta: true },
  name: 'tsbootcamp',
};

test('reads a top-level value', () => {
  eq(get(config, 'name'), 'tsbootcamp');
});

test('reads a nested value', () => {
  eq(get(config, 'server.host'), 'localhost');
});

test('reads a nested number', () => {
  eq(get(config, 'server.port'), 5432);
});

test('returns the whole branch when the path stops early', () => {
  eq(get(config, 'flags'), { beta: true });
});

test('walks three levels down', () => {
  const deep = { a: { b: { c: 'leaf' } } };
  eq(get(deep, 'a.b.c'), 'leaf');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _g1 = Expect<Equal<Get<Config, 'server.host'>, string>>;
type _g2 = Expect<Equal<Get<Config, 'server.port'>, number>>;
type _g3 = Expect<Equal<Get<Config, 'server'>, { host: string; port: number }>>;
type _g4 = Expect<Equal<Get<Config, 'name'>, string>>;
type _g5 = Expect<Equal<Get<{ a: { b: { c: 1 } } }, 'a.b.c'>, 1>>;
// a segment that isn't a key stops the walk
type _g6 = Expect<IsNever<Get<Config, 'server.nope'>>>;
type _g7 = Expect<IsNever<Get<Config, 'nope'>>>;

type _f1 = Expect<Equal<ReturnType<typeof get<Config, 'server.port'>>, number>>;
type _f2 = Expect<Equal<ReturnType<typeof get<Config, 'flags'>>, { beta: boolean }>>;

function _typeTests() {
  const host: string = get(config, 'server.host');
  use(host);

  // @ts-expect-error — 'server.nope' is not a path of Config
  get(config, 'server.nope');

  // @ts-expect-error — 'host' is not a top-level path of Config
  get(config, 'host');

  // @ts-expect-error — server.host is a string, not a number
  const wrong: number = get(config, 'server.host');
  use(wrong);
}
use(_typeTests);
