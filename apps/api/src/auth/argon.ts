import * as argon2 from 'argon2';

// OWASP tavsiyasi: Argon2id, 19 MiB xotira, 2 iteratsiya, 1 parallel.
// Server kuchli bo'lsa memoryCost ni oshirish mumkin.
export const ARGON_OPTS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export const hashPassword = (password: string) => argon2.hash(password, ARGON_OPTS);
export const verifyPassword = (hash: string, password: string) =>
  argon2.verify(hash, password).catch(() => false);
export const needsRehash = (hash: string) => argon2.needsRehash(hash, ARGON_OPTS);
