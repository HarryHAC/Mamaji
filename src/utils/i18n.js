/*
 * Tiny language picker used across the app for strings that aren't in the
 * main TRANSLATIONS dictionary (e.g. the voice assistant's dynamic phrases).
 *
 * Usage: pick(language, { ne, en, mai, bho })
 * Falls back to Nepali (Devanagari) then English if a variant is missing, so
 * Maithili/Bhojpuri never silently drop to English mid-conversation.
 */
export function pick(language, variants) {
  if (!variants) return '';
  return variants[language] || variants.ne || variants.en || '';
}
