// Serverless funksiya uchun yig'uvchi (bundler).
//
// Tashqarida qoldiriladigan paketlar:
//  - @prisma/client / .prisma/client: dvigatel faylini ish vaqtida diskdan
//    o'qiydi, yig'ilsa topa olmaydi
//  - argon2: nativ (.node) modul
//  - Nest'ning ixtiyoriy peer paketlari: mavjud bo'lmasa ham Nest ularni
//    "bor-yo'qligini" tekshiradi, yig'uvchi esa yo'qligidan xato beradi
import { build } from 'esbuild';

const EXTERNAL = [
  '@prisma/client',
  '.prisma/client',
  'argon2',
  // Nest ixtiyoriy modullarni dinamik yuklaydi
  '@nestjs/microservices',
  '@nestjs/microservices/*',
  '@nestjs/websockets',
  '@nestjs/websockets/*',
  '@nestjs/platform-socket.io',
  '@nestjs/platform-ws',
  '@nestjs/graphql',
  'cache-manager',
  'class-transformer/storage',
  '@fastify/*',
];

const result = await build({
  entryPoints: ['dist/vercel-app.js'],
  outfile: 'dist-bundle/app.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  // CommonJS paketlar ichidagi require/__dirname uchun shim
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __pathDirname } from 'node:path';",
      'const require = __createRequire(import.meta.url);',
      'const __filename = __fileURLToPath(import.meta.url);',
      'const __dirname = __pathDirname(__filename);',
    ].join('\n'),
  },
  external: EXTERNAL,
  // Dekorator metadata allaqachon tsc tomonidan chiqarilgan (dist/ da),
  // shuning uchun esbuild faqat yig'adi, qayta kompilyatsiya qilmaydi.
  keepNames: true,
  logLevel: 'info',
  metafile: true,
});

const bytes = Object.values(result.metafile.outputs)[0]?.bytes ?? 0;
console.log(`Yig'ildi: dist-bundle/app.js (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
