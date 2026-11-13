import type { Metadata } from "next";
import { MediaBrowser } from "@/components/media/MediaBrowser";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.media, description: t.meta.mediaDescription };
}

export default async function MediaPage() {
  const { t } = await getT();
  return (
    <div className="relative overflow-x-clip">
      <div className="cini-field absolute inset-x-0 top-0 -z-10 h-[26rem] opacity-70 [mask-image:linear-gradient(180deg,#000,transparent)]" aria-hidden="true" />
      <div className="container-page py-12 lg:py-16">
        <header className="mb-10 max-w-3xl">
          <p className="flex items-center gap-2.5 text-sm font-medium text-bole">
            <span className="size-1.5 rotate-45 bg-bole" />
            YouTube
          </p>
          <h1 className="mt-3 text-[clamp(2.3rem,5vw,3.6rem)]">{t.media.title}</h1>
          <p className="mt-4 text-lg text-muted">{t.media.lead}</p>
        </header>
        <MediaBrowser />
      </div>
    </div>
  );
}
