# Incident exercise: wrong clinic zone

Injected scenario: `loc-1` is changed from `America/Los_Angeles` to `UTC`. Slot previews shift by eight hours while existing appointments retain their UTC instant/display zone. Detection comes from the availability preview, booking-conflict spike, and structured error counts.

Severity: SEV-2 because new bookings are wrong but stored existing instants remain intact. Mitigation: disable booking for the location, restore the location zone from the audit/config backup, compare bookings created during the exposure window, and contact affected customers. Do not bulk-shift appointment instants: the intended civil time must be confirmed. Prevention: require preview/dual approval for zone changes, audit location configuration, and alert on sudden local-hour distribution changes. Current gap: location configuration audit/approval is not yet implemented, so deployment access is the control.
