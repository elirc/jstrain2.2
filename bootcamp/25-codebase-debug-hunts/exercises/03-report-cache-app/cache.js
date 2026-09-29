// cache.js — a tiny TTL cache over an injected clock.
//
// makeCache(clock) returns { get(key), set(key, value, ttlMs) }.
// ttlMs is in MILLISECONDS, same unit as clock.now(). An entry is
// served until clock.now() has moved ttlMs past its write time, then
// get() misses and drops it.

export function makeCache(clock) {
  const entries = new Map();
  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (clock.now() - entry.at >= entry.ttlMs) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value, ttlMs) {
      entries.set(key, { value, at: clock.now(), ttlMs });
    },
  };
}
