// ─────────────────────────────────────────────────────────────────────────
//  17 · trafficLight — SOLUTION                             ★★★ stretch
//  run: node 17-traffic-light.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the generator's own stack IS the state variable. There
//  is no `this.state` for unrelated code to corrupt, and the only door
//  into the machine is next(event) — an illegal state is unreachable
//  rather than merely undocumented.
//
//  `const event = yield state;` is one statement doing two things at
//  two different times: it hands out the current state now, and on the
//  next pull it evaluates to whatever was sent. Look the pair
//  (state, event) up in the table; a miss means "ignore it", which is
//  what a real light does with a walk button while it is already
//  yellow.
//
//  `return 'off'` rides out on { done: true }. Note what that costs
//  you: for-of and spread throw a return value away, so a machine you
//  intend to end is a machine you drive by hand with next().

import { test, eq } from '../../_lib/check.js';

// scaffolding: the transition table. Do not edit.
const TRANSITIONS = {
  red: { timer: 'green' },
  green: { timer: 'yellow', walk: 'yellow' },
  yellow: { timer: 'red' },
};

export function* trafficLight() {
  let state = 'red';
  while (true) {
    const event = yield state;
    if (event === 'off') return 'off';
    const next = TRANSITIONS[state][event];
    if (next !== undefined) state = next;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the priming pull yields the starting state', () => {
  eq(trafficLight().next(), { value: 'red', done: false });
});

test('the value sent to the first next() is thrown away', () => {
  eq(trafficLight().next('timer').value, 'red');
});

test('timer events walk red to green to yellow and back to red', () => {
  const light = trafficLight();
  light.next();
  eq(light.next('timer').value, 'green');
  eq(light.next('timer').value, 'yellow');
  eq(light.next('timer').value, 'red');
});

test('the walk button cuts a green light short', () => {
  const light = trafficLight();
  light.next();
  light.next('timer');
  eq(light.next('walk').value, 'yellow');
});

test('an event the state does not allow changes nothing', () => {
  const light = trafficLight();
  light.next();
  eq(light.next('walk').value, 'red', 'red has no walk transition');
  eq(light.next('nonsense').value, 'red');
});

test('off ends the machine from whatever state it is in', () => {
  const light = trafficLight();
  light.next();
  light.next('timer');
  eq(light.next('off'), { value: 'off', done: true });
  eq(light.next('timer'), { value: undefined, done: true });
});

test('two lights keep separate state', () => {
  const a = trafficLight();
  const b = trafficLight();
  a.next();
  b.next();
  a.next('timer');
  eq(b.next('timer').value, 'green');
  eq(a.next('timer').value, 'yellow');
});
