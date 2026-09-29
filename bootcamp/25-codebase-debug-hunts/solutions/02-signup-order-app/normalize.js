// normalize.js — canonical form for emails.
//
// normalizeEmail(raw) maps every way a person types their address to ONE
// canonical spelling: whitespace trimmed, everything lowercased. All
// storage and comparison must happen on this form.

export function normalizeEmail(raw) {
  return raw.trim().toLowerCase();
}
