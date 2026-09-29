// ─────────────────────────────────────────────────────────────────────────
//  05 · catch triage — SOLUTION                             ★★☆ core
//  run: node ../run.js solutions/05-catch-triage.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `catch (e)` binds `unknown` under strict, because JS can
//  throw anything — a string from a library, a plain `{ message }` from a
//  fetch wrapper, a number from code that predates Error. So every catch
//  block does the same two steps: normalise, then narrow.
//
//  `toError` is the normaliser and it is the only place in a codebase that
//  should know the messy cases. Order matters: the `instanceof Error`
//  check comes first so a real Error (and its stack) survives by identity,
//  not by reconstruction.
//
//  `errorCode` is the narrowing rep. `typeof x === 'object'` is not enough
//  (null passes it), and `'code' in x` gets you an unknown-valued property,
//  not a string — so the last `typeof` is the one doing the real work.
//  Reaching for `(thrown as any).code` skips all three checks and is
//  exactly what the @ts-expect-error probes are there to catch.
//
//  `safeRun` moves a throw into the type system: the caller cannot read
//  `.value` without first proving `ok`. The async twin is the same shape
//  with `await` inside the try — note that `try { return fn() }` without
//  the await catches nothing, because the rejection happens after return.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Attempt<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };

export function toError(thrown: unknown): Error {
  if (thrown instanceof Error) return thrown;
  if (typeof thrown === 'string') return new Error(thrown);
  if (
    typeof thrown === 'object' &&
    thrown !== null &&
    'message' in thrown &&
    typeof thrown.message === 'string'
  ) {
    return new Error(thrown.message);
  }
  return new Error(`unexpected throw: ${String(thrown)}`);
}

export function errorCode(thrown: unknown): string | null {
  if (typeof thrown !== 'object' || thrown === null) return null;
  if (!('code' in thrown)) return null;
  const code: unknown = thrown.code;
  if (typeof code === 'string') return code;
  if (typeof code === 'number') return String(code);
  return null;
}

export function safeRun<T>(fn: () => T): Attempt<T> {
  try {
    return { ok: true, value: fn() };
  } catch (e: unknown) {
    return { ok: false, error: toError(e) };
  }
}

export async function safeRunAsync<T>(
  fn: () => Promise<T>
): Promise<Attempt<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (e: unknown) {
    return { ok: false, error: toError(e) };
  }
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
