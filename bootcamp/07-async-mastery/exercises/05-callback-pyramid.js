// ─────────────────────────────────────────────────────────────────────────
//  05 · loadTotal (the pyramid of doom)                    ★★☆ core
//  concepts: callbacks · error propagation · nesting
//  run: node 05-callback-pyramid.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three callback APIs are given below. Chain them: user → orders →
//  total, and report the total in cents through one callback.
//
//      loadTotal('u1', (err, cents) => ...)   → null, 750
//      loadTotal('u2', (err, cents) => ...)   → null, 0    (no orders)
//      loadTotal('zz', (err, cents) => ...)   → Error('no user zz')
//
//  Rules: any step's error goes straight to YOUR callback, the later
//  steps must not run, and the callback fires exactly once. Feel the
//  indentation grow — this pain is why promises exist.
//
//  hint: `if (err) { cb(err); return; }` at the top of every step

import { test, eq, ok, spy, sleep } from '../../_lib/check.js';

const USERS = { u1: { id: 'u1', name: 'Ada' }, u2: { id: 'u2', name: 'Bo' } };
const ORDERS = { u1: [{ cents: 500 }, { cents: 250 }] };

export function getUser(id, cb) {
  setTimeout(() => {
    if (!USERS[id]) {
      cb(new Error(`no user ${id}`));
      return;
    }
    cb(null, USERS[id]);
  }, 5);
}

export function getOrders(userId, cb) {
  setTimeout(() => cb(null, ORDERS[userId] ?? []), 5);
}

export function getTotalCents(orders, cb) {
  setTimeout(() => {
    if (!Array.isArray(orders)) {
      cb(new TypeError('orders must be an array'));
      return;
    }
    cb(null, orders.reduce((sum, o) => sum + o.cents, 0));
  }, 5);
}

const run = (id) =>
  new Promise((resolve) => loadTotal(id, (err, val) => resolve([err, val])));

export function loadTotal(userId, cb) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('adds up the orders of a known user', async () => {
  eq(await run('u1'), [null, 750]);
});

test('returns 0 for a user with no orders', async () => {
  eq(await run('u2'), [null, 0]);
});

test('propagates an error from the first step', async () => {
  const [err] = await run('zz');
  ok(err instanceof Error);
  ok(err.message.includes('no user zz'), 'keep the original message');
});

test('passes no total when a step fails', async () => {
  const [, val] = await run('zz');
  eq(val, undefined);
});

test('calls the callback exactly once on the error path', async () => {
  const seen = spy();
  await new Promise((resolve) => {
    loadTotal('zz', (...args) => {
      seen(...args);
      resolve();
    });
  });
  await sleep(30);
  eq(seen.callCount, 1);
});
