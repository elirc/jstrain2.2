# 05 — Prototypes and classes mastery bank

Deepen: delegation, construction, property descriptors, receivers, private
state, inheritance, composition, instance identity, and serialization.

## Explain

- [ ] Draw property lookup from instance through prototype chain to null.
- [ ] Explain each step performed by `new` and constructor return edge cases.
- [ ] Compare prototype method, instance arrow field, closure method, and bound method.
- [ ] Explain own/inherited/enumerable/configurable/writable property dimensions.
- [ ] Choose class, closure, or plain data for five domain/lifecycle scenarios.

## Predict

- [ ] Predict own keys, `in`, `hasOwn`, enumeration, and lookup for a prototype example.
- [ ] Predict receivers through inheritance, `super`, detached methods, and callbacks.
- [ ] Predict `instanceof` and constructor identity across prototype replacement and realms.
- [ ] Predict getter/setter behavior with assignment, spread, and serialization.
- [ ] Predict sharing of prototype arrays versus per-instance fields.

## Implement

- [ ] Recreate a minimal `new` helper and state its intentional limitations.
- [ ] Implement an invariant-protecting class with private fields and explicit serialization.
- [ ] Implement the same stateful API with closure composition and compare memory/testability.
- [ ] Implement strategy composition without inheritance.
- [ ] Implement a small error hierarchy that preserves cause and useful classification.

## Test

- [ ] Test property ownership/descriptors rather than only resulting values.
- [ ] Test detached and rebound method behavior deliberately.
- [ ] Prove instances do not share mutable defaults.
- [ ] Test serialization/deserialization re-establishes invariants instead of trusting shape.
- [ ] Write substitutability tests for two strategy implementations.

## Debug and review

- [ ] Diagnose shared mutable prototype state.
- [ ] Review inheritance used only for code reuse and propose composition if clearer.
- [ ] Find a private-field instance crossing a worker/JSON boundary incorrectly.
- [ ] Diagnose an overridden method called during base construction.
- [ ] Review getters for hidden expensive or failure-prone behavior.

## Apply

- [ ] Justify RelayDesk ticket as class or plain domain value with invariant evidence.
- [ ] Review service methods passed as framework callbacks for receiver safety.
- [ ] Replace one unnecessary inheritance relationship with a small injected strategy.
- [ ] Define explicit domain-to-transport serialization for one behavior-rich object.
- [ ] Record one class/closure/plain-data decision and revisit after a feature change.

