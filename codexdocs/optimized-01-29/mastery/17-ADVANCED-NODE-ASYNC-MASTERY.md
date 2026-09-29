# 17 — advanced Node async mastery bank

Deepen: streams, backpressure, subprocesses, worker threads, concurrency control, cancellation, and observability.

## Explain

- [ ] Explain stream backpressure using buffer growth, `write()` return values, and `drain`.
- [ ] Explain when to use async I/O, a child process, a worker thread, or a separate service.
- [ ] Explain the lifecycle and failure contract of a stream pipeline.
- [ ] Explain structured-clone and transfer costs when communicating with worker threads.
- [ ] Explain why concurrency limits protect latency, memory, and downstream dependencies.

## Predict

- [ ] Predict memory behavior when a fast readable pipes through a slow custom writable.
- [ ] Predict pipeline settlement when the middle transform errors after emitting some output.
- [ ] Predict command behavior for `spawn` with and without `shell: true` and hostile input.
- [ ] Predict which worker values are copied, transferred, rejected, or shared.
- [ ] Predict queue latency and throughput as concurrency exceeds the slowest dependency capacity.

## Implement

- [ ] Build a CSV-to-JSON stream pipeline with validation, metrics, and atomic destination handling.
- [ ] Build a subprocess wrapper with timeout, cancellation, output limits, and typed results.
- [ ] Build a worker-thread pool with bounded queueing, job IDs, error propagation, and shutdown.
- [ ] Build an async task queue with concurrency, retries, jitter, cancellation, and fairness.
- [ ] Add event-loop lag, queue depth, duration, and failure instrumentation to an async workload.

## Test

- [ ] Test backpressure with a controlled slow writable rather than timing guesses.
- [ ] Test subprocess success, nonzero exit, signal, timeout, oversized output, and spawn failure.
- [ ] Test worker crash, malformed messages, job cancellation, queue saturation, and termination.
- [ ] Test concurrency bounds by measuring active work with a deterministic deferred-task harness.
- [ ] Run a load test and assert bounded memory, acceptable event-loop lag, and complete cleanup.

## Debug and review

- [ ] Diagnose a buffering transform that defeats streaming and repair its memory profile.
- [ ] Repair an unhandled stream error that sometimes crashes production.
- [ ] Diagnose a parent/child deadlock caused by unread stdout or stderr pipes.
- [ ] Find worker and listener leaks that prevent clean process shutdown.
- [ ] Review CPU-heavy `Promise.all` code and select an execution model using measurements.

## Apply

- [ ] Build a bounded RelayDesk bulk importer with per-record outcomes and restart checkpoints.
- [ ] Offload a CPU-heavy report while preserving request cancellation and trace correlation.
- [ ] Build a webhook delivery queue with backoff, idempotency, dead letters, and concurrency limits.
- [ ] Write an operational note for overload, worker failure, queue drain, and graceful deployment.
- [ ] Benchmark sequential, unbounded, bounded, and worker-based versions; defend the chosen design.
