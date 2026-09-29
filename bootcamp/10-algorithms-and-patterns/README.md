# 10 · Algorithms and Patterns

Nobody memorises four hundred interview questions. What actually transfers is
a short list of PATTERNS — two pointers, sliding window, frequency counting,
binary search, backtracking, divide and conquer, dynamic programming — plus
the ability to smell which one a problem wants within thirty seconds of
reading it. This module drills the patterns by name, one problem at a time, so
that "find the longest substring without repeats" stops being a puzzle you
either know or don't, and becomes "that's a variable-size window, I've built
one of those".

## The mental model

**1. Pattern recognition beats memorisation.** Problems announce their pattern
through a handful of smells. Learn the table, not the problems:

| The problem smells like… | Reach for | Why it works |
|---|---|---|
| sorted array, find a pair/triple | two pointers | sortedness lets you steer the sum |
| reverse / palindrome / in-place compaction | two pointers | one cursor from each end, or read+write |
| "contiguous" + fixed length k | fixed sliding window | add the entering item, drop the leaving one |
| "longest/shortest contiguous run such that…" | variable sliding window | grow right, shrink left while still valid |
| "how many times does X appear", anagrams, top-k | frequency counting (Map) | one pass to count, one pass to answer |
| sorted array, "find where…" | binary search | halve the range every step |
| "smallest/largest x such that f(x) is true" | binary search on the answer | the predicate flips exactly once |
| "minimise the max" / "can we do it in D days with capacity C?" | binary search on the answer | feasibility is monotone; write the predicate first |
| "sum of a range", asked over and over | prefix sums | a subarray sum is a difference of two running totals |
| "how many subarrays sum to k" WITH negatives | prefix sums + hash map | windows need monotone growth; negatives kill it |
| "next greater / previous smaller / span / how long until…" | monotonic stack | pop everyone the new value just answered |
| "how many overlap at once" / "most non-overlapping" | interval sweep or sort-by-end greedy | events in time order; the earliest end frees the most room |
| "can I reach…" / "fewest to cover…" where a local choice is provably safe | greedy | one pass with a frontier or a running balance |
| "all combinations / permutations / subsets" | backtracking | choose → explore → un-choose |
| "sort it yourself" / "merge sorted things" | divide and conquer | split, solve halves, combine |
| "fewest / most ways / longest common…" | dynamic programming | same subproblem asked over and over |
| grid traversal in a shape | boundary shrinking | four edges, pull each in after use |

**2. Two pointers = trade a nested loop for arithmetic.** Any time you catch
yourself writing `for i { for j }`, ask what the inner loop is really looking
for and whether sortedness or a running total can find it directly.

```js
// O(n) instead of O(n²): steer the sum with two cursors
let left = 0, right = sorted.length - 1;
while (left < right) {
  const sum = sorted[left] + sorted[right];
  if (sum === target) return [left, right];
  sum < target ? left++ : right--;
}
```

**3. A cache turns exponential into linear.** Recursion that asks the same
question twice is the whole opening for dynamic programming. Memoisation is
literally "recursion + a Map".

```js
const cache = new Map();
const fib = (n) => {
  if (cache.has(n)) return cache.get(n);       // 21 computations for n = 20…
  const v = n < 2 ? n : fib(n - 1) + fib(n - 2); // …instead of 21,891 calls
  cache.set(n, v);
  return v;
};
```

**4. Name the pattern out loud before you type.** In an interview, "this is a
variable-size sliding window; I'll keep a Map of last-seen indices, O(n) time
and O(k) space" buys you more credit than silently producing correct code. In
your own codebase it buys you a reviewer who can follow the diff.

## The big-O primer, in plain English

Big-O answers one question: **when the input gets 10× bigger, what happens to
the work?** Constants and small terms are dropped because they stop mattering
at scale.

| Notation | Called | 10× more input means | Typical source |
|---|---|---|---|
| O(1) | constant | nothing changes | Map lookup, array index, arithmetic |
| O(log n) | logarithmic | ~3 more steps | binary search, balanced tree |
| O(n) | linear | 10× the work | one pass over the data |
| O(n log n) | linearithmic | ~13× | a good sort, divide and conquer |
| O(n²) | quadratic | 100× | nested loops over the same array |
| O(2ⁿ) | exponential | hopeless | subsets, naive recursion with no cache |
| O(n!) | factorial | more hopeless | permutations |

Reading rules of thumb:

- Loops multiply, sequential passes add. Two passes over n is `O(2n)` = `O(n)`,
  a loop inside a loop is `O(n²)`.
- A loop that halves each step is `O(log n)`; a loop that doubles work each
  step is `O(2ⁿ)`.
- `.includes()` / `.indexOf()` inside a loop is a hidden nested loop. That is
  the single most common accidental `O(n²)` in JavaScript.
- Space complexity counts what YOU allocate — the output array usually gets a
  mention but the interesting number is the extra working memory.
- "It's only 100 items" is a fine reason to keep the `O(n²)`. Say that out
  loud too; knowing when NOT to optimise is part of the skill.

## The details that bite

1. **`while (low <= high)`, not `<`.** With `<`, a range of one element is
   never examined and lookups silently miss.
   ```js
   // [2] with target 2 → -1 if the loop condition is `low < high`
   ```
2. **Always move past `mid`.** `high = mid` (instead of `mid - 1`) is the
   classic infinite loop.
3. **Sliding-window left edges never move backwards.**
   `left = Math.max(left, lastSeen + 1)` — without the `max`, `'abba'` drags
   the window back over a duplicate and reports 3.
4. **`%` keeps the sign of the left operand.** `-1 % 26 === -1`. For "always
   non-negative" use `((k % n) + n) % n` — rotations, ciphers, ring buffers.
5. **`k % 0` is `NaN`.** Guard the empty array before normalising a rotation.
6. **Backtracking must push a COPY.** `out.push(path)` stores the same array
   2ⁿ times, and after the final `pop()` every entry is empty. `[...path]`.
7. **Stability is one character.** Take from the left on ties (`<= 0` in a
   merge, `> 0` in an insertion shift). In-place quicksort isn't stable —
   its long-range swaps hurl equal items past each other. Out-of-place
   variants that partition into fresh arrays can be.
8. **`Array.prototype.sort()` is stable and it sorts strings by default.**
   `[10, 9].sort()` → `[10, 9]`. Always pass a comparator for numbers.
9. **Use a `Map`, not `{}`, for counting.** A bare object inherits keys:
   `counts['constructor']` starts life as a function, not `undefined`.
10. **Sentinels: `Infinity` beats `-1` inside the loop.** Compute with
    `Infinity` for "impossible", convert to `-1`/`0` on the way out, or your
    arithmetic quietly produces answers like `0` coins.
11. **Empty input, one element, all-same values, target absent.** Four
    questions to ask of every solution before you call it done — they are
    exactly what the tests in this module probe.
12. **An "internal node" is not a leaf.** Path problems end at leaves; hitting
    the target part way down is not a match, and negative values below can
    undo an early hit.

## Exercises

| # | file | ★ | what you build |
|---|---|---|---|
| 01 | `01-pair-with-target-sum.js` | ★★☆ | two pointers: find a pair summing to a target in a sorted array |
| 02 | `02-reverse-and-rotate.js` | ★★☆ | in-place reverse, then rotate by k with the three-reversal trick |
| 03 | `03-is-palindrome.js` | ★☆☆ | palindrome check that skips punctuation and case |
| 04 | `04-remove-duplicates.js` | ★★☆ | fast/slow pointers: compact a sorted array in place |
| 05 | `05-merge-sorted.js` | ★☆☆ | merge two sorted arrays in one pass (the merge step) |
| 06 | `06-max-window-sum.js` | ★★☆ | fixed sliding window: best sum of k consecutive values |
| 07 | `07-longest-unique-substring.js` | ★★★ | variable window + last-seen map: longest run without repeats |
| 08 | `08-smallest-subarray-sum.js` | ★★★ | variable window: shortest run summing to ≥ target |
| 09 | `09-anagram-and-first-unique.js` | ★☆☆ | frequency counting: valid anagram, first non-repeating character |
| 10 | `10-majority-and-top-k.js` | ★★☆ | counts → ranking: majority element, top-k frequent |
| 11 | `11-binary-search.js` | ★☆☆ | classic binary search + search-insert position |
| 12 | `12-first-last-occurrence.js` | ★★★ | binary search for boundaries: first and last index of a value |
| 13 | `13-integer-sqrt.js` | ★★☆ | binary search on the answer space: floor(sqrt(n)) |
| 14 | `14-subsets.js` | ★★★ | backtracking: the power set, include/exclude |
| 15 | `15-permutations.js` | ★★★ | backtracking: distinct permutations of a string |
| 16 | `16-nested-path-sum.js` | ★★☆ | recursion over a nested tree: root-to-leaf path sum |
| 17 | `17-insertion-sort.js` | ★★☆ | insertion sort in place, stable, with a comparator |
| 18 | `18-merge-sort.js` | ★★★ | divide and conquer: stable merge sort |
| 19 | `19-quicksort.js` | ★★★ | in-place quicksort with Lomuto partition |
| 20 | `20-run-length.js` | ★★☆ | run-length encode and decode (multi-digit counts) |
| 21 | `21-caesar-cipher.js` | ★☆☆ | Caesar shift and ROT13 with character-code arithmetic |
| 22 | `22-subsequence-and-prefix.js` | ★☆☆ | isSubsequence + longest common prefix |
| 23 | `23-fib-memo.js` | ★★☆ | memoisation: fib with a cache (call counts asserted), climbing stairs |
| 24 | `24-coin-change.js` | ★★★ | bottom-up DP: fewest coins, and why greedy is wrong |
| 25 | `25-lcs-length.js` | ★★★ | 2-D DP grid: longest common subsequence length |
| 26 | `26-spiral-order.js` | ★★★ | matrix traversal with shrinking boundaries |

Do the warm-ups and core in order — the patterns build on each other (05's
merge returns in 18; 02's reverse is the rotation trick; 23's cache is the
door into 24 and 25). Stretch if time allows.

Run one file at a time:

```
node exercises/01-pair-with-target-sum.js
```

Every test starts as `todo`. Turn them green, then read the matching file in
`solutions/` — the walkthrough names the pattern, gives the time and space
complexity, and says which naive approach it beats. That last sentence is the
one to say out loud in an interview.

### Extra reps

Same format, grouped by pattern instead of by difficulty. Take a whole group
in one sitting — the point is to do the pattern often enough that recognising
it stops being a decision. Five of the groups are patterns the first
twenty-six exercises never touch: prefix sums, monotonic stacks, intervals,
greedy proofs, and binary search on the answer with a real predicate.

| # | file | ★ | what you build |
|---|---|---|---|
| **two pointers** | | | |
| 27 | `27-three-sum.js` | ★★★ | sort + fix one + two pointers, with duplicate skipping |
| 28 | `28-container-with-most-water.js` | ★★☆ | converge from the ends, always moving the shorter wall |
| 29 | `29-sorted-squares-and-move-zeroes.js` | ★★☆ | fill from the back; read/write compaction in place |
| **sliding window** | | | |
| 30 | `30-max-vowels-in-window.js` | ★☆☆ | fixed window: add the entering item, drop the leaving one |
| 31 | `31-longest-k-distinct.js` | ★★☆ | variable window + a Map of counts (delete keys at 0) |
| 32 | `32-min-window-substring.js` | ★★★ | minimum window substring: need-map + a `missing` counter |
| **prefix sums** | | | |
| 33 | `33-range-sum-queries.js` | ★☆☆ | build the running-total index, answer ranges in O(1) |
| 34 | `34-subarray-sum-equals-k.js` | ★★★ | prefix sums + hash map, the version windows can't do |
| 35 | `35-product-except-self.js` | ★★☆ | prefix × suffix passes, no division |
| **monotonic stack** | | | |
| 36 | `36-next-greater-and-temperatures.js` | ★★★ | next greater element and daily temperatures, one stack |
| **intervals** | | | |
| 37 | `37-meeting-rooms.js` | ★★★ | sweep line: how many rooms the day needs at its peak |
| 38 | `38-max-non-overlapping.js` | ★★☆ | greedy by earliest END, with the exchange argument |
| **greedy** | | | |
| 39 | `39-jump-game.js` | ★★☆ | furthest-reach frontier in one pass |
| 40 | `40-gas-station.js` | ★★★ | circular route: total surplus + restart on empty |
| 41 | `41-assign-cookies.js` | ★☆☆ | greedy matching over two sorted lists |
| **binary search on the answer** | | | |
| 42 | `42-koko-eating-speed.js` | ★★★ | smallest rate that fits the budget; write the predicate first |
| 43 | `43-ship-capacity.js` | ★★★ | minimise the max: capacity search with a greedy check |
| **dynamic programming** | | | |
| 44 | `44-house-robber-and-unique-paths.js` | ★★☆ | rolling 1-D table, then a 2-D grid count |
| 45 | `45-edit-distance.js` | ★★★ | Levenshtein grid: match free, else 1 + min of three |
| 46 | `46-knapsack.js` | ★★★ | 0/1 knapsack — and why the loop runs backwards |
| 47 | `47-word-break.js` | ★★★ | reachable positions in a string; the greedy cut is wrong |
| **backtracking** | | | |
| 48 | `48-combination-sum.js` | ★★☆ | reuse allowed, start index kills duplicate orderings |
| 49 | `49-n-queens-count.js` | ★★★ | three constraint Sets, prune before you recurse |
| 50 | `50-sudoku-validator.js` | ★★☆ | rows/columns/boxes at once, and the box-index idiom |
| **strings** | | | |
| 51 | `51-prefix-function.js` | ★★★ | KMP prefix function + a search that never rewinds |
| 52 | `52-longest-palindromic-substring.js` | ★★★ | expand around center — all 2n − 1 of them |

---

**Stuck?** `cheatsheets/big-o.md` (classic algorithms, measured timings) · **Self-check:** `quizzes/07-data-structures-algorithms.md` · **Next:** `bootcamp/11-functional-programming`
