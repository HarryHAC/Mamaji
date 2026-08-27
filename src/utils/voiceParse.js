/* Parse spoken numbers and units for the shopkeeper voice assistant. */

const WORD_NUMBERS = {
  'शून्य': 0, 'एक': 1, 'दुई': 2, 'दुइ': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 'पांच': 5, 'छ': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दश': 10, 'दस': 10,
  'एघार': 11, 'बाह्र': 12, 'बीस': 20, 'पच्चीस': 25, 'तीस': 30, 'चालीस': 40, 'पचास': 50, 'साठी': 60, 'सत्तरी': 70, 'असी': 80, 'नब्बे': 90,
  'एकटा': 1, 'दुटा': 2, 'तीनटा': 3, 'दुगो': 2, 'तीनगो': 3,
  'half': 0.5, 'आधा': 0.5, 'डेढ': 1.5,
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100
};

const DEV_DIGITS = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };

function devToAscii(s) {
  return s.replace(/[०-९]/g, d => DEV_DIGITS[d] || d);
}

// Return the first number found in the text (digits, Devanagari digits, or words), or null.
export function parseSpokenNumber(text) {
  if (!text) return null;
  const ascii = devToAscii(String(text));
  // "one hundred", "do sau", "तीन सय" etc. — handle a leading multiplier + hundred.
  const hundredMatch = ascii.toLowerCase().match(/(\d+|एक|दुई|दुइ|तीन|चार|पाँच|two|three|four|five)\s*(सय|hundred)/);
  if (hundredMatch) {
    const base = /^\d+$/.test(hundredMatch[1]) ? parseInt(hundredMatch[1], 10) : (WORD_NUMBERS[hundredMatch[1]] || 1);
    // capture trailing addition e.g. "एक सय बीस"
    const rest = ascii.slice(ascii.indexOf(hundredMatch[0]) + hundredMatch[0].length);
    const restNum = parseSpokenNumber(rest);
    return base * 100 + (restNum || 0);
  }
  const digit = ascii.match(/(\d+(?:\.\d+)?)/);
  if (digit) return parseFloat(digit[1]);
  const tokens = ascii.toLowerCase().split(/\s+/);
  for (const tok of tokens) {
    const clean = tok.replace(/[.,!?।]/g, '');
    if (WORD_NUMBERS[clean] !== undefined) return WORD_NUMBERS[clean];
  }
  return null;
}

const UNIT_MAP = {
  'kg': 'kg', 'kilo': 'kg', 'किलो': 'kg', 'केजी': 'kg', 'के.जी': 'kg', 'किलोग्राम': 'kg',
  'litre': 'litre', 'liter': 'litre', 'l': 'litre', 'लिटर': 'litre', 'लीटर': 'litre',
  'packet': 'packet', 'packets': 'packet', 'प्याकेट': 'packet', 'पैकेट': 'packet', 'पकेट': 'packet',
  'piece': 'piece', 'pieces': 'piece', 'वटा': 'piece', 'पिस': 'piece', 'ओटा': 'piece', 'गो': 'piece', 'टा': 'piece', 'पीस': 'piece',
  'gram': 'g', 'g': 'g', 'ग्राम': 'g',
  'dozen': 'dozen', 'दर्जन': 'dozen',
  'bottle': 'bottle', 'बोतल': 'bottle',
  'box': 'box', 'बाकस': 'box', 'बक्सा': 'box', 'बक्स': 'box', 'क्रेट': 'box'
};

// Return a canonical unit found in text, or null.
export function parseUnit(text) {
  if (!text) return null;
  const tokens = String(text).toLowerCase().split(/\s+/);
  for (const tok of tokens) {
    const clean = tok.replace(/[.,!?।]/g, '');
    if (UNIT_MAP[clean]) return UNIT_MAP[clean];
  }
  // substring fallback
  const t = String(text).toLowerCase();
  for (const key of Object.keys(UNIT_MAP)) {
    if (t.includes(key)) return UNIT_MAP[key];
  }
  return null;
}
