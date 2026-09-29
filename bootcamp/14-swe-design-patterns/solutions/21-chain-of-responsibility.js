// ─────────────────────────────────────────────────────────────────────────
//  21 · ticket escalation chain — SOLUTION                       ★★☆ core
//  concepts: chain of responsibility · ordered handlers · escalation
//  run: node solutions/21-chain-of-responsibility.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — hand a request down a line of candidates until one of them
//  claims it, so no single place has to know the whole decision tree.
//  Each handler answers one question about itself ("is this mine?") and
//  the chain owns the ordering. Adding a desk is a new handler plus one
//  array entry; the `if/else if` tower it replaces would need an edit in
//  the middle of a function everyone is afraid of.
//  `null` as "pass it on" is the contract. Anything non-null stops the
//  chain — which is why `act` must never legitimately return null.
//  Chain of responsibility vs middleware (exercise 18): middleware runs
//  EVERY link and each one may pass control inward and then unwind
//  (onion). A chain runs links until one CLAIMS the request and the rest
//  never execute. Same array of functions, opposite promise.
//  When NOT to use: if the right handler is a pure lookup on one field,
//  a registry object is faster to read and to debug — a chain hides
//  "who answered this?" behind runtime order.
//  In the wild: DOM event bubbling, ASP.NET Core / Express fallthrough
//  routing, log4j appender chains, macOS responder chain, PSP escalation
//  rules in payment routers.
//  Classic wrong turn: returning `false`/`undefined` from a handler that
//  really did handle it — the chain keeps walking and two desks act.

import { test, eq, spy } from '../../_lib/check.js';

export function makeHandler(name, accepts, act) {
  return {
    name,
    handle: (ticket) => (accepts(ticket) ? { action: act(ticket) } : null),
  };
}

export function createChain(handlers) {
  return {
    handle(ticket) {
      const tried = [];
      for (const handler of handlers) {
        tried.push(handler.name);
        const result = handler.handle(ticket);
        if (result !== null) {
          return { handledBy: handler.name, action: result.action, tried };
        }
      }
      return { handledBy: null, action: null, tried };
    },
  };
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
