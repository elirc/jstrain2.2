// ─────────────────────────────────────────────────────────────────────────
//  15 · a typed spyOn — SOLUTION                           ★★★ stretch
//  run: node ../run.js solutions/15-typed-spy-on.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three separate ideas stacked into one signature.
//
//  1 · Filtering keys. `{ [K in keyof T]-?: NonNullable<T[K]> extends AnyFn
//  ? K : never }[keyof T]` builds an object whose values are either the
//  key itself or `never`, then indexes it with all the keys — and `never`
//  members drop out of a union automatically. That map-then-index idiom
//  is THE way to select keys by their value type. `-?` strips optionality
//  so an optional method still counts, and `NonNullable` handles the
//  `| undefined` that comes with it.
//
//  2 · Preserving the signature. `Parameters<F>` and `ReturnType<F>` are
//  what tie `calls`, `results` and the spy's own call signature back to
//  the original method. Getting F right is the subtle part: `T[K]` is not
//  known to be callable even when K is a method key, and `T[K] & AnyFn`
//  looks tempting but makes an intersection of two call signatures, from
//  which `Parameters` picks the LAST — `any[]`. `Extract<T[K], AnyFn>`
//  filters the union instead and keeps the real signature.
//
//  3 · A callable interface. `Spy<F>` has a call signature AND properties,
//  which is exactly how you describe "a function with fields" — the same
//  shape jest's `Mock` and sinon's `SinonSpy` have.
//
//  The body is where the type system runs out and you take over: swapping
//  a method on an object is a mutation the compiler cannot follow, so it
//  costs a few assertions. That is fine, and it is the point — the casts
//  are quarantined inside twenty lines, and every caller gets full
//  inference for free. Note `behaviour.apply(target, args)`, not
//  `behaviour(...args)`: the original method may use `this`.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type AnyFn = (...args: any[]) => any;

export type MethodKeys<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends AnyFn ? K : never;
}[keyof T];

export interface Spy<F extends AnyFn> {
  (...args: Parameters<F>): ReturnType<F>;
  calls: Parameters<F>[];
  results: ReturnType<F>[];
  restore(): void;
}

export function spyOn<T extends object, K extends keyof T & MethodKeys<T>>(
  target: T,
  key: K,
  impl?: Extract<T[K], AnyFn>
): Spy<Extract<T[K], AnyFn>> {
  const original = target[key] as AnyFn;
  const behaviour = (impl ?? original) as AnyFn;

  const spy = ((...args: unknown[]) => {
    spy.calls.push(args as never);
    const result: unknown = behaviour.apply(target, args);
    spy.results.push(result as never);
    return result;
  }) as unknown as Spy<Extract<T[K], AnyFn>>;

  spy.calls = [];
  spy.results = [];
  spy.restore = () => {
    target[key] = original as T[K];
  };

  target[key] = spy as unknown as T[K];
  return spy;
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
