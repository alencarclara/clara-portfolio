// Ponto único de leitura de conteúdo publicado. Páginas, calendário e RSS devem usar
// getPublished; nenhum outro arquivo chama getCollection (testado).
// `astro:content` só é importado dentro da função, para o vitest carregar este arquivo.
import type { CollectionEntry, CollectionKey } from "astro:content";

type Entry = { id: string; data: { draft?: boolean } };

export const isPublished = (entry: Entry): boolean => entry.data.draft !== true;

export const filterPublished = <T extends Entry>(entries: T[]): T[] => entries.filter(isPublished);

export async function getPublished<C extends CollectionKey>(collection: C) {
  const { getCollection } = await import("astro:content");
  const entries = (await getCollection(collection)) as CollectionEntry<C>[];
  return filterPublished(entries as (CollectionEntry<C> & Entry)[]);
}
