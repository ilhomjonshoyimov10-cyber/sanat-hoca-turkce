import { describe, expect, it } from 'vitest';
import { parseCsv, parseWords } from './word-import.js';

describe('CSV o\'qish', () => {
  it("vergul, nuqtali vergul va tab ajratuvchilarni o'zi aniqlaydi", () => {
    expect(parseCsv('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('a;b\n1;2')).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('a\tb\n1\t2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it("qo'shtirnoq ichidagi vergul, qo'shtirnoq va qator ko'chirishni to'g'ri o'qiydi; BOM va Windows qator oxirini ham", () => {
    const rows = parseCsv('\uFEFFturkish,uzbek\r\n"a, b","ikki ""so\'z""\r\nqator"\r\n');
    expect(rows).toEqual([['turkish', 'uzbek'], ['a, b', 'ikki "so\'z"\r\nqator']]);
    // qator ichidagi ko'chirish keyin bitta bo'shliqqa aylanadi
    expect(parseWords('turkish,uzbek\n"a","ikki\nqator"').words[0].uzbek).toBe('ikki qator');
  });
  it("bo'sh qatorlarni tashlab yuboradi", () => {
    expect(parseCsv('a,b\n\n1,2\n,\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe("lug'atni tekshirish", () => {
  const ok = 'turkish,uzbek,level,category,exampleTr\nmerhaba,salom,A1,salomlashish,"Merhaba, nasılsın?"\ngüzel,chiroyli,A2,,';

  it("to'g'ri faylni o'qiydi: darajalar, kategoriya, misol", () => {
    const r = parseWords(ok);
    expect(r.errors).toEqual([]);
    expect(r.words).toHaveLength(2);
    expect(r.words[0]).toMatchObject({ turkish: 'merhaba', uzbek: 'salom', level: 'A1', category: 'salomlashish', exampleTr: 'Merhaba, nasılsın?' });
    expect(r.words[1].level).toBe('A2');
  });
  it("sarlavha nomlarining turli yozilishini qabul qiladi (Turkcha, O'zbekcha, Daraja)", () => {
    const r = parseWords("Turkcha;O'zbekcha;Daraja\nkitap;kitob;b1");
    expect(r.errors).toEqual([]);
    expect(r.words[0]).toMatchObject({ turkish: 'kitap', uzbek: 'kitob', level: 'B1' });
  });
  it("daraja ko'rsatilmasa A1 bo'ladi", () => {
    expect(parseWords('turkish,uzbek\nsu,suv').words[0].level).toBe('A1');
  });
  it("xato qatorlar raqami bilan hisobot qilinadi va kiritilmaydi, to'g'rilari kiritiladi", () => {
    const r = parseWords('turkish,uzbek,level\nsu,suv,A1\n,bo\'sh,A1\nev,uy,Z9\nkedi,mushuk,A1');
    expect(r.words.map((w) => w.turkish)).toEqual(['su', 'kedi']);
    expect(r.errors.map((e) => e.line)).toEqual([3, 4]);
    expect(r.errors[1].message).toContain('Z9');
  });
  it("sarlavhada majburiy ustun bo'lmasa to'xtaydi", () => {
    const r = parseWords('so\'z,boshqa\na,b');
    expect(r.words).toEqual([]);
    expect(r.errors[0].line).toBe(1);
  });
  it("fayl ichidagi takroriy qatorlar (katta/kichik harf farqisiz) bir marta olinadi", () => {
    const r = parseWords('turkish,uzbek\nSU,suv\nsu,Suv\nsu,suv');
    expect(r.words).toHaveLength(1);
    expect(r.duplicates).toBe(2);
  });
  it("turkcha katta/kichik harf qoidasi: İ/ı to'g'ri hisoblanadi (İstanbul = istanbul)", () => {
    expect(parseWords('turkish,uzbek\nİstanbul,Istanbul\nistanbul,Istanbul').duplicates).toBe(1);
  });
  it("HTML belgilari va juda uzun matn rad etiladi (XSS himoyasi)", () => {
    const r = parseWords(`turkish,uzbek\n<script>,x\nsu,${'a'.repeat(201)}\nev,<b>uy</b>`);
    expect(r.words).toEqual([]);
    expect(r.errors).toHaveLength(3);
  });
  it("bir xil tarjimali turli so'zlar uchun ogohlantirish beradi (lekin kiritiladi)", () => {
    const r = parseWords('turkish,uzbek\nhoşça kal,xayr\ngüle güle,xayr');
    expect(r.words).toHaveLength(2);
    expect(r.warnings[0].message).toContain('xayr');
  });
  it("apostroflar bir xil ko'rinishga keladi; gap oxiridagi nuqta va ? ! turkcha tomondan olib tashlanadi", () => {
    const w = parseWords("turkish,uzbek\nElveda!,Xayr…\nNasılsın?,o’zbek ʻtil\nBen...,Men.").words;
    expect(w.map((x) => [x.turkish, x.uzbek])).toEqual([['Elveda', 'Xayr'], ['Nasılsın', "o'zbek 'til"], ['Ben', 'Men']]);
  });
  it("position butun son bo'lishi shart", () => {
    const r = parseWords('turkish,uzbek,position\na,b,5\nc,d,x');
    expect(r.words[0].position).toBe(5);
    expect(r.errors[0].line).toBe(3);
  });
  it("shablon fayl xatosiz o'qiladi", async () => {
    const { readFileSync } = await import('node:fs');
    const r = parseWords(readFileSync(new URL('../../prisma/words-template.csv', import.meta.url), 'utf8'));
    expect(r.errors).toEqual([]);
    expect(r.words).toHaveLength(3);
  });
});
