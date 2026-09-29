// ─────────────────────────────────────────────────────────────────────────
//  17 · order state machine — SOLUTION                       ★★★ stretch
//  concepts: state machine · transition table · illegal states
//  run: node solutions/17-state-machine.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — let an object's behaviour depend on one explicit state, and
//  make every legal move a row in a table instead of a flag combination.
//  Count the wins: the table is the documentation, illegal states are
//  unrepresentable (there is no way to be both cancelled and shipped),
//  new rules are data edits rather than new `if`s, and the tests can
//  enumerate the whole grid — every legal move and every illegal one.
//  Booleans cannot do that: four flags mean sixteen combinations, and
//  eleven of them are nonsense nobody ever tested.
//  When NOT to use: two states and one move (`draft`/`published`) do not
//  need a machine. And a transition table cannot express "wait 3 days" —
//  that needs a real workflow engine with timers.
//  In the wild: XState, Redux reducers on a `status` field, TCP's
//  connection diagram, CSS transitions, Stripe's PaymentIntent statuses.
//  Classic wrong turn: a state machine that also *does* the work. Keep
//  the table pure; run side effects where the transition is applied.

import { test, eq, ok, throws } from '../../_lib/check.js';

const TRANSITIONS = {
  pending: { pay: 'paid', cancel: 'cancelled' },
  paid: { ship: 'shipped', refund: 'refunded' },
  shipped: { deliver: 'delivered' },
  delivered: {},
  cancelled: {},
  refunded: {},
};

export function transition(state, event) {
  const moves = TRANSITIONS[state];
  if (!moves) throw new Error(`unknown state: ${state}`);
  const next = moves[event];
  if (!next) throw new Error(`cannot ${event} an order that is ${state}`);
  return next;
}

export function canTransition(state, event) {
  return Boolean(TRANSITIONS[state]?.[event]);
}

export function createOrder() {
  let state = 'pending';
  const visited = ['pending'];
  return {
    state: () => state,
    can: (event) => canTransition(state, event),
    history: () => [...visited],
    send(event) {
      state = transition(state, event);
      visited.push(state);
      return state;
    },
  };
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
