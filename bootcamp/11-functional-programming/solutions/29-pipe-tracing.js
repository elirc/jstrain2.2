// ─────────────────────────────────────────────────────────────────────────
//  29 · a pipeline you can watch — SOLUTION                  ★★☆ core
//  run: node 29-pipe-tracing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `tap` is the smallest useful combinator there is — run a
//  side effect, return the value untouched — and it exists precisely so
//  that an effect can sit in the middle of a pipeline without becoming
//  part of it. Note it ignores the logger's return value; the moment tap
//  passes it on, it is not a tap any more.
//  `tracePipe` is the ordinary pipe reduce with a tap wrapped around each
//  step's result. Because the logger arrives as an ARGUMENT, the pipeline
//  stays pure-ish and completely testable: production passes
//  `console.log`, the tests pass a spy, and nobody has to read stdout.
//  `fn.name` gives you the label for free for named steps and '' for an
//  arrow written inline at the call site, so the positional fallback is
//  what makes the log readable in the case you actually hit while
//  debugging.
//  Classic wrong turn: logging the value BEFORE each step instead of
//  after. The trace then never shows you the final answer, and every line
//  is off by one when you go looking for the step that broke it.

import { test, eq, spy } from '../../_lib/check.js';

const trimCode = (s) => s.trim();
const stripDashes = (s) => s.split('-').join('');
const toUpper = (s) => s.toUpperCase();

export function tap(logger, label) {
  return (value) => {
    logger({ label, value });
    return value;
  };
}

export function tracePipe(logger, ...steps) {
  return (input) =>
    steps.reduce((value, step, i) => {
      const label = step.name || `step ${i + 1}`;
      return tap(logger, label)(step(value));
    }, input);
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
