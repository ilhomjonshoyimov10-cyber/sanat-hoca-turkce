import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/instrument-sans";
import "../globals.css";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Aurora } from "@/components/fx/Aurora";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/header/Header";
import { AuthProvider } from "@/lib/auth";
import { site } from "@/lib/content";
import { getDictionary } from "@/lib/i18n";
import { isLocale, LOCALE_META, LOCALES } from "@/lib/i18n/config";
import { I18nProvider } from "@/lib/i18n/client";

// Har bir til uchun sahifalar oldindan tayyorlanadi (statik).
// proxy.ts foydalanuvchini cookie'dagi tilga ichkarida yo'naltiradi.
export async function generateStaticParams() {
  return LOCALES.map((l) => ({ lang: l }));
}

export async function generateMetadata(): Promise<Metadata> {
  const l = await lang();
  const t = getDictionary(isLocale(l) ? l : "uz");
  return {
    title: { default: `${site.name} | ${t.meta.title}`, template: `%s | ${site.name}` },
    description: t.meta.description,
  };
}

export const viewport: Viewport = { themeColor: "#070d1f", colorScheme: "dark" };

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const l = await lang();
  if (!isLocale(l)) notFound();
  const t = getDictionary(l);

  return (
    <html lang={LOCALE_META[l].html} className="h-full">
      <body className="flex min-h-full flex-col">
        {/* JavaScript o'chiq bo'lsa ham kontent ko'rinishi uchun */}
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <Aurora />
        <a href="#main" className="skip-link">{t.common.skip}</a>
        <I18nProvider locale={l} dict={t}>
          <AuthProvider>
            <Header />
            {/* Admin e'lonlari: har bir sahifada, kirgan foydalanuvchiga */}
            <AnnouncementBar />
            <main id="main" className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
