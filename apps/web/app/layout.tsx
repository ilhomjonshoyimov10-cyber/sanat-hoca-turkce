import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/instrument-sans";
import "./globals.css";
import { Aurora } from "@/components/fx/Aurora";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: { default: `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
  description:
    "Turk tilini ustoz bilan o'rganing: A1 dan C1 gacha darslar, takrorlash o'yinlari va guruhda birga o'qish. Bepul sinov darsi.",
};

export const viewport: Viewport = { themeColor: "#070d1f", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className="h-full">
      <body className="flex min-h-full flex-col">
        {/* JavaScript o'chiq bo'lsa ham kontent ko'rinishi uchun */}
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <Aurora />
        <a href="#main" className="skip-link">Asosiy qismga o&apos;tish</a>
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
