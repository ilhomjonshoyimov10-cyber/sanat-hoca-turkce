// Ilova ishga tushganda muhim sozlamalar yo'q bo'lsa, darhol to'xtaydi (fail fast).
export function validateEnv(config: Record<string, unknown>) {
  for (const key of ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'TOTP_ENCRYPTION_KEY', 'WEB_URL']) {
    if (!config[key]) throw new Error(`.env faylida ${key} yo'q`);
  }
  for (const key of ['JWT_ACCESS_SECRET', 'TOTP_ENCRYPTION_KEY']) {
    if (String(config[key]).length < 32) throw new Error(`${key} kamida 32 belgidan iborat bo'lsin`);
  }
  return config;
}
