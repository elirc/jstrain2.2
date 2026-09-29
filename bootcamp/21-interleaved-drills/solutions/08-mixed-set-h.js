// ─────────────────────────────────────────────────────────────────────────
//  08 · mixed set H — SOLUTION                             ★★☆ core
//  run: node 08-mixed-set-h.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — five tools, one per job:
//  1. Parameter destructuring with a rename, a default per field and a
//     default OBJECT one level down, plus the outer `= {}` that lets
//     `jobSummary()` answer instead of throwing.
//  2. A class method lives on the prototype and gets its `this` from the
//     call site, so `const report = press.report` loses the press. Bind
//     in the constructor — `this.report = this.report.bind(this)` — and
//     every instance owns a pre-bound copy. A class field arrow
//     (`report = () => …`) is the same fix with different syntax.
//  3. `once` is closure state: a `called` flag and a cached `result`. The
//     flag matters more than the cache — `if (result !== undefined)`
//     would re-run for a function that legitimately returns undefined.
//     Each call to `once` makes a NEW closure, so two wrappers around one
//     function do not know about each other.
//  4. Immutable nested update, three levels: shop → jobs → the one job.
//     `j2` is never spread, so it stays the same object.
//  5. Errors do not "tunnel" out of a loop by themselves: catch each
//     rejection, keep going, and only throw once every task has failed.
//     A bare `Promise.any` would do it too — but its AggregateError
//     message is not the one the caller asked for.

import { test, eq, ok, spy, rejects } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};

const SHOP = deepFreeze({
  city: 'Leeds',
  jobs: {
    j1: { title: 'Flyers', press: 'A1', copies: 250 },
    j2: { title: 'Cards', press: 'B2', copies: 100 },
  },
});

export function jobSummary({
  jobTitle: title = 'untitled',
  copies = 1,
  stock: { paper = 'plain' } = {},
} = {}) {
  return `${title} ×${copies} on ${paper}`;
}

export class Press {
  constructor(name) {
    this.name = name;
    this.jobs = [];
    this.report = this.report.bind(this);
  }

  queue(job) {
    this.jobs.push(job);
    return this.jobs.length;
  }

  report() {
    return `${this.name}: ${this.jobs.length} queued`;
  }
}

export function once(fn) {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}

export function reassignJob(shop, jobId, pressName) {
  return {
    ...shop,
    jobs: {
      ...shop.jobs,
      [jobId]: { ...shop.jobs[jobId], press: pressName },
    },
  };
}

export async function firstSuccess(tasks) {
  for (const task of tasks) {
    try {
      return await task();
    } catch {
      // keep going — a failure here is not the caller's answer yet
    }
  }
  throw new Error(`all ${tasks.length} failed`);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the summary renames, defaults, and reaches into the stock', () => {
  eq(
    jobSummary({ jobTitle: 'Flyers', copies: 250, stock: { paper: 'gloss' } }),
    'Flyers ×250 on gloss'
  );
  eq(jobSummary({ jobTitle: 'Poster' }), 'Poster ×1 on plain');
  eq(jobSummary(), 'untitled ×1 on plain');
});

test('a report handed off as a bare callback still knows its press', () => {
  const press = new Press('A1');
  press.queue('flyers');
  press.queue('cards');
  const report = press.report;
  eq(report(), 'A1: 2 queued');
  const runLater = (fn) => fn();
  eq(runLater(press.report), 'A1: 2 queued');
});

test('once runs its function a single time and reuses the answer', () => {
  const warmUp = spy(() => 'warm');
  const guarded = once(warmUp);
  eq([guarded(), guarded(), guarded()], ['warm', 'warm', 'warm']);
  eq(warmUp.callCount, 1);
});

test('two wrappers around the same function keep separate state', () => {
  const warmUp = spy(() => 'warm');
  const a = once(warmUp);
  const b = once(warmUp);
  a();
  b();
  eq(warmUp.callCount, 2);
});

test('reassigning returns a new shop and shares what did not change', () => {
  const after = reassignJob(SHOP, 'j1', 'B2');
  eq(after.jobs.j1, { title: 'Flyers', press: 'B2', copies: 250 });
  eq(after.city, 'Leeds');
  ok(after.jobs.j2 === SHOP.jobs.j2, 'untouched jobs are shared');
});

test('the frozen shop is not touched', () => {
  reassignJob(SHOP, 'j1', 'B2');
  eq(SHOP.jobs.j1.press, 'A1');
});

test('the first task that works wins; all-failed reports the count', async () => {
  const boom = (why) => async () => {
    throw new Error(why);
  };
  eq(
    await firstSuccess([boom('press jammed'), async () => 'printed', boom('x')]),
    'printed'
  );
  await rejects(
    () => firstSuccess([boom('a'), boom('b'), boom('c')]),
    'all 3 failed'
  );
});
