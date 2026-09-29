// ─────────────────────────────────────────────────────────────────────────
//  15 · a typed spyOn                                      ★★★ stretch
//  concepts: key filtering · Parameters/ReturnType · callable interfaces
//  run: node ../run.js exercises/15-typed-spy-on.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Test doubles are where library-grade types pay off daily. `spyOn`
//  should accept ONLY the method names of an object, and the spy it
//  returns should have the exact same signature as the method it
//  replaced — arguments recorded as a typed tuple, results as the return
//  type.
//
//      const service = makeService();
//      const greet = spyOn(service, 'greet');
//      service.greet('ada');
//      greet.calls    → [['ada']]        (typed [name: string][])
//      greet.results  → ['hi, ada']      (typed string[])
//      greet.restore();                  // the original is back
//      spyOn(service, 'version')         → compile error: not a method
//      spyOn(service, 'greet', (n: number) => 'x')  → compile error
//
//  Two pieces of type machinery. `MethodKeys<T>` filters `keyof T` down
//  to the function-valued keys — the mapped-type-then-index idiom:
//  `{ [K in keyof T]: ... ? K : never }[keyof T]`, where the `never`
//  entries vanish from the resulting union. And `Spy<F>` is a CALLABLE
//  interface: a call signature plus properties, which is how you type
//  "a function that also has fields".
//
//  hint: `T[K]` is not known to be a function even when K is a method
//  key, so reach for `Extract<T[K], AnyFn>` — an intersection would make
//  `Parameters` pick the wrong signature

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type AnyFn = TODO;

export type MethodKeys<T> = TODO;

export interface Spy<F extends AnyFn> {
  (...args: TODO[]): TODO;
  calls: TODO;
  results: TODO;
  restore: TODO;
}

export function spyOn(target: TODO, key: TODO, impl?: TODO): TODO {
  throw new Error('TODO');
}

// the object under test — a boring service with two methods and a field
export function makeService() {
  return {
    greet(name: string): string {
      return `hi, ${name}`;
    },
    add(a: number, b: number): number {
      return a + b;
    },
    version: '1.0',
  };
}
export type Service = ReturnType<typeof makeService>;

// ─────────────────────────── runtime tests ───────────────────────────────

test('the spy records the arguments of every call', () => {
  const service = makeService();
  const greet = spyOn(service, 'greet');
  service.greet('ada');
  service.greet('bo');
  eq(greet.calls, [['ada'], ['bo']]);
});

test('the spy records results and still returns them', () => {
  const service = makeService();
  const greet = spyOn(service, 'greet');
  eq(service.greet('ada'), 'hi, ada');
  eq(greet.results, ['hi, ada']);
});

test('an implementation replaces the behaviour but keeps the recording', () => {
  const service = makeService();
  const add = spyOn(service, 'add', (a: number, b: number) => a * b);
  eq(service.add(3, 4), 12);
  eq(add.calls, [[3, 4]]);
  eq(add.results, [12]);
});

test('restore puts the original method back', () => {
  const service = makeService();
  const add = spyOn(service, 'add', () => 0);
  eq(service.add(1, 2), 0);
  add.restore();
  eq(service.add(1, 2), 3);
  eq(add.calls.length, 1);
});

test('spying on one method leaves the others alone', () => {
  const service = makeService();
  spyOn(service, 'greet', () => 'stub');
  eq(service.greet('ada'), 'stub');
  eq(service.add(1, 1), 2);
  ok(service.version === '1.0', 'data is untouched');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _m1 = Expect<Equal<MethodKeys<Service>, 'greet' | 'add'>>;
type _m2 = Expect<Equal<MethodKeys<{ a: string; b(): void; c?: () => void }>, 'b' | 'c'>>;

function _typeTests() {
  const service = makeService();
  const greet = spyOn(service, 'greet');

  const name: string = greet.calls[0][0];
  const result: string = greet.results[0];
  const direct: string = greet('ada');
  use(name, result, direct);

  // @ts-expect-error — version is data, not a method
  spyOn(service, 'version');

  // @ts-expect-error — 'missing' is not a key of the service at all
  spyOn(service, 'missing');

  // @ts-expect-error — the replacement must match the method's signature
  spyOn(service, 'greet', (n: number) => 'x');
}
use(_typeTests);
