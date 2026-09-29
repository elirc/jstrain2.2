// ─────────────────────────────────────────────────────────────────────────
//  29 · sorting failures into three buckets                 ★☆☆ warm-up
//  concepts: classification · instanceof · codes and statuses
//  run: node 29-error-taxonomy.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every error your service catches is one of three things, and the
//  three want opposite treatment: a RETRYABLE blip (try again), a USER
//  error (tell them what to fix, never retry), or a BUG (page someone,
//  and never show the message to a stranger). Write the sorter once so
//  the retry loop, the HTTP layer and the alerting all agree.
//
//    isRetryable(error)   TimeoutError, RateLimitError,
//                         a .code of ECONNRESET or ETIMEDOUT,
//                         or a .status of 429 or 500-599
//    isUserError(error)   ValidationError, NotFoundError,
//                         or a .status of 400-499
//    classify(error)      'retryable' | 'user' | 'bug'
//
//  A TypeError, a plain Error and a thrown string are all bugs — yours.
//  And nothing may ever be both retryable and a user error.
//
//  hint: 429 is a 4xx that you SHOULD retry, so the order of the two
//  checks decides the answer.

import { test, eq, ok } from '../../_lib/check.js';

export function isRetryable(error) {
  throw new Error('TODO');
}

export function isUserError(error) {
  throw new Error('TODO');
}

export function classify(error) {
  throw new Error('TODO');
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
