// ─────────────────────────────────────────────────────────────────────────
//  06 · layered propagation                                 ★★★ stretch
//  concepts: layering · cause · user-safe messages
//  run: node 06-layered-propagation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three layers, three different jobs when things go wrong:
//
//    findUserRow(id)   repository — talks to the db. A missing row is a
//                      NotFoundError. A db failure is NOT its problem:
//                      let it through untouched.
//    getUser(id)       service — returns { id, name } (no email!). Any
//                      failure below is rethrown as a ServiceError
//                      'could not load user <id>' with the original as
//                      its cause.
//    handleGetUser(id) handler — NEVER throws. Returns { status, body }:
//                        found            → { status: 200, body: user }
//                        NotFoundError    → 404, body { error: message }
//                        anything else    → 500, body { error:
//                                           'internal error' }
//
//      handleGetUser(1)  → { status: 200, body: { id: 1, name: 'Ada' } }
//      handleGetUser(9)  → { status: 404, body: { error:
//                            'user 9 not found' } }
//      handleGetUser(66) → { status: 500, body: { error:
//                            'internal error' } }
//
//  hint: only the handler knows about HTTP — walk `.cause` down to find
//  out what actually went wrong before you pick a status code.

import { test, eq, ok } from '../../_lib/check.js';

export function findUserRow(id) {
  throw new Error('TODO');
}

export function getUser(id) {
  throw new Error('TODO');
}

export function handleGetUser(id) {
  throw new Error('TODO');
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
