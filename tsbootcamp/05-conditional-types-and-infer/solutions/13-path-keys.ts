// ─────────────────────────────────────────────────────────────────────────
//  13 · PathKeys — SOLUTION                                 ★★★ stretch
//  run: node ../run.js solutions/13-path-keys.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the shape is "map every key to the paths it contributes,
//  then index the map by all its keys to collapse the values into one
//  union". `{ ... }[keyof T & string]` is the squash step — indexing an
//  object type with a union of keys gives the union of those property
//  types.
//
//  Trace PathKeys<Config>, Config = { server: { host: string; port:
//  number }; debug: boolean }:
//
//    keys are 'server' | 'debug'
//    K = 'server' → T['server'] is an object → recurse
//         PathKeys<{ host: string; port: number }>
//           K = 'host' → string is not an object → 'host'
//           K = 'port' → number is not an object → 'port'
//           squash → 'host' | 'port'
//         value = 'server' | `server.${'host' | 'port'}`
//               = 'server' | 'server.host' | 'server.port'
//         (a template literal distributes over a union in a hole — one
//          string per member, for free)
//    K = 'debug'  → boolean is not an object → 'debug'
//    squash the map → 'server' | 'server.host' | 'server.port' | 'debug'
//
//  Details that make the tests pass:
//  · `keyof T & string` drops number and symbol keys. Keep them and
//    `${K}.${...}` fails to compile for symbols and quietly invents
//    '1.x' paths for numeric ones.
//  · The leaf case returns K, not never — 'debug' has to appear.
//  · PathKeys<{}> is never: the mapped type has no keys, so indexing it
//    with never gives never. Which then makes `${K}.${never}` never one
//    level up — a template literal with a never hole IS never, so empty
//    branches contribute nothing instead of contributing garbage.
//  · Arrays and functions are objects too. This version would happily
//    walk into `string[]` and hand you 'list.length' | 'list.push'. A
//    library version adds a guard case that returns K for arrays and
//    functions before the recursive branch, the same way DeepReadonly
//    checks functions first. The fixtures here stay plain records so
//    the idea stays visible.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal, type IsNever } from '../../_lib/type-assert.ts';

// provided — the fixture the tests read paths out of
interface Config {
  server: { host: string; port: number };
  debug: boolean;
}

export type PathKeys<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? K | `${K}.${PathKeys<T[K]>}` : K;
    }[keyof T & string]
  : never;

// ─────────────────────────── runtime tests ───────────────────────────────

const path: PathKeys<Config> = 'server.host';

test('a path type holds a real dotted string', () => {
  eq(path, 'server.host');
  eq(path.split('.'), ['server', 'host']);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _p1 = Expect<Equal<PathKeys<Config>, 'server' | 'server.host' | 'server.port' | 'debug'>>;
type _p2 = Expect<Equal<PathKeys<{ a: { b: { c: number } } }>, 'a' | 'a.b' | 'a.b.c'>>;
type _p3 = Expect<Equal<PathKeys<{ x: string }>, 'x'>>;
// nothing to walk into
type _p4 = Expect<IsNever<PathKeys<{}>>>;
type _p5 = Expect<IsNever<PathKeys<string>>>;
// number keys can't appear in a dotted string path
type _p6 = Expect<Equal<PathKeys<{ a: number; 1: string }>, 'a'>>;
type _p7 = Expect<Equal<PathKeys<{ a?: number }>, 'a'>>;
type _p8 = Expect<Equal<PathKeys<{ a: { b: 1 }; c: { d: 2 } }>, 'a' | 'a.b' | 'c' | 'c.d'>>;

function _typeTests() {
  const p: PathKeys<Config> = 'server.port';
  use(p);

  // @ts-expect-error — 'server.nope' is not a path of Config
  const bad: PathKeys<Config> = 'server.nope';
  use(bad);

  // @ts-expect-error — 'host' on its own is not a top-level path
  const partial: PathKeys<Config> = 'host';
  use(partial);
}
use(_typeTests);
