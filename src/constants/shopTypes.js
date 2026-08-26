/*
 * Shop types for Mama Ji. Each type has a localized name, an icon, and its own
 * set of product categories (also localized). This is what lets the same app
 * serve grocery stores, sweet shops, hardware stores, pharmacies, and more.
 *
 * Category name shape: { ne, en, mai, bho } — render with pick(language, cat.name).
 */

const C = (id, icon, ne, en, mai, bho) => ({ id, icon, name: { ne, en, mai: mai || ne, bho: bho || ne } });

export const SHOP_TYPES = {
  grocery: {
    id: 'grocery',
    icon: '🛒',
    name: { ne: 'किराना पसल', en: 'Grocery Store', mai: 'किराना दोकान', bho: 'किराना दोकान' },
    categories: [
      C('vegetables', '🥔', 'तरकारी र फलफूल', 'Vegetables & Fruits', 'तरकारी आ फल', 'तरकारी आ फल'),
      C('staples', '🌾', 'चामल, दाल र तेल', 'Rice, Dal & Oil', 'चाउर, दालि आ तेल', 'चाउर, दाल आ तेल'),
      C('dairy', '🥛', 'दूध र दही', 'Milk & Dairy', 'दूध आ दही', 'दूध आ दही'),
      C('snacks', '🍜', 'बिस्कुट र चाउचाउ', 'Biscuits & Snacks', 'बिस्कुट आ चाउचाउ', 'बिस्कुट आ चाउचाउ'),
      C('beverages', '☕', 'चिया, कफी र पेय', 'Tea & Beverages', 'चाह आ पेय', 'चाह आ पेय'),
      C('spices', '🧂', 'मसला र नुन', 'Spices & Salt', 'मसाला आ नोन', 'मसाला आ नोन'),
      C('household', '🧼', 'साबुन र घरायसी', 'Soap & Household', 'साबुन आ घरक सामान', 'साबुन आ घर के सामान'),
    ],
  },
  sweets: {
    id: 'sweets',
    icon: '🍬',
    name: { ne: 'मिठाई पसल', en: 'Sweet Shop', mai: 'मिठाई दोकान', bho: 'मिठाई दोकान' },
    categories: [
      C('sweets', '🍬', 'मिठाई', 'Sweets', 'मिठाई', 'मिठाई'),
      C('namkeen', '🥨', 'नमकिन', 'Namkeen / Savory', 'नमकीन', 'नमकीन'),
      C('bakery', '🍰', 'केक र बेकरी', 'Cake & Bakery', 'केक आ बेकरी', 'केक आ बेकरी'),
      C('dryfruits', '🥜', 'सुख्खा मेवा', 'Dry Fruits', 'सुखल मेवा', 'सुखल मेवा'),
      C('beverages', '🥤', 'पेय पदार्थ', 'Beverages', 'पेय', 'पेय'),
    ],
  },
  hardware: {
    id: 'hardware',
    icon: '🔧',
    name: { ne: 'हार्डवेयर पसल', en: 'Hardware Store', mai: 'हार्डवेयर दोकान', bho: 'हार्डवेयर दोकान' },
    categories: [
      C('tools', '🔨', 'औजार', 'Tools', 'औजार', 'औजार'),
      C('fasteners', '🔩', 'किला र पेच', 'Nails & Screws', 'कील आ पेंच', 'कील आ पेंच'),
      C('paint', '🎨', 'रङ र ब्रस', 'Paint & Brushes', 'रंग आ ब्रश', 'रंग आ ब्रश'),
      C('electrical', '💡', 'बिजुली सामान', 'Electrical', 'बिजली सामान', 'बिजली सामान'),
      C('plumbing', '🚰', 'पाइप र फिटिङ', 'Pipes & Fittings', 'पाइप आ फिटिंग', 'पाइप आ फिटिंग'),
      C('building', '🧱', 'निर्माण सामग्री', 'Building Material', 'निर्माण सामग्री', 'निर्माण सामग्री'),
    ],
  },
  pharmacy: {
    id: 'pharmacy',
    icon: '💊',
    name: { ne: 'औषधि पसल', en: 'Pharmacy', mai: 'दवाई दोकान', bho: 'दवाई दोकान' },
    categories: [
      C('medicine', '💊', 'औषधि', 'Medicines', 'दवाई', 'दवाई'),
      C('wellness', '🩹', 'स्वास्थ्य सामान', 'Health & Wellness', 'स्वास्थ्य सामान', 'स्वास्थ्य सामान'),
      C('babycare', '🍼', 'शिशु हेरचाह', 'Baby Care', 'शिशु देखभाल', 'शिशु देखभाल'),
      C('personalcare', '🧴', 'व्यक्तिगत हेरचाह', 'Personal Care', 'व्यक्तिगत देखभाल', 'व्यक्तिगत देखभाल'),
    ],
  },
  stationery: {
    id: 'stationery',
    icon: '✏️',
    name: { ne: 'स्टेशनरी पसल', en: 'Stationery', mai: 'स्टेशनरी दोकान', bho: 'स्टेशनरी दोकान' },
    categories: [
      C('books', '📚', 'कापी र किताब', 'Books & Notebooks', 'कॉपी आ किताब', 'कॉपी आ किताब'),
      C('pens', '🖊️', 'कलम र पेन्सिल', 'Pens & Pencils', 'कलम आ पेंसिल', 'कलम आ पेंसिल'),
      C('school', '🎒', 'स्कूल सामान', 'School Supplies', 'स्कूल सामान', 'स्कूल सामान'),
      C('office', '📎', 'अफिस सामान', 'Office Supplies', 'ऑफिस सामान', 'ऑफिस सामान'),
      C('gifts', '🎁', 'उपहार सामान', 'Gift Items', 'उपहार सामान', 'उपहार सामान'),
    ],
  },
  general: {
    id: 'general',
    icon: '🏪',
    name: { ne: 'जनरल स्टोर', en: 'General Store', mai: 'जनरल स्टोर', bho: 'जनरल स्टोर' },
    categories: [
      C('general', '🛍️', 'सामान्य सामान', 'General Items', 'सामान्य सामान', 'सामान्य सामान'),
      C('household', '🧼', 'घरायसी सामान', 'Household', 'घरक सामान', 'घर के सामान'),
      C('snacks', '🍫', 'खाजा र पेय', 'Snacks & Drinks', 'खाजा आ पेय', 'खाजा आ पेय'),
    ],
  },
};

export const SHOP_TYPE_LIST = Object.values(SHOP_TYPES);

// A generic "All" category used to reset filters.
export const ALL_CATEGORY = C('all', '🛍️', 'सबै सामान', 'All Items', 'सब सामान', 'सब सामान');

// Return the category list (including "All") for a shop, based on its type.
export function getShopCategories(shopOrType) {
  const type = typeof shopOrType === 'string'
    ? shopOrType
    : (shopOrType && shopOrType.shopType) || 'grocery';
  const def = SHOP_TYPES[type] || SHOP_TYPES.grocery;
  return [ALL_CATEGORY, ...def.categories];
}

export function getShopTypeMeta(type) {
  return SHOP_TYPES[type] || SHOP_TYPES.grocery;
}
