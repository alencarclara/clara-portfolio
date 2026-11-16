import { getPublished } from "./published";
import type { Lang } from "./i18n";

// Textos de interface (coleção `ui`); nenhum componente guarda texto próprio.
export async function getUi(lang: Lang) {
  const entries = await getPublished("ui");
  const found = entries.find((e) => e.id === lang);
  if (!found) throw new Error(`src/content/ui/${lang}.json não encontrado`);
  return found.data;
}
