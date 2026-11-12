// Profil rasmi uchun yuklash tokeni.
//
// Kitoblardan farqi — bu yerda HAR BIR foydalanuvchi yuklaydi, shuning
// uchun chegaralar ancha qattiq:
//   • faqat rasm turlari (PDF yoki audio emas)
//   • 3 MB (profil rasmi uchun yetarlidan ko'p)
//   • yo'l `avatar/<foydalanuvchi id>/...` — birovning papkasiga
//     yozib bo'lmaydi, chunki yo'lni server belgilaydi, brauzer emas.

export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** 3 MB. Telefonda olingan surat odatda 1–3 MB bo'ladi. */
export const AVATAR_MAX_BYTES = 3 * 1024 * 1024;

/** Fayl nomidagi yo'l belgilari va bo'shliqlarni tozalaydi. */
export function safeFileName(name: string): string {
  const cleaned = name
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.\-]+/, '')
    .slice(-60);
  return cleaned || 'rasm';
}

/**
 * Saqlangan rasm manzili haqiqatan bizning omborimizdanmi.
 *
 * Nega kerak: brauzer yuklashni tugatgach bizga URL yuboradi. Agar uni
 * tekshirmasak, foydalanuvchi istalgan manzilni yuborib, profil rasmi
 * o'rniga begona saytga havola qo'yishi mumkin edi — u sayt esa profilni
 * ochgan har bir odamning IP manzilini ko'radi.
 */
export const BLOB_URL =
  /^https:\/\/[A-Za-z0-9.-]+\.(?:public\.)?blob\.vercel-storage\.com\/[^\s]+$/;
