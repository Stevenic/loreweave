---
name: TypeScript 6 Object.entries strict behavior
description: Object.entries returns [string, unknown][] in TS6 strict mode — requires explicit casts
type: feedback
---

In TypeScript 6 with strict mode, `Object.entries()` returns `[string, unknown][]` instead of `[string, V][]` even when called on `Record<string, V>`. This requires explicit type casts like `Object.entries(obj) as [string, MyType][]`.

**Why:** TypeScript 6 is stricter about `Object.entries` return types because records can be structurally widened. This affects all `for...of` destructuring over entries.

**How to apply:** When iterating with `Object.entries` in strict TS code, always add an `as` cast to the expected tuple type. This applies to validators, renderers, and any code that destructures Record values.
