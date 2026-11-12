import path from "node:path";
import type { NextConfig } from "next";

// Xavfsizlik sarlavhalari. To'liq (nonce bilan) CSP sahifalarni dinamik qilib qo'yadi
// va Google uchun statik sahifalarning afzalligini yo'qotadi, shuning uchun hozircha
// Next.js ning ichki skriptlariga tegmaydigan direktivalar qo'yilgan.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

// API qayerda turadi. Vercel'da bu ikkinchi loyihaning manzili, mahalliyda
// esa o'z kompyuteringizdagi NestJS.
//
// DIQQAT — nega proksi (rewrite) ishlatamiz, to'g'ridan-to'g'ri so'rov emas:
// brauzer faqat BIR domen bilan gaplashadi (o'z saytimiz), API esa server
// tomonidan chaqiriladi. Natijada (1) CORS butunlay kerak emas, (2) kirish
// cookie'si SameSite=Lax bo'lib qolaveradi — cross-site bo'lsa `None` ga
// tushirishga majbur bo'lardik, bu CSRF himoyasini bo'shashtiradi,
// (3) "localhost va 127.0.0.1 — boshqa domen" muammosi ham yo'qoladi.
const API_ORIGIN = process.env.API_ORIGIN ?? "http://127.0.0.1:4000";

const nextConfig: NextConfig = {
  // Docker uchun: faqat kerakli fayllardan iborat kichik yig'ma (.next/standalone).
  // Vercel o'z yig'uvchisini ishlatadi va standalone unga to'sqinlik qiladi.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  // Monorepo ildizi: standalone yig'masiga kerakli fayllar to'g'ri topilishi uchun
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  // Rasmlar FAQAT o'z fayl omborimizdan. Boshqa manzil qo'shilmaydi:
  // begona saytdagi rasm sahifani ochgan har bir odamning IP manzilini
  // o'sha saytga beradi, va server tomonida ham xuddi shu tekshiruv bor.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.blob.vercel-storage.com" }],
  },
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/:path*` }];
  },
};

export default nextConfig;
