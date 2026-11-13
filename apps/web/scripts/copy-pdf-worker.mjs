// pdf.js "worker" faylini public/ ga ko'chiradi (yig'ishdan oldin).
// Nega: worker alohida faylda ishlaydi — uni bundlerga qo'shish o'rniga
// to'g'ridan-to'g'ri statik fayl sifatida beramiz. Versiya kutubxona
// bilan doim bir xil bo'ladi (har yig'ishda node_modules dan olinadi).
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const src = path.join(path.dirname(require.resolve("pdfjs-dist/package.json")), "build", "pdf.worker.min.mjs");
const dir = path.join(process.cwd(), "public", "pdfjs");
mkdirSync(dir, { recursive: true });
copyFileSync(src, path.join(dir, "pdf.worker.min.mjs"));
console.log("pdf.js worker -> public/pdfjs/pdf.worker.min.mjs");
