// ─────────────────────────────────────────────────────────────────────────
//  14 · get by path — CAPSTONE — SOLUTION                   ★★★ stretch
//  run: node ../run.js solutions/14-get-by-path.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: Get walks the path string and the object type in step.
//  Trace Get<Config, 'server.host'>:
//
//    pass 1  P = 'server.host' matches `${infer K}.${infer Rest}`
//            K = 'server', Rest = 'host'      (leftmost dot wins)
//            is 'server' a keyof Config?  yes → Get<Config['server'], 'host'>
//    pass 2  P = 'host' has no dot → the OTHER base case
//            is 'host' a keyof { host: string; port: number }?  yes
//            → its property type → string
//
//  and the failing path, Get<Config, 'server.nope'>:
//
//    pass 1  K = 'server', Rest = 'nope' → recurse into the branch
//    pass 2  'nope' is not a key → never
//
//  Two conditionals do all of it: one splits head from tail, one asks
//  `K extends keyof T`. That second check is what keeps `T[K]` legal —
//  indexing with a key tsc hasn't verified is an error, so the narrowing
//  has to happen before the indexed access, not after.
//
//  The runtime half is deliberately dumb: split on '.', walk, cast once.
//  Types cannot follow a `for` loop — the compiler has no idea that
//  `cursor` after N iterations is `Get<T, P>` — so this is the honest
//  place for `as`. The safety lives in the SIGNATURE:
//
//    · `P extends PathKeys<T> & string` means a bad path is a compile
//      error at the call site, never an `undefined` at runtime;
//    · `Get<T, P>` gives the caller the precise leaf type, so
//      `get(config, 'server.port')` is a number and needs no annotation.
//
//  `& string` in the constraint is what lets the body call `path.split` —
//  PathKeys<T> for an unresolved T is a deferred conditional, and tsc
//  won't take `.split` on it without being told it's a string.
//
//  This is the whole module in one type: a conditional (`extends` as a
//  question), infer to bind the pieces, recursion with a base case, and
//  a mapped type squashed into a union to feed it.

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

export type Get<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Get<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export function get<T, P extends PathKeys<T> & string>(obj: T, path: P): Get<T, P> {
  let cursor: unknown = obj;
  for (const key of path.split('.')) {
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor as Get<T, P>;
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
