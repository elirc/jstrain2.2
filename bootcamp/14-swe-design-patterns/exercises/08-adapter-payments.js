// ─────────────────────────────────────────────────────────────────────────
//  08 · payment adapters                                        ★★☆ core
//  concepts: adapter · anti-corruption layer · one interface
//  run: node exercises/08-adapter-payments.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two payment SDKs, two completely different vocabularies (below, as
//  given). Your checkout code must not learn either one. Write an
//  adapter per provider so both speak this interface:
//
//      adapter.provider                          → 'stripe' | 'paypal'
//      adapter.charge({ amountCents, token })    → { ok, id, amountCents }
//      adapter.refund(id, amountCents)           → { ok, id, amountCents }
//
//      const pay = { amountCents: 2500, token: 't' };
//      createStripeAdapter(stripeApi).charge(pay)
//        → { ok: true, id: 'ch_2500', amountCents: 2500 }
//      createPaypalAdapter(paypalApi).charge(pay)
//        → { ok: true, id: 'PP-2500', amountCents: 2500 }
//
//  Money is cents everywhere in our code; PayPal speaks dollars, so the
//  adapter converts at the boundary — and converts back on the way out.
//  A declined card must come back as `ok: false`, never as a throw.
//
//  hint: the same test suite runs against both adapters below; if you
//  find yourself needing an `if (provider === ...)` you have leaked

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
  throw new Error('TODO');
}

export function createPaypalAdapter(api) {
  throw new Error('TODO');
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
