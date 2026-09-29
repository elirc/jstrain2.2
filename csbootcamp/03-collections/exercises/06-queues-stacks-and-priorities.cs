// ─────────────────────────────────────────────────────────────────────────
//  06 · queues, stacks and priorities                     ★★☆ core
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
//  hint: `Enqueue(item, (priority, sequence++))` is the whole fix for
//        stability, and the tuple's comparison is already what you want
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Serve the queue in arrival order, returning the names in the order served.
List<string> ServeInOrder(params string[] arrivals)
{
    throw new NotImplementedException();
}

// True when every bracket is matched and correctly nested: "([]{})" is true,
// "([)]" is false, "(" is false.
bool IsBalanced(string text)
{
    throw new NotImplementedException();
}

// Highest urgency first. Equal urgency keeps ARRIVAL order.
List<string> Triage(params Ticket[] tickets)
{
    throw new NotImplementedException();
}

// Shortest path length from `start` to `goal` in an unweighted graph, or -1.
// Counted in edges, so a node's distance to itself is 0.
int Hops(Dictionary<string, string[]> graph, string start, string goal)
{
    throw new NotImplementedException();
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
