// ─────────────────────────────────────────────────────────────────────────
//  05 · loadTotal (the pyramid of doom) — SOLUTION         ★★☆ core
//  run: node 05-callback-pyramid.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: each step nests inside the previous one's callback, so
//  the code drifts right — the "pyramid of doom". Every level repeats
//  the same six characters of error plumbing, and forgetting the
//  `return` after `cb(err)` means the callback fires twice: once with
//  the error, once with a bogus result.
//  That is the real cost of callbacks: error handling is manual, and
//  nothing in the language stops you from getting it wrong. A promise
//  chain does this plumbing for you — a rejection skips every later
//  `.then` automatically and lands in one `.catch`.

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
  getUser(userId, (err, user) => {
    if (err) {
      cb(err);
      return;
    }
    getOrders(user.id, (err2, orders) => {
      if (err2) {
        cb(err2);
        return;
      }
      getTotalCents(orders, (err3, cents) => {
        if (err3) {
          cb(err3);
          return;
        }
        cb(null, cents);
      });
    });
  });
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
