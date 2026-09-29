// ─────────────────────────────────────────────────────────────────────────
//  13 · PathKeys                                            ★★★ stretch
//  concepts: recursion over object types · mapped type → union
//  run: node ../run.js exercises/13-path-keys.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Every dot-path into a nested object type, as a union of literals —
//  the type behind autocompleting `t('errors.auth.expired')`.
//
//      PathKeys<{ a: { b: { c: number } } }>  → 'a' | 'a.b' | 'a.b.c'
//      PathKeys<{ x: string }>                → 'x'
//      PathKeys<{}>                           → never
//      PathKeys<string>                       → never
//
//  Both the branch key ('a') and the paths under it are in the union.
//  Number keys are skipped — a dot-path is made of strings.
//
//  hint: build a mapped type whose VALUES are the paths, then index it
//        with `[keyof T & string]` to squash it into a union

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal, type IsNever } from '../../_lib/type-assert.ts';

// provided — the fixture the tests read paths out of
interface Config {
  server: { host: string; port: number };
  debug: boolean;
}

type TODO = any; // replace every TODO below with real types

export type PathKeys<T> = TODO;

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
