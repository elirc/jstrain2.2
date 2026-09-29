// ─────────────────────────────────────────────────────────────────────────
//  05 · wrap with cause                                       ★★☆ core
//  concepts: error cause · wrapping · chains
//  run: node 05-wrap-with-cause.js
// ─────────────────────────────────────────────────────────────────────────
//
//  'ECONNREFUSED' is true but useless. "saving the invoice failed" is
//  useful but hides the truth. You want both, so add context on the way
//  up WITHOUT throwing the original away — that is what `cause` is for.
//
//    wrap(error, message)  → a new Error whose .cause is the original
//        wrap(new Error('ECONNREFUSED'), 'db write failed')
//            .message → 'db write failed'
//            .cause   → the original error object
//
//    rootCause(error)      → the deepest error in the chain
//    causeChain(error)     → the messages, outermost first
//        causeChain(outer) → ['saving failed', 'db write failed',
//                             'ECONNREFUSED']
//
//  hint: `new Error(msg, { cause: err })` — the second argument is an
//  options object, not a second string.

import { test, eq, ok } from '../../_lib/check.js';

export function wrap(error, message) {
  throw new Error('TODO');
}

export function rootCause(error) {
  throw new Error('TODO');
}

export function causeChain(error) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('wrap makes a new error carrying your message', () => {
  const wrapped = wrap(new Error('ECONNREFUSED'), 'db write failed');
  ok(wrapped instanceof Error);
  eq(wrapped.message, 'db write failed');
});

test('the original error is kept as .cause', () => {
  const original = new Error('ECONNREFUSED');
  ok(wrap(original, 'db write failed').cause === original);
});

test('wrapping does not touch the original error', () => {
  const original = new Error('ECONNREFUSED');
  wrap(original, 'db write failed');
  eq(original.message, 'ECONNREFUSED');
  eq(original.cause, undefined);
});

test('rootCause digs to the bottom of a chain', () => {
  const root = new Error('ECONNREFUSED');
  const outer = wrap(wrap(root, 'db write failed'), 'saving failed');
  ok(rootCause(outer) === root);
});

test('rootCause of an unwrapped error is that error', () => {
  const lonely = new Error('nothing below me');
  ok(rootCause(lonely) === lonely);
});

test('causeChain lists the messages outermost first', () => {
  const outer = wrap(
    wrap(new Error('ECONNREFUSED'), 'db write failed'),
    'saving failed'
  );
  eq(causeChain(outer), [
    'saving failed',
    'db write failed',
    'ECONNREFUSED',
  ]);
});

test('causeChain of a single error is one message', () => {
  eq(causeChain(new Error('alone')), ['alone']);
});
