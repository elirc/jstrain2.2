// rates.js — shipping rate table, one row per delivery zone.
//
// rateFor(zone) looks up the pricing row for a zone and THROWS on a
// zone we don't ship to — callers rely on that and skip their own
// validation.

const TABLE = {
  domestic: { baseCents: 500, perKgCents: 120 },
  europe: { baseCents: 900, perKgCents: 260 },
  remote: { baseCents: 2200, perKgCents: 640 },
};

export function rateFor(zone) {
  return TABLE[zone];
}

export function zones() {
  return Object.keys(TABLE);
}
