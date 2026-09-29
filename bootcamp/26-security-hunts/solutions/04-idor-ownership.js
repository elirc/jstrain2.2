// ─────────────────────────────────────────────────────────────────────────
//  04 · reading someone else's invoice — SOLUTION            ★★☆ core
//  concepts: security · access control · IDOR
//  run: node 04-idor-ownership.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Vulnerability: IDOR — Insecure Direct Object Reference. The handler
//  authenticated the user (it HAD userId) but never AUTHORIZED the
//  access: it looked the invoice up by id and returned it to anyone.
//  Change the id in the URL, read anyone's data.
//  The tell: a lookup by a user-supplied id that returns the record
//  without ever comparing it to the caller's identity. Authentication
//  and authorization are different checks; having userId in scope is
//  not the same as USING it.
//  The minimal fix: after fetching, verify ownership — and fail with
//  the SAME error as "unknown", so you don't leak which ids exist:
//      if (!invoice || invoice.ownerId !== userId)
//        throw new Error(`not found: ${invoiceId}`);
//  Collapsing the two failures into one message closes the enumeration
//  side channel (a different error for "exists but not yours" hands an
//  attacker a yes/no oracle over every id).
//  In the wild: /orders/1002, ?account=..., a signed URL reused across
//  users, GraphQL node(id:). The rule: authorize every object access
//  against the caller, at the data layer, on every path.

import { test, eq, throws } from '../../_lib/check.js';

function makeStore() {
  return {
    invoices: new Map([
      ['inv-1', { id: 'inv-1', ownerId: 'ada', cents: 12000 }],
      ['inv-2', { id: 'inv-2', ownerId: 'grace', cents: 8000 }],
    ]),
  };
}

export function getInvoice(store, userId, invoiceId) {
  const invoice = store.invoices.get(invoiceId);
  if (!invoice || invoice.ownerId !== userId) {
    throw new Error(`not found: ${invoiceId}`);
  }
  return invoice;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the owner can read their own invoice', () => {
  const store = makeStore();
  eq(getInvoice(store, 'ada', 'inv-1').cents, 12000);
});

test('a stranger cannot read an invoice they do not own', () => {
  const store = makeStore();
  throws(() => getInvoice(store, 'mallory', 'inv-1'), 'not found');
});

test('one user cannot read another real user\'s invoice', () => {
  const store = makeStore();
  throws(() => getInvoice(store, 'ada', 'inv-2'), 'not found');
});

test('an unknown id and a not-yours id fail identically', () => {
  const store = makeStore();
  let unknown, notYours;
  try { getInvoice(store, 'ada', 'inv-999'); } catch (e) { unknown = e.message; }
  try { getInvoice(store, 'ada', 'inv-2'); } catch (e) { notYours = e.message; }
  eq(unknown.replace('inv-999', 'ID'), notYours.replace('inv-2', 'ID'));
});
