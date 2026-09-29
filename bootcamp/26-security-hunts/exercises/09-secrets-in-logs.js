// ─────────────────────────────────────────────────────────────────────────
//  09 · the log that stores everyone's password               ★★☆ core
//  concepts: security · sensitive data exposure · allowlisting
//  run: node 09-secrets-in-logs.js
// ─────────────────────────────────────────────────────────────────────────
//
//  logLine(req) builds the object the request logger writes for every
//  request. Logs are shipped to a third-party search tool that half the
//  company can read, so the line must contain the five operational
//  fields and NOTHING else:
//
//      method · path · status · durationMs · userId
//
//  A support engineer searching the logs for a customer's order id
//  found the customer's session cookie instead.
//
//  The code below is fully written — and a security hole. 3 tests fail:
//  they search the finished line for things that must never appear in
//  it. Find the flaw and fix it with the smallest change.
//
//  hint: the filter names the secrets it knows about. Every field added
//  to a request between now and forever is a field it has never heard
//  of. Which direction should the list point?

import { test, eq, ok } from '../../_lib/check.js';

const SECRET_KEYS = ['password', 'token'];

export function logLine(req) {
  const entry = { ...req };
  for (const key of SECRET_KEYS) delete entry[key];
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
