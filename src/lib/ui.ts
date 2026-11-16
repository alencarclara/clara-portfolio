import { getPublished } from "./published";

// Textos de interface (coleção `ui`); nenhum componente guarda texto próprio.
export async function getUi() {
  const entries = await getPublished("ui");
  const pt = entries.find((e) => e.id === "pt");
  if (!pt) throw new Error("src/content/ui/pt.json não encontrado");
  return pt.data;
}
