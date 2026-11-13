import { BOOKS_A } from "./books-a";
import { BOOKS_B } from "./books-b";
import type { LibraryBook } from "./types";

export * from "./types";

/** Daraja tartibida: avval oson. */
export const BOOKS: LibraryBook[] = [...BOOKS_A, ...BOOKS_B];

export const findBook = (slug: string) => BOOKS.find((b) => b.slug === slug);
