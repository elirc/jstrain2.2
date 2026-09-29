// ─────────────────────────────────────────────────────────────────────────
//  12 · cron scheduler — SOLUTION                           ★★★ capstone
//  concepts: parsing · UTC date math · injected clocks · job isolation
//  time: 35–45 min · 4 stages · 24 tests
//  run: node 12-cron-scheduler.js
// ─────────────────────────────────────────────────────────────────────────
//
//  WALKTHROUGH
//
//  Architecture. Three pieces, each testable on its own, and that split
//  IS the design: a parser (string → sets of allowed numbers), a search
//  (sets + an instant → the next matching instant), and a scheduler
//  (jobs + a clock → who runs now). Nobody sleeps, nothing is global,
//  and every test in this file finishes in microseconds because the only
//  clock in the system is a function you passed in.
//
//  Stage 1 — the parser. Each field becomes a sorted array of the
//  numbers it allows, which is the representation that makes stage 2
//  trivial: matching is `set.has(value)`, and there is nothing left to
//  interpret at run time. Two details worth keeping: `*/10` steps from
//  the field's OWN minimum (day-of-month starts at 1, so `*/10` is
//  1, 11, 21, 31 — not 0, 10, 20, 30), and a comma list is a union, so
//  a Set deduplicates `5,5,0` for free before you sort it. Validate
//  hard and early — a cron string is configuration, and configuration
//  that is wrong should fail at startup, not silently never run.
//
//  Stage 2 — the search. The naive version adds a minute at a time and
//  checks all five fields; that is up to two million iterations for a
//  yearly job. Instead, jump by the biggest field that does not match:
//  wrong month → skip to the 1st of the next month, wrong day → skip to
//  midnight tomorrow, wrong hour → skip to the next hour. A few hundred
//  iterations covers four years. Three more things bite here:
//    · "Next" must be STRICTLY after, so start from the following whole
//      minute and clear the seconds — otherwise a job that just ran is
//      due again immediately and fires in a tight loop.
//    · Everything is UTC. A scheduler on local time skips an hour or
//      runs a job twice every daylight-saving change; the operational
//      answer is to keep the engine in UTC and convert only for display.
//    · Day-of-month and day-of-week are OR-ed when BOTH are restricted.
//      `0 0 1 * 1` means "the 1st, and also every Monday". It looks like
//      a bug, it is in the POSIX spec, and every cron does it.
//
//  Stage 3 — the scheduler. `tick()` asks the clock once, then for each
//  due job reschedules FIRST and runs second. Rescheduling from "now"
//  and not from the missed slot is what makes a laptop that was asleep
//  for three hours run the hourly job once rather than three times.
//  Catch-up is a product decision; silent catch-up storms are not.
//
//  Stage 4 — isolation ★. Two failure modes, both learned the hard way:
//    · A job that is still running must not be started again. Without
//      the `running` flag, a 5-minute report on a 1-minute schedule ends
//      up with five copies fighting over the same rows.
//    · One job's exception must never abort the tick loop. try/catch
//      around the sync call, plus a rejection handler on the promise —
//      and the flag must be cleared in BOTH paths, or one failure wedges
//      that job forever ("it stopped running and nothing was logged").
//
//  Classic wrong turn: `setInterval(tick, 60_000)` inside the Scheduler.
//  Now the clock is real, the tests sleep, the suite is slow and flaky,
//  and the process will not exit. Keep the scheduler pure — something
//  else owns the timer and calls tick().

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

// field name → [min, max], in cron's own order
const RANGES = {
  minute: [0, 59],
  hour: [0, 23],
  dayOfMonth: [1, 31],
  month: [1, 12],
  dayOfWeek: [0, 6],
};

export function parseCron(expr) {
  const parts = String(expr).trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`expected 5 fields, got ${parts.length}: "${expr}"`);
  }
  const spec = {};
  Object.keys(RANGES).forEach((name, i) => {
    spec[name] = parseField(parts[i], name);
  });
  return spec;
}

// One field → the sorted list of values it allows.
function parseField(text, name) {
  const [min, max] = RANGES[name];
  const values = new Set();

  for (const term of text.split(',')) {
    if (term === '*') {
      for (let v = min; v <= max; v += 1) values.add(v);
      continue;
    }
    const step = /^\*\/(\d+)$/.exec(term);
    if (step) {
      const n = Number(step[1]);
      if (n < 1) throw new Error(`step must be at least 1 in "${term}"`);
      for (let v = min; v <= max; v += n) values.add(v); // from the field's min
      continue;
    }
    if (!/^\d+$/.test(term)) {
      throw new Error(`cannot parse "${term}" in the ${name} field`);
    }
    const v = Number(term);
    if (v < min || v > max) {
      throw new Error(`${v} is out of range for ${name} (${min}-${max})`);
    }
    values.add(v);
  }
  return [...values].sort((a, b) => a - b);
}

// ── stage 2: the search ──────────────────────────────────────────────────

const nextMonth = (d) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
const nextDay = (d) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
const nextHour = (d) =>
  new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours() + 1
    )
  );

export function nextRun(expr, after = new Date()) {
  const spec = parseCron(expr);
  const allows = Object.fromEntries(
    Object.entries(spec).map(([name, values]) => [name, new Set(values)])
  );
  // "restricted" = not the whole range, which is what OR-ing depends on
  const domRestricted = spec.dayOfMonth.length !== 31;
  const dowRestricted = spec.dayOfWeek.length !== 7;

  const dayMatches = (d) => {
    const dom = allows.dayOfMonth.has(d.getUTCDate());
    const dow = allows.dayOfWeek.has(d.getUTCDay());
    return domRestricted && dowRestricted ? dom || dow : dom && dow;
  };

  // strictly after: the next whole minute, seconds and ms cleared
  const from = new Date(after).getTime();
  let t = new Date(Math.floor(from / 60000) * 60000 + 60000);
  const limit = t.getTime() + 4 * 366 * 24 * 60 * 60 * 1000; // ~4 years

  while (t.getTime() <= limit) {
    if (!allows.month.has(t.getUTCMonth() + 1)) {
      t = nextMonth(t);
    } else if (!dayMatches(t)) {
      t = nextDay(t);
    } else if (!allows.hour.has(t.getUTCHours())) {
      t = nextHour(t);
    } else if (!allows.minute.has(t.getUTCMinutes())) {
      t = new Date(t.getTime() + 60000);
    } else {
      return t;
    }
  }
  return null; // '0 0 30 2 *' — February the 30th is never coming
}

// ── stages 3 + 4: the scheduler ──────────────────────────────────────────

export class Scheduler {
  constructor({ now = () => Date.now(), onError } = {}) {
    this.now = now; // injected clock → epoch ms
    this.onError = onError; // stage 4: onError(err, jobName)
    this.jobs = new Map(); // name → job (insertion ordered)
  }

  // stage 3 — parse now (so a bad expression fails at startup) and work
  // out the first run from the current time.
  add(name, expr, fn) {
    if (this.jobs.has(name)) throw new Error(`duplicate job: ${name}`);
    const job = {
      name,
      expr,
      fn,
      next: nextRun(expr, new Date(this.now())),
      running: false,
      runs: 0,
      errors: 0,
      skipped: 0,
    };
    this.jobs.set(name, job);
    return this;
  }

  remove(name) {
    return this.jobs.delete(name);
  }

  nextRunAt(name) {
    return this.jobs.get(name)?.next ?? null;
  }

  stats(name) {
    const job = this.jobs.get(name);
    if (!job) return null;
    return { runs: job.runs, errors: job.errors, skipped: job.skipped };
  }

  // stage 3 — one look at the clock, then everything that is due.
  // stage 4 — a job already in flight is skipped, not started twice.
  tick() {
    const at = new Date(this.now());
    const fired = [];
    for (const job of this.jobs.values()) {
      if (job.next === null || job.next > at) continue;
      job.next = nextRun(job.expr, at); // reschedule from NOW: no catch-up
      if (job.running) {
        job.skipped += 1;
        continue;
      }
      fired.push(job.name);
      this.#start(job);
    }
    return fired;
  }

  // stage 4 — sync throw and async rejection, both handled, and the
  // running flag cleared on every path.
  #start(job) {
    job.runs += 1;
    job.running = true;
    try {
      const result = job.fn();
      if (result && typeof result.then === 'function') {
        result.then(
          () => {
            job.running = false;
          },
          (err) => {
            job.running = false;
            this.#fail(job, err);
          }
        );
      } else {
        job.running = false;
      }
    } catch (err) {
      job.running = false;
      this.#fail(job, err);
    }
  }

  #fail(job, err) {
    job.errors += 1;
    this.onError?.(err, job.name);
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
