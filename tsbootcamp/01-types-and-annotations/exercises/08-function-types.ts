// ─────────────────────────────────────────────────────────────────────────
//  08 · function types and never                            ★★☆ core
//  concepts: function type aliases · callbacks · never
//  run: node ../run.js exercises/08-function-types.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A function type alias names a call signature: `type Formatter =
//  (value: number) => string`. Use it for callbacks — the alias reads
//  better in a parameter list and gives the callback's parameters their
//  types automatically at the call site.
//
//      Formatter   takes a number, returns a string
//      Listener    takes an event string, returns nothing (void)
//
//      applyAll([1, 2], (n) => `#${n}`)   → ['#1', '#2']
//      notify(['a', 'b'], listener)       → 2   (calls listener each time)
//      fail('bad port')                   → throws; never returns
//
//  `never` is the type of a value that never arrives: a function that
//  always throws returns `never`, and `never` vanishes inside a union
//  (`number | never` is just `number`).
//
//  hint: the alias goes in the parameter list — `format: Formatter` —
//  and then the callback's own parameters need no annotation at all

import { test, eq, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Formatter = TODO;
export type Listener = TODO;

export function applyAll(values: TODO, format: TODO): TODO {
  throw new Error('TODO');
}

export function notify(events: TODO, listener: TODO): number {
  throw new Error('TODO');
}

export function fail(message: TODO): TODO {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('applyAll formats every value', () => {
  eq(
    applyAll([1, 2], (n: number) => `#${n}`),
    ['#1', '#2']
  );
});

test('applyAll of an empty array is an empty array', () => {
  eq(applyAll([], (n: number) => `#${n}`), []);
});

test('notify calls the listener once per event', () => {
  const seen: string[] = [];
  const count = notify(['a', 'b'], (event: string) => {
    seen.push(event);
  });
  eq(seen, ['a', 'b']);
  eq(count, 2);
});

test('fail throws the message it is given', () => {
  throws(() => fail('bad port'), 'bad port');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<Formatter, (value: number) => string>>;
type _2 = Expect<Equal<Listener, (event: string) => void>>;
type _3 = Expect<Equal<ReturnType<typeof fail>, never>>;
type _4 = Expect<Equal<Parameters<typeof applyAll>[1], Formatter>>;

function _typeTests() {
  // the alias supplies `value`'s type — no annotation needed here
  const money: Formatter = (value) => `$${value.toFixed(2)}`;
  use(money);

  // a void-returning callback may return something; the caller ignores it
  const listener: Listener = (event) => event.length;
  use(listener);

  // @ts-expect-error — a Formatter returns a string, not a number
  const wrong: Formatter = (value) => value * 2;
  use(wrong);

  // never collapses out of the union: this is a plain number
  const port: number = Number('8080') || fail('bad port');
  use(port);

  // @ts-expect-error — applyAll wants a formatter, not a string
  applyAll([1], 'nope');
}
use(_typeTests);
