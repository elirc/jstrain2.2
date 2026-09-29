# 12 · Dependency Injection

Modules 13–19 have been *using* DI: injected handlers, constructor-injected
services, a scoped `DbContext`. This module is the one about the container
itself — the lifetime rules that decide whether your app works under load, and
the registration shapes that keep configuration out of your business logic.

## The mental model

**1. A registration is a triple: service type, implementation, lifetime.**

```csharp
services.AddScoped<IStore, SqlStore>();
//         ^lifetime  ^service  ^implementation
```

**2. A service may depend on its own lifetime or LONGER — never shorter.**

| Consumer | May inject |
| --- | --- |
| Singleton | singleton only |
| Scoped | scoped, singleton |
| Transient | anything |

Break that and you get a **captive dependency**: a scoped service trapped in
a singleton, alive for the life of the app. Every request after the first
shares one user's `DbContext`.

**3. The container will catch it — if you ask.**

```csharp
services.BuildServiceProvider(new ServiceProviderOptions {
    ValidateScopes = true, ValidateOnBuild = true });
```

On by default in **Development**, off in **Production**. So the bug ships.
`ValidateOnBuild` inspects the whole graph and reports every fault at once,
wrapped in an `AggregateException`.

**4. Registering twice does not overwrite.**

```csharp
GetRequiredService<IRule>()               // the LAST one registered
GetRequiredService<IEnumerable<IRule>>()  // ALL of them, in registration order
```

That second form replaces a `switch` with a pipeline: register each rule,
inject the set, run them all. **Registration order is behaviour.**

**5. Configuration belongs in a class, not in string lookups.**

```csharp
services.AddOptions<SmtpOptions>()
        .Bind(config.GetSection("Smtp"))
        .ValidateDataAnnotations()
        .ValidateOnStart();      // a bad config is a STARTUP crash
```

| | Read when | Safe in a singleton? |
| --- | --- | --- |
| `IOptions<T>` | once, ever | yes — but blind to changes |
| `IOptionsSnapshot<T>` | once per scope/request | **no** (it is scoped) |
| `IOptionsMonitor<T>` | every access, with `OnChange` | yes |

## The details that bite

1. **A captive dependency does not reproduce with one user on localhost.**
   It needs concurrency, which is exactly what your dev machine lacks.

2. **You cannot resolve a scoped service from the root provider** — the
   container refuses, because doing so would silently promote it to a
   singleton. That is why startup seeding needs
   `app.Services.CreateScope()` (module 17/04).

3. **`ValidateOnStart()` validates nothing on its own.** It registers an
   `IStartupValidator` that the *host* invokes. In a bare `ServiceProvider`
   or a unit test, nothing calls it — which is why it can appear to do
   nothing.

4. **Without `ValidateOnStart`, options validation is lazy.** It fires on the
   first `.Value` access. If that is a rarely-hit endpoint, a config typo
   waits for the worst possible moment.

5. **`IOptions<T>` in a long-lived service never sees a change.** Same
   "captured at startup" trap as module 14/02's frozen `bool`. Use
   `IOptionsMonitor<T>`.

6. **Resolving a singular interface that has several registrations silently
   picks the last.** No error. Ask for `IEnumerable<T>` when you mean the set.

7. **`TryAdd` neither replaces nor appends.** It is "register a default unless
   one exists". For pipeline entries you usually want `TryAddEnumerable`,
   which de-duplicates by *implementation* type.

8. **Keyed services throw on an unknown key** rather than falling back —
   which is correct. Silently returning *some* implementation would be worse.

## Registration cheat table

| You want | Write |
| --- | --- |
| One for the app | `AddSingleton<IFoo, Foo>()` |
| One per request | `AddScoped<IFoo, Foo>()` |
| A new one each time | `AddTransient<IFoo, Foo>()` |
| A specific instance | `AddSingleton<IFoo>(theInstance)` |
| Built by a factory | `AddSingleton<IFoo>(sp => new Foo(sp.GetRequiredService<IBar>()))` |
| Several behind one interface | register repeatedly; inject `IEnumerable<IFoo>` |
| Pick one by name | `AddKeyedSingleton<IFoo, Foo>("key")` |
| A default a host can override | `TryAddSingleton<IFoo, Foo>()` |
| Typed configuration | `AddOptions<T>().Bind(section).ValidateDataAnnotations().ValidateOnStart()` |
| Per-request work inside a singleton | inject `IServiceScopeFactory`, `CreateScope()` per unit of work |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-lifetimes-and-captive-dependencies.cs` | ★★☆ | the three lifetimes, then the captive-dependency bug — visible in Dev, silent in Prod |
| 02 | `02-the-options-pattern.cs` | ★★☆ | bind a config section to a class; fail at startup, not at 3am |
| 03 | `03-many-implementations.cs` | ★★☆ | a rule pipeline via `IEnumerable<T>`, keyed services, `TryAdd` |
| 04 | `04-scopes-and-disposal.cs` | ★★☆ | who disposes what, and the transient-from-root leak |
| 05 | `05-factories-and-delegates.cs` | ★★☆ | factory registration, `Func<T>`, and why service location is a smell |
| 06 | `06-validating-the-graph.cs` | ★★☆ | moving container failures from 3am to deploy time |

**06 is the one to act on.** `ValidateOnBuild` and `ValidateScopes` are on by
default in Development **only** — so the captive dependency from exercise 01
throws on your laptop and silently shares state between users in production.
Turning them on everywhere is two lines in `Program.cs`.

**04 is the leak nobody looks for**: a transient `IDisposable` resolved from
the root provider is held until the process exits.

Do them in order. **01 is the one that matters most** — its last two tests
show the same broken registration passing silently under Production settings
and failing loudly under Development ones, which is the whole reason this bug
reaches production at all.

---

**Stuck?** `cheatsheets/aspnetcore-api.md` (DI lifetimes, registration) · **Self-check:** `quizzes/06-aspnetcore-basics.md` · **Next:** `csbootcamp/13-minimal-apis`
