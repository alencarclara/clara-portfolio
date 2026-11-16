import { getPublished } from "./published";
import { resolveForLang, tagSlug } from "./journal";
import type { Lang } from "./i18n";

// Entradas publicadas, uma por par, no idioma pedido (ou a original, com `untranslated`).
export async function getJournal(lang: Lang) {
  return resolveForLang(await getPublished("journal"), lang);
}

// Título e resumo de um tema: da coleção `themes` do idioma, senão o texto da primeira tag.
export async function getThemeInfo(lang: Lang, slug: string, spellings: string[]) {
  const theme = (await getPublished("themes")).find((t) => t.data.lang === lang && t.data.slug === slug);
  return { title: theme?.data.title ?? spellings[0] ?? slug, summary: theme?.data.summary };
}

export const spellingsOf = (entries: { data: { tags: string[] } }[], slug: string) => [
  ...new Set(entries.flatMap((e) => e.data.tags.filter((t) => tagSlug(t) === slug))),
];

export const countText = (ui: { journal: { entriesOne: string; entriesMany: string } }, n: number) =>
  (n === 1 ? ui.journal.entriesOne : ui.journal.entriesMany).replace("{n}", String(n));
