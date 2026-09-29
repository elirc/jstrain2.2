// clock.js — an injectable clock so time is a value, not a side effect.
//
// makeClock(startMs) returns { now(), advance(ms) }. now() is
// milliseconds, like Date.now() — tests advance it by hand.

export function makeClock(startMs = 0) {
  let nowMs = startMs;
  return {
    now: () => nowMs,
    advance: (ms) => {
      nowMs += ms;
    },
  };
}
