export const STOP_WORDS: Record<string, Set<string>> = {
  en: new Set(['the', 'and', 'is', 'at', 'which', 'on', 'in', 'for', 'with', 'about', 'as', 'by', 'to', 'of', 'a', 'an', 'that', 'this', 'it', 'was', 'were', 'be', 'are', 'or', 'but', 'not', 'you', 'i', 'we', 'they', 'he', 'she', 'has', 'have', 'had', 'do', 'does', 'did', 'from', 'when', 'where', 'how', 'why']),
  vi: new Set(['và', 'là', 'của', 'những', 'thì', 'mà', 'trong', 'với', 'cho', 'một', 'các', 'để', 'có', 'không', 'như', 'được', 'ở', 'vào', 'từ', 'đến', 'về', 'này', 'đã', 'sẽ', 'đang', 'ra', 'khi', 'cũng', 'lại', 'nên', 'còn', 'nhưng', 'rằng', 'bởi', 'do']),
  fr: new Set(['le', 'la', 'les', 'et', 'est', 'à', 'un', 'une', 'des', 'en', 'pour', 'dans', 'sur', 'qui', 'que', 'ce', 'avec', 'par', 'pas', 'il', 'elle', 'ne', 'au', 'aux', 'du', 'des']),
  de: new Set(['der', 'die', 'das', 'und', 'ist', 'in', 'zu', 'den', 'auf', 'für', 'von', 'mit', 'eine', 'ein', 'sich', 'als', 'an', 'am', 'wie', 'auch', 'nicht', 'es', 'dem', 'des']),
  es: new Set(['el', 'la', 'los', 'las', 'y', 'es', 'en', 'a', 'un', 'una', 'unos', 'unas', 'por', 'con', 'para', 'que', 'su', 'de', 'del', 'al', 'se', 'no', 'lo', 'como', 'más']),
};

export const COMMON_ADVERBS: Record<string, Set<string>> = {
  vi: new Set(['dường như', 'bỗng nhiên', 'khá là', 'hoàn toàn', 'tuyệt đối', 'rất', 'vô cùng', 'thực sự', 'có vẻ', 'đột nhiên', 'lập tức']),
  en: new Set(['really', 'very', 'quite', 'suddenly', 'absolutely', 'literally', 'completely', 'totally', 'seemingly'])
};

export function extractWords(text: string, lang: string): { word: string, index: number, length: number }[] {
  const words: { word: string, index: number, length: number }[] = [];
  
  if (['zh', 'ja', 'ko'].includes(lang) && typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    const segmenter = new (Intl as any).Segmenter(lang, { granularity: 'word' });
    const segments = segmenter.segment(text);
    for (const segment of segments) {
      if (segment.isWordLike) {
        words.push({ word: segment.segment.toLowerCase(), index: segment.index, length: segment.segment.length });
      }
    }
    return words;
  }

  // Fallback / Western / Vietnamese
  const regex = /[\wÀ-ỹ]+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    words.push({ word: match[0].toLowerCase(), index: match.index, length: match[0].length });
  }

  // Handle VI compounds (dường như, bỗng nhiên) by peeking
  if (lang === 'vi') {
    const adverbs = Array.from(COMMON_ADVERBS.vi);
    for (let i = 0; i < words.length - 1; i++) {
      const combined = words[i].word + ' ' + words[i+1].word;
      if (adverbs.includes(combined)) {
        words[i].word = combined;
        words[i].length = words[i].length + 1 + words[i+1].length;
        words.splice(i + 1, 1);
      }
    }
  }

  return words;
}

export function computeProximityMatrix(text: string, lang: string) {
  const words = extractWords(text, lang);
  const stopSet = STOP_WORDS[lang] || STOP_WORDS['en'];
  const frequencies = new Map<string, number>();
  
  words.forEach(w => {
    if (!stopSet.has(w.word) && w.word.length > 1) {
      frequencies.set(w.word, (frequencies.get(w.word) || 0) + 1);
    }
  });

  const distances: Array<{ word: string, from: number, to: number, severity: 'low' | 'high' }> = [];
  const positions = new Map<string, number[]>();
  
  words.forEach(w => {
    if (!stopSet.has(w.word) && w.word.length > 1 && frequencies.get(w.word)! > 1) {
      if (!positions.has(w.word)) positions.set(w.word, []);
      positions.get(w.word)!.push(w.index);
    }
  });

  for (const [word, posList] of positions.entries()) {
    for (let i = 0; i < posList.length - 1; i++) {
      const dist = posList[i+1] - posList[i];
      // < 50 characters roughly means dense repetition
      const severity = dist < 200 ? 'high' : 'low';
      distances.push({ word, from: posList[i], to: posList[i] + word.length, severity });
      if (i === posList.length - 2) {
         distances.push({ word, from: posList[i+1], to: posList[i+1] + word.length, severity });
      }
    }
  }
  
  return { frequencies, distances };
}

export function splitSentences(text: string, lang: string): { text: string, from: number, to: number }[] {
  // Matches ., !, ?, ..., —, 。, ！, ？, ……
  const regex = /[^.!?—。！？……]+(?:[.!?—。！？……]+|$)/g;
  let match;
  const sentences = [];
  while ((match = regex.exec(text)) !== null) {
    if (match[0].trim().length > 0) {
      sentences.push({ text: match[0], from: match.index, to: match.index + match[0].length });
    }
  }
  return sentences;
}
