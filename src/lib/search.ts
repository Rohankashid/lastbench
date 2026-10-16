/**
 * Converts user search input into a prefix-aware PostgreSQL tsquery format.
 * Enables live typeahead search where partial words match (e.g. "chemi" matches "chemistry").
 *
 * Examples:
 * - "chemi" -> "chemi:*"
 * - "chem unit 1" -> "chem:* & unit:* & 1:*"
 * - "bxe 2022" -> "bxe:* & 2022:*"
 * - "c++" -> "c:*"
 */
export function toSearchQuery(input: string): string {
  if (!input) return '';
  const clean = input.trim().replace(/[^a-zA-Z0-9\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter(Boolean);
  if (!tokens.length) return '';
  return tokens.map(t => `${t}:*`).join(' & ');
}
