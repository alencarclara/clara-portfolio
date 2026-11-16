// Idiomas e rotas. Puro (sem imports do Astro) para o vitest carregar este arquivo.
export const LANGS = ["pt", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const htmlLang: Record<Lang, string> = { pt: "pt-BR", en: "en" };

export const otherLang = (lang: Lang): Lang => (lang === "pt" ? "en" : "pt");

export const isLang = (v: unknown): v is Lang => (LANGS as readonly unknown[]).includes(v);

export type Page = "activities" | "experience" | "courses" | "projects" | "journal";

// Home com barra final ("/pt/"), páginas sem ("/pt/courses"). O base vem de import.meta.env.BASE_URL.
export function localePath(lang: Lang, page?: Page, base = "/"): string {
  const b = base.endsWith("/") ? base : `${base}/`;
  return page ? `${b}${lang}/${page}` : `${b}${lang}/`;
}
