// ─────────────────────────────────────────────────────────────────────────
//  29 · composable business rules — SOLUTION                   ★★★ stretch
//  concepts: specification · boolean composition · rules as values
//  run: node solutions/29-specification-rules.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — turn a business rule into a first-class value that can be
//  named, passed around, stored, and combined with AND/OR/NOT.
//  A specification is a predicate plus an algebra. That algebra is the
//  whole payoff: the sixteen shipping variants product will ask for are
//  combinations of four named rules, not sixteen functions. And each
//  leaf is testable in isolation — `paid` has one reason to be wrong.
//  Everything is built by returning `spec(newName, newPredicate)`, so
//  the parts are never mutated. Specs are values; a rule that changes
//  when you combine it is the mutable-builder bug of exercise 14 wearing
//  a different hat.
//  `describe()` is not decoration. It is how a rule engine explains
//  itself in a log line or an admin screen — "order rejected by NOT
//  (paid AND over $100)" beats a boolean nobody can trace.
//  Short-circuiting falls out of `&&`/`||` for free, and it matters:
//  the right-hand rule may hit a database or an API.
//  When NOT to use: one or two fixed rules — `orders.filter(o =>
//  o.status === 'paid')` is clearer than a rule object. The pattern also
//  fights you when rules must run in SQL: then you want the spec to
//  build a query fragment, not to evaluate in JS, or you will load the
//  table into memory to filter it.
//  In the wild: NestJS/CASL abilities, Spring Data `Specification` and
//  JPA criteria, Sequelize/Prisma `where` fragments, Stripe Radar rules,
//  OPA/Rego policy composition, LaunchDarkly rule sets.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function spec(name, predicate) {
  const self = {
    describe: () => name,
    isSatisfiedBy: (item) => predicate(item),
    and: (other) =>
      spec(
        `(${name} AND ${other.describe()})`,
        (item) => self.isSatisfiedBy(item) && other.isSatisfiedBy(item)
      ),
    or: (other) =>
      spec(
        `(${name} OR ${other.describe()})`,
        (item) => self.isSatisfiedBy(item) || other.isSatisfiedBy(item)
      ),
    not: () => spec(`NOT ${name}`, (item) => !self.isSatisfiedBy(item)),
  };
  return self;
}

export function findAll(items, specification) {
  return items.filter((item) => specification.isSatisfiedBy(item));
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
