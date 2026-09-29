// ─────────────────────────────────────────────────────────────────────────
//  05 · catch triage                                        ★★☆ core
//  concepts: unknown in catch · narrowing · Result unions
//  run: node ../run.js exercises/05-catch-triage.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — you learned this in TS-06.
//
//  Normalise first, narrow second. New shapes this time:
//
//      toError(new RangeError('x'))        → that same object
//      toError('boom')                     → Error('boom')
//      toError({ message: 'from the api' })→ Error('from the api')
//      toError(404)                        → Error('unexpected throw: 404')
//
//      errorCode({ code: 'ENOENT' })       → 'ENOENT'
//      errorCode({ code: 429 })            → '429'
//      errorCode(new Error('plain'))       → null
//
//      safeRun(() => 6 * 7)                → { ok: true, value: 42 }
//      await safeRunAsync(async () => { throw 'x' })
//                                          → { ok: false, error: Error }

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Attempt<T> = TODO;

export function toError(thrown: unknown): TODO {
  throw new Error('TODO');
}

export function errorCode(thrown: unknown): TODO {
  throw new Error('TODO');
}

export function safeRun<T>(fn: () => T): TODO {
  throw new Error('TODO');
}

export async function safeRunAsync<T>(fn: () => Promise<T>): Promise<TODO> {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('a real Error survives by identity, stack and all', () => {
  const original = new RangeError('too big');
  ok(toError(original) === original, 'expected the very same object');
});

test('a thrown string and a { message } object both lift to Error', () => {
  eq(toError('boom').message, 'boom');
  eq(toError({ message: 'from the api' }).message, 'from the api');
});

test('anything else is labelled rather than trusted', () => {
  eq(toError(404).message, 'unexpected throw: 404');
  eq(toError(null).message, 'unexpected throw: null');
  ok(toError(undefined) instanceof Error);
});

test('errorCode digs out string and numeric codes, and only those', () => {
  const enoent = Object.assign(new Error('missing'), { code: 'ENOENT' });
  eq(errorCode(enoent), 'ENOENT');
  eq(errorCode({ code: 429 }), '429');
  eq(errorCode({ code: { nested: true } }), null);
  eq(errorCode(new Error('plain')), null);
  eq(errorCode('ENOENT'), null);
});

test('safeRun turns both outcomes into data', () => {
  const good = safeRun(() => 6 * 7);
  if (!good.ok) throw new Error('expected the ok branch');
  eq(good.value, 42);

  const bad = safeRun((): number => {
    throw 'boom';
  });
  if (bad.ok) throw new Error('expected the failure branch');
  ok(bad.error instanceof Error, 'expected a real Error');
  eq(bad.error.message, 'boom');
});

test('safeRunAsync catches a rejection instead of leaking it', async () => {
  const good = await safeRunAsync(async () => 'ok');
  eq(good, { ok: true, value: 'ok' });

  const bad = await safeRunAsync(async (): Promise<string> => {
    throw Object.assign(new Error('gone'), { code: 410 });
  });
  if (bad.ok) throw new Error('expected the failure branch');
  eq(bad.error.message, 'gone');
  eq(errorCode(bad.error), '410');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<
    Attempt<number>,
    { ok: true; value: number } | { ok: false; error: Error }
  >
>;
type _t2 = Expect<Equal<ReturnType<typeof toError>, Error>>;
type _t3 = Expect<Equal<ReturnType<typeof errorCode>, string | null>>;
type _t4 = Expect<Equal<ReturnType<typeof safeRun<string>>, Attempt<string>>>;

function _typeTests() {
  const caught: unknown = new Error('x');

  // @ts-expect-error — a caught value is unknown, so nothing is readable
  caught.message;

  // @ts-expect-error — including the code you are about to go looking for
  caught.code;

  const message: string = toError(caught).message;
  use(message);

  // @ts-expect-error — normalising gives you an Error, not your subclass
  toError(caught).status;

  const code = errorCode(caught);
  // @ts-expect-error — errorCode may return null, so it is not a string
  const asString: string = code;
  use(asString);

  const result = safeRun(() => 42);

  // @ts-expect-error — value exists only after you have checked ok
  result.value;

  if (result.ok) {
    const value: number = result.value;
    use(value);
  } else {
    const failure: Error = result.error;
    use(failure);
  }

  const pending: Promise<Attempt<string>> = safeRunAsync(async () => 'x');
  use(pending);

  // @ts-expect-error — errorCode needs something to inspect
  errorCode();
}
use(_typeTests);
