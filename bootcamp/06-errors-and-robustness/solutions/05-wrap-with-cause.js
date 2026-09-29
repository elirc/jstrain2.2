// ─────────────────────────────────────────────────────────────────────────
//  05 · wrap with cause — SOLUTION                            ★★☆ core
//  run: node 05-wrap-with-cause.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `new Error(message, { cause })` is standard since ES2022
//  and Node prints the chain for you when an error goes unhandled. Each
//  layer adds the context only it knows ("saving invoice 91 failed") and
//  passes the layer below along untouched, so the log reads like a story
//  from intent down to the syscall.
//  Both walkers are the same loop — follow `.cause` until there isn't
//  one. Guard with `instanceof Error`, because `cause` can be any value.
//  Classic wrong turn: `new Error(msg + ': ' + err.message)`. The text
//  survives; the stack, the type and the `.code` do not.

import { test, eq, ok } from '../../_lib/check.js';

export function wrap(error, message) {
  return new Error(message, { cause: error });
}

export function rootCause(error) {
  let current = error;
  while (current instanceof Error && current.cause !== undefined) {
    current = current.cause;
  }
  return current;
}

export function causeChain(error) {
  const messages = [];
  let current = error;
  while (current instanceof Error) {
    messages.push(current.message);
    current = current.cause;
  }
  return messages;
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
