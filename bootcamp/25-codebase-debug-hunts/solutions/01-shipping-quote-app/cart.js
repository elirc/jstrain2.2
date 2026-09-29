// cart.js — weight math for a list of { name, grams, qty } lines.
//
// totalKg(items) returns the cart's shipping weight in kilograms.

export function totalKg(items) {
  const grams = items.reduce((sum, item) => sum + item.grams * item.qty, 0);
  return grams / 1000;
}
