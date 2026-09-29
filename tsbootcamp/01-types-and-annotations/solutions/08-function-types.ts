// ─────────────────────────────────────────────────────────────────────────
//  08 · function types and never — SOLUTION                 ★★☆ core
//  run: node ../run.js solutions/08-function-types.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `type Formatter = (value: number) => string` names a call
//  signature. Two payoffs. First, `format: Formatter` in a parameter list
//  documents the callback in one word. Second — contextual typing — the
//  alias flows backwards into the callback you write: `const money:
//  Formatter = (value) => ...` needs no annotation on `value`, because
//  the alias already said it is a number.
//
//  `Listener` returns `void`, and void is special in return position: a
//  function that returns something is still a valid `() => void`. That is
//  what makes `events.forEach(...)` accept a callback returning anything.
//  Do NOT read `void` as "returns undefined" — it means "the caller
//  ignores whatever comes back".
//
//  `fail` returns `never`, the type with no values, because it always
//  throws. That is not decoration: `never` disappears from a union, so
//  `Number(x) || fail(...)` is `number` and can be assigned straight to a
//  number. Typing it `void` would poison the expression instead.

import { test, eq, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Formatter = (value: number) => string;
export type Listener = (event: string) => void;

export function applyAll(
  values: readonly number[],
  format: Formatter
): string[] {
  return values.map((value) => format(value));
}

export function notify(events: readonly string[], listener: Listener): number {
  for (const event of events) listener(event);
  return events.length;
}

export function fail(message: string): never {
  throw new Error(message);
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
