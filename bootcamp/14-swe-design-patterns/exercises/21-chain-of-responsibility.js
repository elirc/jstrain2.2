// ─────────────────────────────────────────────────────────────────────────
//  21 · ticket escalation chain                                  ★★☆ core
//  concepts: chain of responsibility · ordered handlers · escalation
//  run: node exercises/21-chain-of-responsibility.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Support tickets arrive and somebody has to own each one: a bot for
//  password resets, billing for small refunds, tier-2 for the rest,
//  on-call for outages. Nobody should write the `if/else if/else if`
//  tower — each desk decides only "mine or not mine" and passes it on.
//
//  Build handlers and a chain that asks them in order, stopping at the
//  first one that accepts:
//
//      const bot = makeHandler('bot', (t) => t.topic === 'password',
//                              () => 'sent reset link');
//      const chain = createChain([bot, billing, tier2]);
//      chain.handle({ id: 'T-1', topic: 'password', severity: 1 })
//        → { handledBy: 'bot', action: 'sent reset link', tried: ['bot'] }
//
//  `tried` lists every desk that looked at it, the winner included. A
//  ticket nobody accepts falls off the end:
//
//      → { handledBy: null, action: null, tried: ['bot', 'billing', ...] }
//
//  hint: return `null` from a handler to mean "pass it on"; the chain
//  must stop asking the moment something comes back non-null

import { test, eq, spy } from '../../_lib/check.js';

export function makeHandler(name, accepts, act) {
  // -> { name, handle(ticket) -> null | { action } }
  throw new Error('TODO');
}

export function createChain(handlers) {
  // -> { handle(ticket) -> { handledBy, action, tried } }
  throw new Error('TODO');
}

const TICKETS = {
  password: { id: 'T-1', topic: 'password', severity: 1 },
  refund: { id: 'T-2', topic: 'billing', severity: 2, amountCents: 4000 },
  outage: { id: 'T-3', topic: 'outage', severity: 4 },
  weird: { id: 'T-4', topic: 'aliens', severity: 2 },
};

const bot = () =>
  makeHandler('bot', (t) => t.topic === 'password', () => 'sent reset link');
const billing = () =>
  makeHandler(
    'billing',
    (t) => t.topic === 'billing' && t.amountCents <= 5000,
    (t) => `refunded ${t.amountCents}`
  );
const tier2 = () =>
  makeHandler('tier2', (t) => t.severity <= 3, (t) => `queued ${t.id}`);

// ──────────────────────────── tests ──────────────────────────────────────

test('the first desk that accepts owns the ticket', () => {
  const chain = createChain([bot(), billing(), tier2()]);
  eq(chain.handle(TICKETS.password), {
    handledBy: 'bot',
    action: 'sent reset link',
    tried: ['bot'],
  });
});

test('tried lists everyone who looked, in order', () => {
  const chain = createChain([bot(), billing(), tier2()]);
  eq(chain.handle(TICKETS.refund), {
    handledBy: 'billing',
    action: 'refunded 4000',
    tried: ['bot', 'billing'],
  });
});

test('desks after the winner are never asked', () => {
  const later = spy(() => true);
  const chain = createChain([
    bot(),
    makeHandler('tier2', later, () => 'queued'),
  ]);
  eq(chain.handle(TICKETS.password).handledBy, 'bot');
  eq(later.callCount, 0);
});

test('a ticket nobody accepts falls off the end', () => {
  const chain = createChain([bot(), billing()]);
  eq(chain.handle(TICKETS.weird), {
    handledBy: null,
    action: null,
    tried: ['bot', 'billing'],
  });
});

test('a catch-all at the end stops anything falling through', () => {
  const chain = createChain([
    bot(),
    billing(),
    makeHandler('oncall', () => true, (t) => `paged for ${t.id}`),
  ]);
  eq(chain.handle(TICKETS.outage).handledBy, 'oncall');
  eq(chain.handle(TICKETS.weird).action, 'paged for T-4');
});

test('order is the policy: swapping two desks changes the owner', () => {
  const first = createChain([billing(), tier2()]);
  const second = createChain([tier2(), billing()]);
  eq(first.handle(TICKETS.refund).handledBy, 'billing');
  eq(second.handle(TICKETS.refund).handledBy, 'tier2');
});

test('every desk sees the same ticket object, untouched', () => {
  const looked = spy(() => false);
  const chain = createChain([
    makeHandler('audit', looked, () => 'never'),
    bot(),
  ]);
  chain.handle(TICKETS.password);
  eq(looked.callCount, 1);
  eq(looked.calls[0][0], TICKETS.password);
  eq(TICKETS.password, { id: 'T-1', topic: 'password', severity: 1 });
});
