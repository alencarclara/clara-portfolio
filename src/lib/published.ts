// Ponto único de leitura de conteúdo publicado. Páginas, calendário e RSS devem usar
// getPublished; nenhum outro arquivo chama getCollection (testado).
// `astro:content` só é importado dentro da função, para o vitest carregar este arquivo.
type Entry = { id: string; data: { draft?: boolean } };

export const isPublished = (entry: Entry): boolean => entry.data.draft !== true;

export const filterPublished = <T extends Entry>(entries: T[]): T[] => entries.filter(isPublished);

export async function getPublished(collection: Parameters<typeof import("astro:content").getCollection>[0]) {
  const { getCollection } = await import("astro:content");
  return filterPublished(await getCollection(collection));
}
