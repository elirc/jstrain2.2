# 05 — Prototypes and classes

## Outcome

Understand property lookup and instance behavior well enough to choose between
classes, closures, and plain data without superstition.

## The 80/20 model

Objects delegate missing-property lookup through a prototype chain. `class` is
syntax over prototypes plus standardized construction, inheritance, private
fields, and method definitions. Instance methods normally live on the
prototype; arrow fields create per-instance functions and capture `this`.

Classes are useful when identity, lifecycle, invariants, and polymorphic
behavior belong together. Plain data plus functions is often simpler for DTOs,
configuration, transformations, and serialization. Composition usually keeps
dependencies clearer than deep inheritance.

Private fields protect access through the language, but do not make an object
immutable or thread-safe. Getters can hide computation or I/O-like surprise;
keep property access unsurprising.

## Common traps

- Detached methods losing `this`.
- Mutable data placed on a prototype and shared by instances.
- `instanceof` failing across realms or duplicated packages.
- Inheritance used only to reuse a few lines.
- Class instances crossing JSON/transport boundaries as though behavior
  serializes.

## Optimized exercises

1. **Prediction:** inspect own versus inherited properties for constructor,
   class method, arrow field, getter, and overridden method.
2. **Design:** implement a rate limiter once as a class and once as a closure;
   compare identity, test seams, cleanup, and API clarity.
3. **Application:** review RelayDesk domain/service code and justify one class
   or one deliberate absence of classes using invariants and lifecycle.

## Exit gate

Explain what `new` does, where a class method lives, how its receiver is chosen,
and why inheritance is not the default reuse mechanism.

More reps: `../../bootcamp/05-prototypes-and-classes/`.

