import { readdirSync, readFileSync } from 'node:fs';
import { parseWords, type ImportReport } from './word-import.js';

/** apps/api/prisma/data/*.csv fayllarini (A1, A2, B1, B2...) birlashtirib o'qiydi. Tartib: fayl nomi bo'yicha. */
export const DATA_DIR = new URL('../../prisma/data/', import.meta.url);

export function loadWordFiles(dir: URL = DATA_DIR): ImportReport {
  const files = readdirSync(dir).filter((f) => f.endsWith('.csv')).sort();
  let text = '';
  files.forEach((f, i) => {
    const body = readFileSync(new URL(f, dir), 'utf8').replace(/^\uFEFF/, '');
    text += i === 0 ? body : body.slice(body.indexOf('\n') + 1); // keyingi fayllarning sarlavhasi tashlanadi
    if (!text.endsWith('\n')) text += '\n';
  });
  return parseWords(text); // bir nechta fayl bo'yicha takrorlar ham shu yerda tozalanadi
}
