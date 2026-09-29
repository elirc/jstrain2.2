// ─────────────────────────────────────────────────────────────────────────
//  09 · unions and literal types — SOLUTION                 ★★☆ core
//  run: node ../run.js solutions/09-union-literals.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'` is a
//  set of four values, written as a type. Anything outside the set is a
//  compile error at the call site, editors autocomplete the members, and
//  a `switch` over the union is checked for coverage.
//
//  That coverage check is why `opposite` needs no trailing `return` and
//  no `default:`. Every member has a case, every case returns, so the
//  compiler proves the end of the function is unreachable and stops
//  demanding a fallback. Add a fifth direction to the union later and
//  this function turns red immediately — a `default: return 'north'`
//  would have swallowed the change silently. That is the whole argument
//  for literal unions over `string`.
//
//  `Id = string | number` is the other flavour: a union of two different
//  shapes. You cannot use it until you know which one you hold, so
//  `typeof id === 'number'` narrows the union to `number` in one branch
//  and `string` in the other. Module 02 does that properly; this is the
//  taste.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type Direction = 'north' | 'east' | 'south' | 'west';
export type Id = string | number;

export function isReadOnly(method: Method): boolean {
  return method === 'GET';
}

export function opposite(direction: Direction): Direction {
  switch (direction) {
    case 'north':
      return 'south';
    case 'south':
      return 'north';
    case 'east':
      return 'west';
    case 'west':
      return 'east';
  }
}

export function idKey(id: Id): string {
  return typeof id === 'number' ? `#${id}` : id;
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
