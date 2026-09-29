// ─────────────────────────────────────────────────────────────────────────
//  06 · round-robin scheduler                                 ★★☆ core
//  concepts: queues · pure functions · fair scheduling
//  run: node 06-round-robin.js
// ─────────────────────────────────────────────────────────────────────────
//
//  How an OS keeps one heavy job from freezing your laptop: give every
//  task a fixed slice of time, then send it to the BACK of the queue if it
//  is not done. Take the whole queue in, hand the trace of slices back.
//
//  A task is { name, work } where work is how many units it still needs.
//  Return one entry per slice actually run, in the order they ran:
//
//      roundRobin([{ name: 'a', work: 3 },
//                  { name: 'b', work: 1 }], 2)
//        → ['a', 'b', 'a']
//        a runs 2 units (1 left) · b runs 1 unit (done) · a runs its last
//
//      roundRobin([{ name: 'a', work: 2 },
//                  { name: 'b', work: 3 }], 1)
//        → ['a', 'b', 'a', 'b', 'b']
//
//      roundRobin([], 4)  → []
//
//  Keep it pure: the caller's task objects must come back untouched.
//
//  hint: copy the remaining work into your own queue entries first

import { test, eq } from '../../_lib/check.js';

export function roundRobin(tasks, quantum) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a task shorter than the quantum runs exactly once', () => {
  eq(roundRobin([{ name: 'a', work: 1 }], 3), ['a']);
});

test('a task longer than the quantum comes back around', () => {
  eq(roundRobin([{ name: 'a', work: 3 }], 2), ['a', 'a']);
});

test('finished tasks drop out of the rotation', () => {
  const tasks = [
    { name: 'a', work: 3 },
    { name: 'b', work: 1 },
  ];
  eq(roundRobin(tasks, 2), ['a', 'b', 'a']);
});

test('a quantum of 1 interleaves the tasks strictly', () => {
  const tasks = [
    { name: 'a', work: 2 },
    { name: 'b', work: 3 },
  ];
  eq(roundRobin(tasks, 1), ['a', 'b', 'a', 'b', 'b']);
});

test('an empty task list schedules nothing', () => {
  eq(roundRobin([], 4), []);
});

test('leaves the caller task objects untouched', () => {
  const tasks = [{ name: 'a', work: 5 }];
  roundRobin(tasks, 2);
  eq(tasks, [{ name: 'a', work: 5 }]);
});

test('application: three build steps share the CPU fairly', () => {
  const steps = [
    { name: 'lint', work: 1 },
    { name: 'test', work: 5 },
    { name: 'build', work: 2 },
  ];
  eq(roundRobin(steps, 2), ['lint', 'test', 'build', 'test', 'test']);
});
