// Smart multilingual dictionary and aliases for fuzzy searching and AI speech matching
export const PRODUCT_ALIASES = [
  {
    id: 'potato',
    canonical: 'आलु',
    canonicalEn: 'Potato',
    aliases: ['आलु', 'alu', 'aaloo', 'aalu', 'potato', 'potatoes', 'आलू', 'बटाटा'],
    category: 'vegetables',
    defaultUnit: 'kg'
  },
  {
    id: 'sugar',
    canonical: 'चिनी',
    canonicalEn: 'Sugar',
    aliases: ['चिनी', 'chini', 'cheeni', 'sugar', 'चीनी', 'खाँड', 'शक्कर'],
    category: 'staples',
    defaultUnit: 'kg'
  },
  {
    id: 'rice',
    canonical: 'चामल',
    canonicalEn: 'Rice',
    aliases: ['चामल', 'chamal', 'chaamal', 'rice', 'चाउर', 'चावल', 'बासमती', 'जिरा मसिना', 'masino chamal'],
    category: 'staples',
    defaultUnit: 'kg'
  },
  {
    id: 'lentil',
    canonical: 'मुसुरो दाल',
    canonicalEn: 'Red Lentils (Musuro Dal)',
    aliases: ['दाल', 'मुसुरो दाल', 'dal', 'daal', 'musuro dal', 'lentil', 'lentils', 'रहड दाल', 'रहर'],
    category: 'staples',
    defaultUnit: 'kg'
  },
  {
    id: 'oil',
    canonical: 'तोरीको तेल',
    canonicalEn: 'Mustard Oil',
    aliases: ['तेल', 'तोरीको तेल', 'tel', 'oil', 'mustard oil', 'sunflower oil', 'धारा तेल', 'सरसों तेल'],
    category: 'staples',
    defaultUnit: 'litre'
  },
  {
    id: 'milk',
    canonical: 'गाईको दूध',
    canonicalEn: 'Fresh Milk',
    aliases: ['दूध', 'दही', 'doodh', 'dudh', 'milk', 'ddc dudh', 'cow milk'],
    category: 'dairy',
    defaultUnit: 'litre'
  },
  {
    id: 'salt',
    canonical: 'आयोडिन नुन',
    canonicalEn: 'Iodized Salt',
    aliases: ['नुन', 'नून', 'nun', 'noon', 'salt', 'aayo nun', 'आयो नुन'],
    category: 'staples',
    defaultUnit: 'packet'
  },
  {
    id: 'noodles',
    canonical: 'वाइवाइ चाउचाउ',
    canonicalEn: 'Wai Wai Noodles',
    aliases: ['वाइवाइ', 'चाउचाउ', 'wai wai', 'waiwai', 'noodles', 'chowchow', 'rara', 'रारा'],
    category: 'snacks',
    defaultUnit: 'packet'
  },
  {
    id: 'tea',
    canonical: 'चियापत्ती (Tokla Tea)',
    canonicalEn: 'Tokla Tea',
    aliases: ['चिया', 'चियापत्ती', 'chiya', 'tea', 'tokla', 'tokla tea', 'चाय'],
    category: 'beverages',
    defaultUnit: 'packet'
  },
  {
    id: 'onion',
    canonical: 'प्याज',
    canonicalEn: 'Onion',
    aliases: ['प्याज', 'pyaj', 'pyaz', 'onion', 'onions', 'कांदा'],
    category: 'vegetables',
    defaultUnit: 'kg'
  },
  {
    id: 'tomato',
    canonical: 'गोलभेंडा (टमाटर)',
    canonicalEn: 'Tomato',
    aliases: ['गोलभेंडा', 'टमाटर', 'golbheda', 'tamatar', 'tomato', 'tomatoes'],
    category: 'vegetables',
    defaultUnit: 'kg'
  },
  {
    id: 'soap',
    canonical: 'लाइफब्वाय साबुन',
    canonicalEn: 'Lifebuoy Soap',
    aliases: ['साबुन', 'लाइफब्वाय', 'sabun', 'soap', 'lifebuoy', 'dettol'],
    category: 'household',
    defaultUnit: 'piece'
  },
  {
    id: 'flour',
    canonical: 'गहुँको पिठो (आटा)',
    canonicalEn: 'Wheat Flour (Atta)',
    aliases: ['पिठो', 'आटा', 'pitho', 'atta', 'flour', 'wheat flour', 'मैदा'],
    category: 'staples',
    defaultUnit: 'kg'
  },
  {
    id: 'egg',
    canonical: 'अन्डा (Eggs)',
    canonicalEn: 'Fresh Eggs',
    aliases: ['अन्डा', 'अण्डा', 'anda', 'egg', 'eggs', 'क्रेत अन्डा'],
    category: 'dairy',
    defaultUnit: 'dozen'
  },
  {
    id: 'biscuits',
    canonical: 'पार्ले-जी बिस्कुट',
    canonicalEn: 'Parle-G Biscuits',
    aliases: ['बिस्कुट', 'बिस्कुटहरू', 'biscuit', 'biscuits', 'parle g', 'parleg', 'गुड्डे'],
    category: 'snacks',
    defaultUnit: 'packet'
  }
];

// Helper to normalize and match text against aliases
export function findMatchingProductInCatalog(inputText, products) {
  if (!inputText) return null;
  const clean = inputText.toLowerCase().trim();

  // 1. Direct match on product name or local name
  const exactMatch = products.find(
    p => p.nameNe.toLowerCase() === clean ||
         p.nameEn.toLowerCase() === clean ||
         p.nameNe.toLowerCase().includes(clean) ||
         p.nameEn.toLowerCase().includes(clean)
  );
  if (exactMatch) return exactMatch;

  // 2. Check aliases
  for (const item of PRODUCT_ALIASES) {
    const aliasMatched = item.aliases.some(alias => clean.includes(alias) || alias.includes(clean));
    if (aliasMatched) {
      // Find this product in current shop catalog
      const found = products.find(
        p => p.aliasId === item.id ||
             p.nameNe.toLowerCase().includes(item.canonical.toLowerCase()) ||
             p.nameEn.toLowerCase().includes(item.canonicalEn.toLowerCase())
      );
      if (found) return found;
    }
  }

  // 3. Substring / token matching
  const words = clean.split(/\s+/);
  for (const word of words) {
    if (word.length < 2) continue;
    const tokenMatch = products.find(
      p => p.nameNe.toLowerCase().includes(word) ||
           p.nameEn.toLowerCase().includes(word)
    );
    if (tokenMatch) return tokenMatch;
  }

  return null;
}
