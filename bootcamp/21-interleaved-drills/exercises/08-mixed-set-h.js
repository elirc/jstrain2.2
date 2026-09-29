// ─────────────────────────────────────────────────────────────────────────
//  08 · mixed set H                                        ★★☆ core
//  concepts: mixed — work out which tool each job wants
//  run: node 08-mixed-set-h.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Five jobs in a print shop. No hints. One sitting.
//
//    jobSummary({ jobTitle: 'Flyers', copies: 250,
//                 stock: { paper: 'gloss' } })  → 'Flyers ×250 on gloss'
//    jobSummary({ jobTitle: 'Poster' })         → 'Poster ×1 on plain'
//    jobSummary()                               → 'untitled ×1 on plain'
//    const press = new Press('A1');
//    press.queue('flyers');
//    const report = press.report;      ← handed off as a bare callback
//    report()                          → 'A1: 1 queued'
//    const warm = once(fn);  warm(); warm();  → fn ran exactly once,
//                                               both calls saw its result
//    reassignJob(SHOP, 'j1', 'B2')  → a new shop; SHOP is deep-frozen
//    await firstSuccess(tasks)      → the first task that resolves;
//                                     if none do, it throws an Error whose
//                                     message contains 'all 3 failed'

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

export function jobSummary(job) {
  throw new Error('TODO');
}

export class Press {
  constructor(name) {
    throw new Error('TODO');
  }

  queue(job) {
    throw new Error('TODO');
  }

  report() {
    throw new Error('TODO');
  }
}

export function once(fn) {
  throw new Error('TODO');
}

export function reassignJob(shop, jobId, pressName) {
  throw new Error('TODO');
}

export async function firstSuccess(tasks) {
  throw new Error('TODO');
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
