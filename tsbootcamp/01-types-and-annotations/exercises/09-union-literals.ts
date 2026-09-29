// ─────────────────────────────────────────────────────────────────────────
//  09 · unions and literal types                            ★★☆ core
//  concepts: union types · string literal unions
//  run: node ../run.js exercises/09-union-literals.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A literal union is the cheapest modelling tool TypeScript has: four
//  words that turn "a string, hopefully one of these" into a closed set
//  the compiler checks, autocompletes, and can prove you handled.
//
//      Method      'GET' | 'POST' | 'PUT' | 'DELETE'
//      Direction   'north' | 'east' | 'south' | 'west'
//      Id          a string or a number
//
//      isReadOnly('GET')     → true       only GET is read-only
//      isReadOnly('POST')    → false
//      opposite('north')     → 'south'
//      opposite('east')      → 'west'
//      idKey(7)              → '#7'       numbers get a hash
//      idKey('u1')           → 'u1'       strings pass through
//
//  Narrowing gets a module of its own (02) — here you only need the
//  `typeof id === 'number'` flavour inside idKey.
//
//  hint: write `opposite` as a `switch` over the four directions with a
//  `return` in every case — the compiler then knows the end is
//  unreachable and stops asking for a fallback return

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Method = TODO;
export type Direction = TODO;
export type Id = TODO;

export function isReadOnly(method: Method): boolean {
  throw new Error('TODO');
}

export function opposite(direction: Direction): Direction {
  throw new Error('TODO');
}

export function idKey(id: Id): string {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('GET is the only read-only method', () => {
  eq(isReadOnly('GET'), true);
  eq(isReadOnly('POST'), false);
  eq(isReadOnly('DELETE'), false);
});

test('opposite flips north and south', () => {
  eq(opposite('north'), 'south');
  eq(opposite('south'), 'north');
});

test('opposite flips east and west', () => {
  eq(opposite('east'), 'west');
  eq(opposite('west'), 'east');
});

test('idKey hashes numeric ids', () => {
  eq(idKey(7), '#7');
});

test('idKey passes string ids through', () => {
  eq(idKey('u1'), 'u1');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<Method, 'GET' | 'POST' | 'PUT' | 'DELETE'>>;
type _2 = Expect<Equal<Direction, 'north' | 'east' | 'south' | 'west'>>;
type _3 = Expect<Equal<Id, string | number>>;
type _4 = Expect<Equal<ReturnType<typeof opposite>, Direction>>;

function _typeTests() {
  const method: Method = 'PUT';
  isReadOnly(method);
  idKey(7);
  idKey('u1');

  // @ts-expect-error — 'PATCH' is not in the Method union
  isReadOnly('PATCH');

  // @ts-expect-error — 'up' is not a Direction
  opposite('up');

  // @ts-expect-error — an Id is a string or a number, never a boolean
  const flag: Id = true;
  use(flag);

  // @ts-expect-error — opposite returns a Direction, not any old string
  const loose: 'north' = opposite('south');
  use(loose);
}
use(_typeTests);
