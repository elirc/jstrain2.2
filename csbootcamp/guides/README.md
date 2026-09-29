# Guides

Long-form essays: the *why* behind the mechanisms, written out properly.

They are not a third copy of the material. The three shelves divide like this:

| shelf | shape | you reach for it when |
| --- | --- | --- |
| [`../cheatsheets/`](../cheatsheets/) | lookup tables, ≤3-line examples | you need an answer in ten seconds |
| [`../*/README.md`](../) | 10-minute lessons + exercises | you are about to write code |
| **`guides/`** (here) | narrative essays | the ten-second answer stopped being enough |

## The index

| # | guide | read when | pairs with |
| --- | --- | --- | --- |
| 01 | [Value, Reference, and Null](01-value-vs-reference-and-null.md) | Something mutated that you didn't expect, a "copy" wasn't a copy, or the compiler warns about null on a line you're sure is safe | [`01-csharp-language-core`](../01-csharp-language-core/) |
| 02 | [The ASP.NET Core Request Pipeline](02-the-aspnetcore-request-pipeline.md) | Middleware runs in an order you didn't expect, a header you set doesn't arrive, or auth passes when it should fail | [`13-minimal-apis`](../13-minimal-apis/), [`14-middleware-pipeline`](../14-middleware-pipeline/), [`15-mvc-controllers`](../15-mvc-controllers/) |

More guides land alongside the modules they support — see
[`../docs/ROADMAP.md`](../docs/ROADMAP.md).
