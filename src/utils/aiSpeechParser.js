import { PRODUCT_ALIASES, findMatchingProductInCatalog } from '../constants/productAliases';
import { calculateDeliveryFee, toDevanagariNumerals } from './deliveryCalculator';

// Devanagari words to numbers map
const WORD_NUMBERS = {
  'एक': 1, 'दुई': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 'छ': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दश': 10,
  '१': 1, '२': 2, '३': 3, '४': 4, '५': 5, '६': 6, '७': 7, '८': 8, '९': 9, '१०': 10,
  'आधा': 0.5, 'डेढ': 1.5, 'ढाई': 2.5,
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'half': 0.5,
  'एकटा': 1, 'दुटा': 2, 'तीनटा': 3, 'चारि': 4, 'पाँचटा': 5, // Maithili
  'एकगो': 1, 'दुगो': 2, 'तीनगो': 3, 'चारगो': 4, 'पांचगो': 5, // Bhojpuri
};

// Unit aliases
const UNIT_MAP = {
  'kg': 'kg', 'kilo': 'kg', 'किलो': 'kg', 'केलो': 'kg', 'के.जी': 'kg',
  'litre': 'litre', 'l': 'litre', 'लिटर': 'litre', 'लीटर': 'litre',
  'packet': 'packet', 'packets': 'packet', 'प्याकेट': 'packet', 'प्याकेटहरू': 'packet', 'पकेट': 'packet',
  'piece': 'piece', 'वटा': 'piece', 'पिस': 'piece', 'ओटा': 'piece', 'टा': 'piece', 'गो': 'piece',
  'gram': 'g', 'g': 'g', 'ग्राम': 'g',
  'dozen': 'dozen', 'दर्जन': 'dozen', 'डर्जन': 'dozen'
};

export function parseVoiceOrder(transcript, shop, catalog, language = 'ne') {
  if (!transcript || !transcript.trim()) {
    return {
      success: false,
      message: language === 'ne' ? 'कृपया केही सामान भन्नुहोस्।' : 'Please speak the items you need.',
      items: [],
      rawText: transcript
    };
  }

  const text = transcript.toLowerCase();
  
  // Split transcript into phrases by conjunctions: "र", "अनि", "आ", "and", ",", "plus", "cha"
  const segments = text
    .split(/[,+\n]|(?:\s+(?:र|अनि|तथा|आ|अउरी|and|with|plus)\s+)/gi)
    .map(s => s.trim())
    .filter(Boolean);

  const parsedItems = [];
  const unavailableItems = [];
  const outOfStockItems = [];

  // Iterate over each segment to identify product and quantity
  segments.forEach(segment => {
    // 1. Check for numerical values
    let quantity = 1;
    let detectedUnit = null;

    // Check words in segment for numbers
    const tokens = segment.split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      // Numeric digit
      const numMatch = token.match(/^([0-9.]+)/);
      if (numMatch) {
        quantity = parseFloat(numMatch[1]) || 1;
      } else if (WORD_NUMBERS[token] !== undefined) {
        quantity = WORD_NUMBERS[token];
      }

      // Check unit
      if (UNIT_MAP[token]) {
        detectedUnit = UNIT_MAP[token];
      }
    }

    // 2. Find product match in active shop catalog
    const matchedProduct = findMatchingProductInCatalog(segment, catalog);

    if (matchedProduct) {
      const unit = detectedUnit || matchedProduct.unit || 'kg';
      
      // Stock check
      if (matchedProduct.stock <= 0 || !matchedProduct.isAvailable) {
        unavailableItems.push(matchedProduct.nameNe);
      } else if (quantity > matchedProduct.stock) {
        outOfStockItems.push({
          product: matchedProduct,
          requested: quantity,
          available: matchedProduct.stock
        });
        parsedItems.push({
          product: matchedProduct,
          quantity: matchedProduct.stock, // clamp to available
          unit: unit,
          itemTotal: matchedProduct.stock * matchedProduct.price,
          clamped: true
        });
      } else {
        parsedItems.push({
          product: matchedProduct,
          quantity: quantity,
          unit: unit,
          itemTotal: Math.round(quantity * matchedProduct.price),
          clamped: false
        });
      }
    } else {
      // If segment looks like an item query but not found
      if (segment.length > 2 && !['चाहियो', 'चाहिन्छ', 'दिनुहोस्', 'हस', 'हो', 'need', 'want', 'please', 'ok'].includes(segment)) {
        unavailableItems.push(segment);
      }
    }
  });

  // If no items were parsed at all from multi-split, try global matching on all products
  if (parsedItems.length === 0) {
    catalog.forEach(product => {
      const pNe = product.nameNe.toLowerCase();
      const pEn = product.nameEn.toLowerCase();
      if (text.includes(pNe) || text.includes(pEn) || (product.aliasId && text.includes(product.aliasId))) {
        parsedItems.push({
          product: product,
          quantity: 1,
          unit: product.unit,
          itemTotal: product.price,
          clamped: false
        });
      }
    });
  }

  if (parsedItems.length === 0 && unavailableItems.length === 0) {
    return {
      success: false,
      message: language === 'ne' 
        ? 'माफ गर्नुहोस्, तपाईंले भनेको सामान बुझ्न सकिएन। कृपया आलु, चिनी, तेल जस्ता सामानको नाम भन्नुहोस्।'
        : 'Sorry, could not detect grocery items. Please mention items like Potato, Sugar, Oil, etc.',
      items: [],
      rawText: transcript
    };
  }

  // Calculate pricing
  const subtotal = parsedItems.reduce((sum, item) => sum + item.itemTotal, 0);
  const deliveryCharge = calculateDeliveryFee(shop, shop?.distanceKm || 1.2, 'delivery');
  const grandTotal = subtotal + deliveryCharge;

  // Build conversational response in active language
  let responseText = '';
  let speechText = '';

  if (language === 'en') {
    const itemDescriptions = parsedItems.map(
      item => `${item.product.nameEn} (${item.quantity} ${item.unit}) at NPR ${item.itemTotal}`
    ).join(', ');
    
    responseText = `Found ${parsedItems.length} items:\n` +
      parsedItems.map(i => `• ${i.product.nameEn}: ${i.quantity} ${i.unit} — NPR ${i.itemTotal}`).join('\n') +
      `\n\nItems Total: NPR ${subtotal}\nDelivery Charge: NPR ${deliveryCharge}\nGrand Total: NPR ${grandTotal}\n\nWould you like to confirm this order?`;

    speechText = `Items found: ${itemDescriptions}. Subtotal is ${subtotal} rupees, delivery charge is ${deliveryCharge} rupees. Total amount is ${grandTotal} rupees. Would you like to confirm the order?`;
  } else if (language === 'mai') {
    const itemDescriptions = parsedItems.map(
      item => `${item.product.nameNe} ${item.quantity} ${item.unit} (रु ${item.itemTotal})`
    ).join(', ');

    responseText = `अहाँक सामान:\n` +
      parsedItems.map(i => `• ${i.product.nameNe} — ${toDevanagariNumerals(i.quantity)} ${i.unit} — रु ${toDevanagariNumerals(i.itemTotal)}`).join('\n') +
      `\n\nसामानक कुल: रु ${toDevanagariNumerals(subtotal)}\nडेलिभरी शुल्क: रु ${toDevanagariNumerals(deliveryCharge)}\nजम्मा रकम: रु ${toDevanagariNumerals(grandTotal)}\n\nकी अहाँ ई अर्डर करय चाहैत छी?`;

    speechText = `सामान भेटल। सामानक कुल रु ${subtotal} भेल, डेलिभरी रु ${deliveryCharge} भेल। जम्मा रु ${grandTotal} भेल। की अहाँ अर्डर करय चाहैत छी?`;
  } else if (language === 'bho') {
    responseText = `रउरा सामान:\n` +
      parsedItems.map(i => `• ${i.product.nameNe} — ${toDevanagariNumerals(i.quantity)} ${i.unit} — रु ${toDevanagariNumerals(i.itemTotal)}`).join('\n') +
      `\n\nसामान के कुल: रु ${toDevanagariNumerals(subtotal)}\nडेलिभरी चार्ज: रु ${toDevanagariNumerals(deliveryCharge)}\nकुल रकम: रु ${toDevanagariNumerals(grandTotal)}\n\nका रउरा ई आर्डर करे के चाहत बानी?`;

    speechText = `सामान मिलल। सामान के कुल रु ${subtotal} भइल, डेलिभरी रु ${deliveryCharge} बा। कुल रु ${grandTotal} भइल। का रउरा आर्डर करे के चाहत बानी?`;
  } else {
    // Default Nepali
    const itemDescriptions = parsedItems.map(
      item => `${item.product.nameNe} ${item.quantity} ${item.unit} को रु ${item.itemTotal}`
    ).join(' र ');

    responseText = `तपाईंले चाहनुभएको सामान:\n` +
      parsedItems.map(i => `• ${i.product.nameNe} — ${toDevanagariNumerals(i.quantity)} ${i.unit} — रु ${toDevanagariNumerals(i.itemTotal)}`).join('\n') +
      `\n\nसामानको जम्मा: रु ${toDevanagariNumerals(subtotal)}\nडेलिभरी शुल्क: रु ${toDevanagariNumerals(deliveryCharge)}\nकुल रकम: रु ${toDevanagariNumerals(grandTotal)}\n\nके तपाईं अर्डर गर्न चाहनुहुन्छ?`;

    speechText = `हुन्छ। ${itemDescriptions} छ। सामानको जम्मा रु ${subtotal} भयो। डेलिभरी शुल्क रु ${deliveryCharge} छ। कुल रु ${grandTotal} भयो। के तपाईं अर्डर गर्न चाहनुहुन्छ?`;
  }

  if (unavailableItems.length > 0) {
    responseText += `\n\n⚠️ पसलमा उपलब्ध नभएको: ${unavailableItems.join(', ')}`;
  }

  return {
    success: parsedItems.length > 0,
    items: parsedItems,
    unavailable: unavailableItems,
    subtotal,
    deliveryCharge,
    grandTotal,
    responseText,
    speechText,
    rawText: transcript
  };
}

// Speak aloud using browser SpeechSynthesis
export function speakTextAloud(text, language = 'ne') {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // stop previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure locale
    if (language === 'ne' || language === 'mai' || language === 'bho') {
      utterance.lang = 'ne-NP';
    } else {
      utterance.lang = 'en-US';
    }
    
    utterance.rate = 0.95; // Friendly cadence
    utterance.pitch = 1.0;

    // Pick best matching voice if available
    const voices = window.speechSynthesis.getVoices();
    const neVoice = voices.find(v => v.lang.startsWith('ne') || v.lang.startsWith('hi'));
    if (neVoice && (language === 'ne' || language === 'mai' || language === 'bho')) {
      utterance.voice = neVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}
