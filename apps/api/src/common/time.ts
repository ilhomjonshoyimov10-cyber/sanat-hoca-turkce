/** "13-noyabr, 15:30" — bildirishnoma matni uchun, Toshkent vaqtida. */
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

export function tashkentTime(d: Date): string {
  // Toshkent: UTC+5, yozgi vaqt yo'q
  const t = new Date(d.getTime() + 5 * 60 * 60 * 1000);
  const hh = String(t.getUTCHours()).padStart(2, '0');
  const mm = String(t.getUTCMinutes()).padStart(2, '0');
  return `${t.getUTCDate()}-${MONTHS[t.getUTCMonth()]}, ${hh}:${mm}`;
}
