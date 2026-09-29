# ADR 002: UTC instants plus IANA zone

Status: accepted. Storing local strings loses ordering and ambiguity; storing offsets freezes rules that governments can change. Persist UTC start/end and the IANA interpretation/display zone. Recurrence stays local. Gaps reject; repeats require an explicit offset. Luxon supplies zone rules, while domain tests pin transition behavior. A tzdata update can change future generated slots, so operators must review zone-rule changes.
