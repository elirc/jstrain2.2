// ─────────────────────────────────────────────────────────────────────────
//  06 · queues, stacks and priorities — SOLUTION          ★★☆ core
//  concepts: FIFO vs LIFO · PriorityQueue · picking by the operation
//  run: dotnet run 06-queues-stacks-and-priorities.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A `List<T>` can do all of this. It just does two of the three badly:
//  `Insert(0, x)` and `RemoveAt(0)` shift every element, so a queue built on
//  a list is O(n) per operation where a real one is O(1).
//
//      Queue<T>          Enqueue / Dequeue / Peek     first in, first out
//      Stack<T>          Push / Pop / Peek            last in, first out
//      PriorityQueue<T,P> Enqueue(item, priority)     LOWEST priority first
//
//  Two things about `PriorityQueue<TElement, TPriority>` that catch people:
//
//   · **Lowest priority comes out first.** It is a min-heap. For "highest
//     first", negate the priority or pass a reversed comparer.
//   · **It is NOT stable.** Two items with the same priority come out in an
//     unspecified order. If insertion order matters within a priority, put it
//     in the priority — a `(int Priority, int Sequence)` tuple works, because
//     tuples compare element by element.
//
//  Walkthrough:
//  Four problems, and in each one the container choice *is* the algorithm.
//  Written with a `List<T>` and index arithmetic, all four get longer, slower
//  and easier to get wrong.
//
//  **`IsBalanced` is what a stack is for.** "The most recently opened bracket
//  is the one that must close next" is the definition of LIFO, so the code
//  ends up being a direct transcription of the rule. Note the two failure
//  modes and that both are needed: a closer with an empty stack (`)` first),
//  and a non-empty stack at the end (`(` never closed). Checking only one of
//  them passes half the bad inputs.
//
//  **`PriorityQueue` is a min-heap, so `-Urgency` is how you get "highest
//  first".** The alternative is passing a reversed `IComparer`; negating is
//  shorter and fine for numbers, but watch for `int.MinValue`, which has no
//  positive counterpart.
//
//  **The sequence number is the whole stability fix.** A heap gives no
//  guarantee about equal priorities — two tickets on urgency 5 come out in
//  whatever order the heap's internal swaps left them, and that order changes
//  with the number of items. Enqueueing `(-urgency, sequence++)` makes the
//  priority a tuple, tuples compare element by element, and the sequence
//  breaks every tie in arrival order. The queue is now stable, and it cost
//  one variable.
//
//  This matters more than it looks. "Same priority comes out in the order it
//  went in" is what everyone assumes, nothing enforces, and no small test
//  catches — a three-item test can pass by luck for months.
//
//  **`Hops` is breadth-first search, and the queue is why it finds the
//  SHORTEST path.** Nodes come out in distance order because they went in in
//  distance order. Swap the `Queue` for a `Stack` and the identical code
//  becomes depth-first, which finds *a* path and not the shortest one — the
//  container is the only difference between the two algorithms.
//
//  **`seen.Add(next)` does two jobs in one call.** It returns false if the
//  node was already there, so the check and the insert are a single
//  operation. Without the visited set, the `a → b → a` cycle in the last test
//  runs forever — which is the test's actual purpose.
//
//  Marking a node as seen when you ENQUEUE it, not when you dequeue it, is
//  the detail that keeps BFS linear: otherwise a node reachable by five
//  different edges gets queued five times.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Serve the queue in arrival order, returning the names in the order served.
List<string> ServeInOrder(params string[] arrivals)
{
    var queue = new Queue<string>(arrivals);
    var served = new List<string>();

    while (queue.Count > 0)
        served.Add(queue.Dequeue());

    return served;
}

// True when every bracket is matched and correctly nested: "([]{})" is true,
// "([)]" is false, "(" is false.
bool IsBalanced(string text)
{
    var closers = new Dictionary<char, char> { [')'] = '(', [']'] = '[', ['}'] = '{' };
    var open = new Stack<char>();

    foreach (var character in text)
    {
        if (character is '(' or '[' or '{')
        {
            open.Push(character);
        }
        else if (closers.TryGetValue(character, out var expected))
        {
            // A closer with nothing open, or the wrong thing open.
            if (open.Count == 0 || open.Pop() != expected) return false;
        }
    }

    // Anything still open never closed.
    return open.Count == 0;
}

// Highest urgency first. Equal urgency keeps ARRIVAL order.
List<string> Triage(params Ticket[] tickets)
{
    // The priority is a TUPLE: negated urgency first (the queue is a
    // min-heap), then arrival order to break ties. Tuples compare element by
    // element, so this is stable without any extra work.
    var queue = new PriorityQueue<string, (int Urgency, int Arrived)>();
    var arrived = 0;

    foreach (var ticket in tickets)
        queue.Enqueue(ticket.Name, (-ticket.Urgency, arrived++));

    var order = new List<string>();

    while (queue.Count > 0)
        order.Add(queue.Dequeue());

    return order;
}

// Shortest path length from `start` to `goal` in an unweighted graph, or -1.
// Counted in edges, so a node's distance to itself is 0.
int Hops(Dictionary<string, string[]> graph, string start, string goal)
{
    if (start == goal) return 0;

    // Marked on ENQUEUE, not on dequeue — otherwise a node reachable by five
    // edges gets queued five times.
    var seen = new HashSet<string> { start };
    var queue = new Queue<(string Node, int Distance)>();
    queue.Enqueue((start, 0));

    while (queue.Count > 0)
    {
        var (node, distance) = queue.Dequeue();

        foreach (var next in graph.GetValueOrDefault(node, []))
        {
            if (next == goal) return distance + 1;

            // Add returns false if it was already there: check and insert
            // in one operation.
            if (seen.Add(next)) queue.Enqueue((next, distance + 1));
        }
    }

    return -1;
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a queue serves in arrival order", () =>
    Eq(ServeInOrder("ada", "bob", "cy"), new[] { "ada", "bob", "cy" }));

Test("an empty queue serves nobody", () =>
    Eq(ServeInOrder(), Array.Empty<string>()));

Test("balanced brackets", () =>
{
    Ok(IsBalanced("([]{})"));
    Ok(IsBalanced(""));
    Ok(IsBalanced("(((())))"));
});

Test("unbalanced brackets", () =>
{
    Ok(!IsBalanced("("));
    Ok(!IsBalanced(")"));
    Ok(!IsBalanced("([)]"), "crossed pairs are not nested");
    Ok(!IsBalanced("(()"));
});

Test("triage takes the most urgent first", () =>
    Eq(Triage(new("low", 1), new("critical", 9), new("medium", 5)),
       new[] { "critical", "medium", "low" }));

Test("equal urgency keeps arrival order", () =>
{
    // A bare PriorityQueue loses this — it is a heap, and heaps are not
    // stable. The sequence number in the priority is what restores it.
    Eq(Triage(new("first", 5), new("second", 5), new("third", 5)),
       new[] { "first", "second", "third" });
});

Test("urgency wins over arrival", () =>
    Eq(Triage(new("early", 1), new("late", 9)), new[] { "late", "early" }));

Test("breadth-first finds the shortest path", () =>
{
    var graph = new Dictionary<string, string[]>
    {
        ["a"] = ["b", "c"],
        ["b"] = ["d"],
        ["c"] = ["d"],
        ["d"] = ["e"],
        ["e"] = [],
    };

    Eq(Hops(graph, "a", "e"), 3);
    Eq(Hops(graph, "a", "d"), 2);
    Eq(Hops(graph, "a", "a"), 0);
});

Test("an unreachable node is -1, and a cycle does not hang", () =>
{
    var graph = new Dictionary<string, string[]>
    {
        ["a"] = ["b"],
        ["b"] = ["a"],      // a cycle: without a visited set this loops forever
        ["z"] = [],
    };

    Eq(Hops(graph, "a", "z"), -1);
});

// ──────────────────────────── types ──────────────────────────────────────

public record Ticket(string Name, int Urgency);
