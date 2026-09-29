# Big-O

Complexity classes, the cost of every JS operation you'll reach for, and how to say it out loud in an interview.

## Top of mind

| Question | Answer |
| --- | --- |
| Is `arr.shift()` cheap? | No — **O(n)**, it reindexes everything. Measured 3,595x slower than `pop()` at n=200k |
| Is `arr.includes()` in a loop fine? | No — that's O(n·m). A `Set` made it **314x faster** at n=100k |
| Is `Array.prototype.sort` stable? | Yes — required by the spec since ES2019 (V8 uses TimSort) |
| What's "too slow"? | Budget ~10⁸ simple ops/sec. O(n²) dies around n ≈ 10,000 |
| Object/Map lookup | O(1) average, not guaranteed worst case |

---

## Complexity classes

| Class | Name | Intuition | n=10 | n=1,000 | n=1,000,000 |
| --- | --- | --- | --- | --- | --- |
| `O(1)` | Constant | Doing one thing, whatever the size | 1 | 1 | 1 |
| `O(log n)` | Logarithmic | Halving the problem each step | 4 | 10 | 20 |
| `O(n)` | Linear | Touch every item once | 10 | 1,000 | 1,000,000 |
| `O(n log n)` | Linearithmic | Sort, or divide-and-conquer over everything | 34 | 9,966 | ~20 million |
| `O(n²)` | Quadratic | Every item against every item | 100 | 1,000,000 | 10¹² (hours) |
| `O(n³)` | Cubic | Triple nested loop, matrix multiply | 1,000 | 10⁹ | 10¹⁸ (never) |
| `O(2ⁿ)` | Exponential | Branch two ways at each of n steps | 1,024 | 10³⁰¹ | — |
| `O(n!)` | Factorial | Try every ordering | 3,628,800 | — | — |

**The budget.** A modern laptop does roughly 10⁸ simple operations per second in JS. So:

| n | O(n) | O(n log n) | O(n²) |
| --- | --- | --- | --- |
| 1,000 | instant | instant | instant |
| 100,000 | instant | instant | ~10 s |
| 1,000,000 | ~10 ms | ~200 ms | forever |

`20!` is 2,432,902,008,176,640,000 — factorial algorithms are unusable past n ≈ 11.

---

## The chart

```txt
  ops
1e12 |                    !!                                EE
     |                                                  EEEE
     |                   !                           EEE
1e10 |                 !!                         EEE
     |                                        EEEE
     |                !                    EEE
1e8  |               !                  EEE
     |                               EEE
     |             !!            EEEE
1e6  |            !           EEE
     |          !!         EEE
     |                 EEEE
1e4  |         !    EEE                                     QQ
     |        !  EEE         QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ
     |      !EEEQQQQQQQQQQLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL
100  |    QQLLLLLLLLLNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN
     | QNNNNGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG
1    |CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
     +--------------------------------------------------------
      n=1                                          n=40

  C = O(1)   G = O(log n)   N = O(n)   L = O(n log n)
  Q = O(n²)  E = O(2ⁿ)      ! = O(n!)
  Y axis is LOG scale — each gridline is ~100x the one below.
```

Read it this way: on a log axis a straight line is exponential growth. `!` and `E` are straight lines. Everything below `Q` is flat by comparison — that's the whole point.

---

## Rules for reading complexity

1. **Drop constants.** `O(3n)` is `O(n)`. `O(n/2)` is `O(n)`.
2. **Drop lower-order terms.** `O(n² + n)` is `O(n²)` — the biggest term wins as n grows.
3. **Sequential loops add.** Loop over n, then loop over n again → `O(n) + O(n)` = `O(n)`.
4. **Nested loops multiply.** A loop over n containing a loop over m → `O(n·m)`; if m is n, `O(n²)`.
5. **Halving the input each step is `log n`.** Binary search, balanced-tree descent, "divide by 2 until 1".
6. **Divide-and-conquer over everything is `n log n`.** `log n` levels of recursion × `O(n)` work per level (merge sort).
7. **Amortised ≠ worst case.** `push` is O(1) *amortised* — occasionally it reallocates and copies in O(n), but averaged over many pushes it's constant.
8. **Different inputs get different letters.** Two arrays is `O(n + m)`, not `O(n)`. Interviewers notice.
9. **Space counts the call stack.** Recursion of depth n is `O(n)` space even with no arrays allocated.
10. **A hidden sort is `n log n`.** `arr.sort()` inside your loop makes the whole thing `O(n² log n)`.

---

## JS operation complexity

### Array

| Operation | Complexity | Note |
| --- | --- | --- |
| `arr[i]`, `arr.at(i)` | O(1) | Real indexed access — as long as the array is "packed" (no holes) |
| `arr.length` | O(1) | Stored, not counted |
| `arr.push(x)` | O(1) amortised | Occasional realloc + copy |
| `arr.pop()` | O(1) | **Measured: 4.8 ms for 200k pops** |
| `arr.shift()` | **O(n)** | Reindexes every element. **17,248 ms for 200k shifts — 3,595x slower than pop** |
| `arr.unshift(x)` | **O(n)** | Same problem. Measured 172x slower than `push` at 50k |
| `arr.splice(i, k)` | O(n) | Shifts everything after `i` |
| `arr.slice(a, b)` | O(k) | k = length of the slice |
| `arr.concat(b)` | O(n + m) | Allocates a new array |
| `[...arr]`, `Array.from(arr)` | O(n) | Shallow copy |
| `arr.indexOf/lastIndexOf/includes` | **O(n)** | Linear scan — the #1 hidden inner loop |
| `arr.find/findIndex/findLast` | O(n) | Same |
| `arr.map/filter/forEach/reduce/some/every` | O(n) | Plus whatever your callback costs |
| `arr.flat(d)` | O(n) over the flattened total | `flat(Infinity)` walks every nested element |
| `arr.sort(cmp)` | **O(n log n)** | TimSort; O(n) on already-sorted input; **stable** |
| `arr.reverse()` / `toReversed()` | O(n) | |
| `arr.join(sep)` | O(n) | Over total string length |
| `arr.fill(x)` | O(n) | |
| `new Set(arr)` / `new Map(pairs)` | O(n) | Worth it before any repeated lookup |

### Object

| Operation | Complexity | Note |
| --- | --- | --- |
| `obj.k`, `obj[k]` get/set | O(1) average | Hash lookup; V8 uses hidden classes for fixed shapes |
| `delete obj.k` | O(1) average | But it forces the object into slow dictionary mode — prefer `= undefined` or a `Map` in hot code |
| `k in obj`, `Object.hasOwn(obj, k)` | O(1) avg / O(depth) | `in` walks the prototype chain |
| Prototype-chain lookup | O(depth) | Depth is tiny in practice — don't optimise this |
| `Object.keys/values/entries` | O(n) | Allocates an array of all own enumerable keys |
| `{ ...obj }`, `Object.assign` | O(n) | Shallow copy of n properties |
| `JSON.stringify(obj)` | O(total size) | Also allocates the whole string |
| `structuredClone(obj)` | O(total size) | Deep, handles cycles |

**Shape matters.** V8 optimises objects with a stable set of keys. Building an object by adding hundreds of dynamic keys degrades to a dictionary — a `Map` is faster and clearer for that job.

### Map / Set

| Operation | Complexity | Note |
| --- | --- | --- |
| `map.get/set/has/delete` | O(1) average | Keys by identity — no string coercion |
| `set.add/has/delete` | O(1) average | **314x faster than `arr.includes` at n=100k, 20k probes** |
| `map.size` / `set.size` | O(1) | Unlike counting `Object.keys().length`, which is O(n) |
| Iteration (`for...of`, `forEach`) | O(n) | Insertion order, guaranteed |
| `new Set(arr)` | O(n) | The dedupe idiom |
| `set.union/intersection/difference` | O(n + m) | ES2025, available in Node 22 |

### String

| Operation | Complexity | Note |
| --- | --- | --- |
| `s[i]`, `s.charAt(i)`, `s.length` | O(1) | Length is in UTF-16 **code units**, not characters |
| `a + b` | O(n + m) worst | V8 builds a "rope" lazily, so loops of `+=` are far better than the theory suggests — but still prefer `arr.join('')` |
| `s.slice/substring` | O(k) | |
| `s.indexOf/includes` | O(n·m) worst | Fast in practice; `m` = needle length |
| `s.split(sep)` / `arr.join()` | O(n) | |
| `s.replace(/re/g, x)` | O(n) typical | Can be exponential with a backtracking-prone pattern — see [regex.md](regex.md) |
| `s.repeat(k)` | O(n·k) | |

### The three that bite juniors

| Anti-pattern | Cost | Fix |
| --- | --- | --- |
| `while (q.length) q.shift()` | O(n²) | Walk with an index, or use a real queue (two-stack, or a linked list) |
| `if (big.includes(x))` inside a loop | O(n·m) | `const s = new Set(big)` once, then `s.has(x)` |
| `arr.splice(i, 1)` inside a loop | O(n²) | `arr.filter(...)` once, or collect indices and rebuild |

---

## Data structures

| Structure | Access | Search | Insert | Delete | Space | JS equivalent |
| --- | --- | --- | --- | --- | --- | --- |
| Static array | O(1) | O(n) | — | — | O(n) | `TypedArray` |
| Dynamic array | O(1) | O(n) | O(1)* end / O(n) middle | O(n) | O(n) | `Array` |
| Singly linked list | O(n) | O(n) | O(1) at a known node | O(1) at a known node | O(n) | hand-rolled `{ value, next }` |
| Stack (LIFO) | O(n) | O(n) | O(1) | O(1) | O(n) | `Array` + `push`/`pop` |
| Queue (FIFO) | O(n) | O(n) | O(1) | O(1) | O(n) | **not** `push`/`shift` — see above |
| Hash map | — | O(1) avg / O(n) worst | O(1) avg | O(1) avg | O(n) | `Map`, plain object |
| Hash set | — | O(1) avg | O(1) avg | O(1) avg | O(n) | `Set` |
| Balanced BST | O(log n) | O(log n) | O(log n) | O(log n) | O(n) | none built in |
| Degenerate BST | O(n) | O(n) | O(n) | O(n) | O(n) | the unbalanced worst case |
| Binary heap | O(1) peek | O(n) | O(log n) | O(log n) pop | O(n) | hand-rolled array heap |
| Trie | — | O(m) by key length | O(m) | O(m) | O(alphabet · nodes) | nested `Map`s |
| Graph — adjacency list | — | O(V + E) traverse | O(1) edge | O(E) edge | O(V + E) | `Map<node, node[]>` |
| Graph — adjacency matrix | O(1) edge check | O(V²) traverse | O(1) | O(1) | O(V²) | 2-D array |

*Amortised.

**Worst case for hash structures** is O(n) if every key collides. In JS you can't control the hash, so quote the average and mention the worst exists.

---

## Classic algorithms

| Algorithm | Best | Average | Worst | Space | Stable? | When |
| --- | --- | --- | --- | --- | --- | --- |
| Linear search | O(1) | O(n) | O(n) | O(1) | — | Unsorted, or n is small |
| Binary search | O(1) | O(log n) | O(log n) | O(1) | — | **Sorted** input only |
| Bubble sort | O(n) | O(n²) | O(n²) | O(1) | yes | Never — teaching only |
| Insertion sort | O(n) | O(n²) | O(n²) | O(1) | yes | n < ~20, or nearly-sorted data |
| Selection sort | O(n²) | O(n²) | O(n²) | O(1) | no | When writes are expensive (n swaps) |
| Merge sort | O(n log n) | O(n log n) | O(n log n) | **O(n)** | yes | Guaranteed bound, linked lists, external sort |
| Quicksort | O(n log n) | O(n log n) | **O(n²)** | O(log n) | no | Fastest in practice; worst case on a bad pivot |
| Heapsort | O(n log n) | O(n log n) | O(n log n) | O(1) | no | In-place with a guaranteed bound |
| TimSort | O(n) | O(n log n) | O(n log n) | O(n) | yes | **What `Array.prototype.sort` actually is** |
| Counting sort | O(n + k) | O(n + k) | O(n + k) | O(k) | yes | Small integer range k |
| Radix sort | O(d(n + k)) | same | same | O(n + k) | yes | Fixed-width integers/strings |
| BFS | O(V + E) | O(V + E) | O(V + E) | O(V) | — | Shortest path in an **unweighted** graph, level order |
| DFS | O(V + E) | O(V + E) | O(V + E) | O(V) depth | — | Cycle detection, topological sort, exhaustive search |
| Dijkstra (binary heap) | — | O((V + E) log V) | same | O(V) | — | Shortest path, **non-negative** weights |
| Topological sort | O(V + E) | O(V + E) | O(V + E) | O(V) | — | Dependency ordering, build graphs |
| Two pointers | O(n) | O(n) | O(n) | O(1) | — | Sorted array pair/triplet problems |
| Sliding window | O(n) | O(n) | O(n) | O(k) | — | Contiguous subarray/substring problems |
| Memoised recursion (DP) | — | O(states × work) | same | O(states) | — | Overlapping subproblems |

**Verified.** `[{k:1,n:'a'},{k:0,n:'b'},{k:1,n:'c'},{k:0,n:'d'},{k:1,n:'e'},{k:0,n:'f'}].sort((x,y)=>x.k-y.k)` yields `b,d,f,a,c,e` — original relative order preserved within each key. Stability has been spec-mandated since ES2019.

---

## Common patterns → complexity

| Shape | Complexity | Escape hatch |
| --- | --- | --- |
| Loop inside a loop over the same array | O(n²) | Replace the inner scan with a `Map`/`Set` → O(n) |
| Sort, then one pass | O(n log n) | Usually the right answer when order helps |
| Two pointers on sorted data | O(n) | After an O(n log n) sort, still O(n log n) overall |
| Binary search per item over n items | O(n log n) | |
| Recursion, branching factor 2, depth n | O(2ⁿ) | Memoise → O(n) or O(n²) |
| Recursion, halving, O(n) merge per level | O(n log n) | The merge-sort shape |
| Building a string with `+=` in a loop | O(n) in V8 | `arr.push` + `join('')` if you want a guarantee |
| Nested `.includes()` / `.find()` | O(n²) hidden | The classic "why is this page slow" |

---

## How to talk about complexity in an interview

1. **State the brute force first, with its complexity.** "The naive approach is a nested loop, O(n²) time, O(1) space." You've now shown you can solve it at all.
2. **Name the bottleneck out loud.** "The inner loop is a membership test."
3. **Propose the structure that removes it.** "If I put the seen values in a `Set`, that test becomes O(1) average, so the whole thing is O(n)."
4. **Always give time AND space.** Half of candidates forget space. "O(n) time, O(n) extra space for the set."
5. **Say "average" or "amortised" when you mean it.** "`Set.has` is O(1) average — worst case is O(n) if every key collides, but that's not reachable here."
6. **Ask about the input constraints before optimising.** If n ≤ 100, the O(n²) solution is the *correct* answer and you should say why.
7. **Name the trade you're making.** "I'm spending O(n) memory to buy O(n) time. If memory were tight I'd sort in place instead and take the log factor."
8. **Don't call array indexing a search.** "O(1) lookup" is true for `arr[i]` and false for `arr.includes(x)`. Mixing these up is a tell.
9. **Be honest about worst cases.** Quicksort's O(n²), hash collisions, catastrophic regex backtracking — mention them and say why they don't apply.
10. **Count the input separately.** "O(n + m) — the two arrays are independent sizes."
11. **Include the cost of your callback.** `arr.map(x => arr2.includes(x))` is O(n·m), not O(n).
12. **Say what you'd change at scale.** "At 10 million rows I'd stream instead of loading it all — that's O(1) space."

**Reusable script:**

> "The brute force is *X*, which is O(_) time and O(_) space. The bottleneck is *Y*. If I trade O(n) memory for a hash map, *Y* becomes constant-time and the whole thing drops to O(_). Worst case is *Z*, which I'd handle by *W*."

---
*See also: [array-methods.md](array-methods.md) · [object-map-set.md](object-map-set.md) · [js-gotchas.md](js-gotchas.md)*
