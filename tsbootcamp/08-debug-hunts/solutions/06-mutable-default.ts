// ─────────────────────────────────────────────────────────────────────────
//  06 · the default that remembers — SOLUTION              ★★☆ core
//  run: node ../run.js solutions/06-mutable-default.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//  BUG CLASS — writing through a reference the function does not own,
//  with a module-level object as the default parameter.
//
//  THE TELL — results that depend on what happened EARLIER. The first
//  request's trace id changes when a second request is prepared; a test
//  that passes alone fails after its neighbour runs. Order-dependent
//  failures always mean shared mutable state, and the only shared thing
//  here is `DEFAULT_OPTIONS`.
//
//  A default parameter is evaluated per call, but `= DEFAULT_OPTIONS` is
//  an evaluation that yields the SAME object every time. Every caller who
//  omitted options is holding the one `headers` record, and
//  `options.headers['x-trace-id'] = traceId` writes into it — permanently,
//  for the life of the process.
//
//  WHY TSC COULD NOT CATCH IT — `Record<string, string>` is a mutable
//  type, so the assignment is legal; and TypeScript has no notion of
//  ownership, aliasing or lifetime. "This object is shared" and "this
//  function may not write to its argument" are both facts about the
//  program's design that no annotation in this file expresses.
//
//  THE FIX — build a new object instead of editing the given one:
//  `{ ...options.headers, 'x-trace-id': traceId }`. The default can now
//  be shared safely because nothing ever writes to it.
//
//  Two ways to make the compiler help: type the parameter
//  `readonly`/`Readonly<RequestOptions>` so a write is an error (08 does
//  exactly this for arrays), or `Object.freeze` the default so the write
//  throws in strict mode instead of succeeding silently. The habit
//  underneath both: a function that takes a value and returns a value
//  should leave its arguments exactly as it found them.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface RequestOptions {
  retries: number;
  headers: Record<string, string>;
}

export interface PreparedRequest {
  url: string;
  retries: number;
  headers: Record<string, string>;
}

export const DEFAULT_OPTIONS: RequestOptions = {
  retries: 2,
  headers: { accept: 'application/json' },
};

export function prepare(
  url: string,
  traceId: string,
  options: RequestOptions = DEFAULT_OPTIONS
): PreparedRequest {
  return {
    url,
    retries: options.retries,
    headers: { ...options.headers, 'x-trace-id': traceId },
  };
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('a prepared request carries the defaults and its own trace', () => {
  const req = prepare('/health', 't1');
  eq(req.url, '/health');
  eq(req.retries, 2);
  eq(req.headers, { accept: 'application/json', 'x-trace-id': 't1' });
});

test('explicit options beat the defaults', () => {
  const req = prepare('/slow', 't2', { retries: 5, headers: {} });
  eq(req.retries, 5);
  eq(req.headers, { 'x-trace-id': 't2' });
});

test('two requests never share a trace id', () => {
  const first = prepare('/a', 'trace-a');
  const second = prepare('/b', 'trace-b');
  eq(first.headers['x-trace-id'], 'trace-a');
  eq(second.headers['x-trace-id'], 'trace-b');
});

test('the module defaults never grow a trace header', () => {
  prepare('/c', 'trace-c');
  eq(DEFAULT_OPTIONS.headers, { accept: 'application/json' });
});

test("a caller's options object comes back untouched", () => {
  const mine: RequestOptions = { retries: 1, headers: { 'x-key': 'k' } };
  prepare('/d', 'trace-d', mine);
  eq(mine.headers, { 'x-key': 'k' });
});

// ──────────────────────────── type tests ─────────────────────────────────
//
//  These already pass — in the broken file and in the fixed one. That is
//  the whole point of the module: the type layer is satisfied either way.

type _t1 = Expect<Equal<ReturnType<typeof prepare>, PreparedRequest>>;

function _typeTests() {
  const req: PreparedRequest = prepare('/x', 't');
  use(req);

  // @ts-expect-error — a trace id is required
  prepare('/x');

  // @ts-expect-error — header values are strings
  prepare('/x', 't', { retries: 1, headers: { n: 1 } });
}
use(_typeTests);
