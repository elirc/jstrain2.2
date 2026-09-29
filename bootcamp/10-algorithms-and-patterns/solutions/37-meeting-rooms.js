// ─────────────────────────────────────────────────────────────────────────
//  37 · minMeetingRooms — SOLUTION                          ★★★ stretch
//  concepts: pattern: interval sweep line · sorted starts vs sorted ends
//  run: node 37-meeting-rooms.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: sweep line over intervals.
//  Smell: "how many things are happening at once" / "minimum resources to
//  cover overlapping intervals" — you want the PEAK of a running count,
//  not an assignment of meetings to rooms.
//  Split the pairs into a sorted list of starts and a sorted list of ends.
//  Walk the starts; before opening each meeting, close every meeting that
//  has already ended (`ends[e] <= start`). The high-water mark of the open
//  counter is the answer. This is exactly the merge step from exercise 05
//  applied to two event streams.
//  Time O(n log n) for the two sorts, space O(n). The naive version
//  compares every pair of meetings, O(n²), and still has to reason about
//  chains of overlaps. A min-heap of end times is the other O(n log n)
//  answer and is what you would say in an interview if asked for it.
//  Bites: `<=` on the end comparison is what makes touching meetings share
//  a room; `<` silently books an extra room forever. And sort the two
//  COPIES — sorting `meetings` itself mutates the caller's data.

import { test, eq } from '../../_lib/check.js';

export function minMeetingRooms(meetings) {
  const starts = meetings.map(([start]) => start).sort((a, b) => a - b);
  const ends = meetings.map(([, end]) => end).sort((a, b) => a - b);
  let open = 0;
  let peak = 0;
  let next = 0; // index into ends
  for (const start of starts) {
    while (next < ends.length && ends[next] <= start) {
      open -= 1;
      next += 1;
    }
    open += 1;
    if (open > peak) peak = open;
  }
  return peak;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('needs a second room for an overlap', () => {
  eq(minMeetingRooms([[0, 30], [5, 10], [15, 20]]), 2);
});

test('reuses one room for meetings that never overlap', () => {
  eq(minMeetingRooms([[7, 10], [2, 4]]), 1);
});

test('a meeting ending as another starts shares the room', () => {
  eq(minMeetingRooms([[1, 5], [5, 9]]), 1);
  eq(minMeetingRooms([[1, 5], [5, 9], [9, 12]]), 1);
});

test('identical meetings each need their own room', () => {
  eq(minMeetingRooms([[1, 2], [1, 2], [1, 2]]), 3);
});

test('a long meeting overlapping short ones needs two rooms', () => {
  eq(minMeetingRooms([[1, 10], [2, 3], [4, 5]]), 2);
});

test('counts the peak, not the total overlaps', () => {
  eq(minMeetingRooms([[1, 4], [2, 5], [3, 6], [7, 8]]), 3);
});

test('an empty day needs no rooms', () => {
  eq(minMeetingRooms([]), 0);
  eq(minMeetingRooms([[3, 4]]), 1);
});

test('does not modify the input', () => {
  const meetings = [[5, 10], [0, 30]];
  minMeetingRooms(meetings);
  eq(meetings, [[5, 10], [0, 30]]);
});
