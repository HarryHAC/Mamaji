/*
 * Clean up noisy speech-to-text output before the assistant acts on it.
 *
 * Browser speech recognition (especially hi-IN standing in for Bhojpuri/Maithili
 * in a noisy room) often hallucinates stutters and repeated phrases, e.g.
 *   "हमारा हमारा 9 वाट के 9 वाट के 9 वाट के बवाल एड करेगा"
 * That wall of repetition buries any real command. This collapses:
 *   1. consecutive duplicate words, and
 *   2. an immediately repeated phrase of 2–5 words,
 * then caps the length so a garbled utterance can't flood the parser.
 */
export function cleanTranscript(input) {
  if (!input) return '';
  let words = String(input).trim().split(/\s+/).filter(Boolean);

  // 1. Drop a word that is identical to the one right before it.
  words = words.filter((w, i) => i === 0 || w.toLowerCase() !== words[i - 1].toLowerCase());

  // 2. Collapse an immediately-repeated phrase ("a b c a b c" -> "a b c").
  //    Try longer phrases first so nested repeats collapse cleanly.
  for (let n = 5; n >= 2; n--) {
    let i = 0;
    while (i + 2 * n <= words.length) {
      const a = words.slice(i, i + n).join(' ').toLowerCase();
      const b = words.slice(i + n, i + 2 * n).join(' ').toLowerCase();
      if (a === b) {
        words.splice(i + n, n); // remove the repeat, re-check from same spot
      } else {
        i++;
      }
    }
  }

  let out = words.join(' ');
  if (out.length > 180) out = out.slice(0, 180).trim(); // hard cap on runaway input
  return out;
}
