// ─────────────────────────────────────────────────────────────────────────
//  29 · composable business rules                             ★★★ stretch
//  concepts: specification · boolean composition · rules as values
//  run: node exercises/29-specification-rules.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "Free shipping goes to paid orders over $100 shipping inside North
//  America." Next sprint it is "...unless the order was refunded". Write
//  that as a predicate and every variation forks a new function.
//
//  Make one rule a value that other rules can be built from:
//
//      const paid = spec('paid', (o) => o.status === 'paid');
//      const big  = spec('over $100', (o) => o.totalCents >= 10000);
//
//      paid.isSatisfiedBy(order)     → true | false
//      paid.and(big)                 → a new spec, both must hold
//      paid.or(big)  /  paid.not()   → the other two combinators
//      paid.and(big).describe()      → '(paid AND over $100)'
//      paid.and(big).not().describe()→ 'NOT (paid AND over $100)'
//
//  Then `findAll(orders, spec)` filters with any of them.
//
//  Combining must never modify the parts — `paid` still means `paid`
//  after you build ten rules out of it — and `and`/`or` must
//  short-circuit, because a rule may hit the database.
//
//  hint: every combinator returns `spec(newName, newPredicate)`; the
//  new predicate closes over the two it combines

import { test, eq, ok, spy } from '../../_lib/check.js';

export function spec(name, predicate) {
  // -> { isSatisfiedBy(item), and(other), or(other), not(), describe() }
  throw new Error('TODO');
}

export function findAll(items, specification) {
  throw new Error('TODO');
}

const ORDERS = [
  { id: 'A-1', totalCents: 12000, status: 'paid', country: 'US' },
  { id: 'A-2', totalCents: 4500, status: 'paid', country: 'CA' },
  { id: 'A-3', totalCents: 30000, status: 'pending', country: 'US' },
  { id: 'A-4', totalCents: 9900, status: 'refunded', country: 'DE' },
];

const paid = () => spec('paid', (o) => o.status === 'paid');
const big = () => spec('over $100', (o) => o.totalCents >= 10000);
const domestic = () => spec('US', (o) => o.country === 'US');
const ids = (orders) => orders.map((order) => order.id);

// ──────────────────────────── tests ──────────────────────────────────────

test('a leaf spec answers exactly one question', () => {
  const rule = paid();
  eq(rule.isSatisfiedBy(ORDERS[0]), true);
  eq(rule.isSatisfiedBy(ORDERS[2]), false);
  eq(rule.describe(), 'paid');
});

test('and requires both, or accepts either', () => {
  const both = paid().and(big());
  eq(both.isSatisfiedBy(ORDERS[0]), true);
  eq(both.isSatisfiedBy(ORDERS[1]), false);

  const either = paid().or(big());
  eq(either.isSatisfiedBy(ORDERS[1]), true);
  eq(either.isSatisfiedBy(ORDERS[2]), true);
  eq(either.isSatisfiedBy(ORDERS[3]), false);
});

test('not inverts, and De Morgan still holds', () => {
  const notBoth = paid().and(big()).not();
  const eitherNot = paid().not().or(big().not());
  eq(ids(findAll(ORDERS, notBoth)), ['A-2', 'A-3', 'A-4']);
  eq(ids(findAll(ORDERS, notBoth)), ids(findAll(ORDERS, eitherNot)));
});

test('describe spells the composite rule back to you', () => {
  eq(paid().and(big()).describe(), '(paid AND over $100)');
  eq(paid().and(big()).not().describe(), 'NOT (paid AND over $100)');
  eq(paid().or(big().and(domestic())).describe(), '(paid OR (over $100 AND US))');
});

test('findAll keeps the items that satisfy the rule', () => {
  eq(ids(findAll(ORDERS, paid())), ['A-1', 'A-2']);
  eq(findAll(ORDERS, spec('nobody', () => false)), []);
  eq(findAll(ORDERS, spec('everybody', () => true)).length, 4);
});

test('combining builds a new rule and leaves the parts alone', () => {
  const rule = paid();
  const combined = rule.and(big());
  ok(combined !== rule);
  eq(rule.describe(), 'paid');
  eq(rule.isSatisfiedBy(ORDERS[1]), true);
  eq(combined.isSatisfiedBy(ORDERS[1]), false);
});

test('and/or short-circuit, because a rule can be expensive', () => {
  const rightAnd = spy(() => true);
  const cheapNo = spec('never', () => false).and(spec('slow', rightAnd));
  eq(cheapNo.isSatisfiedBy(ORDERS[0]), false);
  eq(rightAnd.callCount, 0);

  const rightOr = spy(() => true);
  const cheapYes = spec('always', () => true).or(spec('slow', rightOr));
  eq(cheapYes.isSatisfiedBy(ORDERS[0]), true);
  eq(rightOr.callCount, 0);
});

test('a requirement reads like the sentence somebody asked for', () => {
  const northAmerica = domestic().or(spec('CA', (o) => o.country === 'CA'));
  const freeShipping = paid().and(big()).and(northAmerica);
  eq(freeShipping.describe(), '((paid AND over $100) AND (US OR CA))');
  eq(ids(findAll(ORDERS, freeShipping)), ['A-1']);
});
