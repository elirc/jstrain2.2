// ─────────────────────────────────────────────────────────────────────────
//  12 · cron scheduler                                      ★★★ capstone
//  concepts: parsing · UTC date math · injected clocks · job isolation
//  time: 35–45 min · 4 stages · 24 tests
//  run: node 12-cron-scheduler.js
// ─────────────────────────────────────────────────────────────────────────
//
//  THE PITCH
//  node-cron, Kubernetes CronJobs, GitHub Actions `schedule:`, the
//  crontab on every server you have ever ssh'd into — all of them are
//  this file. Five fields of numbers, a search for the next matching
//  minute, and a loop that asks "who is due?". The reason it is worth
//  building is the second half: the moment a scheduler owns a real
//  clock, it becomes untestable, so you inject the clock and every
//  scenario — a four-hour outage, a job that overruns its slot — is a
//  variable assignment away.
//
//  STAGES — do them in order, run the file after each one
//    1. parseCron ......... five fields → sets of allowed numbers
//    2. nextRun ........... when does this next match? (UTC only)
//    3. Scheduler ......... add / tick / remove, on an injected clock
//    4. isolation ★ ....... overrunning jobs, and jobs that throw
//
//  THE SPEC
//
//    Five fields, in this order, with three forms each: a number, `*`,
//    `*/n`, and comma lists of those.
//
//        minute hour day-of-month month day-of-week
//         0-59  0-23     1-31      1-12    0-6 (0 = Sunday)
//
//      parseCron('*/15 * * * *').minute  → [0, 15, 30, 45]
//      parseCron('30,0,15 * * * *').minute → [0, 15, 30]  // sorted, unique
//      parseCron('* * */10 * *').dayOfMonth → [1, 11, 21, 31]
//
//    `*/n` steps from the field's OWN minimum — days start at 1. A bad
//    field count, an out-of-range number or unparseable junk all throw.
//
//    stage 2 —
//
//      nextRun('*/15 * * * *', new Date('2024-03-01T10:07:00Z'))
//        → Date 2024-03-01T10:15:00.000Z
//
//    STRICTLY after the instant you pass, seconds and milliseconds
//    cleared, and UTC throughout (`getUTCHours`, `Date.UTC`) — a
//    scheduler on local time runs twice or not at all each daylight
//    saving change. Return null when the expression can never match
//    (`'0 0 30 2 *'`). And the POSIX rule that surprises everyone: when
//    BOTH day-of-month and day-of-week are restricted they are OR-ed —
//    `0 0 1 * 1` means "the 1st, and also every Monday".
//
//    stages 3 + 4 —
//
//      const cron = new Scheduler({ now: () => t, onError });
//      cron.add('sweep', '*/15 * * * *', fn)   // throws on a bad expr
//      cron.tick()          → ['sweep']   // the names that just started
//      cron.nextRunAt('sweep')  → Date · cron.remove('sweep') → boolean
//      cron.stats('sweep')  → { runs, errors, skipped }   (null if gone)
//
//    tick() reads the clock ONCE and runs everything due. A job that is
//    still running (it returned a promise that has not settled) is
//    skipped and counted, never started twice. A job that throws — or
//    rejects — goes to onError(err, name) and must not stop the jobs
//    after it, nor stop being scheduled.
//
//  hint (stage 2): do not walk minute by minute for four years. If the
//  MONTH does not match, jump to the 1st of the next month; if the day
//  does not, jump to midnight tomorrow; if the hour does not, jump to
//  the next hour. `Date.UTC(y, m, d + 1)` handles every overflow for you.
//  hint (stage 3): reschedule a job BEFORE you run it, computing the
//  next slot from "now" — that is what stops a laptop waking up from
//  replaying four hours of missed runs.

import { test, eq, throws, sleep } from '../../_lib/check.js';

// ── scaffolding for the tests — no need to change any of this ────────────

// A promise you resolve by hand, so a test can decide exactly when a
// "slow" job finishes — no timers, no waiting.
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const utc = (y, mo, d, h = 0, mi = 0) => Date.UTC(y, mo - 1, d, h, mi);
const iso = (date) => (date === null ? null : date.toISOString());

// ── stage 1: the parser ──────────────────────────────────────────────────

// Provided: field name → [min, max], in cron's own field order.
const RANGES = {
  minute: [0, 59],
  hour: [0, 23],
  dayOfMonth: [1, 31],
  month: [1, 12],
  dayOfWeek: [0, 6],
};

// '*/15 * * * *' → { minute: [0,15,30,45], hour: [0..23], … }
// Every field becomes the SORTED list of values it allows, so that
// matching later is one Set lookup and nothing is re-parsed at run time.
export function parseCron(expr) {
  throw new Error('TODO');
}

// ── stage 2: the search ──────────────────────────────────────────────────

// The first instant strictly after `after` that the expression matches,
// as a Date, or null if it never will. UTC only.
export function nextRun(expr, after = new Date()) {
  throw new Error('TODO');
}

// ── stages 3 + 4: the scheduler ──────────────────────────────────────────

export class Scheduler {
  constructor({ now = () => Date.now(), onError } = {}) {
    this.now = now; // injected clock → epoch ms
    this.onError = onError; // stage 4: onError(err, jobName)
    this.jobs = new Map(); // name → job (a Map keeps them in add order)
  }

  // stage 3 — validate the expression now, and work out the first run
  // from the current time.
  add(name, expr, fn) {
    throw new Error('TODO');
  }

  remove(name) {
    throw new Error('TODO');
  }

  nextRunAt(name) {
    throw new Error('TODO');
  }

  // → { runs, errors, skipped }, or null if there is no such job
  stats(name) {
    throw new Error('TODO');
  }

  // stage 3 — one look at the clock, then start everything that is due
  // and return their names.
  // stage 4 — a job already in flight is skipped and counted.
  tick() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

// ── stage 1: parsing a cron expression ───────────────────────────────────

test("'*' expands to the whole range of its field", () => {
  const spec = parseCron('* * * * *');
  eq(spec.minute.length, 60);
  eq(spec.hour.length, 24);
  eq(spec.dayOfMonth[0], 1, 'days start at 1, not 0');
  eq(spec.dayOfMonth.at(-1), 31);
  eq(spec.month, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  eq(spec.dayOfWeek, [0, 1, 2, 3, 4, 5, 6]);
});

test('a plain number is just that number', () => {
  const spec = parseCron('30 9 1 1 0');
  eq(spec.minute, [30]);
  eq(spec.hour, [9]);
  eq(spec.dayOfMonth, [1]);
  eq(spec.month, [1]);
  eq(spec.dayOfWeek, [0]);
});

test('*/n steps from the minimum of the field, not from zero', () => {
  eq(parseCron('*/15 * * * *').minute, [0, 15, 30, 45]);
  eq(parseCron('* */6 * * *').hour, [0, 6, 12, 18]);
  eq(parseCron('* * */10 * *').dayOfMonth, [1, 11, 21, 31]);
});

test('a comma list is a union — sorted, and deduplicated', () => {
  eq(parseCron('30,0,15,0 * * * *').minute, [0, 15, 30]);
});

test('lists and steps mix inside one field', () => {
  eq(parseCron('0,*/20 * * * *').minute, [0, 20, 40]);
  eq(parseCron('* * * 1,*/6 *').month, [1, 7]);
});

test('the wrong number of fields is an error', () => {
  throws(() => parseCron('* * * *'), 'expected 5 fields');
  throws(() => parseCron('* * * * * *'), 'expected 5 fields');
  throws(() => parseCron(''), 'expected 5 fields');
});

test('values outside the range, or plain nonsense, are errors', () => {
  throws(() => parseCron('60 * * * *'), 'out of range');
  throws(() => parseCron('* 24 * * *'), 'out of range');
  throws(() => parseCron('* * 0 * *'), 'out of range');
  throws(() => parseCron('* * * 13 *'), 'out of range');
  throws(() => parseCron('* * * * 7'), 'out of range');
  throws(() => parseCron('friday * * * *'), 'cannot parse');
  throws(() => parseCron('*/0 * * * *'), 'at least 1');
});

// ── stage 2: nextRun ─────────────────────────────────────────────────────

test('nextRun finds the next matching minute', () => {
  const at = new Date(utc(2024, 3, 1, 10, 7));
  eq(iso(nextRun('*/15 * * * *', at)), '2024-03-01T10:15:00.000Z');
});

test('it is strictly after — a matching instant rolls to the next one', () => {
  const at = new Date(utc(2024, 3, 1, 10, 15));
  eq(iso(nextRun('*/15 * * * *', at)), '2024-03-01T10:30:00.000Z');
});

test('seconds and milliseconds are cleared', () => {
  const at = new Date(Date.UTC(2024, 2, 1, 10, 7, 42, 500));
  eq(iso(nextRun('*/15 * * * *', at)), '2024-03-01T10:15:00.000Z');
});

test('it rolls over hours, days, months and years', () => {
  eq(
    iso(nextRun('0 * * * *', new Date(utc(2024, 3, 1, 10, 30)))),
    '2024-03-01T11:00:00.000Z'
  );
  eq(
    iso(nextRun('30 9 * * *', new Date(utc(2024, 3, 1, 10, 0)))),
    '2024-03-02T09:30:00.000Z'
  );
  eq(
    iso(nextRun('0 0 1 * *', new Date(utc(2024, 12, 15, 12, 0)))),
    '2025-01-01T00:00:00.000Z'
  );
});

test('a weekday field finds the right day', () => {
  // 2024-03-01 is a Friday; the next Monday is the 4th
  eq(
    iso(nextRun('30 9 * * 1', new Date(utc(2024, 3, 1, 10, 0)))),
    '2024-03-04T09:30:00.000Z'
  );
});

test('day-of-month and day-of-week are OR-ed when both are set', () => {
  // '0 0 1 * 1' = midnight on the 1st, AND every Monday
  const afterFriday = new Date(utc(2024, 3, 1, 12, 0)); // Fri 1 Mar
  eq(iso(nextRun('0 0 1 * 1', afterFriday)), '2024-03-04T00:00:00.000Z');
  const afterMonday = new Date(utc(2024, 3, 4, 12, 0)); // Mon 4 Mar
  eq(iso(nextRun('0 0 1 * 1', afterMonday)), '2024-03-11T00:00:00.000Z');
  // with only day-of-month set, Mondays are irrelevant
  eq(iso(nextRun('0 0 1 * *', afterFriday)), '2024-04-01T00:00:00.000Z');
});

test('a date that can never happen returns null', () => {
  eq(nextRun('0 0 30 2 *', new Date(utc(2024, 1, 1, 0, 0))), null);
});

// ── stage 3: the scheduler and its injected clock ────────────────────────

test('add works out the first run from the current time', () => {
  let t = utc(2024, 3, 1, 10, 7);
  const cron = new Scheduler({ now: () => t });
  cron.add('sweep', '*/15 * * * *', () => {});
  eq(iso(cron.nextRunAt('sweep')), '2024-03-01T10:15:00.000Z');
  eq(cron.nextRunAt('nope'), null);
});

test('tick fires the jobs that are due, and only those', () => {
  let t = utc(2024, 3, 1, 10, 0);
  const cron = new Scheduler({ now: () => t });
  const ran = [];
  cron.add('minutely', '* * * * *', () => ran.push('minutely'));
  cron.add('hourly', '0 * * * *', () => ran.push('hourly'));

  eq(cron.tick(), [], 'nothing is due yet');
  t = utc(2024, 3, 1, 10, 1);
  eq(cron.tick(), ['minutely']);
  t = utc(2024, 3, 1, 11, 0);
  eq(cron.tick(), ['minutely', 'hourly']);
  eq(ran, ['minutely', 'minutely', 'hourly']);
});

test('a job fires once per due slot, not once per tick', () => {
  let t = utc(2024, 3, 1, 10, 0);
  const cron = new Scheduler({ now: () => t });
  let runs = 0;
  cron.add('hourly', '0 * * * *', () => {
    runs += 1;
  });
  t = utc(2024, 3, 1, 11, 0);
  cron.tick();
  cron.tick();
  cron.tick();
  eq(runs, 1);
  eq(iso(cron.nextRunAt('hourly')), '2024-03-01T12:00:00.000Z');
});

test('a long jump in the clock does not replay the missed runs', () => {
  let t = utc(2024, 3, 1, 10, 0);
  const cron = new Scheduler({ now: () => t });
  let runs = 0;
  cron.add('hourly', '0 * * * *', () => {
    runs += 1;
  });
  t = utc(2024, 3, 1, 14, 30); // the laptop was asleep for 4 hours
  cron.tick();
  eq(runs, 1, 'once, not four times');
  eq(iso(cron.nextRunAt('hourly')), '2024-03-01T15:00:00.000Z');
});

test('remove takes a job out of the rotation', () => {
  let t = utc(2024, 3, 1, 10, 0);
  const cron = new Scheduler({ now: () => t });
  cron.add('sweep', '* * * * *', () => {});
  eq(cron.remove('sweep'), true);
  eq(cron.remove('sweep'), false);
  t = utc(2024, 3, 1, 10, 1);
  eq(cron.tick(), []);
  eq(cron.stats('sweep'), null);
});

// ── stage 4: overlap and error isolation ★ ───────────────────────────────

test('a job still in flight is skipped, not started a second time', async () => {
  let t = utc(2024, 3, 1, 10, 0);
  const cron = new Scheduler({ now: () => t });
  const gate = deferred();
  let starts = 0;
  cron.add('slow', '* * * * *', () => {
    starts += 1;
    return gate.promise;
  });

  t = utc(2024, 3, 1, 10, 1);
  eq(cron.tick(), ['slow']);
  t = utc(2024, 3, 1, 10, 2);
  eq(cron.tick(), [], 'still running');
  t = utc(2024, 3, 1, 10, 3);
  eq(cron.tick(), []);
  eq(starts, 1);
  eq(cron.stats('slow'), { runs: 1, errors: 0, skipped: 2 });
});

test('once the slow job settles it is eligible again', async () => {
  let t = utc(2024, 3, 1, 10, 0);
  const cron = new Scheduler({ now: () => t });
  const gate = deferred();
  cron.add('slow', '* * * * *', () => gate.promise);

  t = utc(2024, 3, 1, 10, 1);
  cron.tick();
  t = utc(2024, 3, 1, 10, 2);
  cron.tick();
  gate.resolve();
  await sleep(0); // let the promise handlers run

  t = utc(2024, 3, 1, 10, 3);
  eq(cron.tick(), ['slow']);
  eq(cron.stats('slow'), { runs: 2, errors: 0, skipped: 1 });
});

test('a job that throws does not stop the jobs after it', () => {
  let t = utc(2024, 3, 1, 10, 0);
  const cron = new Scheduler({ now: () => t });
  const ran = [];
  cron.add('first', '* * * * *', () => ran.push('first'));
  cron.add('broken', '* * * * *', () => {
    throw new Error('boom');
  });
  cron.add('third', '* * * * *', () => ran.push('third'));

  t = utc(2024, 3, 1, 10, 1);
  eq(cron.tick(), ['first', 'broken', 'third']);
  eq(ran, ['first', 'third']);
});

test('onError sees the error and the job name, sync or async', async () => {
  let t = utc(2024, 3, 1, 10, 0);
  const seen = [];
  const cron = new Scheduler({
    now: () => t,
    onError: (err, name) => seen.push([name, err.message]),
  });
  cron.add('sync', '* * * * *', () => {
    throw new Error('sync boom');
  });
  cron.add('async', '* * * * *', async () => {
    throw new Error('async boom');
  });

  t = utc(2024, 3, 1, 10, 1);
  cron.tick();
  await sleep(0);
  eq(seen, [
    ['sync', 'sync boom'],
    ['async', 'async boom'],
  ]);
});

test('a failed job is rescheduled like any other', async () => {
  let t = utc(2024, 3, 1, 10, 0);
  const cron = new Scheduler({ now: () => t, onError: () => {} });
  const gate = deferred();
  cron.add('flaky', '* * * * *', () => gate.promise);

  t = utc(2024, 3, 1, 10, 1);
  cron.tick();
  gate.reject(new Error('nope'));
  await sleep(0);
  eq(cron.stats('flaky'), { runs: 1, errors: 1, skipped: 0 });

  t = utc(2024, 3, 1, 10, 2);
  eq(cron.tick(), ['flaky'], 'a failure is not a death sentence');
  eq(cron.stats('flaky').runs, 2);
});
