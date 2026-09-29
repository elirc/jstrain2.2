// ─────────────────────────────────────────────────────────────────────────
//  29 · a pipeline you can watch                             ★★☆ core
//  concepts: composition · tap · dependency injection
//  run: node 29-pipe-tracing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The cost of `pipe(a, b, c)` is that when the answer is wrong you cannot
//  see where it went wrong — there are no intermediate variables to print.
//  Fix that without breaking purity: pass the logger IN, and log between
//  the steps. Injecting it keeps the pipeline testable, because a spy is a
//  perfectly good logger.
//
//      tap(logger, label)      → (value) => value, having logged it
//
//      const normalise = tracePipe(logger, trimCode, stripDashes, toUpper);
//      normalise('  ab-cd ')   → 'ABCD'
//      logger saw, in order:
//          { label: 'trimCode',    value: 'ab-cd' }
//          { label: 'stripDashes', value: 'abcd' }
//          { label: 'toUpper',     value: 'ABCD' }
//
//  Each entry is one object: the label, and the value AFTER that step ran.
//  The label is the step function's own name; a function with no name is
//  labelled by position — 'step 1', 'step 2', ... Building the pipeline
//  must log nothing, and whatever the logger returns is ignored.
//
//  hint: `fn.name` is '' for an arrow passed straight in as an argument.

import { test, eq, spy } from '../../_lib/check.js';

const trimCode = (s) => s.trim();
const stripDashes = (s) => s.split('-').join('');
const toUpper = (s) => s.toUpperCase();

export function tap(logger, label) {
  throw new Error('TODO');
}

export function tracePipe(logger, ...steps) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('tap logs a value and hands it straight back', () => {
  const logger = spy();
  eq(tap(logger, 'raw')(' ab '), ' ab ');
  eq(logger.callCount, 1);
  eq(logger.calls[0][0], { label: 'raw', value: ' ab ' });
});

test('a traced pipeline answers exactly like a plain pipe', () => {
  const normalise = tracePipe(spy(), trimCode, stripDashes, toUpper);
  eq(normalise('  ab-cd '), 'ABCD');
});

test('it logs one entry per step', () => {
  const logger = spy();
  tracePipe(logger, trimCode, stripDashes, toUpper)('  ab-cd ');
  eq(logger.callCount, 3);
});

test('each entry names its step and carries the value after it', () => {
  const logger = spy();
  tracePipe(logger, trimCode, stripDashes, toUpper)('  ab-cd ');
  eq(logger.calls.map((call) => call[0]), [
    { label: 'trimCode', value: 'ab-cd' },
    { label: 'stripDashes', value: 'abcd' },
    { label: 'toUpper', value: 'ABCD' },
  ]);
});

test('building the pipeline logs nothing', () => {
  const logger = spy();
  tracePipe(logger, trimCode, toUpper);
  eq(logger.callCount, 0, 'nothing has run yet');
});

test('a nameless step is labelled by its position', () => {
  const logger = spy();
  tracePipe(logger, trimCode, (s) => `${s}!`)('  hi ');
  eq(logger.calls[1][0], { label: 'step 2', value: 'hi!' });
});

test('what the logger returns is ignored', () => {
  const hijack = spy(() => 'LOGGED');
  eq(tracePipe(hijack, trimCode, toUpper)(' ab '), 'AB');
  eq(tap(hijack, 'x')(7), 7);
});

test('a pipeline with no steps returns the input and logs nothing', () => {
  const logger = spy();
  eq(tracePipe(logger)('untouched'), 'untouched');
  eq(logger.callCount, 0);
});
