import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <section className="container-page grid min-h-[50vh] place-content-center py-24 text-center">
      <p className="t-num text-[5rem] leading-none text-brass">404</p>
      <h1 className="mt-4 text-[clamp(1.8rem,4vw,2.6rem)]">{t.notFound.title}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">{t.notFound.text}</p>
      <Link href="/" className="btn btn-primary mx-auto mt-8">{t.notFound.home}</Link>
    </section>
  );
}
