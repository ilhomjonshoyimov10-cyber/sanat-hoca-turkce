"use client";

import { useEffect, useState } from "react";

/**
 * Sahifa brauzerda "jonlangani"ni (hydration tugaganini) bildiradi.
 *
 * Nega kerak: React ulanib ulgurmasdan turib tugma bosilsa, brauzer formani
 * O'ZI yuboradi. `method` ko'rsatilmagani uchun bu GET bo'ladi va barcha
 * maydonlar — PAROL ham — manzil qatoriga tushadi. U yerdan brauzer tarixiga,
 * server loglariga va Referer sarlavhasiga o'tib ketadi.
 *
 * Shuning uchun maxfiy ma'lumot oladigan formalarda tugma shu qiymat `true`
 * bo'lgunicha o'chiq turadi. Qo'shimcha himoya sifatida formalarda
 * `method="post"` ham turadi: agar baribir yuborilsa, ma'lumot manzilga emas,
 * so'rov tanasiga ketadi.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
