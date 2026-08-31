/*
 * Tiny language picker used across the app for strings that aren't in the
 * main TRANSLATIONS dictionary (e.g. the voice assistant's dynamic phrases).
 *
 * Usage: pick(language, { ne, hi, en, mai, bho })
 * Falls back to Nepali (Devanagari) then English if a variant is missing, so
 * Maithili/Bhojpuri never silently drop to English mid-conversation.
 */
export function pick(language, variants) {
  if (!variants) return '';
  // Fallback chain: exact → Hindi → Nepali → English (all Devanagari-friendly).
  return variants[language] || variants.hi || variants.ne || variants.en || '';
}

// Best speech-recognition / speech-synthesis locale for a UI language.
// Hindi (hi-IN) has the widest, clearest browser voice support, so Maithili &
// Bhojpuri (close to Hindi, and lacking their own voices) use it too.
export function speechLocale(language) {
  switch (language) {
    case 'en': return 'en-US';
    case 'ne': return 'ne-NP';
    case 'hi':
    case 'mai':
    case 'bho':
    default: return 'hi-IN';
  }
}

// Is this language written in Devanagari (i.e. not English)?
export function isDevanagari(language) {
  return language !== 'en';
}
