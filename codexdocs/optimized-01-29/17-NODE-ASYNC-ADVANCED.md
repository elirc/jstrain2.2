# 17 — Advanced Node async

## Outcome

Use streams, child processes, workers, and backpressure only when their
resource and isolation benefits match the workload.

## The 80/20 model

Streams coordinate producer and consumer rates. A writable returning `false`
signals backpressure; pipelines connect completion, error, and cleanup. Buffering
all chunks defeats streaming and can turn input size into memory exhaustion.

Child processes provide OS/process isolation and external program execution.
Worker threads move CPU-heavy JavaScript off the event-loop thread; they do not
make I/O automatically faster. Both require protocol, error, cancellation,
resource limit, and shutdown design.

Measure event-loop delay and actual CPU/memory behavior before adding workers.
Parallelism has serialization and coordination costs.

## Common traps

- Ignoring stream backpressure.
- Missing errors on one side of a pipe.
- Shell execution with interpolated input.
- Worker per request with unbounded creation.
- Child stdout/stderr buffers filling and blocking.
- Terminating workers without reconciling owned jobs.

## Optimized exercises

1. **Stream:** process large JSONL ticket exports with bounded memory,
   backpressure, malformed-line reporting, and cancellation.
2. **Worker:** compare CPU-heavy report calculation on main thread and a fixed
   worker pool; measure latency and serialization overhead.
3. **Application:** choose one RelayDesk background task and justify same
   process, worker thread, child process, or separate service; prototype its
   shutdown/failure protocol.

## Exit gate

Explain which resource is saturated, how backpressure is communicated, and who
owns cleanup for one advanced async design.

More reps: `../../bootcamp/17-node-async-advanced/`.

