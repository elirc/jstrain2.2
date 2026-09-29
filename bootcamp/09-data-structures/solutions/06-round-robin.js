// ─────────────────────────────────────────────────────────────────────────
//  06 · round-robin scheduler — SOLUTION                      ★★☆ core
//  run: node 06-round-robin.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: "run a bit, go to the back of the line" is literally
//  dequeue → work → enqueue, so the queue IS the algorithm; the loop is
//  four lines once you see it. Each slice is O(1), and the total is O(total
//  work / quantum) — no scanning for "whose turn is it", which is what an
//  array-of-tasks-with-an-index solution degenerates into.
//  Purity: copy `{ ...task }` on the way in. Decrementing the caller's
//  objects is the classic wrong turn here — the schedule comes out right
//  and every task in the caller's list silently ends up with work 0.
//  head-index dequeue (exercise 04) keeps this O(1) per slice; shift()
//  would make a long schedule quadratic.

import { test, eq } from '../../_lib/check.js';

export function roundRobin(tasks, quantum) {
  const queue = tasks.map((task) => ({ ...task }));
  let head = 0;
  const trace = [];

  while (head < queue.length) {
    const task = queue[head];
    head += 1;
    trace.push(task.name);
    task.work -= quantum;
    if (task.work > 0) queue.push(task);
  }

  return trace;
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
