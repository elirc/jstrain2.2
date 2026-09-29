// ─────────────────────────────────────────────────────────────────────────
//  08 · payment adapters — SOLUTION                             ★★☆ core
//  concepts: adapter · anti-corruption layer · one interface
//  run: node solutions/08-adapter-payments.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — translate a foreign interface into the one your code already
//  speaks, so the vendor's vocabulary stops at the boundary.
//  Each adapter does three jobs: rename fields (amount_cents → amountCents),
//  convert units (cents ↔ dollars for PayPal), and normalize outcomes
//  (`paid: true` and `status: 'COMPLETED'` both become `ok: true`). Once
//  that is done the same `settle()` function drives either provider, and
//  swapping vendors is a one-line change in a factory.
//  When NOT to use: don't adapt an API you only call once — the wrapper
//  is pure overhead. And resist "adapters" that add features; an adapter
//  that also retries or caches is really two objects.
//  In the wild: Prisma/Knex database drivers, Passport, `node-fetch`
//  polyfills, every "provider" package in a framework.
//  Classic wrong turn: leaking the vendor object through (`return r`) —
//  now callers read `transactionId` and you are married to PayPal again.

import { test, eq, ok } from '../../_lib/check.js';

// ── the two vendor SDKs (pretend these are node_modules) ──────────────────

const stripeApi = {
  createCharge({ amount_cents, currency, source }) {
    if (source === 'bad_token') return { id: null, paid: false, amount_cents };
    return { id: `ch_${amount_cents}`, paid: true, amount_cents, currency };
  },
  refundCharge(chargeId, amount_cents) {
    return { id: chargeId, refunded: amount_cents, status: 'succeeded' };
  },
};

const paypalApi = {
  doPayment(amountDollars, token) {
    if (token === 'bad_token') return { transactionId: null, status: 'DECLINED' };
    return {
      transactionId: `PP-${Math.round(amountDollars * 100)}`,
      status: 'COMPLETED',
    };
  },
  reversePayment(transactionId, amountDollars) {
    return { transactionId, status: 'REVERSED', amount: amountDollars };
  },
};

export function createStripeAdapter(api) {
  return {
    provider: 'stripe',
    charge({ amountCents, token }) {
      const res = api.createCharge({
        amount_cents: amountCents,
        currency: 'usd',
        source: token,
      });
      return { ok: res.paid === true, id: res.id, amountCents: res.amount_cents };
    },
    refund(id, amountCents) {
      const res = api.refundCharge(id, amountCents);
      return {
        ok: res.status === 'succeeded',
        id: res.id,
        amountCents: res.refunded,
      };
    },
  };
}

export function createPaypalAdapter(api) {
  return {
    provider: 'paypal',
    charge({ amountCents, token }) {
      const res = api.doPayment(amountCents / 100, token);
      return {
        ok: res.status === 'COMPLETED',
        id: res.transactionId,
        amountCents,
      };
    },
    refund(id, amountCents) {
      const res = api.reversePayment(id, amountCents / 100);
      return {
        ok: res.status === 'REVERSED',
        id: res.transactionId,
        amountCents: Math.round(res.amount * 100),
      };
    },
  };
}

const PROVIDERS = [
  { name: 'stripe', make: () => createStripeAdapter(stripeApi), id: 'ch_2500' },
  { name: 'paypal', make: () => createPaypalAdapter(paypalApi), id: 'PP-2500' },
];

// checkout-level code: written once, works with any adapter
const settle = (adapter) => {
  const charged = adapter.charge({ amountCents: 2500, token: 'tok_ok' });
  const refunded = adapter.refund(charged.id, 1000);
  return { charged, refunded };
};

// ──────────────────────────── tests ──────────────────────────────────────

for (const provider of PROVIDERS) {
  test(`${provider.name}: charges and normalizes the receipt`, () => {
    eq(provider.make().charge({ amountCents: 2500, token: 'tok_ok' }), {
      ok: true,
      id: provider.id,
      amountCents: 2500,
    });
  });

  test(`${provider.name}: a declined card is ok:false, not a throw`, () => {
    const receipt = provider.make().charge({ amountCents: 2500, token: 'bad_token' });
    eq(receipt.ok, false);
    eq(receipt.id, null);
  });

  test(`${provider.name}: refunds a partial amount in cents`, () => {
    eq(provider.make().refund(provider.id, 1000), {
      ok: true,
      id: provider.id,
      amountCents: 1000,
    });
  });
}

test('both adapters expose the same interface', () => {
  for (const provider of PROVIDERS) {
    const adapter = provider.make();
    eq(adapter.provider, provider.name);
    ok(typeof adapter.charge === 'function');
    ok(typeof adapter.refund === 'function');
  }
});

test('caller code is identical for both providers', () => {
  const [stripe, paypal] = PROVIDERS.map((p) => settle(p.make()));
  eq(stripe.charged.amountCents, paypal.charged.amountCents);
  eq(stripe.refunded.amountCents, paypal.refunded.amountCents);
  eq([stripe.charged.ok, stripe.refunded.ok], [true, true]);
  eq([paypal.charged.ok, paypal.refunded.ok], [true, true]);
});
