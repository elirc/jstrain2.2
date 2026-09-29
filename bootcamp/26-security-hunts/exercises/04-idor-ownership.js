// ─────────────────────────────────────────────────────────────────────────
//  04 · reading someone else's invoice                       ★★☆ core
//  concepts: security · access control · IDOR
//  run: node 04-idor-ownership.js
// ─────────────────────────────────────────────────────────────────────────
//
//  getInvoice(store, userId, invoiceId) backs GET /invoices/:id. It must
//  return the invoice ONLY when it belongs to the requesting user, and
//  throw 'not found' otherwise — the SAME error whether the id is
//  unknown or simply not yours (leaking "exists, but not yours" is its
//  own bug):
//
//      getInvoice(store, 'ada',   'inv-1')  → the invoice (Ada owns it)
//      getInvoice(store, 'mallory','inv-1') → throws 'not found'
//
//  A user changed the id in the URL from their own to the next number
//  and read a stranger's invoice.
//
//  The code below is fully written — and a security hole. 2 tests fail:
//  they fetch another user's id. Find the flaw and fix it with the
//  smallest change. Don't leak whether the id exists.
//
//  hint: authentication is "who are you"; authorization is "may YOU have
//  THIS". The function knows the userId. Trace every path that returns
//  an invoice and ask: was ownership checked on that path?

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
  if (!invoice) throw new Error(`not found: ${invoiceId}`);
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
