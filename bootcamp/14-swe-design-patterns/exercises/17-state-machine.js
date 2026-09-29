// ─────────────────────────────────────────────────────────────────────────
//  17 · order state machine                                  ★★★ stretch
//  concepts: state machine · transition table · illegal states
//  run: node exercises/17-state-machine.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "Can this order be cancelled?" is a question that spawns boolean
//  flags — isPaid, isShipped, wasCancelled — and then contradictions.
//  Model it as one state plus a table of legal moves instead.
//
//      pending  --pay-->    paid    --ship-->  shipped --deliver--> delivered
//         |                   |
//      cancel              refund
//         v                   v
//      cancelled          refunded
//
//  Cancelling is only legal *before* payment; after that the move is a
//  refund. delivered, cancelled and refunded are terminal.
//
//      transition('pending', 'pay')    → 'paid'
//      transition('paid', 'cancel')    → throws
//                                  'cannot cancel an order that is paid'
//      transition('banana', 'pay')     → throws 'unknown state: banana'
//      canTransition('paid', 'ship')   → true      (never throws)
//
//      const order = createOrder();     // starts 'pending'
//      order.send('pay'); order.state() → 'paid'
//      order.history()                 → ['pending', 'paid']
//      an illegal send throws and leaves the state alone
//
//  hint: `{ pending: { pay: 'paid', cancel: 'cancelled' }, … }` — the
//  table IS the design; every function below is three lines of lookup

import { test, eq, ok, throws } from '../../_lib/check.js';

export function transition(state, event) {
  throw new Error('TODO');
}

export function canTransition(state, event) {
  throw new Error('TODO');
}

export function createOrder() {
  throw new Error('TODO');
}

const LEGAL = [
  ['pending', 'pay', 'paid'],
  ['pending', 'cancel', 'cancelled'],
  ['paid', 'ship', 'shipped'],
  ['paid', 'refund', 'refunded'],
  ['shipped', 'deliver', 'delivered'],
];

const ILLEGAL = [
  ['pending', 'ship'],
  ['pending', 'deliver'],
  ['pending', 'refund'],
  ['paid', 'pay'],
  ['paid', 'cancel'],
  ['paid', 'deliver'],
  ['shipped', 'cancel'],
  ['shipped', 'refund'],
  ['shipped', 'pay'],
];

const EVENTS = ['pay', 'ship', 'deliver', 'cancel', 'refund'];
const TERMINAL = ['delivered', 'cancelled', 'refunded'];

// ──────────────────────────── tests ──────────────────────────────────────

test('every legal move lands on the right state', () => {
  for (const [from, event, to] of LEGAL) {
    eq(transition(from, event), to, `${from} --${event}--> ${to}`);
  }
});

test('every illegal move is refused, and says why', () => {
  transition('pending', 'pay');
  for (const [from, event] of ILLEGAL) {
    throws(
      () => transition(from, event),
      `cannot ${event} an order that is ${from}`
    );
  }
  throws(() => transition('banana', 'pay'), 'unknown state: banana');
});

test('terminal states accept nothing at all', () => {
  transition('pending', 'pay');
  for (const state of TERMINAL) {
    for (const event of EVENTS) {
      throws(() => transition(state, event), `cannot ${event}`);
    }
  }
});

test('canTransition answers the same question without throwing', () => {
  for (const [from, event] of LEGAL) eq(canTransition(from, event), true);
  for (const [from, event] of ILLEGAL) eq(canTransition(from, event), false);
  eq(canTransition('banana', 'pay'), false);
  eq(canTransition('pending', 'yodel'), false);
});

test('an order walks the happy path', () => {
  const order = createOrder();
  eq(order.state(), 'pending');
  eq(order.send('pay'), 'paid');
  order.send('ship');
  order.send('deliver');
  eq(order.state(), 'delivered');
});

test('an order remembers every state it has been in', () => {
  const order = createOrder();
  order.send('pay');
  order.send('ship');
  eq(order.history(), ['pending', 'paid', 'shipped']);
});

test('an illegal send throws and leaves the order untouched', () => {
  const order = createOrder();
  order.send('pay');
  throws(() => order.send('cancel'), 'cannot cancel an order that is paid');
  eq(order.state(), 'paid');
  eq(order.history(), ['pending', 'paid']);
  ok(order.can('ship') && !order.can('cancel'));
});
