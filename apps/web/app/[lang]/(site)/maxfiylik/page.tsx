import type { Metadata } from "next";

export const metadata: Metadata = { title: "Maxfiylik siyosati" };

// TODO(E'LON QILISHDAN OLDIN): yurist matnni ko'rib chiqsin, operator nomi va aloqa
// ma'lumotlarini to'ldiring, so'ng yuqoridagi "loyiha" bannerini olib tashlang.
export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <p className="alert-error mb-6">Bu hujjat loyiha holatida va yuridik ko&apos;rikdan o&apos;tmagan.</p>
      <h1 className="font-display text-4xl font-bold">Maxfiylik siyosati</h1>

      <div className="mt-6 space-y-6 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold">Qanday ma&apos;lumotlarni yig&apos;amiz</h2>
          <p className="mt-2 text-muted">
            Ism, familiya, telefon raqam, email, tug&apos;ilgan sana, o&apos;qish natijalari (o&apos;yinlar, vazifalar, davomat), guruh chatidagi xabarlar, murojaatlar va AI yordamchi bilan suhbatlar.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Nima uchun</h2>
          <p className="mt-2 text-muted">
            Siz bilan bog&apos;lanish, darslarni tashkil qilish, o&apos;qish jarayonini kuzatish va hisobingizni himoya qilish uchun.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">AI yordamchi</h2>
          <p className="mt-2 text-muted">
            AI yordamchiga yozgan savollaringiz va javoblar o&apos;quv markazida saqlanadi va administrator ko&apos;rishi
            mumkin — qiyin mavzularni aniqlash va darsni moslash uchun. Ism, telefon va email AI xizmatiga yuborilmaydi
            (matndan olib tashlanadi). Suhbatni o&apos;zingiz istalgan vaqtda o&apos;chirishingiz mumkin.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">18 yoshgacha bo&apos;lganlar</h2>
          <p className="mt-2 text-muted">
            18 yoshga to&apos;lmagan o&apos;quvchilar uchun ota-ona yoki qonuniy vakil roziligi talab qilinadi.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Saqlash va himoya</h2>
          <p className="mt-2 text-muted">
            Parollar o&apos;qib bo&apos;lmaydigan (xeshlangan) ko&apos;rinishda saqlanadi. Ma&apos;lumotlaringiz uchinchi shaxslarga sotilmaydi.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Sizning huquqlaringiz</h2>
          <p className="mt-2 text-muted">
            Ma&apos;lumotlaringizni ko&apos;rish, tuzatish yoki o&apos;chirishni so&apos;rashingiz mumkin. Aloqa: [TODO: email yoki telefon].
          </p>
        </section>
      </div>
    </div>
  );
}
