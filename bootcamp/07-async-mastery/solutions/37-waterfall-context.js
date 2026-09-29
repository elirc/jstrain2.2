// ─────────────────────────────────────────────────────────────────────────
//  37 · runWaterfall (steps that build a context) — SOLUTION  ★★☆ core
//  run: node 37-waterfall-context.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `for...of` with an await inside. Everywhere else in this
//  module that shape is the bug (exercise 20); here it is the whole point,
//  because step N+1 literally cannot start without step N's output.
//  The context is rebuilt with `{ ...ctx, ...patch }` rather than
//  `Object.assign(ctx, patch)`. Two reasons: the caller's `initial` object
//  stays untouched, and every step gets a snapshot it cannot corrupt for
//  the steps that already ran — much easier to debug than one shared bag
//  everyone mutates.
//  Error handling is free: an `await` on a rejected step throws right
//  there, the loop unwinds, and later steps never start. You do not need
//  a try/catch unless you want to ADD context to the error, e.g.
//  `throw new Error(\`step ${i} failed\`, { cause: err })`.
//  Wrong turn: `steps.map(step)` or `Promise.all` because it "looks
//  cleaner". That starts every step immediately with an empty context —
//  and `.forEach(async ...)` does not even wait.

import { test, eq, ok, rejects, sleep, spy } from '../../_lib/check.js';

export const trace = [];
export const meter = { running: 0, peak: 0 };

export const reset = () => {
  trace.length = 0;
  meter.running = 0;
  meter.peak = 0;
};

// Builds a step that logs its start/end and returns `patch` (or patch(ctx)).
export function makeStep(name, patch, ms = 10) {
  return spy(async (ctx) => {
    meter.running += 1;
    meter.peak = Math.max(meter.peak, meter.running);
    trace.push(`${name}:start`);
    await sleep(ms);
    trace.push(`${name}:end`);
    meter.running -= 1;
    return typeof patch === 'function' ? patch(ctx) : patch;
  });
}

export async function runWaterfall(steps, initial = {}) {
  let ctx = { ...initial };
  for (const step of steps) {
    const patch = await step(ctx);
    if (patch) ctx = { ...ctx, ...patch };
  }
  return ctx;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('merges every step result into one context', async () => {
  reset();
  const steps = [makeStep('a', { id: 1 }), makeStep('b', { total: 20 })];
  eq(await runWaterfall(steps, {}), { id: 1, total: 20 });
});

test('a later step sees what the earlier ones produced', async () => {
  reset();
  const steps = [
    makeStep('a', { id: 1 }),
    makeStep('b', (ctx) => ({ name: `u${ctx.id}` })),
  ];
  eq(await runWaterfall(steps, { region: 'eu' }), {
    region: 'eu',
    id: 1,
    name: 'u1',
  });
});

test('runs the steps one at a time, in order', async () => {
  reset();
  const steps = [
    makeStep('a', { a: 1 }),
    makeStep('b', { b: 2 }),
    makeStep('c', { c: 3 }),
  ];
  await runWaterfall(steps, {});
  eq(trace, [
    'a:start',
    'a:end',
    'b:start',
    'b:end',
    'c:start',
    'c:end',
  ]);
  eq(meter.peak, 1, 'a waterfall never has two steps in flight');
});

test('does not mutate the object you passed in', async () => {
  reset();
  const initial = { region: 'eu' };
  const out = await runWaterfall([makeStep('a', { id: 1 })], initial);
  eq(initial, { region: 'eu' });
  ok(out !== initial, 'return a new object');
});

test('a step returning undefined leaves the context alone', async () => {
  reset();
  const steps = [makeStep('a', { id: 1 }), makeStep('log', undefined)];
  eq(await runWaterfall(steps, {}), { id: 1 });
});

test('rejects on a failing step and never starts the rest', async () => {
  reset();
  const boom = spy(async () => {
    trace.push('boom');
    throw new Error('payment declined');
  });
  const never = makeStep('never', { never: true });
  await rejects(
    runWaterfall([makeStep('a', { id: 1 }), boom, never], {}),
    'payment declined'
  );
  eq(never.callCount, 0);
});
