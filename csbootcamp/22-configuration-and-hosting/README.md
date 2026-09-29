# 22 · Configuration and Hosting

Every app needs settings that differ per environment and work that runs
outside a request. Both are places where a small misunderstanding produces a
failure that only shows up after deployment.

## The mental model

**1. Configuration is a stack of sources. Later wins.**

```
appsettings.json
appsettings.{Environment}.json     ← overrides the above
user secrets (Development only)
environment variables              ← overrides those
command-line arguments             ← wins over everything
```

One file serves every environment; a deployment overrides two keys; a
developer overrides a third locally without committing anything.

**2. `__` maps to `:` in environment variables.**

`Smtp__Host` sets `Smtp:Host`. `:` is not legal in an env var name on every
platform, so setting `Smtp:Host` directly works on Windows and silently does
nothing in bash or a container. This accounts for a lot of "why won't it read
my env var".

**3. A missing key is `null`, not an error.**

Configuration is a dictionary and has no opinion about which keys you meant
to have. So a typo is silent until something far away dereferences null.
Wrap required reads:

```csharp
throw new InvalidOperationException($"required configuration missing: {key}");
```

Better still, bind to a class and `ValidateOnStart()` (module 12/02) — the
whole config is checked at boot rather than key by key.

**4. A `BackgroundService` is a singleton with a shutdown token.**

| Fact | Consequence |
| --- | --- |
| It is a **singleton** | cannot inject a scoped service — inject `IServiceScopeFactory` |
| The token is a **shutdown signal** | check it every iteration or the host kills you mid-work |
| An unhandled exception **stops the host** (.NET 6+) | the loop body needs its own try/catch |

Two try/catches at two levels: **outer** for `OperationCanceledException`
(shutdown is normal, not an error), **inner** per item (one bad message must
not be fatal).

## The details that bite

1. **Never put secrets in `appsettings.json`** — it is committed. Use
   user-secrets in development and a platform secret store in production.
   That is *why* environment variables outrank files in the precedence order.

2. **A blank environment variable is a very common deployment mistake.**
   Treat `""` as missing, not as a value.

3. **Keys are case-insensitive**, which hides some typos and not others.

4. **Everything before the first `await` in `ExecuteAsync` runs inside
   `StartAsync`**, delaying application startup. `await Task.Yield()` first.

5. **Logging cancellation as an error** means every clean deploy produces a
   scary log line, and people learn to ignore the error log.

6. **`IOptions<T>` never sees a config change** (module 12/02). Use
   `IOptionsMonitor<T>` in anything long-lived — a `BackgroundService`
   especially.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-configuration.cs` | ★★☆ | layered sources, `__` mapping, and a `Required` that names the key |
| 02 | `02-background-services.cs` | ★★★ | prompt shutdown, per-item error isolation, a scope per unit of work |
| 03 | `03-options-validation.cs` | ★★☆ | three layers of validation, and failing at startup |
| 04 | `04-sections-and-arrays.cs` | ★★☆ | hierarchical keys, index-merged arrays, `Get` vs `Bind` |
| 05 | `05-environments.cs` | ★★☆ | conditional wiring, and defaulting to the safe branch |
| 06 | `06-startup-and-lifetime.cs` | ★★★ | hosted-service ordering, and what a failing start does not clean up |

**03 exists because binding never fails.** A mistyped key leaves a timeout at
zero and the process starts perfectly happily. Validation at startup is the
only thing that turns that into a deployment failure instead of an incident.

**05 is one habit**: write the condition as "is it development?", never "is it
production?". Every unrecognised environment name then falls into the safe
branch, which is where a typo in a deployment variable belongs.

Do them in order. **02's last test is module 12/01's captive dependency in
its natural habitat** — a singleton worker that needs a scoped service, and
the `IServiceScopeFactory` pattern that solves it.

---

**Stuck?** `cheatsheets/aspnetcore-api.md` (DI lifetimes) · **Self-check:** `quizzes/06-aspnetcore-basics.md` · **Next:** `csbootcamp/23-api-capstones`
