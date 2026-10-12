// Franco-Arabic (Arabizi) Intelligent Conversion Engine
// Supports Egyptian & Levantine phonetic nuances, numerals (3, 7, 5, 2, 6, 9, 8) and bidirectional translation.

export const WORD_DICTIONARY = {
  'ازيك': 'ezayak',
  'ازيكوا': 'ezayoko',
  'ازيكم': 'ezayoko',
  'عامل ايه': '3amel eh',
  'عاملة ايه': '3amla eh',
  'عاملين ايه': '3amleen eh',
  'الحمدلله': 'el7mdllah',
  'الحمد لله': 'el7md lellah',
  'شكرا': 'shokran',
  'شكراً': 'shokran',
  'حبيبي': '7bibi',
  'حبيبتي': '7bebti',
  'وحشتني': 'wa7ashtny',
  'وحشتيني': 'wa7ashteeny',
  'صباح الخير': '9ba7 el 5air',
  'مساء الخير': 'msa2 el 5air',
  'صباح الفل': '9ba7 el fol',
  'صباح الورد': '9ba7 el ward',
  'تصبح على خير': 'te9ba7 3la 5air',
  'تمام': 'tamam',
  'يلا': 'yalla',
  'فينك': 'fenak',
  'فينكم': 'feenko',
  'بحبك': 'ba7ebak',
  'حاضر': '7ader',
  'معلش': 'ma3lesh',
  'ان شاء الله': 'in sha allah',
  'إن شاء الله': 'in sha allah',
  'ماشي': 'mashy',
  'ايوه': 'aiwa',
  'أيوة': 'aiwa',
  'لا': 'la2',
  'لأ': 'la2',
  'اه': 'ah',
  'أه': 'ah',
  'ليه': 'leh',
  'كده': 'keda',
  'كدة': 'keda',
  'مش': 'msh',
  'عشان': '3ashan',
  'علشان': '3alashan',
  'مين': 'meen',
  'اخويا': 'a5oya',
  'أخويا': 'a5oya',
  'اختي': 'o5ty',
  'أختي': 'o5ty',
  'اصلي': 'a9ly',
  'أصلي': 'a9ly',
  'يا رب': 'ya rab',
  'يارب': 'ya rab',
  'سلام': 'salam',
  'مع السلامة': 'ma3 el salama',
  'باي': 'bye',
  'مبروك': 'mabrook',
  'ألف مبروك': 'alf mabrook',
  'كل سنة وانت طيب': 'kol sana w enta 6ayeb',
  'كل سنه وانتي طيبه': 'kol sana w enty 6ayeba',
  'رمضان كريم': 'ramadan kareem',
  'وحياتك': 'w 7yatak',
  'صاحبي': 'sa7by',
  'بجد': 'begad',
  'قوي': 'awy',
  'أوي': 'awy',
  'كتير': 'keteer',
  'دلوقتي': 'delwaty',
  'فين': 'feen',
  'امتى': 'emta',
  'إمتى': 'emta',
  'براحة': 'bra7a',
  'خلاص': '5las',
  'والله': 'wallah',
  'بخير': 'b5air',
  'اخبارك': 'a5barak',
  'أخبارك': 'a5barak',
  'وحشني': 'wa7shny',
  'حلو': '7elw',
  'حلوة': '7elwa',
  'جميل': 'gmeel',
  'جميلة': 'gmeela',
  'كويس': 'kwayes',
  'كويسة': 'kwaysa',
  'فرحان': 'far7an',
  'تعبان': 'ta3ban',
  'موجود': 'mawgood',
  'مستنيك': 'mstaneek',
  'هكلمك': 'hakalmak',
  'رن عليا': 'ren 3alaya',
  'كلمني': 'kalemny',
  'رسالة': 'resala',
  'شات': 'chat',
  'واتساب': 'whatsapp',
  'تلفون': 'telephone',
  'موبايل': 'mobile'
};

// Reverse Dictionary (Franco to Arabic)
export const REVERSE_DICTIONARY = {};
for (const [ar, fr] of Object.entries(WORD_DICTIONARY)) {
  REVERSE_DICTIONARY[fr.toLowerCase()] = ar;
}
// Add extra common Franco slang spellings
REVERSE_DICTIONARY['ezayak'] = 'ازيك';
REVERSE_DICTIONARY['ezayek'] = 'ازيك';
REVERSE_DICTIONARY['ezayk'] = 'ازيك';
REVERSE_DICTIONARY['3amel'] = 'عامل';
REVERSE_DICTIONARY['3amla'] = 'عاملة';
REVERSE_DICTIONARY['eh'] = 'ايه';
REVERSE_DICTIONARY['sa7bi'] = 'صاحبي';
REVERSE_DICTIONARY['sa7by'] = 'صاحبي';
REVERSE_DICTIONARY['7abibi'] = 'حبيبي';
REVERSE_DICTIONARY['7abebti'] = 'حبيبتي';
REVERSE_DICTIONARY['al7mdllah'] = 'الحمد لله';
REVERSE_DICTIONARY['el7amdellah'] = 'الحمد لله';
REVERSE_DICTIONARY['shokrn'] = 'شكراً';
REVERSE_DICTIONARY['gedan'] = 'جداً';
REVERSE_DICTIONARY['feen'] = 'فين';
REVERSE_DICTIONARY['fenak'] = 'فينك';
REVERSE_DICTIONARY['enta'] = 'انت';
REVERSE_DICTIONARY['enty'] = 'انتي';
REVERSE_DICTIONARY['ana'] = 'انا';
REVERSE_DICTIONARY['ah'] = 'اه';
REVERSE_DICTIONARY['la2'] = 'لا';
REVERSE_DICTIONARY['la'] = 'لا';
REVERSE_DICTIONARY['leh'] = 'ليه';
REVERSE_DICTIONARY['keda'] = 'كده';
REVERSE_DICTIONARY['begad'] = 'بجد';
REVERSE_DICTIONARY['tamam'] = 'تمام';
REVERSE_DICTIONARY['msh'] = 'مش';
REVERSE_DICTIONARY['mesh'] = 'مش';
REVERSE_DICTIONARY['delw2ty'] = 'دلوقتي';
REVERSE_DICTIONARY['delwaty'] = 'دلوقتي';
REVERSE_DICTIONARY['5alas'] = 'خلاص';
REVERSE_DICTIONARY['5las'] = 'خلاص';
REVERSE_DICTIONARY['bra7tk'] = 'براحتك';

// Single Arabic Character Mapping to Franco
export const CHAR_MAP = {
  'ع': '3',
  'ح': '7',
  'خ': '5',
  'ء': '2',
  'أ': '2',
  'إ': '2',
  'آ': '2',
  'ئ': '2',
  'ؤ': '2',
  'ط': '6',
  'ظ': "6'",
  'ص': '9',
  'ض': "9'",
  'ق': '9',
  'غ': "3'",
  'ب': 'b',
  'ت': 't',
  'ث': 'th',
  'ج': 'g',
  'د': 'd',
  'ذ': 'z',
  'ر': 'r',
  'ز': 'z',
  'س': 's',
  'ش': 'sh',
  'ف': 'f',
  'ك': 'k',
  'ل': 'l',
  'م': 'm',
  'ن': 'n',
  'ه': 'h',
  'ة': 'a',
  'و': 'w',
  'ي': 'y',
  'ى': 'a',
  'ا': 'a',
  'لأ': 'la2',
  'لا': 'la'
};

// Single Franco / Numeral Mapping to Arabic
export const FRANCO_TO_AR_CHAR_MAP = {
  '3': 'ع',
  '7': 'ح',
  '5': 'خ',
  '2': 'أ',
  '6': 'ط',
  '9': 'ص',
  '8': 'غ',
  'b': 'ب',
  't': 'ت',
  'g': 'ج',
  'd': 'د',
  'z': 'ز',
  'r': 'ر',
  's': 'س',
  'f': 'ف',
  'q': 'ق',
  'k': 'ك',
  'l': 'ل',
  'm': 'م',
  'n': 'n',
  'h': 'ه',
  'w': 'و',
  'y': 'ي',
  'a': 'ا',
  'e': 'ي',
  'o': 'و',
  'u': 'و',
  'i': 'ي',
  'c': 'ك',
  'p': 'ب',
  'v': 'ف'
};

export function convertCharToFranco(ch) {
  if (!ch) return '';
  return CHAR_MAP[ch] || ch;
}

export function convertCharToAr(ch) {
  if (!ch) return '';
  const lower = ch.toLowerCase();
  return FRANCO_TO_AR_CHAR_MAP[lower] || ch;
}

/**
 * Intelligent full-text conversion from Arabic to Franco
 */
export function convertArabicToFranco(text) {
  if (!text || typeof text !== 'string') return '';

  let result = text;

  // 1. Multi-word phrases
  for (const [ar, fr] of Object.entries(WORD_DICTIONARY)) {
    if (ar.includes(' ')) {
      const reg = new RegExp(`(^|\\s)${escapeRegex(ar)}(?=$|\\s|[.,!؟?:;/])`, 'gi');
      result = result.replace(reg, `$1${fr}`);
    }
  }

  // 2. Tokenize
  const tokens = result.split(/(\s+|[.,!؟?:;/()\[\]{}]+)/);

  const convertedTokens = tokens.map(token => {
    if (!token || /^[\s.,!؟?:;/()\[\]{}]+$/.test(token)) {
      return token;
    }

    const cleanWord = token.trim();
    if (WORD_DICTIONARY[cleanWord]) {
      return WORD_DICTIONARY[cleanWord];
    }

    if (cleanWord.startsWith('ال') && cleanWord.length > 2) {
      const stem = cleanWord.substring(2);
      if (WORD_DICTIONARY[stem]) {
        return 'el' + WORD_DICTIONARY[stem];
      }
    }

    return convertWordPhoneticallyToFranco(token);
  });

  return convertedTokens.join('');
}

function convertWordPhoneticallyToFranco(word) {
  let out = '';
  const len = word.length;

  for (let i = 0; i < len; i++) {
    const ch = word[i];
    const next = i + 1 < len ? word[i + 1] : '';

    if (ch === 'ل' && next === 'ا') {
      out += 'la';
      i++;
      continue;
    }
    if (ch === 'ش') {
      out += 'sh';
      continue;
    }
    if (ch === 'ث') {
      out += 'th';
      continue;
    }
    if (ch === 'غ') {
      out += "3'";
      continue;
    }
    if (i === 0 && ch === 'ا' && next === 'ل' && len > 2) {
      out += 'el';
      i++;
      continue;
    }
    if (ch === 'و' && i > 0 && i < len - 1) {
      out += 'o';
      continue;
    }
    if (ch === 'ي' && i > 0 && i < len - 1) {
      out += 'e';
      continue;
    }

    out += CHAR_MAP[ch] || ch;
  }

  return out;
}

/**
 * Intelligent full-text conversion from Franco to Arabic
 */
export function convertFrancoToArabic(text) {
  if (!text || typeof text !== 'string') return '';

  let result = text;

  // 1. Multi-word phrases in reverse dictionary
  for (const [fr, ar] of Object.entries(REVERSE_DICTIONARY)) {
    if (fr.includes(' ')) {
      const reg = new RegExp(`(^|\\s)${escapeRegex(fr)}(?=$|\\s|[.,!؟?:;/])`, 'gi');
      result = result.replace(reg, `$1${ar}`);
    }
  }

  // 2. Tokenize by words and punctuation
  const tokens = result.split(/(\s+|[.,!؟?:;/()\[\]{}]+)/);

  const convertedTokens = tokens.map(token => {
    if (!token || /^[\s.,!؟?:;/()\[\]{}]+$/.test(token)) {
      return token;
    }

    const cleanWord = token.trim().toLowerCase();
    if (REVERSE_DICTIONARY[cleanWord]) {
      return REVERSE_DICTIONARY[cleanWord];
    }

    // Check with 'el' prefix
    if (cleanWord.startsWith('el') && cleanWord.length > 2) {
      const stem = cleanWord.substring(2);
      if (REVERSE_DICTIONARY[stem]) {
        return 'ال' + REVERSE_DICTIONARY[stem];
      }
    }

    return convertWordPhoneticallyToArabic(token);
  });

  return convertedTokens.join('');
}

function convertWordPhoneticallyToArabic(word) {
  let out = '';
  const len = word.length;
  const lower = word.toLowerCase();

  for (let i = 0; i < len; i++) {
    const ch = lower[i];
    const next = i + 1 < len ? lower[i + 1] : '';

    // Check compound symbols (3', 9', 6', sh, th, kh, gh, la)
    if (ch === '3' && next === "'") {
      out += 'غ';
      i++;
      continue;
    }
    if (ch === '9' && next === "'") {
      out += 'ض';
      i++;
      continue;
    }
    if (ch === '6' && next === "'") {
      out += 'ظ';
      i++;
      continue;
    }
    if (ch === 's' && next === 'h') {
      out += 'ش';
      i++;
      continue;
    }
    if (ch === 't' && next === 'h') {
      out += 'ث';
      i++;
      continue;
    }
    if (ch === 'k' && next === 'h') {
      out += 'خ';
      i++;
      continue;
    }
    if (ch === 'g' && next === 'h') {
      out += 'غ';
      i++;
      continue;
    }
    if (ch === 'l' && next === 'a') {
      out += 'لا';
      i++;
      continue;
    }
    if (i === 0 && ch === 'e' && next === 'l' && len > 2) {
      out += 'ال';
      i++;
      continue;
    }

    out += FRANCO_TO_AR_CHAR_MAP[ch] || ch;
  }

  return out;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks whether text contains Arabic characters
 */
export function hasArabicLetters(text) {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

/**
 * Bi-directional Smart Translate:
 * If text contains Arabic -> converts to Franco.
 * If text is in Franco/English -> converts to Arabic.
 */
export function translateBidirectional(text) {
  if (!text || typeof text !== 'string') return '';
  if (hasArabicLetters(text)) {
    return convertArabicToFranco(text);
  } else {
    return convertFrancoToArabic(text);
  }
}
