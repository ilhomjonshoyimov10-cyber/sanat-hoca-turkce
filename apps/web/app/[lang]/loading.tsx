import { PageLoader } from "@/components/Loader";

/** Sahifalar orasida o'tishda (server javobi kutilayotganda) ko'rinadi. */
export default function Loading() {
  return (
    <div className="container-page">
      <PageLoader />
    </div>
  );
}
