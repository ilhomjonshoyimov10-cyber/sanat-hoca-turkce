// "Biz haqimizda" sahifasining mazmuni.
//
// Bu yerdagi HAR BIR DA'VO ustoz tomonidan tasdiqlanishi kerak:
// tajriba yillari, natijalar soni va sertifikatlar — bular haqiqiy
// bo'lishi shart. Reklama uchun bo'rttirilgan raqam bir kun kelib
// ishonchni yo'qotadi, qonuniy muammo ham bo'lishi mumkin.
//
// O'zgartirish uchun shu faylni tahrirlang — kod tegmaydi.

export const contact = {
  /** Qo'ng'iroq va Telegram uchun bir xil raqam */
  phone: "+998 94 727 33 35",
  phoneHref: "tel:+998947273335",
  telegramChannel: "https://t.me/turkcem_tr",
  telegramChannelLabel: "@turkcem_tr",
  telegramPerson: "https://t.me/Sanat_hoca",
  telegramPersonLabel: "@Sanat_hoca",
  city: "Buxoro shahri",
  place: "Buxoro Savdo majmuasi",
  addressLine: "Buxoro shahri, Buxoro Savdo majmuasi",
};

/**
 * Xaritadagi joy.
 *
 * DIQQAT: bu yerda qidiruv so'rovi ishlatilgan, aniq koordinata emas.
 * Xarita joyni taxminan ko'rsatadi. Aniq nuqta kerak bo'lsa, Google
 * Maps'da o'quv markazni toping va havoladan koordinatani oling,
 * so'ng `mapQuery` ni "41.1234,64.5678" shaklida almashtiring.
 */
export const mapQuery = "Buxoro Savdo majmuasi, Buxoro, O'zbekiston";

export const teacher = {
  name: "Sanat hoca",
  role: "Turk tili o'qituvchisi",
  photo: "/ustoz/sanat-hoca.jpg",
  intro:
    "Turk tilini noldan C1 darajasigacha o'rgataman. Darslarda asosiy e'tibor " +
    "gapirishga qaratiladi: grammatika qoidasi yod olinmaydi, u jonli gapda " +
    "ishlatiladi. Har bir o'quvchining darajasi alohida aniqlanadi.",
};

/** Ustoz bergan ma'lumotlar. Tasdiqlanishi SHART. */
export const facts = [
  { value: "C1", label: "Turk tili darajasi" },
  { value: "3+", label: "Yillik o'qituvchilik tajribasi" },
  { value: "300+", label: "O'qigan o'quvchilar" },
];

/**
 * Sertifikatlar va rasmlar.
 *
 * Fayllarni `public/ustoz/` papkasiga qo'ying va shu ro'yxatga yozing.
 * Ro'yxat bo'sh bo'lsa, bo'lim butunlay ko'rinmaydi — bo'sh ramka
 * ko'rsatib, "tez orada" deb yozishdan ko'ra shu yaxshi.
 */
export const certificates: { src: string; alt: string }[] = [];
