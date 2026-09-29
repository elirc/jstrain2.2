// ─────────────────────────────────────────────────────────────────────────
//  09 · the log that stores everyone's password — SOLUTION     ★★☆ core
//  concepts: security · sensitive data exposure · allowlisting
//  run: node 09-secrets-in-logs.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Vulnerability: sensitive data exposure through logging — and
//  underneath it, the denylist mistake. `{ ...req }` copies everything
//  the framework attached to the request and the loop then removes the
//  two secrets somebody happened to think of in 2022. `headers` and
//  `body` were never on the list, so the bearer token, the session
//  cookie, the customer's e-mail and their card number all rode along.
//  The tell: a spread of an object you did not build, followed by
//  `delete`. Copy-then-subtract keeps whatever you failed to name; the
//  set of things you failed to name grows every sprint, without a diff
//  anyone reviews.
//  The minimal fix: turn the list around. Name what may be logged and
//  build the line out of those fields only:
//      const LOGGABLE = ['method','path','status','durationMs','userId'];
//      const entry = {};
//      for (const key of LOGGABLE) if (key in req) entry[key] = req[key];
//      return entry;
//  Now a new request field defaults to invisible, which is the safe
//  default, and the `Object.keys` test becomes a real contract: adding
//  a field to the log is a deliberate edit to one array.
//  Note the shallow-copy trap too — even an allowlisted object field
//  would carry its whole subtree. Log scalars, or project nested values
//  explicitly.
//  In the wild: request loggers, error reporters (the exception object
//  holds the arguments that caused it), analytics events, and support
//  tooling that renders "the raw payload". Logs are usually the least
//  protected copy of your data and the one that lives longest.

import { test, eq, ok } from '../../_lib/check.js';

const LOGGABLE = ['method', 'path', 'status', 'durationMs', 'userId'];

export function logLine(req) {
  const entry = {};
  for (const key of LOGGABLE) {
    if (key in req) entry[key] = req[key];
  }
  return entry;
}

// ─── a request as the framework hands it over ─────────────────────────────

const request = () => ({
  method: 'POST',
  path: '/api/checkout',
  status: 201,
  durationMs: 42,
  userId: 'u_1042',
  password: 'hunter2',
  headers: {
    authorization: 'Bearer sk_live_9f3c1d',
    cookie: 'session=8c4e2a1b',
    'user-agent': 'curl/8.4.0',
  },
  body: {
    email: 'ada@example.com',
    card: { number: '4111111111111111', cvc: '737' },
  },
});

// ──────────────────────────── tests ──────────────────────────────────────

test('keeps the operational fields', () => {
  const line = logLine(request());
  eq(line.method, 'POST');
  eq(line.path, '/api/checkout');
  eq(line.status, 201);
  eq(line.durationMs, 42);
  eq(line.userId, 'u_1042');
});

test('drops a top-level password field', () => {
  ok(!('password' in logLine(request())));
});

test('does not log the Authorization header or the session cookie', () => {
  const text = JSON.stringify(logLine(request()));
  ok(!text.includes('sk_live_9f3c1d'), 'bearer token reached the log');
  ok(!text.includes('8c4e2a1b'), 'session cookie reached the log');
});

test('does not log anything from the request body', () => {
  const text = JSON.stringify(logLine(request()));
  ok(!text.includes('4111111111111111'), 'card number reached the log');
  ok(!text.includes('ada@example.com'), 'customer e-mail reached the log');
});

test('the line has exactly the five allowed fields', () => {
  eq(Object.keys(logLine(request())).sort(), [
    'durationMs',
    'method',
    'path',
    'status',
    'userId',
  ]);
});
