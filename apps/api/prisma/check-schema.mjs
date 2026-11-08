// schema.prisma va HAQIQIY bazani ustun-ustun solishtiradi.
//
// Nima uchun kerak: migratsiya fayllari bu loyihada qo'lda yoziladi (ishlab
// chiqish muhitida Prisma dvigatelini yuklab bo'lmaydi, shuning uchun
// `prisma migrate dev` ishlamaydi). Prisma Client esa schema.prisma dan
// yaratiladi va aynan undagi ustun nomlari bilan SQL yozadi. Agar migratsiya
// sxemadan bir harf bilan ham farq qilsa, ilova ishga tushadi, lekin
// so'rov paytida "column does not exist" bilan yiqiladi — ya'ni xato
// foydalanuvchida chiqadi.
//
// Bu skript shuni oldini oladi: har model, har maydon, har enum, har
// tashqi kalit va har indeks tekshiriladi.
//
// Ishlatish:
//   DATABASE_URL=postgresql://... node prisma/check-schema.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaText = readFileSync(path.join(here, 'schema.prisma'), 'utf8');

// ───────────────────────── schema.prisma ni o'qish ─────────────────────────

/** Izohlarni olib tashlaydi, lekin satr ichidagi "//" ni ham hisobga oladi. */
function stripComment(line) {
  let inString = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') inString = !inString;
    if (!inString && line[i] === '/' && line[i + 1] === '/') return line.slice(0, i);
  }
  return line;
}

function parseSchema(text) {
  const models = new Map(); // nom -> { fields: [], blockAttrs: [] }
  const enums = new Map(); // nom -> [qiymatlar]
  let current = null;
  let kind = null;

  for (const raw of text.split('\n')) {
    const line = stripComment(raw).trim();
    if (!line) continue;

    const open = line.match(/^(model|enum)\s+(\w+)\s*\{$/);
    if (open) {
      kind = open[1];
      current = open[2];
      if (kind === 'model') models.set(current, { fields: [], blockAttrs: [] });
      else enums.set(current, []);
      continue;
    }
    if (line === '}') {
      current = null;
      kind = null;
      continue;
    }
    if (!current) continue;

    if (kind === 'enum') {
      const v = line.match(/^(\w+)/);
      if (v) enums.get(current).push(v[1]);
      continue;
    }

    // model ichi
    if (line.startsWith('@@')) {
      models.get(current).blockAttrs.push(line);
      continue;
    }
    const f = line.match(/^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$/);
    if (!f) continue;
    models.get(current).fields.push({
      name: f[1],
      type: f[2],
      isList: Boolean(f[3]),
      isOptional: Boolean(f[4]),
      attrs: f[5] ?? '',
    });
  }
  return { models, enums };
}

const { models, enums } = parseSchema(schemaText);

// ───────────────────────── Prisma turi -> PostgreSQL turi ─────────────────────────

const SCALARS = {
  String: { data_type: 'text' },
  Int: { data_type: 'integer' },
  BigInt: { data_type: 'bigint' },
  Float: { data_type: 'double precision' },
  Boolean: { data_type: 'boolean' },
  DateTime: { data_type: 'timestamp without time zone' },
  Json: { data_type: 'jsonb' },
  Decimal: { data_type: 'numeric' },
  Bytes: { data_type: 'bytea' },
};

/** Maydon bazada ustun bo'lib chiqadimi? Model turiga ishora qilsa — yo'q (bu aloqa). */
function isColumn(field) {
  if (models.has(field.type)) return false; // aloqa maydoni
  if (field.isList && !SCALARS[field.type] && !enums.has(field.type)) return false;
  return Boolean(SCALARS[field.type]) || enums.has(field.type);
}

function expectedType(field) {
  if (field.isList) return { data_type: 'ARRAY' };
  if (enums.has(field.type)) return { data_type: 'USER-DEFINED', udt_name: field.type };
  const s = SCALARS[field.type];
  if (field.type === 'DateTime' && /@db\.Date/.test(field.attrs)) return { data_type: 'date' };
  return s;
}

/** Prisma indeks/unique nomlarini qanday yasaydi: Jadval_ustun1_ustun2_idx */
function attrColumns(attr) {
  const m = attr.match(/\[([^\]]*)\]/);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((c) => c.trim().replace(/\(.*\)/, ''))
    .filter(Boolean);
}

// ───────────────────────── Bazani o'qish ─────────────────────────

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL kerak');
  process.exit(2);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const q = (sql, params) => client.query(sql, params).then((r) => r.rows);

const dbColumns = await q(`
  SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
`);
const dbTables = new Set(dbColumns.map((c) => c.table_name));

const dbEnums = await q(`
  SELECT t.typname AS name, e.enumlabel AS label, e.enumsortorder AS ord
  FROM pg_type t
  JOIN pg_enum e ON e.enumtypid = t.oid
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
  ORDER BY t.typname, e.enumsortorder
`);

const dbIndexes = await q(`
  SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public'
`);
const indexNames = new Set(dbIndexes.map((r) => r.indexname));

const dbFks = await q(`
  SELECT con.conname AS name,
         rel.relname AS table_name,
         con.confdeltype AS on_delete
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = rel.relnamespace
  WHERE con.contype = 'f' AND n.nspname = 'public'
`);
const fkByName = new Map(dbFks.map((r) => [r.name, r]));

// ───────────────────────── Solishtirish ─────────────────────────

const problems = [];
const note = (m) => problems.push(m);

// 1) Enumlar: nomi, qiymatlari va TARTIBI bir xil bo'lsin.
for (const [name, values] of enums) {
  const rows = dbEnums.filter((r) => r.name === name);
  if (!rows.length) {
    note(`enum "${name}" bazada yo'q`);
    continue;
  }
  const dbValues = rows.map((r) => r.label);
  if (dbValues.join(',') !== values.join(',')) {
    note(`enum "${name}" qiymatlari farq qiladi:\n    sxema: ${values.join(', ')}\n    baza:  ${dbValues.join(', ')}`);
  }
}

// 2) Modellar, maydonlar, turlar, nullability
let checkedColumns = 0;
for (const [modelName, model] of models) {
  if (!dbTables.has(modelName)) {
    note(`jadval "${modelName}" bazada yo'q`);
    continue;
  }
  const cols = new Map(dbColumns.filter((c) => c.table_name === modelName).map((c) => [c.column_name, c]));

  const schemaColumnNames = new Set();
  for (const field of model.fields) {
    if (!isColumn(field)) continue;
    schemaColumnNames.add(field.name);
    checkedColumns++;

    const col = cols.get(field.name);
    if (!col) {
      note(`"${modelName}"."${field.name}" ustuni bazada yo'q`);
      continue;
    }

    const exp = expectedType(field);
    if (exp && col.data_type !== exp.data_type) {
      note(`"${modelName}"."${field.name}" turi: sxema ${field.type}${field.isList ? '[]' : ''} (${exp.data_type}), baza ${col.data_type}`);
    }
    if (exp?.udt_name && col.udt_name !== exp.udt_name) {
      note(`"${modelName}"."${field.name}" enum turi: sxema ${exp.udt_name}, baza ${col.udt_name}`);
    }
    if (field.isList && col.udt_name !== `_${SCALARS[field.type] ? field.type.toLowerCase().replace('string', 'text').replace('int', 'int4') : field.type}`) {
      // massiv elementi turini qat'iy tekshirmaymiz: ARRAY ekani yetarli
    }

    // Nullability. Prisma: "?" = NULL bo'lishi mumkin, aks holda NOT NULL.
    // Massivlar Prisma'da hech qachon optional bo'lmaydi.
    const shouldBeNullable = field.isOptional;
    const isNullable = col.is_nullable === 'YES';
    if (!field.isList && shouldBeNullable !== isNullable) {
      note(
        `"${modelName}"."${field.name}" nullability: sxema ${shouldBeNullable ? 'optional (?)' : 'majburiy'}, baza ${isNullable ? 'NULL mumkin' : 'NOT NULL'}`,
      );
    }
  }

  // 3) Bazada ortiqcha ustun bormi (teskari drift)
  for (const colName of cols.keys()) {
    if (!schemaColumnNames.has(colName)) {
      note(`"${modelName}"."${colName}" ustuni bazada bor, lekin sxemada yo'q`);
    }
  }

  // 4) Indekslar va unique'lar
  for (const attr of model.blockAttrs) {
    const cols2 = attrColumns(attr);
    if (!cols2.length) continue;
    if (attr.startsWith('@@index')) {
      const expected = `${modelName}_${cols2.join('_')}_idx`;
      if (!indexNames.has(expected)) note(`indeks "${expected}" bazada yo'q`);
    } else if (attr.startsWith('@@unique')) {
      const expected = `${modelName}_${cols2.join('_')}_key`;
      if (!indexNames.has(expected)) note(`unique "${expected}" bazada yo'q`);
    }
  }
  // Maydon ustidagi @unique
  for (const field of model.fields) {
    if (!isColumn(field)) continue;
    if (/@unique/.test(field.attrs)) {
      const expected = `${modelName}_${field.name}_key`;
      if (!indexNames.has(expected)) note(`unique "${expected}" bazada yo'q`);
    }
  }
}

// 5) Tashqi kalitlar: nomi va o'chirish qoidasi
//    confdeltype: a=NO ACTION, r=RESTRICT, c=CASCADE, n=SET NULL, d=SET DEFAULT
const DELETE_RULE = { Cascade: 'c', Restrict: 'r', SetNull: 'n', SetDefault: 'd', NoAction: 'a' };
let checkedFks = 0;
for (const [modelName, model] of models) {
  for (const field of model.fields) {
    const rel = field.attrs.match(/@relation\(([^)]*)\)/);
    if (!rel || !/fields:\s*\[/.test(rel[1])) continue;
    const fkCols = (rel[1].match(/fields:\s*\[([^\]]*)\]/) ?? [])[1];
    if (!fkCols) continue;
    const names = fkCols.split(',').map((c) => c.trim());
    const expected = `${modelName}_${names.join('_')}_fkey`;
    checkedFks++;
    const got = fkByName.get(expected);
    if (!got) {
      note(`tashqi kalit "${expected}" bazada yo'q`);
      continue;
    }
    const onDelete = (rel[1].match(/onDelete:\s*(\w+)/) ?? [])[1];
    // Prisma sukut bo'yicha: majburiy maydon -> Restrict, optional -> SetNull
    const wanted = onDelete ?? (field.isOptional ? 'SetNull' : 'Restrict');
    const wantedCode = DELETE_RULE[wanted];
    if (wantedCode && got.on_delete !== wantedCode) {
      const found = Object.entries(DELETE_RULE).find(([, v]) => v === got.on_delete);
      note(`"${expected}" onDelete: sxema ${wanted}, baza ${found ? found[0] : got.on_delete}`);
    }
  }
}

await client.end();

// ───────────────────────── Natija ─────────────────────────

console.log(
  `Tekshirildi: ${models.size} model, ${checkedColumns} ustun, ${enums.size} enum, ${checkedFks} tashqi kalit, ${indexNames.size} indeks`,
);
if (problems.length) {
  console.error(`\n✗ ${problems.length} ta muammo:\n`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('✓ schema.prisma va baza bir xil');
