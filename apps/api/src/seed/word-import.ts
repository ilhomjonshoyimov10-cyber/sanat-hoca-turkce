// Lug'atni (CSV/TSV) o'qish va tekshirish. Sof funksiyalar: bazaga tegmaydi, shuning uchun testlanadi.
// Ustunlar (sarlavha qatori bo'lishi shart): turkish, uzbek [, level, category, exampleTr, exampleUz, position]

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type WordLevel = (typeof LEVELS)[number];

export interface ParsedWord {
  turkish: string;
  uzbek: string;
  level: WordLevel;
  category?: string;
  exampleTr?: string;
  exampleUz?: string;
  position?: number;
}
export interface RowIssue { line: number; message: string }
export interface ImportReport {
  words: ParsedWord[];
  errors: RowIssue[];        // kiritilmaydigan qatorlar
  warnings: RowIssue[];      // kiritiladi, lekin e'tibor bering
  duplicates: number;        // fayl ichidagi takroriy qatorlar (o'tkazib yuboriladi)
}

const MAX = { turkish: 60, uzbek: 200, category: 40, example: 200 };

// Sarlavha nomlari: turli yozilishlarni qabul qiladi
const ALIASES: Record<string, string> = {
  turkish: 'turkish', turkcha: 'turkish', tr: 'turkish', turk: 'turkish', soz: 'turkish', so_z: 'turkish',
  uzbek: 'uzbek', ozbekcha: 'uzbek', uz: 'uzbek', tarjima: 'uzbek', translation: 'uzbek',
  level: 'level', daraja: 'level',
  category: 'category', kategoriya: 'category', mavzu: 'category', topic: 'category',
  exampletr: 'exampleTr', misol: 'exampleTr', misoltr: 'exampleTr', example: 'exampleTr',
  exampleuz: 'exampleUz', misoluz: 'exampleUz',
  position: 'position', tartib: 'position', order: 'position',
};
const headerKey = (h: string) =>
  ALIASES[h.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’ʻ`]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').replace(/_/g, '') ] ??
  ALIASES[h.toLowerCase().trim()];

/** Ajratuvchini (, ; yoki tab) birinchi qatordan aniqlaydi. */
function detectDelimiter(firstLine: string): string {
  const counts: [string, number][] = [[',', 0], [';', 0], ['\t', 0]];
  let inQuotes = false;
  for (const ch of firstLine) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes) for (const c of counts) if (c[0] === ch) c[1]++;
  }
  return counts.sort((a, b) => b[1] - a[1])[0][0];
}

/** Qo'shtirnoqlar, qator ichidagi vergul va qator ko'chirishlarini to'g'ri o'qiydigan CSV parser. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '');
  const delim = detectDelimiter(text.split(/\r?\n/, 1)[0] ?? '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

// Apostroflar bir xil ko'rinishga keltiriladi (o’zbek, oʻzbek, o`zbek -> o'zbek)
const clean = (s: string | undefined) => (s ?? '').normalize('NFC').replace(/[’ʻʼ‘`´]/g, "'").replace(/\s+/g, ' ').trim();
const unsafe = /[<>]|\p{Cc}/u; // HTML belgilari va boshqaruv belgilari
// Gap oxiridagi nuqta/ko'p nuqta; turkcha tomonda ? va ! ham (o'yinda yozish osonroq bo'lishi uchun)
const tail = (s: string, turkish: boolean) => s.replace(turkish ? /[\s.…?!]+$/u : /[\s.…]+$/u, '');

export function parseWords(text: string): ImportReport {
  const report: ImportReport = { words: [], errors: [], warnings: [], duplicates: 0 };
  const rows = parseCsv(text);
  if (rows.length === 0) { report.errors.push({ line: 1, message: "Fayl bo'sh" }); return report; }

  const cols = rows[0].map((h) => headerKey(clean(h)));
  const idx = (k: string) => cols.indexOf(k);
  if (idx('turkish') < 0 || idx('uzbek') < 0) {
    report.errors.push({ line: 1, message: "Sarlavha qatorida 'turkish' va 'uzbek' ustunlari bo'lishi shart" });
    return report;
  }

  const seen = new Set<string>();
  const byTr = new Map<string, Set<string>>();
  const byUz = new Map<string, Set<string>>();
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const get = (k: string) => clean(r[idx(k)]);
    const turkish = tail(get('turkish'), true);
    const uzbek = tail(get('uzbek'), false);
    const bad = (message: string) => report.errors.push({ line, message });

    if (!turkish || !uzbek) return bad("'turkish' yoki 'uzbek' bo'sh");
    if (turkish.length > MAX.turkish) return bad(`Turkcha so'z ${MAX.turkish} belgidan oshmasin`);
    if (uzbek.length > MAX.uzbek) return bad(`Tarjima ${MAX.uzbek} belgidan oshmasin`);

    const levelRaw = idx('level') >= 0 ? get('level').toUpperCase() : '';
    if (levelRaw && !(LEVELS as readonly string[]).includes(levelRaw)) return bad(`Daraja noto'g'ri: "${levelRaw}" (A1, A2, B1, B2, C1 bo'lishi kerak)`);

    const category = get('category') || undefined;
    const exampleTr = get('exampleTr') || undefined;
    const exampleUz = get('exampleUz') || undefined;
    if (category && category.length > MAX.category) return bad(`Kategoriya ${MAX.category} belgidan oshmasin`);
    for (const [name, v] of [['misol (turkcha)', exampleTr], ['misol (o\'zbekcha)', exampleUz]] as const) {
      if (v && v.length > MAX.example) return bad(`${name} ${MAX.example} belgidan oshmasin`);
    }
    if ([turkish, uzbek, category, exampleTr, exampleUz].some((v) => v && unsafe.test(v))) return bad("Matnda '<', '>' yoki boshqaruv belgilari bor");

    let position: number | undefined;
    if (idx('position') >= 0 && get('position') !== '') {
      position = Number(get('position'));
      if (!Number.isInteger(position) || position < 0 || position > 1_000_000) return bad("'position' butun son bo'lishi kerak");
    }

    const key = `${turkish.toLocaleLowerCase('tr-TR')}|${uzbek.toLocaleLowerCase('uz')}`;
    if (seen.has(key)) { report.duplicates++; return; }
    seen.add(key);

    const trKey = turkish.toLocaleLowerCase('tr-TR');
    const uzKey = uzbek.toLocaleLowerCase('uz');
    byTr.set(trKey, (byTr.get(trKey) ?? new Set()).add(uzbek));
    byUz.set(uzKey, (byUz.get(uzKey) ?? new Set()).add(turkish));

    report.words.push({ turkish, uzbek, level: (levelRaw || 'A1') as WordLevel, category, exampleTr, exampleUz, position });
  });

  // Bir xil tarjimali turli so'zlar o'yinda chalkashlik tug'diradi (juftlik o'yini ularni birga ko'rsatmaydi)
  for (const [uz, trs] of byUz) if (trs.size > 1) report.warnings.push({ line: 0, message: `Bir xil tarjima "${uz}": ${[...trs].join(', ')}` });
  return report;
}
