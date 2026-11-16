import { describe, it, expect } from "vitest";
import { tagSlug, monthGrid, groupByDay, monthsWithEntries, entriesByTheme, resolveForLang } from "../src/lib/journal";

type E = { id: string; data: { date: string; lang: "pt" | "en"; title: string; tags: string[] } };
const e = (id: string, date: string, lang: "pt" | "en", tags: string[] = ["astro"]): E => ({
  id,
  data: { date, lang, title: id, tags },
});

describe("journal > tagSlug", () => {
  it.each([
    ["Machine Learning", "machine-learning"],
    ["Educação", "educacao"],
    ["  Astro  ", "astro"],
    ["i18n / rotas", "i18n-rotas"],
    ["node.js", "node-js"],
    ["a--b", "a-b"],
    ["ÇÃO", "cao"],
    ["C++", "c"],
    ["já-é-kebab", "ja-e-kebab"],
  ])("%j vira %j", (tag, slug) => {
    expect(tagSlug(tag)).toBe(slug);
  });

  it("o resultado sempre casa com o slug kebab-case dos temas", () => {
    for (const t of ["Machine Learning", "Educação", "node.js", "A B  C", "x_y"]) {
      expect(tagSlug(t)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("maiúsculas e acentos não criam temas diferentes", () => {
    expect(tagSlug("Educação")).toBe(tagSlug("educacao"));
    expect(tagSlug("ASTRO")).toBe(tagSlug("astro"));
  });
});

describe("journal > monthGrid (semana começa no domingo)", () => {
  const flat = (g: (number | null)[][]) => g.flat();

  it("toda semana tem 7 células", () => {
    for (const [y, m] of [[2026, 11], [2026, 8], [2028, 2], [2026, 2]]) {
      for (const week of monthGrid(y, m)) expect(week).toHaveLength(7);
    }
  });

  it("nov/2026 começa no domingo: 1 na primeira célula, 5 semanas, 30 dias", () => {
    const g = monthGrid(2026, 11);
    expect(g).toHaveLength(5);
    expect(g[0]).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(g[4]).toEqual([29, 30, null, null, null, null, null]);
  });

  it("ago/2026 começa no sábado: seis nulos antes do dia 1 e 6 semanas", () => {
    const g = monthGrid(2026, 8);
    expect(g[0]).toEqual([null, null, null, null, null, null, 1]);
    expect(g).toHaveLength(6);
    expect(g[5]).toEqual([30, 31, null, null, null, null, null]);
  });

  it("fev/2028 (bissexto) tem 29 dias; começa na terça", () => {
    const g = monthGrid(2028, 2);
    expect(g[0]).toEqual([null, null, 1, 2, 3, 4, 5]);
    expect(flat(g).filter((d) => d !== null)).toHaveLength(29);
  });

  it("fev/2026 (não bissexto, começa no domingo) tem 28 dias e exatamente 4 semanas", () => {
    const g = monthGrid(2026, 2);
    expect(g).toHaveLength(4);
    expect(flat(g).filter((d) => d !== null)).toHaveLength(28);
  });

  it("os dias vêm em ordem crescente, de 1 até o último, sem repetir", () => {
    const days = flat(monthGrid(2026, 11)).filter((d): d is number => d !== null);
    expect(days).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });
});

describe("journal > groupByDay, monthsWithEntries, entriesByTheme", () => {
  const entries = [
    e("pt/2026-11-15-b", "2026-11-15", "pt", ["Astro", "Testes"]),
    e("pt/2026-10-02-a", "2026-10-02", "pt", ["astro"]),
    e("pt/2026-11-15-a", "2026-11-15", "pt", ["testes"]),
    e("pt/2026-11-20-c", "2026-11-20", "pt", ["Machine Learning"]),
  ];

  it("groupByDay: chaves em ordem crescente; várias entradas no mesmo dia, ordenadas por id", () => {
    const g = groupByDay(entries);
    expect([...g.keys()]).toEqual(["2026-10-02", "2026-11-15", "2026-11-20"]);
    expect(g.get("2026-11-15")!.map((x) => x.id)).toEqual(["pt/2026-11-15-a", "pt/2026-11-15-b"]);
  });

  it("groupByDay aceita lista vazia e não muta a entrada", () => {
    expect(groupByDay([]).size).toBe(0);
    const copy = [...entries];
    groupByDay(entries);
    expect(entries).toEqual(copy);
  });

  it("monthsWithEntries: meses únicos, em ordem crescente", () => {
    expect(monthsWithEntries(entries)).toEqual(["2026-10", "2026-11"]);
    expect(monthsWithEntries([])).toEqual([]);
  });

  it("entriesByTheme: um tema por slug, ordenado por slug; entrada entra em cada um dos seus temas", () => {
    const t = entriesByTheme(entries);
    expect(t.map((x) => x.slug)).toEqual(["astro", "machine-learning", "testes"]);
    expect(t.find((x) => x.slug === "astro")!.entries).toHaveLength(2);
    expect(t.find((x) => x.slug === "testes")!.entries).toHaveLength(2);
  });

  it("entriesByTheme: 'Astro' e 'astro' caem no mesmo tema; entradas da mais nova para a mais antiga", () => {
    const astro = entriesByTheme(entries).find((x) => x.slug === "astro")!;
    expect(astro.entries.map((x) => x.id)).toEqual(["pt/2026-11-15-b", "pt/2026-10-02-a"]);
  });

  it("entriesByTheme: lista vazia dá lista vazia", () => {
    expect(entriesByTheme([])).toEqual([]);
  });
});

describe("journal > resolveForLang", () => {
  const all = [
    e("pt/2026-11-15-spec", "2026-11-15", "pt"),
    e("en/2026-11-15-spec", "2026-11-15", "en"),
    e("pt/2026-11-16-so-pt", "2026-11-16", "pt"),
    e("en/2026-11-17-so-en", "2026-11-17", "en"),
  ];

  it("usa a versão do idioma pedido quando existe, sem marcar como não traduzida", () => {
    const r = resolveForLang(all, "en").find((x) => x.id === "en/2026-11-15-spec")!;
    expect(r.untranslated).toBe(false);
    expect(resolveForLang(all, "pt").find((x) => x.id === "pt/2026-11-15-spec")!.untranslated).toBe(false);
  });

  it("sem a versão do idioma, devolve a original com untranslated: true", () => {
    const en = resolveForLang(all, "en");
    const onlyPt = en.find((x) => x.id === "pt/2026-11-16-so-pt")!;
    expect(onlyPt.untranslated).toBe(true);
    expect(onlyPt.data.lang).toBe("pt");
    const pt = resolveForLang(all, "pt");
    expect(pt.find((x) => x.id === "en/2026-11-17-so-en")!.untranslated).toBe(true);
  });

  it("nunca duplica: um resultado por par, mesmo com os dois idiomas", () => {
    for (const lang of ["pt", "en"] as const) {
      const r = resolveForLang(all, lang);
      expect(r).toHaveLength(3);
      expect(r.filter((x) => x.id.endsWith("-spec"))).toHaveLength(1);
    }
  });

  it("resultado ordenado por data e id, sem mutar a entrada", () => {
    const copy = [...all];
    const r = resolveForLang([...all].reverse(), "pt");
    expect(r.map((x) => x.data.date)).toEqual(["2026-11-15", "2026-11-16", "2026-11-17"]);
    resolveForLang(all, "pt");
    expect(all).toEqual(copy);
  });

  it("lista vazia dá lista vazia", () => {
    expect(resolveForLang([], "pt")).toEqual([]);
  });
});
