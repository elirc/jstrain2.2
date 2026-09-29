# 23 · Node Drills — Second Reps

You have already been taught everything in this module. That is the point.
A review of the Node track found a handful of ideas that carry most of the
weight in interviews and in production — the event loop's lanes, streams
that fail, crash-safe writes, injected time, workers and children — and
found that you met each of them exactly once. Once is enough to follow an
explanation. It is not enough to produce the answer cold, at a whiteboard,
with someone watching, which is the only test that counts.

So these are drills, not lessons. Every prompt here is deliberately
hint-free: re-reading a hint feels like learning and is not, while
dragging an answer out of your own memory is the thing that actually
moves it. Expect the first attempt of each file to be slower and more
uncomfortable than the module it came from — that discomfort is the
retrieval working. When you get stuck for more than ten minutes, read the
solution's walkthrough, close it, and write the file again from scratch
rather than patching what you had.

## When to run these

- **After FLIGHTPLAN-2 hours 6–9.** Modules 17, 18, 19 and 20 own the
  first pass; these are the second rep on top of them. Doing a drill
  before its parent module is just a hard exercise with no teaching.
- **On the flight home.** The whole module is offline, zero-dependency
  and fast: nothing here sleeps for more than ~300 ms, and the
  injected-clock files (10, 11, 14) assert hours of policy in zero real
  milliseconds. A drill file is a 10–20 minute unit of work.
- **The week before an interview.** Files 01–03, 09 and 12 are the ones
  that come up out loud.
- **Any time a drill is boring.** That is the goal state — it means the
  material is finally yours. Skip it and spend the hour on 14.

## Score yourself

Do a file, then rate it honestly. The number you want is a 4, not a 5:
a file you had to think about and still got right is worth more than one
you already knew.

| score | what it looked like |
| --- | --- |
| 5 | Wrote it straight through, tests green first run, no re-reading |
| 4 | One wrong assumption, spotted it from a failing test, fixed it |
| 3 | Needed to re-derive the rule (lane order, drain semantics) mid-file |
| 2 | Opened the parent module's README to get moving |
| 1 | Read the solution's walkthrough before finishing |

**Anything at 3 or below: redo that file from an empty editor within two
days.** Not the same day — the gap is where the strengthening happens.
A 1 or 2 on files 01–03 means going back to module 17's README first;
those three are pure recall and there is nothing to reason your way to.

## The rules these drills are testing

The lane order, which decides files 01–03. Everything queued below runs
to exhaustion before the next line down gets a turn:

```
1. the synchronous code you are in
2. the nextTick queue      — including ticks queued BY ticks
3. the microtask queue     — .then, await resumption, queueMicrotask
4. libuv's phases          — timers → … → poll → check (setImmediate)
```

Two consequences worth having on instant recall: a `process.nextTick`
queued from inside a microtask waits for the WHOLE microtask drain to
finish, and inside any I/O callback `setImmediate` always beats
`setTimeout(…, 0)` — no race, no coin flip.

| the reflex | the drill |
| --- | --- |
| `pipeline()`, never `.pipe().pipe()` | 04 |
| a stream stage keeps state between chunks; `flush` is a real event | 05 |
| `write()` returning false is advice — obey it or buffer everything | 06 |
| the newline is the commit marker; replay is gated on a sequence number | 07 |
| two files means two commit points; one file plus rename means one | 08 |
| a 304 repeats the validator and drops the entity headers | 09 |
| a unit that reads the clock takes the clock as a parameter | 10, 11 |
| one channel with overlapping conversations needs correlation ids | 12 |
| a non-zero exit is a result; wait for `close`, not `exit` | 13 |
| `Promise.race` cancels nothing — hold the losing promise | 14 |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-lane-gauntlet-timer.js` | ★★☆ | three snippets anchored in a timer: predict every printed order |
| 02 | `02-lane-gauntlet-io.js` | ★★☆ | the same, from inside I/O callbacks, including I/O nested in I/O |
| 03 | `03-lane-gauntlet-await.js` | ★★★ | the boss: async functions, await resumption, a promise resolved by a timer |
| 04 | `04-pipeline-error-cleanup.js` | ★★★ | a Transform that fails mid-stream — prove the cleanup and the partial output |
| 05 | `05-object-mode-records.js` | ★★★ | a line splitter rebuilt in objectMode, emitting parsed records, with flush |
| 06 | `06-backpressure-count.js` | ★★★ | count the drains by hand, then let `pipeline` do it and watch the counter go quiet |
| 07 | `07-wal-damage-cases.js` | ★★★ | three damaged logs: torn tail, duplicated op, rewound sequence |
| 08 | `08-atomic-retrofit.js` | ★★★ | retrofit a two-file save that tears into one that cannot |
| 09 | `09-conditional-response.js` | ★★☆ | `respondTo(req, resource)`: 200 vs 304, weak ETags, `*`, Vary, HEAD |
| 10 | `10-retry-injected-scheduler.js` | ★★★ | retry with backoff on an injected scheduler — assert `[100, 200, 400]`, wait for none of it |
| 11 | `11-token-bucket-clock.js` | ★★☆ | a token bucket on an injected clock, with no timer anywhere in it |
| 12 | `12-worker-lifecycle.js` | ★★★ | one worker, correlation ids, and a shutdown that drains before it terminates |
| 13 | `13-child-batch-limit.js` | ★★☆ | three children, two at a time, one bad exit code that must not sink the batch |
| 14 | `14-boss-batching-pipeline.js` | ★★★ | batch by size OR by deadline, ordered, on a fake clock — the compose-it-all file |

Do them in order; each one leans on the reflex the one before it built.
There are no warm-ups in this module by design — a drill you can do
without thinking is not a drill.

Run one file at a time:

```
node exercises/01-lane-gauntlet-timer.js
```

Every test should say `todo` before you start and `all green — next file!`
when you are done. The `solutions/` copy of each file has the same tests
plus a walkthrough that names the concept, the reason for the shape, and
the classic wrong turn — read it after your own attempt, not before.

Exercise 08 writes real files, under `23-node-drills/tmp-test/<uuid>/`,
and deletes them in a `finally`. Exercises 12 and 13 start real threads
and real child processes, so they are the two slow files here; everything
else finishes in well under a second.

---

**No "Stuck?" line here, on purpose** — reinforcement and hunt modules send you looking for the reference yourself; that retrieval is the rep. · **Next:** `bootcamp/24-debug-hunts`
