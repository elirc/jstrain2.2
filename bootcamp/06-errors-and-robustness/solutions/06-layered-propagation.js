// ─────────────────────────────────────────────────────────────────────────
//  06 · layered propagation — SOLUTION                      ★★★ stretch
//  run: node 06-layered-propagation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: "throw early, catch late" in three layers.
//  The repository throws the instant reality disagrees with expectation,
//  and deliberately says nothing about connection failures — it has no
//  better information to add, so wrapping them would only add noise.
//  The service adds the one fact it owns (which user this was about) and
//  keeps the original as `cause`, so nothing is lost.
//  The handler is the ONLY place that converts errors into a response.
//  It walks the cause chain to find what actually happened, maps known
//  failures to real status codes, and maps everything else to a blank
//  500 — an unknown error is not safe to show a user.
//  Classic wrong turn: try/catch in every layer that logs and returns
//  null. Then the handler gets `null` and cannot tell "missing" from
//  "broken", so everything is a 500 and nothing is debuggable.

import { test, eq, ok } from '../../_lib/check.js';

export function findUserRow(id) {
  const row = db.findRow(id);
  if (!row) throw new NotFoundError('user', id);
  return row;
}

export function getUser(id) {
  try {
    const row = findUserRow(id);
    return { id: row.id, name: row.name };
  } catch (err) {
    throw new ServiceError(`could not load user ${id}`, { cause: err });
  }
}

export function handleGetUser(id) {
  try {
    return { status: 200, body: getUser(id) };
  } catch (err) {
    let root = err;
    while (root instanceof Error && root.cause !== undefined) {
      root = root.cause;
    }
    if (root instanceof NotFoundError) {
      return { status: 404, body: { error: root.message } };
    }
    return { status: 500, body: { error: 'internal error' } };
  }
}

// ── given: a tiny database and two error types ───────────────────────────

const ROWS = {
  1: { id: 1, name: 'Ada', email: 'ada@lovelace.dev' },
  2: { id: 2, name: 'Grace', email: 'grace@hopper.dev' },
};

export const db = {
  findRow(id) {
    if (id === 66) {
      throw Object.assign(new Error('ECONNREFUSED 127.0.0.1:5432'), {
        code: 'ECONNREFUSED',
      });
    }
    return ROWS[id] ?? null;
  },
};

export class NotFoundError extends Error {
  constructor(entity, id) {
    super(`${entity} ${id} not found`);
    this.name = 'NotFoundError';
    this.entity = entity;
    this.id = id;
  }
}

export class ServiceError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'ServiceError';
  }
}

// returns the error `fn` threw, so a test can inspect it
function thrownBy(fn) {
  try {
    fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TODO') throw err;
    return err;
  }
  throw new Error('expected fn to throw, but it returned');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the handler returns the user on the happy path', () => {
  eq(handleGetUser(1), { status: 200, body: { id: 1, name: 'Ada' } });
});

test('the service does not leak the email column', () => {
  eq(handleGetUser(2).body.email, undefined);
});

test('a missing row becomes a 404 with a useful message', () => {
  eq(handleGetUser(9), { status: 404, body: { error: 'user 9 not found' } });
});

test('a database outage becomes a generic 500', () => {
  eq(handleGetUser(66), {
    status: 500,
    body: { error: 'internal error' },
  });
});

test('the handler never leaks the database error text', () => {
  ok(!JSON.stringify(handleGetUser(66)).includes('ECONNREFUSED'));
});

test('the repository throws NotFoundError carrying the id', () => {
  const err = thrownBy(() => findUserRow(9));
  ok(err instanceof NotFoundError);
  eq(err.id, 9);
});

test('the repository lets database errors through untouched', () => {
  const err = thrownBy(() => findUserRow(66));
  eq(err.code, 'ECONNREFUSED');
  ok(!(err instanceof NotFoundError));
});

test('the service wraps failures but keeps the original as cause', () => {
  const err = thrownBy(() => getUser(9));
  ok(err instanceof ServiceError);
  eq(err.message, 'could not load user 9');
  ok(err.cause instanceof NotFoundError);
});
