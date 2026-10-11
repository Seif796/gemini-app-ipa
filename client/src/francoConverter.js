// Franco-Arabic (Arabizi) Intelligent Conversion Engine
// Supports Egyptian & Levantine phonetic nuances, numerals (3, 7, 5, 2, 6, 9, 8) and common expressions.

const WORD_DICTIONARY = {
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
  'عشان': '3ashan' ,
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

// Single Character Mapping
const CHAR_MAP = {
  // Numerals in Franco
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

  // Letters
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

/**
 * Convert a single Arabic character to its Franco equivalent
 * @param {string} ch
 * @returns {string}
 */
export function convertCharToFranco(ch) {
  if (!ch) return '';
  return CHAR_MAP[ch] || ch;
}

/**
 * Intelligent full-text conversion from Arabic to Franco
 * Checks dictionary for idioms first, then converts phonetically.
 * @param {string} text
 * @returns {string}
 */
export function convertArabicToFranco(text) {
  if (!text || typeof text !== 'string') return '';

  let result = text;

  // 1. Check for multi-word expressions
  for (const [ar, fr] of Object.entries(WORD_DICTIONARY)) {
    if (ar.includes(' ')) {
      const reg = new RegExp(`(^|\\s)${escapeRegex(ar)}(?=$|\\s|[.,!؟])`, 'gi');
      result = result.replace(reg, `$1${fr}`);
    }
  }

  // 2. Tokenize by words and spaces/punctuation
  const tokens = result.split(/(\s+|[.,!؟?:;()\[\]{}]+)/);

  const convertedTokens = tokens.map(token => {
    // If it's punctuation, spaces or non-Arabic, keep as is
    if (!token || /^[\s.,!؟?:;()\[\]{}]+$/.test(token)) {
      return token;
    }

    // Exact word dictionary match
    const cleanWord = token.trim();
    if (WORD_DICTIONARY[cleanWord]) {
      return WORD_DICTIONARY[cleanWord];
    }

    // Check with 'ال' prefix
    if (cleanWord.startsWith('ال') && cleanWord.length > 2) {
      const stem = cleanWord.substring(2);
      if (WORD_DICTIONARY[stem]) {
        return 'el' + WORD_DICTIONARY[stem];
      }
    }

    // Character by character conversion with phonetic awareness
    return convertWordPhonetically(token);
  });

  return convertedTokens.join('');
}

function convertWordPhonetically(word) {
  let out = '';
  const len = word.length;

  for (let i = 0; i < len; i++) {
    const ch = word[i];
    const next = i + 1 < len ? word[i + 1] : '';

    // Digraph checks
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

    // Definite article 'ال' at start of word
    if (i === 0 && ch === 'ا' && next === 'ل' && len > 2) {
      out += 'el';
      i++;
      continue;
    }

    // Middle/end 'و' -> often 'o' or 'u'
    if (ch === 'و' && i > 0 && i < len - 1) {
      out += 'o';
      continue;
    }

    // Middle 'ي' -> often 'e' or 'i'
    if (ch === 'ي' && i > 0 && i < len - 1) {
      out += 'e';
      continue;
    }

    // Default character map
    if (CHAR_MAP[ch]) {
      out += CHAR_MAP[ch];
    } else {
      out += ch;
    }
  }

  return out;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks whether text contains Arabic characters
 * @param {string} text 
 * @returns {boolean}
 */
export function hasArabicLetters(text) {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

