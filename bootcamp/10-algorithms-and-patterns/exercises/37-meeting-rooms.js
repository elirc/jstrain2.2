// ─────────────────────────────────────────────────────────────────────────
//  37 · minMeetingRooms                                     ★★★ stretch
//  concepts: pattern: interval sweep line · sorted starts vs sorted ends
//  run: node 37-meeting-rooms.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Given meetings as [start, end] pairs, how many rooms does the day need?
//  Ends are EXCLUSIVE: a meeting that ends at 10 frees the room for one
//  starting at 10.
//
//      minMeetingRooms([[0, 30], [5, 10], [15, 20]])  → 2
//      minMeetingRooms([[7, 10], [2, 4]])             → 1
//      minMeetingRooms([[1, 5], [5, 9]])              → 1   (touching)
//
//  You are not matching meetings to rooms — you only need the PEAK number
//  of meetings running at the same instant. Walk time forward and track
//  how many are open right now.
//
//  hint: pull the starts and the ends into two sorted lists and merge-walk
//        them; do not sort the pairs themselves, and do not mutate them

import { test, eq } from '../../_lib/check.js';

export function minMeetingRooms(meetings) {
  throw new Error('TODO');
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
