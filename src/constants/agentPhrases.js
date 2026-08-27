import { pick } from '../utils/i18n';

/*
 * All spoken/shown phrases for the Mama Ji customer voice assistant, in five
 * languages: ne (Nepali), hi (Hindi), en (English), mai (Maithili), bho (Bhojpuri).
 */

export const AGENT = {
  greeting: (language, shopName) => pick(language, {
    ne: `नमस्ते! 🙏 म तपाईंको मामा जी एआई सहायक हुँ। तपाईंलाई के सामान चाहियो भन्नुहोस्, म सबै गरिदिन्छु!\n\nजस्तै: "मलाई १ किलो आलु र २ किलो चिनी चाहियो"\n\nअहिले ${shopName} बाट अर्डर गर्न सकिन्छ। बस बोल्नुहोस्, केही थिच्नु पर्दैन।`,
    hi: `नमस्ते! 🙏 मैं आपका मामा जी एआई सहायक हूँ। बताइए क्या सामान चाहिए, मैं सब कर दूँगा!\n\nजैसे: "मुझे १ किलो आलू और २ किलो चीनी चाहिए"\n\nअभी ${shopName} से ऑर्डर कर सकते हैं। बस बोलिए, कुछ दबाने की ज़रूरत नहीं।`,
    en: `Namaste! 🙏 I'm your Mama Ji AI Assistant. Just tell me what groceries you need and I'll handle everything!\n\nExample: "I need 1 kg potato and 2 kg sugar"\n\nCurrently ordering from ${shopName}. Just speak — no need to press anything.`,
    mai: `प्रणाम! 🙏 हम अहाँक मामा जी एआई सहायक छी। अहाँके जे सामान चाही, कहू, हम सब क' देब!\n\nजेना: "हमरा १ किलो आलू आ २ किलो चीनी चाही"\n\nएखन ${shopName} सँ अर्डर कऽ सकैत छी। बस बाजू, किछु थिचय के जरूरत नै।`,
    bho: `प्रणाम! 🙏 हम रउरा मामा जी एआई सहायक बानी। रउरा जे सामान चाहीं, बताईं, हम सब कर देब!\n\nजइसे: "हमरा १ किलो आलू आ २ किलो चीनी चाहीं"\n\nअभी ${shopName} से आर्डर कर सकीलें। बस बोलीं, कुछु थिचे के जरूरत नइखे।`
  }),

  processing: (language) => pick(language, {
    ne: 'हुन्छ, तपाईंको अर्डर बुझ्दैछु र पसलमा स्टक जाँच्दैछु...',
    hi: 'ठीक है, आपका ऑर्डर समझ रहा हूँ और दुकान में स्टॉक देख रहा हूँ...',
    en: 'Alright, understanding your order and checking stock...',
    mai: 'ठीक, अहाँक अर्डर बुझि रहल छी आ दोकानमे स्टक देखि रहल छी...',
    bho: 'ठीक बा, रउरा आर्डर समझत बानी आ दोकान में स्टॉक देखत बानी...'
  }),

  confirmCue: (language) => pick(language, {
    ne: '\n\n👉 अर्डर पक्का गर्न "हो" भन्नुहोस्, वा रद्द गर्न "होइन" भन्नुहोस्।',
    hi: '\n\n👉 ऑर्डर पक्का करने के लिए "हाँ" कहें, या रद्द करने के लिए "नहीं" कहें।',
    en: '\n\n👉 Say "Yes" to place the order, or "No" to cancel.',
    mai: '\n\n👉 अर्डर पक्का करय लेल "हँ" कहू, वा रद्द करय लेल "नै" कहू।',
    bho: '\n\n👉 आर्डर पक्का करे खातिर "हँ" कहीं, भा रद्द करे खातिर "ना" कहीं।'
  }),

  allUnavailable: (language, names, shopName) => pick(language, {
    ne: `माफ गर्नुहोस्, ${names} अहिले ${shopName} मा उपलब्ध छैन। तपाईं अर्को सामान भन्न सक्नुहुन्छ, वा अर्को पसल छान्न सक्नुहुन्छ।`,
    hi: `माफ़ करें, ${names} अभी ${shopName} में उपलब्ध नहीं है। आप कोई और सामान बता सकते हैं, या दूसरी दुकान चुन सकते हैं।`,
    en: `Sorry, ${names} is not available at ${shopName} right now. You can ask for something else, or choose another shop.`,
    mai: `माफ करू, ${names} एखन ${shopName} मे नै अछि। अहाँ दोसर सामान कहि सकैत छी, वा दोसर दोकान चुनि सकैत छी।`,
    bho: `माफ करीं, ${names} अभी ${shopName} में नइखे। रउरा दोसर सामान कह सकीलें, भा दोसर दोकान चुन सकीलें।`
  }),

  notUnderstoodItems: (language) => pick(language, {
    ne: 'माफ गर्नुहोस्, तपाईंले भनेको सामान बुझ्न सकिएन। कृपया "१ किलो आलु र २ किलो चिनी" जस्तो भन्नुहोस्।',
    hi: 'माफ़ करें, आपका बताया सामान समझ नहीं आया। कृपया ऐसे कहें: "१ किलो आलू और २ किलो चीनी"।',
    en: 'Sorry, I couldn\'t understand the items. Please say something like "1 kg potato and 2 kg sugar".',
    mai: 'माफ करू, अहाँ जे कहलहुँ से बुझि नै सकलहुँ। कृपया "१ किलो आलू आ २ किलो चीनी" जेना कहू।',
    bho: 'माफ करीं, रउरा जे कहनी ओकरा समझ नइखीं पवनी। कृपया "१ किलो आलू आ २ किलो चीनी" जइसन कहीं।'
  }),

  askPayment: (language) => pick(language, {
    ne: 'तपाईं कसरी भुक्तानी गर्नुहुन्छ? "नगद" (डेलिभरीमा) वा "अनलाइन" (eSewa/Khalti) भन्नुहोस्।',
    hi: 'आप भुगतान कैसे करेंगे? "नगद" (डिलीवरी पर) या "ऑनलाइन" (eSewa/Khalti) कहें।',
    en: 'How would you like to pay? Say "Cash" (on delivery) or "Online" (eSewa/Khalti).',
    mai: 'अहाँ कोना भुगतान करब? "नगद" (डेलिभरीमे) वा "अनलाइन" (eSewa/Khalti) कहू।',
    bho: 'रउरा कइसे पैसा देब? "नगद" (डेलिभरी पर) भा "अनलाइन" (eSewa/Khalti) कहीं।'
  }),

  paymentReask: (language) => pick(language, {
    ne: 'कृपया "नगद" वा "अनलाइन" भन्नुहोस्।',
    hi: 'कृपया "नगद" या "ऑनलाइन" कहें।',
    en: 'Please say "Cash" or "Online".',
    mai: 'कृपया "नगद" वा "अनलाइन" कहू।',
    bho: 'कृपया "नगद" भा "अनलाइन" कहीं।'
  }),

  payLabel: (language, method) => {
    const labels = {
      cod: { ne: 'नगद (डेलिभरीमा)', hi: 'नगद (डिलीवरी पर)', en: 'Cash on Delivery', mai: 'नगद (डेलिभरीमे)', bho: 'नगद (डेलिभरी पर)' },
      esewa: { ne: 'eSewa (अनलाइन — भुक्तानी भयो)', hi: 'eSewa (ऑनलाइन — भुगतान हो गया)', en: 'eSewa (Online — Paid)', mai: 'eSewa (अनलाइन — भुगतान भेल)', bho: 'eSewa (अनलाइन — भुगतान भइल)' },
      khalti: { ne: 'Khalti (अनलाइन — भुक्तानी भयो)', hi: 'Khalti (ऑनलाइन — भुगतान हो गया)', en: 'Khalti (Online — Paid)', mai: 'Khalti (अनलाइन — भुगतान भेल)', bho: 'Khalti (अनलाइन — भुगतान भइल)' }
    };
    return pick(language, labels[method] || labels.cod);
  },

  processingPayment: (language) => pick(language, {
    ne: 'अनलाइन भुक्तानी प्रक्रिया गर्दैछु...',
    hi: 'ऑनलाइन भुगतान प्रोसेस कर रहा हूँ...',
    en: 'Processing your online payment...',
    mai: 'अनलाइन भुगतान प्रक्रिया कऽ रहल छी...',
    bho: 'अनलाइन भुगतान प्रोसेस करत बानी...'
  }),

  placing: (language) => pick(language, {
    ne: 'हुन्छ! तपाईंको अर्डर अहिले पसलमा पठाउँदैछु...',
    hi: 'बढ़िया! आपका ऑर्डर अभी दुकान को भेज रहा हूँ...',
    en: 'Great! Placing your order with the shop now...',
    mai: 'ठीक! अहाँक अर्डर एखन दोकानमे पठा रहल छी...',
    bho: 'ठीक बा! रउरा आर्डर अभी दोकान में भेजत बानी...'
  }),

  orderSuccess: (language, id, total, payLabel) => pick(language, {
    ne: `बधाई छ! 🎉 तपाईंको अर्डर सफलतापूर्वक पसलमा पठाइयो!\n\nअर्डर नं: ${id}\nकुल रकम: रु ${total}\nभुक्तानी: ${payLabel}\n\nपसलेले स्वीकार गरेपछि सामान तयार गरिनेछ। तपाईंलाई अरू केही चाहियो भने भन्नुहोस्!`,
    hi: `बधाई हो! 🎉 आपका ऑर्डर सफलतापूर्वक दुकान को भेज दिया गया!\n\nऑर्डर नं: ${id}\nकुल रकम: रु ${total}\nभुगतान: ${payLabel}\n\nदुकानदार के स्वीकार करते ही सामान तैयार होगा। और कुछ चाहिए तो बताइए!`,
    en: `Order placed successfully! 🎉\n\nOrder: ${id}\nTotal: NPR ${total}\nPayment: ${payLabel}\n\nThe shop will start preparing once they accept. Need anything else?`,
    mai: `बधाई! 🎉 अहाँक अर्डर सफलतापूर्वक दोकानमे पठा देल गेल!\n\nअर्डर नं: ${id}\nकुल रकम: रु ${total}\nभुगतान: ${payLabel}\n\nदोकानदार स्वीकार केलाक बाद सामान तैयार हएत। आर किछु चाही त कहू!`,
    bho: `बधाई! 🎉 रउरा आर्डर सफलतापूर्वक दोकान में भेज दिहल गइल!\n\nआर्डर नं: ${id}\nकुल रकम: रु ${total}\nभुगतान: ${payLabel}\n\nदोकानदार मंजूर कइला के बाद सामान तैयार होई। आउर कुछु चाहीं त कहीं!`
  }),

  cancelled: (language) => pick(language, {
    ne: 'ठीक छ, अर्डर रद्द गरियो। तपाईंले सामान बदल्न चाहनुहुन्छ भने फेरि भन्नुहोस्।',
    hi: 'ठीक है, ऑर्डर रद्द कर दिया। सामान बदलना हो तो फिर बताइए।',
    en: 'OK, order cancelled. Tell me if you want to change items or order something else.',
    mai: 'ठीक अछि, अर्डर रद्द भेल। सामान बदलय चाहैत छी त फेर कहू।',
    bho: 'ठीक बा, आर्डर रद्द भइल। सामान बदले के होखे त फेर कहीं।'
  }),

  noOrderReady: (language) => pick(language, {
    ne: 'कुनै अर्डर तयार छैन।', hi: 'कोई ऑर्डर तैयार नहीं है।',
    en: 'No order ready to confirm.', mai: 'कोनो अर्डर तैयार नै अछि।', bho: 'कवनो आर्डर तैयार नइखे।'
  }),

  reAskYesNo: (language) => pick(language, {
    ne: 'कृपया "हो" वा "होइन" भन्नुहोस्। के म यो अर्डर गरिदिऊँ?',
    hi: 'कृपया "हाँ" या "नहीं" कहें। क्या मैं यह ऑर्डर कर दूँ?',
    en: 'Please say "Yes" to confirm or "No" to cancel. Shall I place this order?',
    mai: 'कृपया "हँ" वा "नै" कहू। की हम ई अर्डर कऽ दी?',
    bho: 'कृपया "हँ" भा "ना" कहीं। का हम ई आर्डर कर दीं?'
  }),

  trackOpening: (language, id) => pick(language, {
    ne: `तपाईंको अर्डर ${id} को स्थिति हेर्न खोल्दैछु।`,
    hi: `आपके ऑर्डर ${id} की स्थिति देखने के लिए खोल रहा हूँ।`,
    en: `Opening tracking for order ${id}.`,
    mai: `अहाँक अर्डर ${id} के स्थिति देखबाक लेल खोलि रहल छी।`,
    bho: `रउरा आर्डर ${id} के स्थिति देखे खातिर खोलत बानी।`
  }),

  noActiveOrder: (language) => pick(language, {
    ne: 'अहिले कुनै सक्रिय अर्डर छैन।', hi: 'अभी कोई सक्रिय ऑर्डर नहीं है।',
    en: 'No active orders found right now.', mai: 'एखन कोनो सक्रिय अर्डर नै अछि।', bho: 'अभी कवनो सक्रिय आर्डर नइखे।'
  }),

  cartOpening: (language, count) => pick(language, {
    ne: `तपाईंको झोला (कार्ट) खोल्दैछु। ${count} सामान छन्।`,
    hi: `आपका कार्ट खोल रहा हूँ। ${count} सामान हैं।`,
    en: `Opening your cart. ${count} items found.`,
    mai: `अहाँक झोरा (कार्ट) खोलि रहल छी। ${count} सामान अछि।`,
    bho: `रउरा झोरा (कार्ट) खोलत बानी। ${count} सामान बा।`
  }),

  help: (language) => pick(language, {
    ne: 'म तपाईंको एआई पसल सहायक हुँ। तपाईं मलाई यसरी भन्न सक्नुहुन्छ:\n• "मलाई १ किलो आलु र २ किलो चिनी चाहियो"\n• "मेरो अर्डर कहाँ पुग्यो?"\n• "कार्ट देखाउनुहोस्"\n• "रद्द गर्नुहोस्"\n\nबस बोल्नुहोस्, म सबै गर्छु!',
    hi: 'मैं आपका एआई खरीदारी सहायक हूँ। आप मुझसे ऐसे कह सकते हैं:\n• "मुझे १ किलो आलू और २ किलो चीनी चाहिए"\n• "मेरा ऑर्डर कहाँ पहुँचा?"\n• "कार्ट दिखाओ"\n• "रद्द करो"\n\nबस बोलिए, मैं सब कर दूँगा!',
    en: 'I\'m your AI shopping assistant. You can say:\n• "I need 1 kg potato and 2 kg sugar"\n• "Track my order"\n• "Show my cart"\n• "Cancel"\n\nJust speak, I\'ll handle everything!',
    mai: 'हम अहाँक एआई दोकान सहायक छी। अहाँ हमरा एना कहि सकैत छी:\n• "हमरा १ किलो आलू आ २ किलो चीनी चाही"\n• "हमर अर्डर कतय पहुँचल?"\n• "कार्ट देखाउ"\n• "रद्द करू"\n\nबस बाजू, हम सब क\' देब!',
    bho: 'हम रउरा एआई दोकान सहायक बानी। रउरा हमरा एह तरह कह सकीलें:\n• "हमरा १ किलो आलू आ २ किलो चीनी चाहीं"\n• "हमार आर्डर कहाँ पहुँचल?"\n• "कार्ट देखाईं"\n• "रद्द करीं"\n\nबस बोलीं, हम सब कर देब!'
  }),

  cancelAck: (language) => pick(language, {
    ne: 'ठीक छ। तपाईंलाई केही चाहियो भने भन्नुहोस्।', hi: 'ठीक है। कुछ चाहिए तो बताइए।',
    en: 'Sure. Let me know if you need anything.', mai: 'ठीक अछि। किछु चाही त कहू।', bho: 'ठीक बा। कुछु चाहीं त कहीं।'
  }),

  notUnderstood: (language) => pick(language, {
    ne: 'माफ गर्नुहोस्, मैले बुझिनँ। सामान अर्डर गर्न "मलाई १ किलो आलु चाहियो" जस्तो भन्नुहोस्, वा "सहायता" भन्नुहोस्।',
    hi: 'माफ़ करें, समझ नहीं आया। ऑर्डर के लिए "मुझे १ किलो आलू चाहिए" जैसे कहें, या "मदद" कहें।',
    en: 'Sorry, I didn\'t understand. To order say "I need 1 kg potato", or say "help" for options.',
    mai: 'माफ करू, हम नै बुझलहुँ। सामान अर्डर करय लेल "हमरा १ किलो आलू चाही" कहू, वा "सहायता" कहू।',
    bho: 'माफ करीं, हम ना समझनी। सामान आर्डर करे खातिर "हमरा १ किलो आलू चाहीं" कहीं, भा "मदद" कहीं।'
  }),

  micNeeded: (language) => pick(language, {
    ne: 'सुन्नको लागि माइक अनुमति चाहिन्छ। कृपया माइक अनुमति दिनुहोस्, अनि माइक बटन एकपटक थिच्नुहोस्।',
    hi: 'सुनने के लिए माइक की अनुमति चाहिए। कृपया माइक की अनुमति दें, फिर माइक बटन एक बार दबाएँ।',
    en: 'I need microphone access to listen. Please allow the mic, then tap the mic button once.',
    mai: 'सुनबाक लेल माइक अनुमति चाही। कृपया माइक अनुमति दिअ\', आ माइक बटन एक बेर थिचू।',
    bho: 'सुने खातिर माइक अनुमति चाहीं। कृपया माइक अनुमति दीं, आ माइक बटन एक बेर दबाईं।'
  }),

  didntCatch: (language) => pick(language, {
    ne: 'माफ गर्नुहोस्, मैले सुन्न सकिनँ। कृपया फेरि भन्नुहोस्।',
    hi: 'माफ़ करें, मैं सुन नहीं पाया। कृपया फिर से बोलें।',
    en: 'Sorry, I couldn\'t hear that. Please speak again.',
    mai: 'माफ करू, हम सुनि नै सकलहुँ। कृपया फेर कहू।',
    bho: 'माफ करीं, हम सुन ना पवनी। कृपया फेर कहीं।'
  })
};
