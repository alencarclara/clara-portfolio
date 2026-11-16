import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { tagSlug, monthGrid } from "../src/lib/journal";
import {
  LANGS, otherLang, uiOf, dist, walk, routeFile, pageHtml, tags, textOf, norm, elementById, journalPublished, journalResolved,
  type Lang,
} from "./helpers";

const normHref = (h: string) => h.replace(/\/$/, "") || "/";
const count = (ui: any, n: number) => (n === 1 ? ui.journal.entriesOne : ui.journal.entriesMany).replace("{n}", String(n));
const dirNames = (lang: Lang, sub: string) => {
  const root = path.join(dist, lang, "journal", sub);
  return walk(root, /^index\.html$/).map((f) => path.basename(path.dirname(f))).sort();
};

describe("journal > há entradas reais para testar", () => {
  it("existe ao menos uma entrada publicada em cada idioma", () => {
    for (const lang of LANGS) {
      expect(journalPublished().filter((e) => e.data.lang === lang).length, `nenhuma entrada ${lang}`).toBeGreaterThan(0);
    }
  });

  it("há ao menos um dia em que uma entrada aparece sem tradução em algum idioma (para o aviso)", () => {
    expect(journalResolved("pt").some((r) => r.untranslated) || journalResolved("en").some((r) => r.untranslated)).toBe(true);
  });
});

describe.each(LANGS)("journal > páginas [%s]", (lang: Lang) => {
  const ui = uiOf(lang);
  const other = otherLang(lang);
  const resolved = journalResolved(lang);
  const days = [...new Set(resolved.map((r) => r.date))].sort();
  const months = [...new Set(days.map((d) => d.slice(0, 7)))].sort();
  const themes = new Map<string, string[]>();
  for (const r of resolved) for (const t of r.entry.data.tags as string[]) themes.set(tagSlug(t), [...(themes.get(tagSlug(t)) ?? []), t]);

  const J = `/${lang}/journal`;
  const dayRoute = (d: string) => `${J}/day/${d}`;
  const monthRoute = (m: string) => `${J}/month/${m}`;

  describe("rotas geradas: só o que tem entrada", () => {
    it("existem /journal, /journal/themes e uma página por mês, dia e tema com entrada", () => {
      for (const r of [J, `${J}/themes`, ...months.map(monthRoute), ...days.map(dayRoute), ...[...themes.keys()].map((s) => `${J}/themes/${s}`)]) {
        expect(routeFile(r), `sem página para ${r}`).not.toBeNull();
      }
    });

    it("não há páginas de mês, dia ou tema sem entrada", () => {
      expect(dirNames(lang, "month")).toEqual(months);
      expect(dirNames(lang, "day")).toEqual(days);
      expect(dirNames(lang, "themes").filter((n) => n !== "themes")).toEqual([...themes.keys()].sort());
    });
  });

  describe("abas Calendário e Temas", () => {
    it.each([[J, "calendar"], [monthRoute(months[months.length - 1]), "calendar"], [`${J}/themes`, "themes"]] as const)(
      "%s: nav com aria-label, dois links e aria-current na aba certa",
      (route, current) => {
        const html = pageHtml(route);
        const nav = tags(html, "nav").find((n) => n.attrs["aria-label"] === ui.journal.tabsLabel);
        expect(nav, `sem <nav aria-label="${ui.journal.tabsLabel}">`).toBeDefined();
        const navHtml = new RegExp(`${nav!.tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([\\s\\S]*?)</nav>`).exec(html)![1];
        const links = tags(navHtml, "a");
        expect(links.map((a) => normHref(a.attrs.href))).toEqual([J, `${J}/themes`]);
        expect(links.map((a) => a.attrs["aria-current"])).toEqual(current === "calendar" ? ["page", undefined] : [undefined, "page"]);
        expect(textOf(navHtml)).toContain(ui.journal.calendar);
        expect(textOf(navHtml)).toContain(ui.journal.themes);
      },
    );
  });

  describe("calendário", () => {
    const latest = months[months.length - 1];

    it.each(months.map((m) => [m]))("mês %s: título, cabeçalho de 7 dias, células e links só nos dias com entrada", (m) => {
      const [y, mo] = m.split("-").map(Number);
      const html = pageHtml(monthRoute(m));
      const cal = elementById(html, "calendar");
      expect(cal, 'sem elemento id="calendar"').not.toBeNull();
      expect(textOf(cal!)).toContain(`${ui.journal.monthNames[mo - 1]} ${y}`);
      expect(tags(cal!, "th").map((t) => norm(textOf(cal!.slice(t.index, cal!.indexOf("</th>", t.index))))))
        .toEqual(ui.journal.weekdays);
      const dayCount = monthGrid(y, mo).flat().filter((d) => d !== null).length;
      const tds = [...cal!.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((x) => norm(textOf(x[1])));
      expect(tds.filter((t) => t !== "")).toHaveLength(dayCount);
      const wanted = days.filter((d) => d.startsWith(m)).map(dayRoute);
      const got = tags(cal!, "a").map((a) => normHref(a.attrs.href)).filter((h) => h.includes("/journal/day/"));
      expect(got.sort()).toEqual(wanted.sort());
    });

    it("cada dia com entrada é link com aria-label: dia, mês e número de entradas", () => {
      const html = pageHtml(monthRoute(latest));
      const cal = elementById(html, "calendar")!;
      for (const a of tags(cal, "a").filter((x) => (x.attrs.href ?? "").includes("/journal/day/"))) {
        const d = a.attrs.href.replace(/\/$/, "").split("/").pop()!;
        const n = resolved.filter((r) => r.date === d).length;
        const label = a.attrs["aria-label"] ?? "";
        expect(label, d).toContain(String(Number(d.slice(8, 10))));
        expect(label, d).toContain(ui.journal.monthNames[Number(d.slice(5, 7)) - 1]);
        expect(label, d).toContain(count(ui, n));
      }
    });

    it("/journal mostra o mesmo calendário do mês mais recente com entrada", () => {
      const a = elementById(pageHtml(J), "calendar");
      const b = elementById(pageHtml(monthRoute(latest)), "calendar");
      expect(a).not.toBeNull();
      expect(norm(a!)).toBe(norm(b!));
    });

    it.each(months.map((m, i) => [m, months[i - 1], months[i + 1]]))(
      "mês %s: link rel=prev para %s e rel=next para %s só quando existem",
      (m, prev, next) => {
        const html = pageHtml(monthRoute(m));
        const rel = (r: string) => tags(html, "a").filter((a) => a.attrs.rel === r);
        expect(rel("prev").map((a) => normHref(a.attrs.href))).toEqual(prev ? [monthRoute(prev)] : []);
        expect(rel("next").map((a) => normHref(a.attrs.href))).toEqual(next ? [monthRoute(next)] : []);
      },
    );

    it("sem JavaScript: o calendário não depende de script (nenhuma tag <script> dentro de #calendar)", () => {
      expect(elementById(pageHtml(J), "calendar")).not.toMatch(/<script\b/i);
    });
  });

  describe("página do dia", () => {
    it.each(days.map((d) => [d]))("%s: h1 com a data, entradas completas, tags como links, link de volta", (d) => {
      const html = pageHtml(dayRoute(d));
      const [y, m, dd] = d.split("-").map(Number);
      const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? "";
      expect(textOf(h1)).toContain(String(dd));
      expect(textOf(h1)).toContain(ui.journal.monthNames[m - 1]);
      expect(textOf(h1)).toContain(String(y));
      const back = tags(html, "a").find((a) => normHref(a.attrs.href ?? "") === monthRoute(d.slice(0, 7)));
      expect(back, "sem link de volta ao calendário do mês").toBeDefined();
      expect(textOf(html)).toContain(ui.journal.backToCalendar);
      const articles = [...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi)];
      const wanted = resolved.filter((r) => r.date === d);
      expect(articles).toHaveLength(wanted.length);
      for (const r of wanted) {
        const text = articles.map((a) => textOf(a[2])).find((t) => t.includes(norm(r.entry.data.title)));
        expect(text, `${r.name}: título não encontrado`).toBeDefined();
        expect(text).toContain(norm(r.entry.data.did));
        expect(text).toContain(norm(r.entry.data.learned));
        expect(text).toContain(ui.journal.did);
        expect(text).toContain(ui.journal.learned);
      }
    });

    it.each(days.map((d) => [d]))("%s: cada tag leva à página do tema; links da entrada aparecem", (d) => {
      const html = pageHtml(dayRoute(d));
      const hrefs = tags(html, "a").map((a) => a.attrs.href ?? "");
      for (const r of resolved.filter((x) => x.date === d)) {
        for (const t of r.entry.data.tags as string[]) expect(hrefs.map(normHref), t).toContain(`${J}/themes/${tagSlug(t)}`);
        for (const l of (r.entry.data.links ?? []) as string[]) expect(hrefs, l).toContain(l);
      }
    });

    it("aviso 'ainda sem tradução' só nas entradas sem versão neste idioma, com lang da original", () => {
      for (const d of days) {
        const html = pageHtml(dayRoute(d));
        const articles = [...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi)];
        for (const r of resolved.filter((x) => x.date === d)) {
          const art = articles.find((a) => textOf(a[2]).includes(norm(r.entry.data.title)))!;
          expect(textOf(art[2]).includes(ui.journal.untranslated), `${r.name}: aviso`).toBe(r.untranslated);
          // O texto da entrada leva o lang da original; o aviso (idioma da interface) não pode herdá-lo.
          const L = r.entry.data.lang;
          const langRe = new RegExp(`<(h2|p)\\b[^>]*\\blang=["']?${L}\\b[^>]*>`, "gi");
          const withLang = [...art[2].matchAll(langRe)].length;
          expect(withLang, `${r.name}: lang da original em título, did e learned`).toBe(r.untranslated ? 3 : 0);
          expect(art[1], `${r.name}: <article> sem lang`).not.toMatch(/\blang=/);
        }
      }
    });
  });

  describe("temas", () => {
    it("lista: um link por tema, com título e contagem de entradas", () => {
      const html = pageHtml(`${J}/themes`);
      const list = elementById(html, "themes");
      expect(list, 'sem elemento id="themes"').not.toBeNull();
      const items = [...list!.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => m[1]);
      expect(items).toHaveLength(themes.size);
      for (const [slug, spellings] of themes) {
        const item = items.find((i) => tags(i, "a").some((a) => normHref(a.attrs.href) === `${J}/themes/${slug}`));
        expect(item, `sem link para o tema ${slug}`).toBeDefined();
        const text = textOf(item!);
        expect(spellings.some((s) => text.includes(norm(s))), `${slug}: título`).toBe(true);
        expect(text).toContain(count(ui, spellings.length));
      }
    });

    it.each([...themes.keys()].map((s) => [s]))("tema %s: h1 com o título e entradas da mais nova para a mais antiga", (slug) => {
      const html = pageHtml(`${J}/themes/${slug}`);
      const h1 = textOf(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? "");
      expect(themes.get(slug)!.some((s) => h1.includes(norm(s)))).toBe(true);
      const list = elementById(html, "theme-entries");
      expect(list, 'sem elemento id="theme-entries"').not.toBeNull();
      const got = tags(list!, "a").map((a) => normHref(a.attrs.href)).filter((h) => h.includes("/journal/day/"));
      const want = resolved
        .filter((r) => (r.entry.data.tags as string[]).some((t) => tagSlug(t) === slug))
        .sort((a, b) => (b.date + b.name).localeCompare(a.date + a.name))
        .map((r) => dayRoute(r.date));
      const dedupe = (l: string[]) => l.filter((x, i) => x !== l[i - 1]);
      expect(dedupe(got)).toEqual(dedupe(want));
    });
  });

  describe("idioma, <head> e links em todas as páginas do Journal", () => {
    const routes = [J, `${J}/themes`, ...months.map(monthRoute), ...days.map(dayRoute), ...[...themes.keys()].map((s) => `${J}/themes/${s}`)];
    const swap = (r: string) => r.replace(`/${lang}/`, `/${other}/`);

    it("html lang certo, um único h1 e um único main", () => {
      for (const r of routes) {
        const html = pageHtml(r);
        expect(tags(html, "html")[0].attrs.lang, r).toBe(lang === "pt" ? "pt-BR" : "en");
        expect(tags(html, "h1").length, `${r}: h1`).toBe(1);
        expect(tags(html, "main").length, `${r}: main`).toBe(1);
      }
    });

    it("#lang-switch e <link rel=alternate> levam à mesma rota no outro idioma, que existe", () => {
      for (const r of routes) {
        const html = pageHtml(r);
        const sw = tags(html, "a").find((a) => a.attrs.id === "lang-switch");
        expect(sw, `${r}: sem #lang-switch`).toBeDefined();
        expect(normHref(sw!.attrs.href), r).toBe(swap(r));
        expect(routeFile(swap(r)), `${swap(r)} não existe`).not.toBeNull();
        const alt = tags(html, "link").find((l) => l.attrs.rel === "alternate" && l.attrs.hreflang === other);
        expect(normHref(alt?.attrs.href ?? ""), `${r}: alternate`).toBe(swap(r));
      }
    });

    it("todo link interno fica no mesmo idioma (exceto #lang-switch)", () => {
      for (const r of routes) {
        for (const a of tags(pageHtml(r), "a")) {
          const href = a.attrs.href;
          if (!href || href.startsWith("#") || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href) || a.attrs.id === "lang-switch") continue;
          expect(href === `/${lang}` || href.startsWith(`/${lang}/`) || href.startsWith("/_astro/"), `${r}: ${href}`).toBe(true);
        }
      }
    });
  });
});

describe("journal > rascunhos não vazam", () => {
  it("o título de uma entrada com draft: true não aparece em nenhuma página gerada", () => {
    const drafts = walk(path.join(__dirname, "../src/content/journal"), /\.md$/)
      .map((f) => ({ f, src: fs.readFileSync(f, "utf8") as string }))
      .filter((x) => /^draft:\s*true\s*$/m.test(x.src))
      .map((x) => /^title:\s*(.+)$/m.exec(x.src)?.[1]?.replace(/^["']|["']$/g, "").trim())
      .filter(Boolean) as string[];
    const all = walk(dist, /\.html$/).map((f) => textOf(fs.readFileSync(f, "utf8")));
    for (const t of drafts) for (const text of all) expect(text).not.toContain(t);
  });
});
