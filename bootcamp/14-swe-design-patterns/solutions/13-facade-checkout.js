// ─────────────────────────────────────────────────────────────────────────
//  13 · checkout facade — SOLUTION                              ★★☆ core
//  concepts: facade · orchestration · compensating actions
//  run: node solutions/13-facade-checkout.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — one simple entry point in front of a subsystem that is only
//  hard because it has a correct order and a correct cleanup.
//  The value is not "fewer imports"; it is that the *compensating*
//  actions live in exactly one place. Every caller who hand-rolled this
//  flow forgot to release stock on a declined card, and stock quietly
//  bled away. Note the facade adds no new behaviour of its own — it
//  sequences, converts failures into one result shape, and returns.
//  When NOT to use: a facade that grows a parameter per caller ("also
//  skip email if…") has become a god object. Split it before it does.
//  In the wild: `fetch` over XHR/streams, Prisma over SQL + pooling,
//  `git pull` over fetch+merge, any `/api/checkout` endpoint.
//  Classic wrong turn: throwing from inside for business failures. Out
//  of stock is not exceptional — it is one of the expected answers.

import { test, eq, spy } from '../../_lib/check.js';

export function createCheckoutFacade({ inventory, payments, shipping, email }) {
  return {
    place({ userId, items, card, address }) {
      const reserved = [];
      for (const item of items) {
        if (!inventory.reserve(item.sku, item.qty)) {
          for (const done of reserved) inventory.release(done.sku, done.qty);
          return { ok: false, reason: 'out-of-stock', sku: item.sku };
        }
        reserved.push(item);
      }

      const amountCents = items.reduce(
        (sum, item) => sum + item.priceCents * item.qty,
        0
      );
      const payment = payments.charge(amountCents, card);
      if (!payment.ok) {
        for (const done of reserved) inventory.release(done.sku, done.qty);
        return { ok: false, reason: 'payment-declined' };
      }

      const { label } = shipping.schedule(address, items);
      email.send(userId, `Order confirmed: ${label}`);
      return { ok: true, chargeId: payment.id, label, amountCents };
    },
  };
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
