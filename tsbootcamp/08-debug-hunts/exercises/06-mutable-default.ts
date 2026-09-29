// ─────────────────────────────────────────────────────────────────────────
//  06 · the default that remembers                         ★★☆ core
//  concepts: shared references · default parameters · accidental mutation
//  run: node ../run.js exercises/06-mutable-default.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `prepare` stamps an outgoing request with its own trace id. Callers
//  that pass no options get the module defaults. Two rules the tests care
//  about, both about ownership:
//
//      • a prepared request carries exactly ONE trace id — its own
//      • preparing a request changes nothing the caller can still see:
//        not DEFAULT_OPTIONS, not the options object handed in
//
//      prepare('/a', 't1').headers
//            → { accept: 'application/json', 'x-trace-id': 't1' }
//      prepare('/b', 't2').headers['x-trace-id']       → 't2'
//      DEFAULT_OPTIONS.headers                → still just { accept: … }
//
//  tsc is quiet. Three tests are not. One line is doing something to a
//  value it does not own; find it and make the smallest fix.
//
//  hint: the failing tests all inspect something AFTER a call that was
//  supposed to be finished with it. Ask which objects in this file exist
//  exactly once for the lifetime of the module.

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
  options.headers['x-trace-id'] = traceId;
  return { url, retries: options.retries, headers: options.headers };
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
