import { pick } from '../utils/i18n';

/*
 * Phrases for the SHOPKEEPER voice assistant (manages inventory by voice).
 * Five languages: ne, hi, en, mai, bho.
 */

export const SHOP_AGENT = {
  greeting: (language, shopName) => pick(language, {
    ne: `नमस्ते! 🙏 म तपाईंको पसल सहायक हुँ। म ${shopName} मा सामान थप्न, मूल्य वा स्टक बदल्न मद्दत गर्छु।\n\nभन्नुहोस्: "नयाँ सामान थप्नुहोस्", वा "आलुको मूल्य ८० बनाउनुहोस्", वा "चिनीको स्टक ५० बनाउनुहोस्"। बस बोल्नुहोस्!`,
    hi: `नमस्ते! 🙏 मैं आपका दुकान सहायक हूँ। मैं ${shopName} में सामान जोड़ने, दाम या स्टॉक बदलने में मदद करता हूँ।\n\nकहें: "नया सामान जोड़ो", या "आलू का दाम ८० करो", या "चीनी का स्टॉक ५० करो"। बस बोलिए!`,
    en: `Namaste! 🙏 I'm your shop assistant. I can add items, change prices or stock at ${shopName}.\n\nSay: "Add a new item", or "Set potato price to 80", or "Set sugar stock to 50". Just speak!`,
    mai: `प्रणाम! 🙏 हम अहाँक दोकान सहायक छी। हम ${shopName} मे सामान जोड़य, दाम वा स्टक बदलय मे मदद करैत छी।\n\nकहू: "नव सामान जोड़ू", वा "आलूक दाम ८० करू", वा "चीनीक स्टक ५० करू"। बस बाजू!`,
    bho: `प्रणाम! 🙏 हम रउरा दोकान सहायक बानी। हम ${shopName} में सामान जोड़े, दाम भा स्टॉक बदले में मदद करीलें।\n\nकहीं: "नया सामान जोड़ीं", भा "आलू के दाम ८० करीं", भा "चीनी के स्टॉक ५० करीं"। बस बोलीं!`
  }),

  askName: (language) => pick(language, {
    ne: 'सामानको नाम भन्नुहोस्।', hi: 'सामान का नाम बताइए।', en: 'What is the item name?', mai: 'सामानक नाम कहू।', bho: 'सामान के नाम बताईं।'
  }),
  askPrice: (language, name) => pick(language, {
    ne: `"${name}" को मूल्य कति? (प्रति एकाइ रुपैयाँमा)`, hi: `"${name}" का दाम कितना? (प्रति इकाई रुपये में)`, en: `What price for "${name}"? (in rupees per unit)`,
    mai: `"${name}" क दाम कतेक? (प्रति एकाइ रुपैयामे)`, bho: `"${name}" के दाम कतना? (प्रति एकाइ रुपइया में)`
  }),
  askUnit: (language) => pick(language, {
    ne: 'एकाइ के हो? किलो, लिटर, प्याकेट, वा वटा भन्नुहोस्।', hi: 'इकाई क्या है? किलो, लीटर, पैकेट, या पीस बताइए।', en: 'What unit? Say kg, litre, packet, or piece.',
    mai: 'एकाइ की अछि? किलो, लिटर, पैकेट, वा गो कहू।', bho: 'एकाइ का बा? किलो, लिटर, पैकेट, भा गो कहीं।'
  }),
  askStock: (language) => pick(language, {
    ne: 'अहिले कति स्टक छ? (संख्या भन्नुहोस्)', hi: 'अभी कितना स्टॉक है? (संख्या बताइए)', en: 'How much stock do you have? (say a number)',
    mai: 'एखन कतेक स्टक अछि? (संख्या कहू)', bho: 'अभी कतना स्टॉक बा? (संख्या कहीं)'
  }),
  confirmAdd: (language, d) => pick(language, {
    ne: `नयाँ सामान:\n• नाम: ${d.name}\n• मूल्य: रु ${d.price} प्रति ${d.unit}\n• स्टक: ${d.stock} ${d.unit}\n\nथप्ने हो? "हो" वा "होइन" भन्नुहोस्।`,
    hi: `नया सामान:\n• नाम: ${d.name}\n• दाम: रु ${d.price} प्रति ${d.unit}\n• स्टॉक: ${d.stock} ${d.unit}\n\nजोड़ूँ? "हाँ" या "नहीं" कहें।`,
    en: `New item:\n• Name: ${d.name}\n• Price: NPR ${d.price} per ${d.unit}\n• Stock: ${d.stock} ${d.unit}\n\nAdd it? Say "Yes" or "No".`,
    mai: `नव सामान:\n• नाम: ${d.name}\n• दाम: रु ${d.price} प्रति ${d.unit}\n• स्टक: ${d.stock} ${d.unit}\n\nजोड़ू? "हँ" वा "नै" कहू।`,
    bho: `नया सामान:\n• नाम: ${d.name}\n• दाम: रु ${d.price} प्रति ${d.unit}\n• स्टॉक: ${d.stock} ${d.unit}\n\nजोड़ीं? "हँ" भा "ना" कहीं।`
  }),
  added: (language, name) => pick(language, {
    ne: `भयो! 🎉 "${name}" तपाईंको पसलमा थपियो र ग्राहकहरूलाई देखिन्छ। अरू सामान थप्न "नयाँ सामान थप्नुहोस्" भन्नुहोस्।`,
    hi: `हो गया! 🎉 "${name}" आपकी दुकान में जुड़ गया और ग्राहकों को दिखेगा। और जोड़ने के लिए "नया सामान जोड़ो" कहें।`,
    en: `Done! 🎉 "${name}" was added to your shop and is now visible to customers. Say "Add a new item" to add more.`,
    mai: `भऽ गेल! 🎉 "${name}" अहाँक दोकानमे जुड़ि गेल आ ग्राहकके देखाइत अछि। आर जोड़य लेल "नव सामान जोड़ू" कहू।`,
    bho: `हो गइल! 🎉 "${name}" रउरा दोकान में जुड़ गइल आ ग्राहक के देखाई। आउर जोड़े खातिर "नया सामान जोड़ीं" कहीं।`
  }),
  addCancelled: (language) => pick(language, {
    ne: 'ठीक छ, रद्द गरियो। अरू केही गर्न भन्नुहोस्।', hi: 'ठीक है, रद्द कर दिया। और क्या करना है बताइए।', en: 'OK, cancelled. Tell me what else to do.',
    mai: 'ठीक अछि, रद्द भेल। आर की करय अछि कहू।', bho: 'ठीक बा, रद्द भइल। आउर का करे के बा कहीं।'
  }),
  priceUpdated: (language, name, price) => pick(language, {
    ne: `भयो! "${name}" को नयाँ मूल्य रु ${price} राखियो।`, hi: `हो गया! "${name}" का नया दाम रु ${price} है।`, en: `Done! "${name}" price is now NPR ${price}.`,
    mai: `भऽ गेल! "${name}" क नव दाम रु ${price} भेल।`, bho: `हो गइल! "${name}" के नया दाम रु ${price} भइल।`
  }),
  stockUpdated: (language, name, stock) => pick(language, {
    ne: `भयो! "${name}" को स्टक अब ${stock} भयो।`, hi: `हो गया! "${name}" का स्टॉक अब ${stock} है।`, en: `Done! "${name}" stock is now ${stock}.`,
    mai: `भऽ गेल! "${name}" क स्टक अब ${stock} भेल।`, bho: `हो गइल! "${name}" के स्टॉक अब ${stock} भइल।`
  }),
  availabilityToggled: (language, name, available) => pick(language, {
    ne: available ? `"${name}" अब उपलब्ध छ ✅` : `"${name}" अब अनुपलब्ध छ ⛔`,
    hi: available ? `"${name}" अब उपलब्ध है ✅` : `"${name}" अब अनुपलब्ध है ⛔`,
    en: available ? `"${name}" is now available ✅` : `"${name}" is now unavailable ⛔`,
    mai: available ? `"${name}" अब उपलब्ध अछि ✅` : `"${name}" अब अनुपलब्ध अछि ⛔`,
    bho: available ? `"${name}" अब उपलब्ध बा ✅` : `"${name}" अब अनुपलब्ध बा ⛔`
  }),
  productNotFound: (language) => pick(language, {
    ne: 'त्यो सामान भेटिनँ। कृपया सही नाम भन्नुहोस्।', hi: 'वह सामान नहीं मिला। कृपया सही नाम बताइए।', en: 'I couldn\'t find that item. Please say the correct name.',
    mai: 'ऊ सामान नै भेटल। सही नाम कहू।', bho: 'ऊ सामान ना मिलल। सही नाम कहीं।'
  }),
  needNumber: (language) => pick(language, {
    ne: 'कृपया संख्या भन्नुहोस् (जस्तै: ८० वा एक सय)।', hi: 'कृपया संख्या बताइए (जैसे: ८० या एक सौ)।', en: 'Please say a number (e.g. 80 or one hundred).',
    mai: 'कृपया संख्या कहू (जेना: ८०)।', bho: 'कृपया संख्या कहीं (जइसे: ८०)।'
  }),
  reAskYesNo: (language) => pick(language, {
    ne: 'कृपया "हो" वा "होइन" भन्नुहोस्।', hi: 'कृपया "हाँ" या "नहीं" कहें।', en: 'Please say "Yes" or "No".', mai: '"हँ" वा "नै" कहू।', bho: '"हँ" भा "ना" कहीं।'
  }),
  help: (language) => pick(language, {
    ne: 'म यसो गर्न सक्छु:\n• "नयाँ सामान थप्नुहोस्"\n• "आलुको मूल्य ९० बनाउनुहोस्"\n• "चिनीको स्टक ४० बनाउनुहोस्"\n• "तेल अनुपलब्ध बनाउनुहोस्"\n\nबस बोल्नुहोस्!',
    hi: 'मैं यह कर सकता हूँ:\n• "नया सामान जोड़ो"\n• "आलू का दाम ९० करो"\n• "चीनी का स्टॉक ४० करो"\n• "तेल अनुपलब्ध करो"\n\nबस बोलिए!',
    en: 'I can:\n• "Add a new item"\n• "Set potato price to 90"\n• "Set sugar stock to 40"\n• "Mark oil unavailable"\n\nJust speak!',
    mai: 'हम ई कऽ सकैत छी:\n• "नव सामान जोड़ू"\n• "आलूक दाम ९० करू"\n• "चीनीक स्टक ४० करू"\n• "तेल अनुपलब्ध करू"\n\nबस बाजू!',
    bho: 'हम ई कर सकीलें:\n• "नया सामान जोड़ीं"\n• "आलू के दाम ९० करीं"\n• "चीनी के स्टॉक ४० करीं"\n• "तेल अनुपलब्ध करीं"\n\nबस बोलीं!'
  }),
  notUnderstood: (language) => pick(language, {
    ne: 'माफ गर्नुहोस्, बुझिनँ। "नयाँ सामान थप्नुहोस्" वा "सहायता" भन्नुहोस्।', hi: 'माफ़ करें, समझ नहीं आया। "नया सामान जोड़ो" या "मदद" कहें।', en: 'Sorry, I didn\'t get that. Say "Add a new item" or "help".',
    mai: 'माफ करू, नै बुझलहुँ। "नव सामान जोड़ू" वा "सहायता" कहू।', bho: 'माफ करीं, ना समझनी। "नया सामान जोड़ीं" भा "मदद" कहीं।'
  }),
  micNeeded: (language) => pick(language, {
    ne: 'माइक अनुमति चाहिन्छ। कृपया अनुमति दिनुहोस्, अनि माइक बटन थिच्नुहोस्।', hi: 'माइक की अनुमति चाहिए। कृपया अनुमति दें, फिर माइक बटन दबाएँ।', en: 'I need mic access. Please allow it, then tap the mic button.',
    mai: 'माइक अनुमति चाही। अनुमति दिअ\' आ माइक बटन थिचू।', bho: 'माइक अनुमति चाहीं। अनुमति दीं आ माइक बटन दबाईं।'
  })
};
