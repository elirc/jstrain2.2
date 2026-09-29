// ─────────────────────────────────────────────────────────────────────────
//  29 · sorting failures into three buckets — SOLUTION      ★☆☆ warm-up
//  run: node 29-error-taxonomy.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the taxonomy is the interesting part, not the code.
//  Three buckets, three behaviours: retry the blip, explain the user
//  error, alert on the bug — and every branch elsewhere in the service
//  can now ask one question instead of inventing its own rules.
//  `isUserError` calls `isRetryable` first and returns false if it hits,
//  which is what keeps the two categories disjoint and makes 429 fall
//  out correctly: it is a 4xx, but it is the one you are supposed to
//  retry, so retryable wins by construction rather than by a comment.
//  Everything is branched on `instanceof` and on `.code` / `.status` —
//  never on message text, which is the README's rule 8. Messages get
//  reworded; a code does not.
//  `classify` ends in 'bug' by default, which is the right default: an
//  error nobody recognised is not a blip to retry, it is something you
//  did not think about. A thrown string lands there too — it is not an
//  Error, so neither predicate claims it.

import { test, eq, ok } from '../../_lib/check.js';

export function isRetryable(error) {
  if (!(error instanceof Error)) return false;
  if (error instanceof TimeoutError || error instanceof RateLimitError) {
    return true;
  }
  if (typeof error.code === 'string' && RETRYABLE_CODES.has(error.code)) {
    return true;
  }
  const { status } = error;
  if (typeof status !== 'number') return false;
  return status === 429 || (status >= 500 && status <= 599);
}

export function isUserError(error) {
  if (!(error instanceof Error)) return false;
  if (isRetryable(error)) return false;
  if (error instanceof ValidationError || error instanceof NotFoundError) {
    return true;
  }
  const { status } = error;
  return typeof status === 'number' && status >= 400 && status <= 499;
}

export function classify(error) {
  if (isRetryable(error)) return 'retryable';
  if (isUserError(error)) return 'user';
  return 'bug';
}

// ── given: the error family and the socket codes ─────────────────────────

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateLimitError';
    this.status = 429;
  }
}

const RETRYABLE_CODES = new Set(['ECONNRESET', 'ETIMEDOUT']);

// an Error that looks like an HTTP failure
const httpError = (status) =>
  Object.assign(new Error(`HTTP ${status}`), { status });

// ──────────────────────────── tests ──────────────────────────────────────

test('timeouts and rate limits are retryable', () => {
  ok(isRetryable(new TimeoutError('timed out')));
  ok(isRetryable(new RateLimitError('slow down')));
  eq(classify(new TimeoutError('timed out')), 'retryable');
});

test('validation and not-found are user errors, and never retried', () => {
  ok(isUserError(new ValidationError('email must contain @')));
  ok(isUserError(new NotFoundError('user 42 not found')));
  eq(isRetryable(new ValidationError('nope')), false);
  eq(classify(new NotFoundError('gone')), 'user');
});

test('5xx is retryable, a plain 4xx is not', () => {
  eq(classify(httpError(503)), 'retryable');
  eq(classify(httpError(400)), 'user');
  eq(isRetryable(httpError(404)), false);
});

test('429 is the exception — retryable even though it is a 4xx', () => {
  eq(classify(httpError(429)), 'retryable');
  eq(isUserError(httpError(429)), false);
});

test('socket codes are retryable', () => {
  const dropped = Object.assign(new Error('socket hang up'), {
    code: 'ECONNRESET',
  });
  ok(isRetryable(dropped));
  ok(RETRYABLE_CODES.has(dropped.code));
});

test('anything unrecognised is a bug', () => {
  eq(classify(new TypeError('x.map is not a function')), 'bug');
  eq(classify(new Error('boom')), 'bug');
  eq(classify('just a string'), 'bug');
});

test('nothing is ever both retryable and a user error', () => {
  const samples = [
    new TimeoutError('t'),
    new RateLimitError('r'),
    new ValidationError('v'),
    new NotFoundError('n'),
    httpError(429),
    httpError(404),
    httpError(500),
    new TypeError('bug'),
  ];
  for (const error of samples) {
    ok(!(isRetryable(error) && isUserError(error)), error.message);
  }
});
