// ─────────────────────────────────────────────────────────────────────────
//  13 · checkout facade                                         ★★☆ core
//  concepts: facade · orchestration · compensating actions
//  run: node exercises/13-facade-checkout.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Placing an order today means four subsystems and a correct order of
//  operations, and three different screens get it subtly wrong. Hide the
//  dance behind one call.
//
//      const checkout = createCheckoutFacade({ inventory, payments,
//                                              shipping, email });
//      checkout.place({ userId, items, card, address })
//
//  The subsystems (all injected, so tests can spy on them):
//      inventory.reserve(sku, qty)      → true | false
//      inventory.release(sku, qty)
//      payments.charge(amountCents, card) → { ok, id }
//      shipping.schedule(address, items)  → { label }
//      email.send(to, subject)
//
//  The choreography:
//    1. reserve every item, in order
//       · any refusal → release what you already reserved and return
//         { ok: false, reason: 'out-of-stock', sku }
//    2. charge sum(priceCents × qty)
//       · not ok → release everything, return
//         { ok: false, reason: 'payment-declined' }
//    3. schedule shipping, then email `Order confirmed: <label>`
//    4. return { ok: true, chargeId, label, amountCents }
//
//  hint: the release-on-failure step is the reason this lives in one
//  place — every caller that forgot it leaked stock

import { test, eq, spy } from '../../_lib/check.js';

export function createCheckoutFacade({ inventory, payments, shipping, email }) {
  throw new Error('TODO');
}

const ITEMS = [
  { sku: 'mug', qty: 2, priceCents: 900 },
  { sku: 'tee', qty: 1, priceCents: 2000 },
];

const makeParts = ({ inStock = () => true, paid = true } = {}) => ({
  inventory: { reserve: spy(inStock), release: spy() },
  payments: { charge: spy(() => ({ ok: paid, id: paid ? 'ch_1' : null })) },
  shipping: { schedule: spy(() => ({ label: 'LBL-1' })) },
  email: { send: spy() },
});

const ORDER = { userId: 'ada@x.io', items: ITEMS, card: 'tok', address: '1 Main St' };

// ──────────────────────────── tests ──────────────────────────────────────

test('a good order comes back as one receipt', () => {
  const parts = makeParts();
  eq(createCheckoutFacade(parts).place(ORDER), {
    ok: true,
    chargeId: 'ch_1',
    label: 'LBL-1',
    amountCents: 3800,
  });
});

test('every subsystem is called once, with what it needs', () => {
  const parts = makeParts();
  createCheckoutFacade(parts).place(ORDER);
  eq(parts.inventory.reserve.calls, [['mug', 2], ['tee', 1]]);
  eq(parts.payments.charge.calls, [[3800, 'tok']]);
  eq(parts.shipping.schedule.calls, [['1 Main St', ITEMS]]);
  eq(parts.inventory.release.callCount, 0);
});

test('the confirmation email names the shipping label', () => {
  const parts = makeParts();
  createCheckoutFacade(parts).place(ORDER);
  eq(parts.email.send.calls, [['ada@x.io', 'Order confirmed: LBL-1']]);
});

test('an out-of-stock item names the sku that failed', () => {
  const parts = makeParts({ inStock: (sku) => sku !== 'tee' });
  eq(createCheckoutFacade(parts).place(ORDER), {
    ok: false,
    reason: 'out-of-stock',
    sku: 'tee',
  });
});

test('out of stock releases what was already reserved and charges nothing', () => {
  const parts = makeParts({ inStock: (sku) => sku !== 'tee' });
  createCheckoutFacade(parts).place(ORDER);
  eq(parts.inventory.release.calls, [['mug', 2]]);
  eq(parts.payments.charge.callCount, 0);
  eq(parts.email.send.callCount, 0);
});

test('a declined card releases every reservation', () => {
  const parts = makeParts({ paid: false });
  eq(createCheckoutFacade(parts).place(ORDER), {
    ok: false,
    reason: 'payment-declined',
  });
  eq(parts.inventory.release.calls, [['mug', 2], ['tee', 1]]);
});

test('a declined card ships nothing and emails nobody', () => {
  const parts = makeParts({ paid: false });
  createCheckoutFacade(parts).place(ORDER);
  eq(parts.shipping.schedule.callCount, 0);
  eq(parts.email.send.callCount, 0);
});
