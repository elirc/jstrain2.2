// report.js — the expensive report, cached for five minutes.
//
// makeReportService(clock, compute) returns { get(name) }: the first
// call for a name computes, calls inside the next five minutes are
// served from cache, and after five minutes the next call recomputes.

import { makeCache } from './cache.js';

const CACHE_FOR = 300; // five minutes

export function makeReportService(clock, compute) {
  const cache = makeCache(clock);
  return {
    get(name) {
      const cached = cache.get(name);
      if (cached !== undefined) return cached;
      const report = compute(name);
      cache.set(name, report, CACHE_FOR);
      return report;
    },
  };
}
