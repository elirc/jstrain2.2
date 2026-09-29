# Cheatsheets

Your offline reference — the docs you can't open on a plane. Lookup tables and
short examples, no narrative. When the ten-second answer stops being enough,
go to [`../guides/`](../guides/).

| sheet | covers | modules |
| --- | --- | --- |
| [`csharp-basics.md`](csharp-basics.md) | types, operators, strings, parsing, signatures, delegates, extension methods, iterators | 01, 02, 05, 06, 09 |
| [`collections.md`](collections.md) | choosing a container, dictionary access, LINQ operators, deferred execution, costs | 03, 04 |
| [`async.md`](async.md) | Task, WhenAll, cancellation, async void, fire-and-forget, async streams | 08 |
| [`aspnetcore-api.md`](aspnetcore-api.md) | routing, binding, status codes, middleware order, controllers, filters, DI lifetimes | 13, 14, 15 |
| [`ef-core.md`](ef-core.md) | DbContext, queries, deferred execution, tracking, relationships, N+1, owned types, SQLite limits | 17, 18 |
| [`auth-and-security.md`](auth-and-security.md) | password hashing, JWT issue/validate, policies, IDOR, mass assignment | 19 |

The single most useful table in here is the **status code** table in
`aspnetcore-api.md`, and the most commonly needed one-liner is
`int.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n)`.
