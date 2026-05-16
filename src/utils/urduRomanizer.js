/**
 * Urdu Romanization Engine
 * Converts Urdu text to Roman/Latin script with word-level pairing
 */

// Comprehensive mapping for Urdu characters to Roman/Latin equivalents
const urduToRomanMap = {
  // Basic alphabet
  'ا': 'a', 'آ': 'aa', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ٹ': 't', 'ث': 's',
  'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ڈ': 'd', 'ذ': 'z',
  'ر': 'r', 'ڑ': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
  'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'o', 'ہ': 'h',
  'ھ': 'h', 'ء': 'a', 'ی': 'y', 'ے': 'e', 'ؤ': 'o', 'ئ': 'y',
  
  // Special Urdu characters
  'ں': 'n',  // Noon ghunna - nasalized n
  'ن٘': 'n', // Another form of noon with diacritic
  'نۨ': 'n', // Another variant
  
  // Extended characters
  'ة': 't', 'ى': 'a', 'ٰ': 'a', 'ٖ': 'i', 'ٓ': 'a', 'ٔ': 'a',
  
  // Vowel marks (diacritics)
  'َ': 'a', 'ِ': 'i', 'ُ': 'u', 'ً': 'an', 'ٍ': 'in', 'ٌ': 'un',
  'ْ': '', 'ّ': '', // Sukun and Shadda
  
  // Nasalization marks
  '٘': 'n', // Small noon for nasalization
  
  // Punctuation and spaces
  ' ': ' ', '\n': '\n', '،': ',', '۔': '.', '؟': '?',
  '!': '!', ':': ':', ';': ';', '"': '"', "'": "'",
  '(': '(', ')': ')', '[': '[', ']': ']', '{': '{', '}': '}'
};

// Special word combinations for better romanization
const specialWordMappings = {
  'ال': 'al',
  'الله': 'allah',
  'محمد': 'muhammad',
  'علی': 'ali',
  'رضی': 'razi',
  'اللہ': 'allah',
  'کراچی': 'karachi',
  'پاکستان': 'pakistan',
  'اسلام': 'islam',
  'مسلم': 'muslim',
  'انمول': 'anmol',
  'پنکی': 'pinky',
  'منشیات': 'munshiyaat',
  'فروش': 'farosh',
  'گرفتار': 'giraftar',
  'ملزمہ': 'mulzimah',
  'عدالت': 'adalat',
  'مقدمہ': 'muqadma',
  'میں': 'mein',  // Common word with noon ghunna
  'ہیں': 'hain',  // Common word with noon ghunna
  'تھیں': 'thin', // Common word with noon ghunna
  'گئیں': 'gain', // Common word with noon ghunna
  'لگیں': 'lagain', // Common word with noon ghunna
  'ہوئیں': 'huin', // Common word with noon ghunna
  'آئیں': 'aain', // Common word with noon ghunna
  'جائیں': 'jaain' // Common word with noon ghunna
};

// Urdu digits to Roman digits
const urduDigits = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

/**
 * Check if a character is Urdu/Arabic script
 */
export function isUrduChar(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x0600 && code <= 0x06FF) ||
         (code >= 0x0750 && code <= 0x077F) ||
         (code >= 0xFB50 && code <= 0xFDFF) ||
         (code >= 0xFE70 && code <= 0xFEFF);
}

/**
 * Convert Urdu digits to Roman digits
 */
export function romanizeDigits(text) {
  if (!text) return '';
  let result = '';
  for (const char of text) {
    result += urduDigits[char] || char;
  }
  return result;
}

/**
 * Check if a character is a nasalization character (noon ghunna or similar)
 */
export function isNasalizationChar(char) {
  return char === 'ں' || char === 'ن٘' || char === 'نۨ' || char === '٘';
}

/**
 * Check if a word contains any Urdu characters
 */
export function hasUrduChars(word) {
  if (!word) return false;
  for (const char of word) {
    if (isUrduChar(char)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a word is mixed content (has both Urdu and numbers)
 */
export function isMixedContent(word) {
  let hasUrdu = false;
  let hasNumber = false;
  
  for (const char of word) {
    if (isUrduChar(char)) hasUrdu = true;
    if (/[0-9]/.test(char)) hasNumber = true;
  }
  
  return hasUrdu && hasNumber;
}

/**
 * Romanize a single word with special handling for nasalization and numbers
 */
export function romanizeWord(word) {
  if (!word || typeof word !== 'string') return '';
  
  // Check if the word contains any Urdu characters
  if (!hasUrduChars(word)) {
    // If no Urdu characters, return the word as-is (preserve numbers and Latin text)
    return word;
  }
  
  // Check for special word mappings first
  const normalizedWord = word.trim();
  if (specialWordMappings[normalizedWord]) {
    return specialWordMappings[normalizedWord];
  }
  
  let result = '';
  let prevChar = '';
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const nextChar = word[i + 1] || '';
    
    // Handle nasalization characters
    if (isNasalizationChar(char)) {
      if (prevChar === 'a' || prevChar === 'e' || prevChar === 'i') {
        result += 'n';
      } else {
        result += 'n';
      }
    }
    // Handle regular digits - preserve them as-is
    else if (/[0-9]/.test(char)) {
      result += char;
    }
    // Handle Urdu digits and convert them to regular digits
    else if (urduDigits[char]) {
      result += urduDigits[char];
    }
    // Handle other Urdu characters
    else if (urduToRomanMap[char]) {
      let romanized = urduToRomanMap[char];
      
      // Special handling for 'n' followed by 'g' to make 'ng' sound
      if (romanized === 'n' && (nextChar === 'گ' || nextChar === 'ک')) {
        romanized = 'ng';
      }
      
      result += romanized;
    } 
    else {
      // Keep non-Urdu characters as-is
      result += char;
    }
    
    prevChar = urduToRomanMap[char] || char;
  }
  
  // Clean up common patterns
  result = result.replace(/aa/g, 'ā');
  result = result.replace(/ii/g, 'ī');
  result = result.replace(/uu/g, 'ū');
  result = result.replace(/kh/g, 'kh');
  result = result.replace(/sh/g, 'sh');
  result = result.replace(/gh/g, 'gh');
  
  // Fix common nasalization patterns
  result = result.replace(/ain/g, 'ain');
  result = result.replace(/ein/g, 'ein');
  result = result.replace(/oin/g, 'oin');
  
  // Handle words ending with nasalized n
  if (result.endsWith('n') && word.includes('ں')) {
    // Keep the 'n' as is
  }
  
  return result;
}

/**
 * Split Urdu text into words (handles RTL properly)
 */
export function splitUrduWords(text) {
  if (!text) return [];
  
  const words = [];
  let currentWord = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Check if character is a whitespace
    if (/\s/.test(char)) {
      if (currentWord) {
        words.push(currentWord);
        currentWord = '';
      }
      words.push(char);
    } 
    // Check if character is punctuation
    else if (/[،۔؟!?:;'"()\[\]{}]/.test(char)) {
      if (currentWord) {
        words.push(currentWord);
        currentWord = '';
      }
      words.push(char);
    } 
    else {
      currentWord += char;
    }
  }
  
  if (currentWord) {
    words.push(currentWord);
  }
  
  return words;
}

/**
 * Get word-romanization pairs for a sentence/paragraph
 * Returns array of objects: { word: string, romanized: string, isSpace: boolean }
 */
export function getWordRomanizationPairs(text) {
  if (!text || typeof text !== 'string') return [];
  
  const words = splitUrduWords(text);
  const pairs = [];
  
  for (const word of words) {
    // Check if it's a space or punctuation
    if (/^\s+$/.test(word)) {
      pairs.push({ 
        word: word, 
        romanized: '', 
        isSpace: true 
      });
    } 
    else if (/[،۔؟!?:;'"()\[\]{}]/.test(word)) {
      pairs.push({ 
        word: word, 
        romanized: word, 
        isSpace: false,
        isPunctuation: true 
      });
    }
    else {
      // Romanize the word (this will now preserve numbers and non-Urdu text)
      const romanized = romanizeWord(word);
      pairs.push({ 
        word: word, 
        romanized: romanized, 
        isSpace: false 
      });
    }
  }
  
  return pairs;
}

/**
 * Romanize entire text (simple version)
 */
export function romanizeUrduText(text) {
  if (!text || typeof text !== 'string') return '';
  
  const pairs = getWordRomanizationPairs(text);
  return pairs.map(pair => pair.isSpace ? pair.word : pair.romanized).join('');
}

/**
 * Get detailed romanization with character mappings for a word
 * Includes information about nasalization
 */
export function getDetailedWordRomanization(word) {
  if (!word) return [];
  
  const details = [];
  
  for (const char of word) {
    let type = 'char';
    let romanized = urduToRomanMap[char] || char;
    
    if (isNasalizationChar(char)) {
      type = 'nasalization';
      romanized = 'n (nasal)';
    } else if (/[0-9]/.test(char)) {
      type = 'number';
      romanized = char;
    } else if (urduDigits[char]) {
      type = 'urdu-number';
      romanized = urduDigits[char];
    } else if (!isUrduChar(char)) {
      type = 'latin';
      romanized = char;
    }
    
    details.push({
      original: char,
      romanized: romanized,
      type: type,
      isNasal: isNasalizationChar(char)
    });
  }
  
  return details;
}

/**
 * Test function to verify romanization of a specific word
 * Useful for debugging
 */
export function testRomanization(word) {
  console.log(`Original: ${word}`);
  console.log(`Romanized: ${romanizeWord(word)}`);
  console.log(`Details:`, getDetailedWordRomanization(word));
  return {
    original: word,
    romanized: romanizeWord(word),
    details: getDetailedWordRomanization(word)
  };
}

// Default export for compatibility
export default {
  romanizeUrduText,
  romanizeWord,
  getWordRomanizationPairs,
  splitUrduWords,
  getDetailedWordRomanization,
  isUrduChar,
  romanizeDigits,
  isNasalizationChar,
  hasUrduChars,
  isMixedContent,
  testRomanization
};