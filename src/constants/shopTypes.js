/*
 * Shop types for Mama Ji. Each type has a localized name, an icon, and its own
 * set of product categories (also localized). This is what lets the same app
 * serve ANY local or wholesale shop — grocery, sweets, hardware, pharmacy,
 * stationery, electronics, clothing, wholesale/bulk suppliers, and more.
 *
 * Category name shape: { ne, hi, en, mai, bho } — render with pick(language, cat.name).
 */

const C = (id, icon, ne, hi, en, mai, bho) => ({
  id, icon,
  name: { ne, hi: hi || ne, en, mai: mai || ne, bho: bho || ne }
});

export const SHOP_TYPES = {
  grocery: {
    id: 'grocery',
    icon: '🛒',
    name: { ne: 'किराना पसल', hi: 'किराना दुकान', en: 'Grocery Store', mai: 'किराना दोकान', bho: 'किराना दोकान' },
    categories: [
      C('vegetables', '🥔', 'तरकारी र फलफूल', 'सब्ज़ी और फल', 'Vegetables & Fruits', 'तरकारी आ फल', 'तरकारी आ फल'),
      C('staples', '🌾', 'चामल, दाल र तेल', 'चावल, दाल और तेल', 'Rice, Dal & Oil', 'चाउर, दालि आ तेल', 'चाउर, दाल आ तेल'),
      C('dairy', '🥛', 'दूध र दही', 'दूध और दही', 'Milk & Dairy', 'दूध आ दही', 'दूध आ दही'),
      C('snacks', '🍜', 'बिस्कुट र चाउचाउ', 'बिस्कुट और नमकीन', 'Biscuits & Snacks', 'बिस्कुट आ चाउचाउ', 'बिस्कुट आ चाउचाउ'),
      C('beverages', '☕', 'चिया, कफी र पेय', 'चाय और पेय', 'Tea & Beverages', 'चाह आ पेय', 'चाह आ पेय'),
      C('spices', '🧂', 'मसला र नुन', 'मसाला और नमक', 'Spices & Salt', 'मसाला आ नोन', 'मसाला आ नोन'),
      C('household', '🧼', 'साबुन र घरायसी', 'साबुन और घरेलू', 'Soap & Household', 'साबुन आ घरक सामान', 'साबुन आ घर के सामान'),
    ],
  },
  wholesale: {
    id: 'wholesale',
    icon: '📦',
    name: { ne: 'थोक पसल', hi: 'थोक दुकान', en: 'Wholesale Store', mai: 'थोक दोकान', bho: 'थोक दोकान' },
    categories: [
      C('bulk_grocery', '🌾', 'थोक किराना', 'थोक किराना', 'Bulk Grocery', 'थोक किराना', 'थोक किराना'),
      C('bulk_staples', '🍚', 'बोरा — चामल, दाल', 'बोरी — चावल, दाल', 'Sacks — Rice, Dal', 'बोरा — चाउर, दालि', 'बोरा — चाउर, दाल'),
      C('bulk_oil', '🛢️', 'तेल र घिउ (थोक)', 'तेल और घी (थोक)', 'Oil & Ghee (Bulk)', 'तेल आ घी (थोक)', 'तेल आ घी (थोक)'),
      C('bulk_packaged', '📦', 'प्याकेट सामान (कार्टन)', 'पैकेट सामान (कार्टन)', 'Packaged (Cartons)', 'पैकेट सामान (कार्टन)', 'पैकेट सामान (कार्टन)'),
      C('bulk_beverages', '🥤', 'पेय (थोक)', 'पेय (थोक)', 'Beverages (Bulk)', 'पेय (थोक)', 'पेय (थोक)'),
      C('bulk_household', '🧴', 'घरायसी (थोक)', 'घरेलू (थोक)', 'Household (Bulk)', 'घरक सामान (थोक)', 'घर के सामान (थोक)'),
    ],
  },
  sweets: {
    id: 'sweets',
    icon: '🍬',
    name: { ne: 'मिठाई पसल', hi: 'मिठाई दुकान', en: 'Sweet Shop', mai: 'मिठाई दोकान', bho: 'मिठाई दोकान' },
    categories: [
      C('sweets', '🍬', 'मिठाई', 'मिठाई', 'Sweets', 'मिठाई', 'मिठाई'),
      C('namkeen', '🥨', 'नमकिन', 'नमकीन', 'Namkeen / Savory', 'नमकीन', 'नमकीन'),
      C('bakery', '🍰', 'केक र बेकरी', 'केक और बेकरी', 'Cake & Bakery', 'केक आ बेकरी', 'केक आ बेकरी'),
      C('dryfruits', '🥜', 'सुख्खा मेवा', 'सूखे मेवे', 'Dry Fruits', 'सुखल मेवा', 'सुखल मेवा'),
      C('beverages', '🥤', 'पेय पदार्थ', 'पेय पदार्थ', 'Beverages', 'पेय', 'पेय'),
    ],
  },
  hardware: {
    id: 'hardware',
    icon: '🔧',
    name: { ne: 'हार्डवेयर पसल', hi: 'हार्डवेयर दुकान', en: 'Hardware Store', mai: 'हार्डवेयर दोकान', bho: 'हार्डवेयर दोकान' },
    categories: [
      C('tools', '🔨', 'औजार', 'औज़ार', 'Tools', 'औजार', 'औजार'),
      C('fasteners', '🔩', 'किला र पेच', 'कील और पेंच', 'Nails & Screws', 'कील आ पेंच', 'कील आ पेंच'),
      C('paint', '🎨', 'रङ र ब्रस', 'रंग और ब्रश', 'Paint & Brushes', 'रंग आ ब्रश', 'रंग आ ब्रश'),
      C('electrical', '💡', 'बिजुली सामान', 'बिजली का सामान', 'Electrical', 'बिजली सामान', 'बिजली सामान'),
      C('plumbing', '🚰', 'पाइप र फिटिङ', 'पाइप और फिटिंग', 'Pipes & Fittings', 'पाइप आ फिटिंग', 'पाइप आ फिटिंग'),
      C('building', '🧱', 'निर्माण सामग्री', 'निर्माण सामग्री', 'Building Material', 'निर्माण सामग्री', 'निर्माण सामग्री'),
    ],
  },
  pharmacy: {
    id: 'pharmacy',
    icon: '💊',
    name: { ne: 'औषधि पसल', hi: 'दवा की दुकान', en: 'Pharmacy', mai: 'दवाई दोकान', bho: 'दवाई दोकान' },
    categories: [
      C('medicine', '💊', 'औषधि', 'दवाई', 'Medicines', 'दवाई', 'दवाई'),
      C('wellness', '🩹', 'स्वास्थ्य सामान', 'स्वास्थ्य सामान', 'Health & Wellness', 'स्वास्थ्य सामान', 'स्वास्थ्य सामान'),
      C('babycare', '🍼', 'शिशु हेरचाह', 'शिशु देखभाल', 'Baby Care', 'शिशु देखभाल', 'शिशु देखभाल'),
      C('personalcare', '🧴', 'व्यक्तिगत हेरचाह', 'व्यक्तिगत देखभाल', 'Personal Care', 'व्यक्तिगत देखभाल', 'व्यक्तिगत देखभाल'),
    ],
  },
  stationery: {
    id: 'stationery',
    icon: '✏️',
    name: { ne: 'स्टेशनरी पसल', hi: 'स्टेशनरी दुकान', en: 'Stationery', mai: 'स्टेशनरी दोकान', bho: 'स्टेशनरी दोकान' },
    categories: [
      C('books', '📚', 'कापी र किताब', 'कॉपी और किताब', 'Books & Notebooks', 'कॉपी आ किताब', 'कॉपी आ किताब'),
      C('pens', '🖊️', 'कलम र पेन्सिल', 'कलम और पेंसिल', 'Pens & Pencils', 'कलम आ पेंसिल', 'कलम आ पेंसिल'),
      C('school', '🎒', 'स्कूल सामान', 'स्कूल का सामान', 'School Supplies', 'स्कूल सामान', 'स्कूल सामान'),
      C('office', '📎', 'अफिस सामान', 'ऑफिस का सामान', 'Office Supplies', 'ऑफिस सामान', 'ऑफिस सामान'),
      C('gifts', '🎁', 'उपहार सामान', 'उपहार सामान', 'Gift Items', 'उपहार सामान', 'उपहार सामान'),
    ],
  },
  electronics: {
    id: 'electronics',
    icon: '🔌',
    name: { ne: 'इलेक्ट्रोनिक्स पसल', hi: 'इलेक्ट्रॉनिक्स दुकान', en: 'Electronics Store', mai: 'इलेक्ट्रोनिक्स दोकान', bho: 'इलेक्ट्रोनिक्स दोकान' },
    categories: [
      C('mobile', '📱', 'मोबाइल र सामान', 'मोबाइल और एक्सेसरी', 'Mobiles & Accessories', 'मोबाइल आ सामान', 'मोबाइल आ सामान'),
      C('appliances', '📺', 'घरेलु उपकरण', 'घरेलू उपकरण', 'Home Appliances', 'घरेलु उपकरण', 'घरेलु उपकरण'),
      C('cables', '🔌', 'तार र चार्जर', 'तार और चार्जर', 'Cables & Chargers', 'तार आ चार्जर', 'तार आ चार्जर'),
      C('batteries', '🔋', 'ब्याट्री र बल्ब', 'बैटरी और बल्ब', 'Batteries & Bulbs', 'ब्याट्री आ बल्ब', 'ब्याट्री आ बल्ब'),
    ],
  },
  clothing: {
    id: 'clothing',
    icon: '👕',
    name: { ne: 'कपडा पसल', hi: 'कपड़े की दुकान', en: 'Clothing Store', mai: 'कपड़ा दोकान', bho: 'कपड़ा दोकान' },
    categories: [
      C('mens', '👔', 'पुरुष कपडा', 'पुरुष वस्त्र', "Men's Wear", 'पुरुष कपड़ा', 'पुरुष कपड़ा'),
      C('womens', '👗', 'महिला कपडा', 'महिला वस्त्र', "Women's Wear", 'महिला कपड़ा', 'महिला कपड़ा'),
      C('kids', '🧒', 'बाल कपडा', 'बच्चों के कपड़े', "Kids' Wear", 'बाल कपड़ा', 'बाल कपड़ा'),
      C('footwear', '👟', 'जुत्ता र चप्पल', 'जूते और चप्पल', 'Footwear', 'जुत्ता आ चप्पल', 'जुत्ता आ चप्पल'),
      C('accessories', '🧣', 'सामान', 'एक्सेसरी', 'Accessories', 'सामान', 'सामान'),
    ],
  },
  general: {
    id: 'general',
    icon: '🏪',
    name: { ne: 'जनरल स्टोर', hi: 'जनरल स्टोर', en: 'General Store', mai: 'जनरल स्टोर', bho: 'जनरल स्टोर' },
    categories: [
      C('general', '🛍️', 'सामान्य सामान', 'सामान्य सामान', 'General Items', 'सामान्य सामान', 'सामान्य सामान'),
      C('household', '🧼', 'घरायसी सामान', 'घरेलू सामान', 'Household', 'घरक सामान', 'घर के सामान'),
      C('snacks', '🍫', 'खाजा र पेय', 'नाश्ता और पेय', 'Snacks & Drinks', 'खाजा आ पेय', 'खाजा आ पेय'),
    ],
  },
};

export const SHOP_TYPE_LIST = Object.values(SHOP_TYPES);

// A generic "All" category used to reset filters.
export const ALL_CATEGORY = C('all', '🛍️', 'सबै सामान', 'सभी सामान', 'All Items', 'सब सामान', 'सब सामान');

// Return the category list (including "All") for a shop, based on its type.
export function getShopCategories(shopOrType) {
  const type = typeof shopOrType === 'string'
    ? shopOrType
    : (shopOrType && shopOrType.shopType) || 'general';
  const def = SHOP_TYPES[type] || SHOP_TYPES.general; // custom/other → general categories
  return [ALL_CATEGORY, ...def.categories];
}

export function getShopTypeMeta(type) {
  if (SHOP_TYPES[type]) return SHOP_TYPES[type];
  // Custom / "other" shop type.
  return { id: type || 'other', icon: '🏬', name: { ne: 'अन्य पसल', hi: 'अन्य दुकान', en: 'Other Shop', mai: 'अन्य दोकान', bho: 'अन्य दोकान' } };
}
