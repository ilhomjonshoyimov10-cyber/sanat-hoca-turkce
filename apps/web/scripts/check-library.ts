// Kutubxona kontentini tekshiradi: npx tsx scripts/check-library.ts
//   • har bir [[...]] belgisining kaliti lug'atda bormi
//   • lug'atdagi har bir so'z matnda ishlatilganmi (keraksiz yozuv yo'q)
//   • slug takrorlanmaganmi, savol-javob bo'sh emasmi
import { BOOKS, plain, segments } from "../lib/library";

const problems: string[] = [];
const slugs = new Set<string>();
for (const b of BOOKS) {
  if (slugs.has(b.slug)) problems.push(`slug takrorlangan: ${b.slug}`);
  slugs.add(b.slug);
  b.chapters.forEach((c, ci) => {
    const where = `${b.slug} / ${ci + 1}-bob`;
    const keys = new Set(c.glossary.map((x) => x.key));
    if (keys.size !== c.glossary.length) problems.push(`${where}: lug'atda kalit takrorlangan`);
    const used = new Set<string>();
    for (const p of c.paragraphs) {
      for (const s of segments(p)) {
        if ("key" in s) {
          used.add(s.key);
          if (!keys.has(s.key)) problems.push(`${where}: "${s.key}" lug'atda yo'q`);
        }
      }
      if (/\[\[|\]\]/.test(plain(p))) problems.push(`${where}: yopilmagan [[ belgisi`);
    }
    for (const k of keys) if (!used.has(k)) problems.push(`${where}: "${k}" lug'atda bor, matnda yo'q`);
    for (const x of c.glossary) if (!x.uz || !x.ru || !x.en) problems.push(`${where}: "${x.key}" tarjimasi to'liq emas`);
    if (c.questions.length === 0) problems.push(`${where}: savol yo'q`);
  });
}
console.log(`${BOOKS.length} kitob, ${BOOKS.reduce((n, b) => n + b.chapters.length, 0)} bob`);
if (problems.length) {
  console.log(problems.map((p) => "  • " + p).join("\n"));
  process.exit(1);
}
console.log("✓ muammo yo'q");
