// validate.js — shape checks for a NORMALIZED email.
//
// isValidEmail expects input that already went through normalizeEmail:
// it rejects whitespace and uppercase outright rather than repairing
// them — repairing is normalize's job, not ours.

export function isValidEmail(email) {
  if (typeof email !== 'string' || email.length < 3) return false;
  if (/\s/.test(email)) return false; // normalize would have trimmed it
  if (email !== email.toLowerCase()) return false; // …and lowercased it
  const at = email.indexOf('@');
  return at > 0 && email.includes('.', at) && !email.includes('@', at + 1);
}
