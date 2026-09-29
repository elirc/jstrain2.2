# ADR-002: Membership-derived tenant context

Status: accepted. URLs or headers alone must never grant tenant access. Each request combines a hashed bearer token, requested organization, unexpired session, and active membership. Resource queries then repeat the organization predicate and guest project grant. Encoding organization only in a signed token was rejected because suspension/revocation would remain stale until token expiry. The selected approach costs one indexed lookup per request but makes revocation immediate.
