// quote.js — the public entry point: price a cart for a zone.
//
// quoteCents(items, zone) = base + perKg × weight, as integer cents.
// Unknown zones are rateFor's problem — it throws, we don't re-check.

import { rateFor } from './rates.js';
import { totalKg } from './cart.js';

export function quoteCents(items, zone) {
  const rate = rateFor(zone);
  const kg = totalKg(items);
  return Math.round(rate.baseCents + rate.perKgCents * kg);
}
