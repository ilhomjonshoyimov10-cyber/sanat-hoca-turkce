// Jonli o'yinlarda topilgan "javobni oshkor qilish" xatolari uchun testlar.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isVerb, nearlySameAsTranslation, pickDistractors, sameAsTranslation, soften } from '../dist/games/distractors.js';

const w = (id, turkish, uzbek, level = 'A1', extra = {}) => ({ id, turkish, uzbek, level, category: null, tags: [], ...extra });

describe('soften — harf o‘lchami javobni oshkor qilmasin', () => {
  it('bosh harfni kichik qiladi', () => {
    assert.equal(soften('Satranç'), 'satranç');
    assert.equal(soften('Tanishtiray', 'uz'), 'tanishtiray');
  });
  it('turkcha İ/I qoidasi bilan', () => {
    assert.equal(soften('İstanbul'), 'istanbul');
    assert.equal(soften('Irmak'), 'ırmak');
  });
  it('qisqartmalarga tegmaydi', () => {
    assert.equal(soften('TV'), 'TV');
    assert.equal(soften('ABD'), 'ABD');
  });
  it('kichik harfli so‘zga tegmaydi', () => {
    assert.equal(soften('uzum', 'uz'), 'uzum');
  });
});

describe('sameAsTranslation — tarjimasi o‘zi bilan bir xil so‘zlar', () => {
  it('aynan bir xil: tuz/tuz, taksi/Taksi, üzüm/uzum', () => {
    assert.equal(sameAsTranslation({ turkish: 'tuz', uzbek: 'tuz' }), true);
    assert.equal(sameAsTranslation({ turkish: 'taksi', uzbek: 'Taksi' }), true);
    assert.equal(sameAsTranslation({ turkish: 'üzüm', uzbek: 'uzum' }), true);
  });
  it('O‘XSHASH so‘zlar (elma/olma) chiqarib tashlanmaydi — bu o‘rganishning tabiiy qismi', () => {
    assert.equal(sameAsTranslation({ turkish: 'elma', uzbek: 'olma' }), false);
    assert.equal(sameAsTranslation({ turkish: 'kitap', uzbek: 'kitob' }), false);
    assert.equal(sameAsTranslation({ turkish: 'kedi', uzbek: 'mushuk' }), false);
  });
  it('yozdiradigan o‘yinlar uchun qattiqroq: tenis/tennis ham chiqadi', () => {
    assert.equal(nearlySameAsTranslation({ turkish: 'tenis', uzbek: 'tennis' }), true);
    assert.equal(nearlySameAsTranslation({ turkish: 'kedi', uzbek: 'mushuk' }), false);
  });
});

describe('pickDistractors — chalg‘ituvchilar mazmunli bo‘lsin', () => {
  const fruit = (id, tr, uz) => w(id, tr, uz, 'A1', { tags: ['mavzu:meva'] });
  const pool = [
    fruit('f1', 'elma', 'olma'), fruit('f2', 'armut', 'nok'), fruit('f3', 'kiraz', 'gilos'),
    fruit('f4', 'çilek', 'qulupnay'), fruit('f5', 'karpuz', 'tarvuz'),
    w('x1', 'spiker', "teledasturni e'lon qiluvchi"), w('x2', 'tanıştırayım', 'tanishtiray'),
    w('x3', 'gitmek', 'ketmoq'), w('x4', 'gelmek', 'kelmoq'),
  ];

  it('avval bir mavzudan oladi (meva savoliga meva)', () => {
    for (let k = 0; k < 20; k++) {
      const d = pickDistractors(pool[0], pool, 3);
      assert.equal(d.length, 3);
      assert.ok(d.every((x) => x.tags.includes('mavzu:meva')), `meva emas: ${d.map((x) => x.turkish)}`);
    }
  });

  it('fe‘lga fe‘l chalg‘ituvchi beradi', () => {
    const verbs = [w('v1', 'yazmak', 'yozmoq'), w('v2', 'okumak', 'o‘qimoq'), w('v3', 'gitmek', 'ketmoq'), w('v4', 'gelmek', 'kelmoq')];
    const nouns = [w('n1', 'masa', 'stol'), w('n2', 'kapı', 'eshik'), w('n3', 'kalem', 'qalam')];
    const all = [...verbs, ...nouns];
    for (let k = 0; k < 20; k++) {
      const d = pickDistractors(verbs[0], all, 3);
      assert.ok(d.every((x) => isVerb(x.turkish)), `fe‘l emas: ${d.map((x) => x.turkish)}`);
    }
  });

  it('bir xil tarjimali ikkita variant bermaydi (ikkita to‘g‘ri javob bo‘lmasin)', () => {
    const dup = [w('a', 'anne', 'ona'), w('b', 'ana', 'ona'), w('c', 'baba', 'ota'), w('d', 'abla', 'opa'), w('e', 'dede', 'bobo')];
    for (let k = 0; k < 20; k++) {
      const d = pickDistractors(dup[0], dup, 3);
      assert.ok(!d.some((x) => x.uzbek === 'ona'), 'to‘g‘ri javob tarjimasi chalg‘ituvchida takrorlandi');
    }
  });
});
