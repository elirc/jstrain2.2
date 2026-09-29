// ─────────────────────────────────────────────────────────────────────────
//  17 · trafficLight                                       ★★★ stretch
//  concepts: state machines · next(event) · generator return value
//  run: node 17-traffic-light.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A state machine is usually a `switch` plus a `currentState` variable
//  that any code in the file can scribble on. A generator can hold that
//  variable inside its own frozen stack instead: it yields the state it
//  is in, and you push it forward by sending the event that happened.
//
//      const light = trafficLight();
//      light.next().value            → 'red'      (the priming pull)
//      light.next('timer').value     → 'green'
//      light.next('walk').value      → 'yellow'   (pedestrian button)
//      light.next('walk').value      → 'yellow'   (yellow has no walk)
//      light.next('off')             → { value: 'off', done: true }
//
//  Drive it off the TRANSITIONS table below. An event the current state
//  does not list changes nothing — you yield the same state again. The
//  'off' event works from every state and ENDS the machine, returning
//  the string 'off'.
//
//  hint: `const event = yield state;` is the entire protocol — one line
//        that hands the state out now and evaluates to what was sent in
//        when someone pulls again

import { test, eq } from '../../_lib/check.js';

// scaffolding: the transition table. Do not edit.
const TRANSITIONS = {
  red: { timer: 'green' },
  green: { timer: 'yellow', walk: 'yellow' },
  yellow: { timer: 'red' },
};

export function* trafficLight() {
  throw new Error('TODO');
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
