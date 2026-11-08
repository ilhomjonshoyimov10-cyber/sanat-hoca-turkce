import { describe, expect, it } from 'vitest';
import { loadWordFiles } from './word-data.js';

// Ustoz bergan haqiqiy lug'at fayllari (prisma/data/*.csv) buzilmaganini tekshiradi
describe("lug'at fayllari (prisma/data)", () => {
  const r = loadWordFiles();
  const count = (lvl: string) => r.words.filter((w) => w.level === lvl).length;

  it("xatosiz o'qiladi va 4 ta darajani ham o'z ichiga oladi", () => {
    expect(r.errors).toEqual([]);
    for (const [lvl, min] of [['A1', 800], ['A2', 900], ['B1', 600], ['B2', 300]] as const) expect(count(lvl)).toBeGreaterThanOrEqual(min);
  });
  it("jami 2500 dan ortiq so'z; darajalar tartibi saqlangan (A1 birinchi)", () => {
    expect(r.words.length).toBeGreaterThan(2500);
    expect(r.words[0].level).toBe('A1');
  });
  it("o'zbekcha tomonda turkcha klaviatura harflari (ö, ğ, ı, ş, ç) qolmagan (qavs ichidagilardan tashqari)", () => {
    const bad = r.words.filter((w) => /[öğışçÖĞŞÇ]/.test(w.uzbek.replace(/\([^)]*\)/g, '')));
    expect(bad.map((w) => w.uzbek)).toEqual([]);
  });
  it("har bir so'zda 'Ünite' bo'limi ko'rsatilgan (o'quv dasturi tartibi uchun)", () => {
    expect(r.words.filter((w) => !w.category).length).toBe(0);
  });
});
