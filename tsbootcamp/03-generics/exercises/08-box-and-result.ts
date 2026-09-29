// ─────────────────────────────────────────────────────────────────────────
//  08 · Box & Result                                      ★★☆ core
//  concepts: generic interfaces · generic type aliases · type guards
//  run: node ../run.js exercises/08-box-and-result.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Types take parameters too. `interface Box<T>` and
//  `type Result<T, E>` are functions over types: give them a T, get a
//  concrete type back.
//
//      box(2)                       → { value: 2 }        Box<number>
//      mapBox(box(2), n => `#${n}`) → { value: '#2' }      Box<string>
//      ok(42)                       → { ok: true, value: 42 }
//      err('boom')                  → { ok: false, error: 'boom' }
//      isOk(result)                 → narrows to the ok branch
//
//  `Result<T, E = Error>` is a discriminated union: the `ok` flag decides
//  which other key exists. `isOk` is a type guard — its return type is
//  `r is <the ok branch>`, which is what lets `r.value` compile after the
//  `if`.
//
//  hint: `ok` never produces an error, so its E can be `never` — and
//  `never` is assignable to everything, which is why `const r:
//  Result<number, string> = ok(1)` still works

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface Box<T> {
  value: TODO;
}

export type Result<T, E = TODO> = TODO;

export function box(value: TODO): TODO {
  throw new Error('TODO');
}

export function mapBox(source: TODO, fn: TODO): TODO {
  throw new Error('TODO');
}

export function ok(value: TODO): TODO {
  throw new Error('TODO');
}

export function err(error: TODO): TODO {
  throw new Error('TODO');
}

export function isOk(result: TODO): TODO {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('box wraps a value', () => {
  eq(box(2), { value: 2 });
});

test('mapBox transforms the contents and re-boxes them', () => {
  eq(mapBox(box(2), (n: number) => `#${n}`), { value: '#2' });
});

test('ok builds the success branch', () => {
  eq(ok(42), { ok: true, value: 42 });
});

test('err builds the failure branch', () => {
  eq(err('boom'), { ok: false, error: 'boom' });
});

test('isOk tells the branches apart', () => {
  eq(isOk(ok(1)), true);
  eq(isOk(err('boom')), false);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<Box<number>, { value: number }>>;
type _r2 = Expect<Equal<Result<number>, Result<number, Error>>>;
type _r3 = Expect<
  Equal<
    Result<number, string>,
    { ok: true; value: number } | { ok: false; error: string }
  >
>;

function _typeTests() {
  const stringBox = mapBox(box(2), (n: number) => `#${n}`);
  type _b = Expect<Equal<typeof stringBox, Box<string>>>;
  use(stringBox);

  // never fits anywhere, so ok() and err() slot into any Result
  const r: Result<number, string> = ok(1);
  const e: Result<number, string> = err('boom');
  use(r, e);

  if (isOk(r)) {
    const value: number = r.value;
    use(value);
  } else {
    const reason: string = r.error;
    use(reason);
  }

  // @ts-expect-error — .value exists only on the ok branch, so not before the guard
  r.value;

  // @ts-expect-error — a Box<number> does not hold a string
  const wrong: Box<string> = box(2);
  use(wrong);
}
use(_typeTests);
