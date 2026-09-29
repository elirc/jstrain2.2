# 07 · Data Structures and Algorithms — cost, fit, and pattern recognition

Cover the answer, commit out loud, then reveal. For the "which pattern" questions, name it before you read on.

---

### Q1 — cost of array operations

Give the average-case big-O for each: `arr[i]`, `arr.push(x)`, `arr.pop()`, `arr.shift()`, `arr.unshift(x)`, `arr.includes(x)`, `arr.splice(i, 1)`.

<details><summary>Answer</summary>

**`arr[i]` O(1) · `push`/`pop` O(1) amortized · `shift`/`unshift` O(n) · `includes` O(n) · `splice` O(n)** — anything that touches the *front* of an array has to reindex everything after it.

A JS array is a contiguous-ish indexed block, so reading or writing at a known index is constant time and appending is constant time until the engine has to grow and copy the backing store (hence "amortized"). `shift` and `unshift` move every remaining element by one slot. `includes`/`indexOf`/`find` scan linearly. This is why a queue built on `arr.shift()` is O(n) per dequeue and quietly becomes O(n²) over a big loop — use an index pointer or a real deque.
</details>

---

### Q2 — cost of Map, Set, and object

Give the average-case big-O for `map.get(k)`, `map.set(k, v)`, `set.has(x)`, `obj[k]`, and `Object.keys(obj)`.

<details><summary>Answer</summary>

**`get`/`set`/`has`/`obj[k]` are all O(1) average · `Object.keys` is O(n)** — hash-based lookup does not care how many entries there are.

That's the single highest-leverage optimization in everyday JS: replace a linear `find` inside a loop with one pre-built `Map`. A nested loop that scans `b` for every element of `a` is O(n·m); building `new Set(b)` first makes it O(n + m). The caveat is "average" — worst case is O(n) under adversarial hash collisions, and `Object.keys` has to materialize an array, so it's linear and allocates.
</details>

---

### Q3 — stacks and queues from arrays

What does this print?

```js
const stack = [];
stack.push(1, 2, 3);
console.log(stack.pop(), stack);
const queue = [1, 2, 3];
console.log(queue.shift(), queue);
const deque = [1, 2, 3];
deque.unshift(0);
console.log(deque, deque.at(-1));
```

<details><summary>Answer</summary>

**`3 [ 1, 2 ]`**, **`1 [ 2, 3 ]`**, **`[ 0, 1, 2, 3 ] 3`** — `push`/`pop` give you a LIFO stack; `push`/`shift` give you a FIFO queue.

Both mutate. A stack is the right structure whenever you need to "remember where you were and come back": bracket matching, undo history, iterative tree traversal, the call stack itself. A queue is right for level-order/breadth-first processing and for anything fair-ordered, like a job runner. Just remember Q1: `shift` is O(n), so a hot queue should track a head index instead of shifting.
</details>

---

### Q4 — reading loop complexity

What is the time complexity of each, in terms of `n = arr.length`?

```js
// A
for (const x of arr) sum += x;
// B
for (const x of arr) for (const y of arr) pairs++;
// C
for (const x of arr) if (other.includes(x)) hits++;   // other.length = m
// D
arr.sort((a, b) => a - b);
// E
for (let i = n; i > 1; i = Math.floor(i / 2)) steps++;
```

<details><summary>Answer</summary>

**A: O(n) · B: O(n²) · C: O(n·m) · D: O(n log n) · E: O(log n)** — count how many times the innermost line runs as a function of the input size.

Nested loops over the same collection multiply. C is the hidden quadratic: `includes` is itself a loop, so a linear-looking body is not linear — the same trap applies to `indexOf`, `find`, and `filter` used inside a loop. Comparison sorts cannot beat O(n log n), and V8's `sort` is Timsort. Halving (or doubling) each step is the signature of a logarithmic algorithm: binary search, balanced trees, repeated squaring.
</details>

---

### Q5 — chunking

What does this print?

```js
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
console.log(chunk([1, 2, 3, 4, 5], 2));
console.log(chunk([], 3));
```

<details><summary>Answer</summary>

**`[ [ 1, 2 ], [ 3, 4 ], [ 5 ] ]`**, then **`[]`** — the last chunk is short, and `slice` clamps past the end instead of throwing.

O(n) time and O(n) space. This is the shape you need constantly for batched API calls, paginated rendering, and rate-limited work: chunk, then `for (const batch of chunks) await Promise.all(batch.map(send))`. Note the loop increments by `size`, not by 1 — the most common way to get this wrong is a nested loop that re-scans. Empty input falls out correctly for free because the loop condition fails immediately.
</details>

---

### Q6 — stable dedupe by key

What does this print?

```js
function dedupeStable(items, keyOf) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const k = keyOf(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}
console.log(dedupeStable([{ e: 'a' }, { e: 'b' }, { e: 'a' }], (o) => o.e));
```

<details><summary>Answer</summary>

**`[ { e: 'a' }, { e: 'b' } ]`** — the first occurrence of each key wins and original order is preserved.

The pattern is "seen set + output array", O(n) time and O(n) space, and it generalizes to any derived key. `[...new Set(arr)]` only works when the elements themselves are primitives; the moment you're deduping objects by a field, you need this. Note it keeps the *first* record — if you want the last one to win, build a `Map` of key → item instead and take `[...map.values()]`.
</details>

---

### Q7 — top K

What does this print, and what is the cost?

```js
function topK(nums, k) {
  return [...nums].sort((x, y) => y - x).slice(0, k);
}
console.log(topK([5, 1, 9, 3, 7], 2));
console.log(topK([5, 1], 5));
```

<details><summary>Answer</summary>

**`[ 9, 7 ]`**, then **`[ 5, 1 ]`** — sorting costs O(n log n), and `slice` clamps when `k` exceeds the length.

The spread copy is deliberate: without it, `sort` would reorder the caller's array (module 03, Q8). Sort-then-slice is the right call for typical sizes and is what you should write first. When `n` is huge and `k` is small, a size-`k` min-heap gets you O(n log k), and quickselect gets O(n) average — mention that trade-off in an interview, but only implement it if asked.
</details>

---

### Q8 — name the pattern

What does this print, and what is the pattern called?

```js
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return null;
}
console.log(twoSum([2, 7, 11, 15], 9));
console.log(twoSum([3, 2, 4], 6));
console.log(twoSum([1, 2], 100));
```

<details><summary>Answer</summary>

**`[ 0, 1 ]`**, **`[ 1, 2 ]`**, **`null`** — this is the **hash map complement** pattern, and it turns O(n²) into O(n).

The naive solution checks every pair. Here, at each element you compute what its partner *would* be and ask the map whether you've already passed it — one pass, one lookup per element. Trading O(n) memory for a factor of n in time is the most common algorithmic move there is, and it's the same core idea as memoization, indexing, and caching. Trigger phrase: "find a pair / has this appeared before / count occurrences" → reach for a `Map` or `Set`.
</details>

---

### Q9 — name the pattern

What does this print, and what is the pattern called?

```js
function maxWindow(nums, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  let best = sum;
  for (let i = k; i < nums.length; i++) {
    sum += nums[i] - nums[i - k];
    best = Math.max(best, sum);
  }
  return best;
}
console.log(maxWindow([1, 12, -5, -6, 50, 3], 4));
console.log(maxWindow([2, 2, 2], 1));
```

<details><summary>Answer</summary>

**`51`**, then **`2`** — this is the **sliding window**, O(n) time and O(1) space.

Recomputing each window from scratch would be O(n·k). Instead you keep a running total and, on each step, add the element entering the window and subtract the one leaving. Trigger phrase: "contiguous subarray/substring of size k" or "longest substring with property P" — fixed-size windows use this arithmetic form, variable-size windows grow the right edge and shrink the left while a condition is violated.
</details>

---

### Q10 — name the pattern

What does this print, and why is `steps` so small?

```js
function bsearch(sorted, target) {
  let lo = 0;
  let hi = sorted.length - 1;
  let steps = 0;
  while (lo <= hi) {
    steps++;
    const mid = (lo + hi) >> 1;
    if (sorted[mid] === target) return { index: mid, steps };
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return { index: -1, steps };
}
const arr = Array.from({ length: 1024 }, (_, i) => i * 2);
console.log(bsearch(arr, 2046));
console.log(bsearch(arr, 3));
```

<details><summary>Answer</summary>

**`{ index: 1023, steps: 11 }`**, then **`{ index: -1, steps: 10 }`** — **binary search**, O(log n): 1024 elements need at most 11 probes.

The precondition is that the input is *sorted*; on unsorted data it returns confident nonsense. Three details that make or break an implementation: `lo <= hi` (not `<`) or you miss single-element ranges; `mid + 1` / `mid - 1` or you loop forever; and `(lo + hi) >> 1` vs `lo + ((hi - lo) >> 1)` — the second avoids integer overflow, which matters in other languages more than in JS. Trigger phrase: "sorted input" or "find the smallest X such that P(X) is true".
</details>

---

### Q11 — name the pattern

What does this print, and what is the pattern called?

```js
function freq(str) {
  const counts = new Map();
  for (const ch of str) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0];
}
console.log(freq('mississippi'));
console.log(freq('abc'));
```

<details><summary>Answer</summary>

**`[ 'i', 4 ]`**, then **`[ 'a', 1 ]`** — a **frequency map** (counting/tally), O(n) to build plus O(k log k) to rank.

`counts.get(ch) ?? 0` is the seed-on-first-sight idiom; `??` rather than `||` because a legitimate count of `0` would be swallowed by `||`. This one structure answers a whole family of questions: most common element, are these two strings anagrams, does any element appear more than n/2 times, first non-repeating character. If you only need the max, skip the sort and track the best as you go — that's O(n) with O(1) extra passes.
</details>

---

### Q12 — name the pattern

What does this print, and what is the pattern called?

```js
function isBalanced(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of s) {
    if ('([{'.includes(ch)) stack.push(ch);
    else if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;
}
console.log(isBalanced('a(b[c]{d})'), isBalanced('(]'), isBalanced('(('));
```

<details><summary>Answer</summary>

**`true false false`** — the **stack for nesting** pattern, O(n) time and O(n) space.

Every opener is pushed; every closer must match the most recent unmatched opener, which is exactly LIFO. Note the two distinct failure modes the last two cases cover: a *mismatch* mid-string, and a *leftover* opener at the end — forgetting the final `stack.length === 0` check is the classic incomplete solution. Any nesting problem is a stack problem: JSON/HTML parsing, expression evaluation, undo/redo, and depth-first traversal.
</details>

---

### Q13 — index once, look up many

What does this print, and when is the `Map` worth building?

```js
const rows = [
  { id: 'a', n: 1 },
  { id: 'b', n: 2 },
  { id: 'c', n: 3 },
];
const index = new Map(rows.map((r) => [r.id, r]));
console.log(index.get('b'));
console.log(rows.find((r) => r.id === 'b'));
console.log(index.size, index.has('z'));
```

<details><summary>Answer</summary>

**`{ id: 'b', n: 2 }`** twice, then **`3 false`** — same answer, different cost profile: `find` is O(n) per lookup, the `Map` is O(n) once and O(1) forever after.

So a single lookup should just use `find`. Two or more lookups against the same collection, and especially any lookup *inside a loop*, should build the index first. This is the everyday version of Q8, and it's what an ORM's `include`/`join` does for you. Note that both hold references to the same row objects — mutating `index.get('b')` mutates `rows[1]` too.
</details>

---

### Q14 — Set membership inside a filter

What does this print, and what is the cost of each line?

```js
const a = [1, 2, 3, 4];
const b = [3, 4, 5];
const bSet = new Set(b);
console.log(a.filter((x) => bSet.has(x)));
console.log(a.filter((x) => b.includes(x)));
```

<details><summary>Answer</summary>

**`[ 3, 4 ]`** both times — identical output, but the first is O(n + m) and the second is O(n·m).

`includes` inside a `filter` is the most common accidental quadratic in real code, because it reads as one linear operation. On arrays of 50 it's invisible; on arrays of 50,000 it's a frozen tab. Building the `Set` costs one pass and then every membership test is constant. The same rewrite applies to `some(x => other.indexOf(...) > -1)` and to nested `for` loops that search.
</details>

---

### Q15 — the cost of naive recursion

What does this print?

```js
let naiveCalls = 0;
function fib(n) {
  naiveCalls++;
  return n < 2 ? n : fib(n - 1) + fib(n - 2);
}
let memoCalls = 0;
const cache = new Map();
function fibMemo(n) {
  memoCalls++;
  if (cache.has(n)) return cache.get(n);
  const v = n < 2 ? n : fibMemo(n - 1) + fibMemo(n - 2);
  cache.set(n, v);
  return v;
}
console.log(fib(20), naiveCalls);
console.log(fibMemo(20), memoCalls);
```

<details><summary>Answer</summary>

**`6765 21891`**, then **`6765 39`** — naive recursion is O(2ⁿ), memoized is O(n).

The naive version recomputes the same subproblems exponentially many times: `fib(18)` alone is evaluated twice, `fib(17)` three times, and so on. Memoizing collapses the call *tree* into a call *graph* where each distinct input is computed once — 21,891 calls become 39. This is the definition of dynamic programming: overlapping subproblems plus optimal substructure. The bottom-up form (a loop with two variables) gets you O(n) time and O(1) space with no recursion at all.
</details>

---

### Q16 — recursion has a budget

What does this print?

```js
function deepCount(node) {
  if (!node) return 0;
  return 1 + deepCount(node.left) + deepCount(node.right);
}
const tree = { left: { left: null, right: { left: null, right: null } }, right: null };
console.log(deepCount(tree));
function depth(n) {
  return n === 0 ? 0 : 1 + depth(n - 1);
}
try {
  depth(1e6);
} catch (e) {
  console.log(e.constructor.name + ': ' + e.message);
}
```

<details><summary>Answer</summary>

**`3`**, then **`RangeError: Maximum call stack size exceeded`** — recursion depth is bounded by the call stack, typically around 10⁴ frames in Node.

Recursion is safe when depth is logarithmic (balanced trees, divide and conquer) and dangerous when it's linear in the input (a linked list, a degenerate tree, a range counter). JavaScript engines do **not** implement tail-call optimization in practice, despite it being in the ES6 spec — Safari is the lone exception — so `return f(n - 1)` still grows the stack. When depth is unbounded, convert to an explicit stack and a `while` loop; the algorithm is the same, the memory just moves to the heap.
</details>

---

### Q17 — BFS versus DFS

What does this print, and when would you pick each?

```js
const graph = { a: ['b', 'c'], b: ['d'], c: ['d'], d: [] };
function bfs(start) {
  const seen = new Set([start]);
  const queue = [start];
  const order = [];
  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    for (const nb of graph[node]) {
      if (!seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
  return order;
}
function dfs(node, seen = new Set()) {
  if (seen.has(node)) return [];
  seen.add(node);
  return [node, ...graph[node].flatMap((n) => dfs(n, seen))];
}
console.log(bfs('a'));
console.log(dfs('a'));
```

<details><summary>Answer</summary>

**`[ 'a', 'b', 'c', 'd' ]`**, then **`[ 'a', 'b', 'd', 'c' ]`** — BFS visits level by level with a queue; DFS goes deep first with a stack (here, the call stack).

Both are O(V + E) and both need the `seen` set — without it, any cycle loops forever and any diamond (`a→b→d`, `a→c→d`) visits `d` twice. Pick **BFS** for shortest path in an unweighted graph, for "nearest match", or when the answer is likely shallow. Pick **DFS** for exhaustive exploration, topological sort, cycle detection, and anything naturally recursive like directory walking. Swap `queue.shift()` for `stack.pop()` and BFS becomes iterative DFS — that one line is the whole difference.
</details>

---

### Q18 — which structure fits?

Name the best structure for each: (a) "has this user ID been processed?" (b) "give me the record for order 8821" (c) "process jobs in arrival order" (d) "undo the last action" (e) "attach cached metadata to DOM nodes without leaking memory" (f) "always pull the highest-priority task next".

<details><summary>Answer</summary>

**(a) Set · (b) Map · (c) queue · (d) stack · (e) WeakMap · (f) priority queue / heap.**

(a) and (b) are the same O(1) hash lookup; the only difference is whether you need a value attached. (c) FIFO — but use a head index, not `shift`, if it's hot. (d) LIFO by definition. (e) `WeakMap` is the only one that lets the key be garbage collected, so removing a node from the DOM releases its metadata automatically. (f) JavaScript has no built-in heap, so you either sort on insert (O(n) per insert), sort lazily, or write ~30 lines of binary heap for O(log n) push and pop.
</details>

---

### Q19 — when is sorting worth it?

You need to answer "are there any duplicates in this array?" Compare the sort-based approach with the Set-based approach on time, space, and side effects.

<details><summary>Answer</summary>

**Set: O(n) time, O(n) space, non-destructive. Sort: O(n log n) time, O(1) extra space if you sort in place — but it reorders the caller's array.**

`new Set(arr).size !== arr.length` is the one-liner and it's the right default. Sorting wins only when memory is tight, when the elements aren't hashable the way you need, or when you were going to sort anyway — in which case scanning adjacent pairs is free. But remember `sort` mutates (module 03, Q8), so "O(1) space" costs you the original order unless you copy first, which puts you back at O(n) space. Also: `sort` needs a comparator to be correct on numbers, while `Set` needs nothing.
</details>

---

### Q20 — the trigger-phrase cheat sheet

Match each problem phrasing to its pattern: (a) "contiguous subarray", (b) "sorted array, find a value", (c) "count occurrences / find a pair", (d) "nesting or matching pairs", (e) "shortest path, unweighted", (f) "the same subproblem keeps reappearing", (g) "k largest / k smallest".

<details><summary>Answer</summary>

**(a) sliding window · (b) binary search · (c) hash map/set · (d) stack · (e) BFS · (f) memoization / DP · (g) sort-and-slice, or a size-k heap.**

Interview problems are recombinations of maybe eight patterns, and most of the work is recognizing which one you're looking at before you write anything. Say the pattern name out loud, state the complexity you're targeting, *then* code — that ordering is also what an interviewer is grading. And if you can't spot the pattern, say the brute force out loud with its complexity first; it's a correct answer to improve on, and it's how you find the redundant work worth eliminating.
</details>

---

### Q21 — name the pattern

What does this print, and what is the pattern called?

```js
function nextGreater(nums) {
  const out = new Array(nums.length).fill(-1);
  const stack = [];
  for (let i = 0; i < nums.length; i++) {
    while (stack.length && nums[stack.at(-1)] < nums[i]) out[stack.pop()] = nums[i];
    stack.push(i);
  }
  return out;
}
console.log(nextGreater([2, 1, 2, 4, 3]));
console.log(nextGreater([5, 4, 3]));
```

<details><summary>Answer</summary>

**`[ 4, 2, 4, -1, -1 ]`**, then **`[ -1, -1, -1 ]`** — a **monotonic stack**, O(n) time despite the nested `while`.

The stack holds indices whose answer is still unknown, kept in decreasing value order. When a bigger number arrives it resolves every smaller index waiting underneath it, all at once. The complexity argument is the one to say out loud: each index is pushed exactly once and popped at most once, so the inner loop does at most n pops in total across the whole run — amortized O(1) per element, not O(n). Trigger phrases: "next greater/smaller element", "days until warmer", "largest rectangle in a histogram", "span". A strictly decreasing input never pops, which is why the second case is all `-1`.
</details>

---

### Q22 — name the pattern

What does this print, and what is the pattern called?

```js
function prefix(nums) {
  const p = [0];
  for (const n of nums) p.push(p.at(-1) + n);
  return p;
}
const p = prefix([3, 1, 4, 1, 5]);
console.log(p);
const range = (i, j) => p[j + 1] - p[i];
console.log(range(1, 3), range(0, 4), range(2, 2));
```

<details><summary>Answer</summary>

**`[ 0, 3, 4, 8, 9, 14 ]`**, then **`6 14 4`** — **prefix sums**, O(n) to build and O(1) per range query afterwards.

`p[k]` is the sum of the first `k` elements, so the sum of the inclusive range `[i, j]` is `p[j + 1] - p[i]` — the leading `0` is what makes that formula work without a special case for `i === 0`. This is the same trade as indexing in Q13: one linear pass buys you constant-time answers forever, which turns "q queries over an array" from O(n·q) into O(n + q). Trigger phrases: "sum between two indices", "how many times was the running total X", "2-D submatrix sum" (same idea with inclusion-exclusion). The mirror trick is a difference array, for many range *updates* and one final read.
</details>

---

### Q23 — name the pattern

What does this print, and why is the map seeded with `0`?

```js
function countSubarrays(nums, k) {
  const seen = new Map([[0, 1]]);
  let sum = 0;
  let count = 0;
  for (const n of nums) {
    sum += n;
    count += seen.get(sum - k) ?? 0;
    seen.set(sum, (seen.get(sum) ?? 0) + 1);
  }
  return count;
}
console.log(countSubarrays([1, 1, 1], 2));
console.log(countSubarrays([3, 4, 7, 2, -3, 1, 4, 2], 7));
console.log(countSubarrays([1, 2, 3], 100));
```

<details><summary>Answer</summary>

**`2`**, **`4`**, **`0`** — **prefix sums plus a hash map**, O(n) time and O(n) space.

A subarray ending at `i` sums to `k` exactly when some earlier prefix equals `sum - k`, so counting those earlier prefixes counts the subarrays — Q8's complement trick applied to running totals. The `[[0, 1]]` seed represents the empty prefix, and it's what lets a subarray that starts at index 0 be found; drop it and every answer is short by the count of prefixes that themselves equal `k`. Note this beats a sliding window here because the array contains a negative number, and a window can only shrink correctly when all values are non-negative.
</details>

---

### Q24 — name the pattern

What does this print, and what is the pattern called?

```js
function pairSum(sorted, target) {
  let lo = 0;
  let hi = sorted.length - 1;
  let probes = 0;
  while (lo < hi) {
    probes++;
    const sum = sorted[lo] + sorted[hi];
    if (sum === target) return { pair: [sorted[lo], sorted[hi]], probes };
    if (sum < target) lo++;
    else hi--;
  }
  return { pair: null, probes };
}
console.log(pairSum([1, 3, 5, 7, 9], 12));
console.log(pairSum([1, 3, 5], 100));
```

<details><summary>Answer</summary>

**`{ pair: [ 3, 9 ], probes: 2 }`**, then **`{ pair: null, probes: 2 }`** — **two pointers**, O(n) time and O(1) space on already-sorted input.

Sortedness is what makes each step safe: if the sum is too small the only way to grow it is to move the left pointer right, and if it's too big the only way to shrink it is to move the right pointer left, so every move eliminates a whole row or column of candidate pairs without checking them. That's the difference from Q8's hash-map version, which works on unsorted data but costs O(n) memory — pick two pointers when the input is sorted or you can afford to sort it. Trigger phrases: "pair/triplet summing to", "container with most water", "reverse in place", "merge two sorted arrays", "remove duplicates in place".
</details>

---

### Q25 — name the pattern

What does this print, and what is the pattern called?

```js
function merge(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [start, end] of sorted) {
    const last = out.at(-1);
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else out.push([start, end]);
  }
  return out;
}
console.log(merge([[1, 3], [8, 10], [2, 6], [15, 18]]));
console.log(merge([[1, 4], [2, 3]]));
```

<details><summary>Answer</summary>

**`[ [ 1, 6 ], [ 8, 10 ], [ 15, 18 ] ]`**, then **`[ [ 1, 4 ] ]`** — **sort by start, then sweep**, O(n log n) dominated by the sort.

Sorting by start time is what reduces the problem to a single comparison against only the last kept interval: anything that overlaps an earlier one must overlap the most recent one too. The `Math.max` is the case people forget — the second example is a fully *contained* interval, and taking `end` unconditionally would shrink `[1, 4]` to `[1, 3]` and silently drop coverage. Trigger phrases: "merge/insert intervals", "meeting rooms", "can this calendar be booked", "free time between". The related sweep-line variant sorts start and end events separately and counts concurrency.
</details>

---

### Q26 — name the structure

What does this print, and when is this worth building?

```js
function makeTrie(words) {
  const root = new Map();
  for (const w of words) {
    let node = root;
    for (const ch of w) {
      if (!node.has(ch)) node.set(ch, new Map());
      node = node.get(ch);
    }
    node.set('$', true);
  }
  return root;
}
function walk(root, s) {
  let node = root;
  for (const ch of s) {
    if (!node.has(ch)) return null;
    node = node.get(ch);
  }
  return node;
}
const trie = makeTrie(['car', 'cart', 'dog']);
console.log(walk(trie, 'car') !== null, walk(trie, 'ca') !== null);
console.log(walk(trie, 'car').has('$'), walk(trie, 'ca').has('$'));
console.log(walk(trie, 'cat'));
```

<details><summary>Answer</summary>

**`true true`**, **`true false`**, **`null`** — a **trie** (prefix tree): lookup and insert are O(length of the word), independent of how many words are stored.

Every node is one character and the path from the root spells the prefix, which is why the `'$'` end-marker is needed at all: reaching a node proves the string is a *prefix*, not that it is a stored *word*. A `Set` beats a trie for plain membership — one hash, no per-character walk — so build a trie only when you need prefix questions: autocomplete, "does any stored word start here", longest common prefix, or word-search boards where you prune a branch the moment the prefix dies. The cost is memory: one Map per character of shared structure.
</details>

---

### Q27 — name the structure

What does this print, and what is the structure called?

```js
function makeDSU(n) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = new Array(n).fill(1);
  let groups = n;
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a, b) => {
    let ra = find(a);
    let rb = find(b);
    if (ra === rb) return false;
    if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra;
    size[ra] += size[rb];
    groups--;
    return true;
  };
  return { find, union, groups: () => groups };
}
const d = makeDSU(6);
console.log(d.union(0, 1), d.union(1, 2), d.union(0, 2));
d.union(3, 4);
console.log(d.groups(), d.find(2) === d.find(0), d.find(3) === d.find(5));
```

<details><summary>Answer</summary>

**`true true false`**, then **`3 true false`** — **union-find** (disjoint set union), effectively O(1) per operation.

`union` returns `false` when both elements are already in the same set, which is exactly the "this edge would create a cycle" test that Kruskal's minimum spanning tree needs. The two optimizations are both load-bearing: `parent[x] = parent[parent[x]]` is path halving, which flattens the tree while searching, and merging the smaller set into the larger keeps depth logarithmic — together they give the famous inverse-Ackermann bound, which is under 5 for any input you will ever see. Reach for it over BFS when edges arrive *incrementally*: BFS must re-scan the whole graph after every new edge, while union-find just absorbs it.
</details>

---

### Q28 — name the algorithm

What does this print, and what does `null` mean?

```js
function topo(graph) {
  const indeg = new Map(Object.keys(graph).map((k) => [k, 0]));
  for (const deps of Object.values(graph)) {
    for (const d of deps) indeg.set(d, indeg.get(d) + 1);
  }
  const queue = [...indeg].filter(([, n]) => n === 0).map(([k]) => k);
  const order = [];
  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    for (const d of graph[node]) {
      indeg.set(d, indeg.get(d) - 1);
      if (indeg.get(d) === 0) queue.push(d);
    }
  }
  return order.length === indeg.size ? order : null;
}
console.log(topo({ app: ['ui', 'api'], ui: ['core'], api: ['core'], core: [] }));
console.log(topo({ a: ['b'], b: ['a'] }));
```

<details><summary>Answer</summary>

**`[ 'app', 'ui', 'api', 'core' ]`**, then **`null`** — **topological sort** by Kahn's algorithm, O(V + E).

Count how many edges point *at* each node, start with the ones nobody depends on, and each time you emit a node decrement its neighbours — a neighbour joins the queue the moment its last dependency is satisfied. The cycle check falls out for free: if you emitted fewer nodes than exist, the leftovers are all stuck waiting on each other, so `null` means "this graph has a cycle". That's precisely what a package manager, a build system, or a database migration runner reports as "circular dependency". Note the order is not unique — any node with in-degree 0 is a legal next pick.
</details>

---

### Q29 — two kinds of cycle

What does this print, and which technique is which?

```js
function hasCycle(graph) {
  const color = new Map();
  const visit = (n) => {
    if (color.get(n) === 'grey') return true;
    if (color.get(n) === 'black') return false;
    color.set(n, 'grey');
    for (const nb of graph[n]) if (visit(nb)) return true;
    color.set(n, 'black');
    return false;
  };
  return Object.keys(graph).some(visit);
}
console.log(hasCycle({ a: ['b'], b: ['c'], c: [] }));
console.log(hasCycle({ a: ['b'], b: ['c'], c: ['a'] }));
const n = [0, 1, 2, 3].map((v) => ({ v, next: null }));
n[0].next = n[1]; n[1].next = n[2]; n[2].next = n[3]; n[3].next = n[1];
let slow = n[0];
let fast = n[0];
let steps = 0;
while (fast && fast.next) {
  steps++;
  slow = slow.next;
  fast = fast.next.next;
  if (slow === fast) break;
}
console.log(slow === fast, steps, slow.v);
```

<details><summary>Answer</summary>

**`false`**, **`true`**, then **`true 3 3`** — **three-colour DFS** for a directed graph, **Floyd's tortoise and hare** for a linked list.

The colours matter: grey means "on the current recursion stack" and finding a grey node is a back edge, which is a cycle; black means "fully explored, provably safe" and re-reaching it is just a diamond, not a loop. A single `seen` set cannot tell those apart, which is the classic wrong answer — it reports a cycle for `a→b, a→c, b→d, c→d`. Floyd's solves the same question in O(1) *space* by moving one pointer twice as fast: if there's a loop the gap closes by one each step, so they must meet. Use it when you cannot afford a visited set, or cannot mark the nodes at all.
</details>

---

### Q30 — name the pattern

What does this print, and what is being binary-searched?

```js
function minCapacity(weights, days) {
  const canDo = (cap) => {
    let used = 1;
    let load = 0;
    for (const w of weights) {
      if (load + w > cap) { used++; load = 0; }
      load += w;
    }
    return used <= days;
  };
  let lo = Math.max(...weights);
  let hi = weights.reduce((a, b) => a + b, 0);
  let probes = 0;
  while (lo < hi) {
    probes++;
    const mid = (lo + hi) >> 1;
    if (canDo(mid)) hi = mid;
    else lo = mid + 1;
  }
  return { cap: lo, probes };
}
console.log(minCapacity([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5));
console.log(minCapacity([3, 2, 2, 4, 1, 4], 3));
```

<details><summary>Answer</summary>

**`{ cap: 15, probes: 5 }`**, then **`{ cap: 6, probes: 4 }`** — **binary search on the answer**, O(n log(sum)).

There is no sorted array here; the search space is the *range of possible answers*, and what makes it searchable is that `canDo` is **monotonic** — if a capacity of 15 works then 16 works, and if 14 fails then 13 fails. That turns the problem into "find the boundary between false and true", which is binary search's real job. Recognize it when the question says "minimum X such that" or "maximum X such that" and a candidate answer is cheap to *verify* but hard to construct: ship capacity, Koko's eating speed, splitting an array into k parts, allocating pages. Note the bounds are chosen so the answer is guaranteed inside them, and `hi = mid` (not `mid - 1`) keeps the successful candidate in play.
</details>

---

### Q31 — read the DP

What does this print, and what does each cell of `dp` mean?

```js
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (const c of coins) {
    for (let a = c; a <= amount; a++) dp[a] = Math.min(dp[a], dp[a - c] + 1);
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
console.log(coinChange([1, 5, 6, 9], 11));
console.log(coinChange([2], 3));
console.log(coinChange([1, 2, 5], 11));
```

<details><summary>Answer</summary>

**`2`**, **`-1`**, **`3`** — a **1-D bottom-up DP**, where `dp[a]` is the fewest coins that make exactly `a`, and the answer is O(coins × amount).

The first case is the reason greedy fails: taking the largest coin first gives 9 + 1 + 1 = three coins, while the DP finds 5 + 6 = two. `dp[0] = 0` is the base case (zero coins make zero) and `Infinity` marks "unreachable", which is what survives to produce `-1`. The loop runs *upwards* over amounts, so `dp[a - c]` may already include coin `c` — that's deliberate here, because coins are reusable. Reverse that inner loop to count downwards and you get 0/1 knapsack instead, where each item may be used once; the direction of a single loop is the entire difference between the two problems.
</details>

---

### Q32 — read the DP

What does this print, and what does `dp[i][j]` mean?

```js
function lcs(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}
console.log(lcs('ABCBDAB', 'BDCABA'));
console.log(lcs('abc', 'abc'), lcs('abc', 'xyz'));
```

<details><summary>Answer</summary>

**`4`**, then **`3 0`** — a **2-D grid DP**: `dp[i][j]` is the longest common subsequence of the first `i` characters of `a` and the first `j` of `b`. O(n·m) time and space.

Two inputs means two axes, and the extra row and column of zeros are the empty-string base cases that make the `i - 1` / `j - 1` lookups safe without bounds checks. The recurrence is the whole algorithm in one line: matching characters extend the diagonal answer by one, mismatches take the better of dropping a character from either string. This is the engine behind `git diff` and every text-comparison view. Since each row depends only on the previous one, you can drop to two rolling rows for O(min(n, m)) space — but then you lose the table you'd need to reconstruct the actual subsequence.
</details>

---

### Q33 — which table shape?

For each, say whether you'd use a 1-D array, a 2-D grid, or a rolling window, and what one cell holds: (a) fibonacci, (b) 0/1 knapsack with capacity C, (c) edit distance between two strings, (d) "can this array be partitioned into two equal-sum halves", (e) longest increasing subsequence.

<details><summary>Answer</summary>

**(a) two rolling variables · (b) 1-D over capacity, iterated downwards · (c) 2-D grid · (d) 1-D boolean over sums · (e) 1-D over indices.**

The shape follows the *state*: how many things must you know to describe a subproblem? Fibonacci needs one index and only ever looks back two, so it collapses to two variables. Knapsack and subset-sum are naturally 2-D (items × capacity), but each row reads only the row above, so you keep one row and walk capacity *downwards* to stop an item being reused within the same pass — walking upwards silently turns it into the unbounded version. Edit distance needs both string positions, so it stays a genuine grid. LIS is `dp[i] =` longest run ending at `i`, an O(n²) 1-D scan, with an O(n log n) patience-sorting version if pressed. Say the cell's meaning out loud before writing the loop — "dp of i is the best answer for the first i items" — because a recurrence that doesn't match your sentence is where DP bugs live.
</details>

---

### Q34 — the k-th largest, without sorting

What does this print, and when does this beat sorting?

```js
function quickselect(arr, k) {
  const a = [...arr];
  let lo = 0;
  let hi = a.length - 1;
  while (true) {
    const pivot = a[hi];
    let store = lo;
    for (let i = lo; i < hi; i++) {
      if (a[i] > pivot) { [a[i], a[store]] = [a[store], a[i]]; store++; }
    }
    [a[store], a[hi]] = [a[hi], a[store]];
    if (store === k) return a[store];
    if (store < k) lo = store + 1;
    else hi = store - 1;
  }
}
console.log(quickselect([5, 1, 9, 3, 7], 0), quickselect([5, 1, 9, 3, 7], 2));
console.log([5, 1, 9, 3, 7].toSorted((x, y) => y - x)[2]);
```

<details><summary>Answer</summary>

**`9 5`**, then **`5`** — **quickselect**, O(n) average time (O(n²) worst case), versus O(n log n) for the sort.

It's quicksort that throws away half the work: partition around a pivot, see which side index `k` landed on, and recurse into only that side. Average cost is n + n/2 + n/4 + ... which sums to 2n. The other option for "k largest" is a size-k min-heap at O(n log k), and it wins when you're streaming and can't hold the array at all. JavaScript ships no heap — no `PriorityQueue`, no `SortedSet` — so in an interview you either write the ~30 lines or say "I'd sort here and swap in a heap if profiling justified it", which is the honest answer for the array sizes most code actually sees.
</details>

---

### Q35 — why BFS is not enough

You have a road network where each edge has a travel time, and you want the fastest route from A to B. Why doesn't the BFS from Q17 work, what does Dijkstra change, and what breaks it?

<details><summary>Answer</summary>

**BFS finds the route with the fewest *edges*, not the lowest *cost*. Dijkstra replaces the queue with a priority queue keyed by distance-so-far. Negative edge weights break it, and Bellman-Ford is the answer.**

BFS is correct on unweighted graphs precisely because every edge costs 1, so the first time it reaches a node it has arrived by a shortest path. Add weights and that stops being true — three fast hops can beat one slow one. Dijkstra keeps the same skeleton but always expands the *cheapest* unfinished node, which restores the guarantee that a node is finalized the first time it's popped; with a binary heap it's O((V + E) log V). That guarantee is exactly what a negative edge destroys, because a later, cheaper path can undercut an already-finalized node — Bellman-Ford handles it in O(V·E) and detects negative cycles as a bonus. If you also have a distance estimate to the target, A* is Dijkstra with that heuristic added to the priority.
</details>
