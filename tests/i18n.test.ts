import { describe, it, expect } from "vitest";
import path from "node:path";
import { uiSchema } from "../src/lib/schemas";
import { LANGS as APP_LANGS, otherLang as appOtherLang, localePath } from "../src/lib/i18n";
import {
  LANGS, PAGES, pageRoute, routesFor, uiOf, otherLang,
  dist, allHtml, read, routeFile, pageHtml, tags, textOf, norm, contentRoot, walk,
  type Lang,
} from "./helpers";

const normHref = (h: string) => h.replace(/\/$/, "") || "/";

describe("i18n > helper de rotas (src/lib/i18n.ts)", () => {
  it("LANGS tem pt e en, nesta ordem", () => {
    expect([...APP_LANGS]).toEqual(["pt", "en"]);
  });

  it("otherLang troca pt e en", () => {
    expect(appOtherLang("pt")).toBe("en");
    expect(appOtherLang("en")).toBe("pt");
  });

  it("localePath: home com barra final, páginas sem", () => {
    expect(localePath("pt")).toBe("/pt/");
    expect(localePath("en", "courses")).toBe("/en/courses");
  });

  it("localePath aceita subcaminhos do Journal", () => {
    expect(localePath("en", "journal/day/2026-11-15")).toBe("/en/journal/day/2026-11-15");
    expect(localePath("pt", "journal/themes/astro", "/clara-portfolio/")).toBe("/clara-portfolio/pt/journal/themes/astro");
  });

  it("localePath respeita o base do GitHub Pages, com ou sem barra final", () => {
    expect(localePath("pt", undefined, "/clara-portfolio/")).toBe("/clara-portfolio/pt/");
    expect(localePath("en", "journal", "/clara-portfolio/")).toBe("/clara-portfolio/en/journal");
    expect(localePath("en", "journal", "/clara-portfolio")).toBe("/clara-portfolio/en/journal");
  });
});

describe("i18n > textos de interface", () => {
  const uiFiles = walk(path.join(contentRoot, "ui"), /\.json$/).map((f) => path.basename(f)).sort();

  it("existem exatamente pt.json e en.json", () => {
    expect(uiFiles).toEqual(["en.json", "pt.json"]);
  });

  it.each(LANGS)("%s.json valida em uiSchema", (l) => {
    const r = uiSchema.safeParse(uiOf(l));
    expect(r.success, JSON.stringify((r as any).error?.issues)).toBe(true);
  });

  const keyPaths = (v: unknown, prefix: string[] = []): string[] =>
    Array.isArray(v)
      ? [`${prefix.join(".")}[${v.length}]`]
      : v && typeof v === "object"
        ? Object.entries(v).flatMap(([k, x]) => keyPaths(x, [...prefix, k]))
        : [prefix.join(".")];

  it("en.json e pt.json têm as mesmas chaves (e meses com 12 itens)", () => {
    expect(keyPaths(uiOf("en")).sort()).toEqual(keyPaths(uiOf("pt")).sort());
  });

  it("langSwitch existe no schema, com label, text e name", () => {
    const base = uiOf("pt");
    expect(Object.keys(base.langSwitch ?? {}).sort()).toEqual(["label", "name", "text"]);
    const { langSwitch, ...rest } = base;
    expect(uiSchema.safeParse(rest).success, "langSwitch deve ser obrigatório").toBe(false);
  });

  it("journal: chave obrigatória no uiSchema, com os textos do Journal", () => {
    const keys = [
      "backToCalendar", "calendar", "did", "empty", "entriesMany", "entriesOne", "learned", "links",
      "monthNames", "nextMonth", "prevMonth", "rss", "tabsLabel", "tags", "themes", "untranslated", "weekdays",
    ];
    for (const l of LANGS) {
      const ui = uiOf(l);
      expect(Object.keys(ui.journal ?? {}).sort(), `${l}.json`).toEqual(keys);
      expect(ui.journal.weekdays).toHaveLength(7);
      expect(ui.journal.monthNames).toHaveLength(12);
      expect(ui.journal.entriesOne).toContain("{n}");
      expect(ui.journal.entriesMany).toContain("{n}");
    }
    const { journal, ...rest } = uiOf("pt");
    expect(uiSchema.safeParse(rest).success, "journal deve ser obrigatório").toBe(false);
  });

  it("o placeholder 'soon' do Journal foi removido de pages.journal", () => {
    for (const l of LANGS) expect(Object.keys(uiOf(l).pages.journal).sort()).toEqual(["intro", "title"]);
  });

  it("o botão de cada idioma aponta para o outro: text e name diferem entre pt e en", () => {
    expect(uiOf("pt").langSwitch.text).not.toBe(uiOf("en").langSwitch.text);
    expect(uiOf("pt").langSwitch.name).not.toBe(uiOf("en").langSwitch.name);
  });
});

describe("i18n > raiz /", () => {
  const html = () => pageHtml("/");
  const links = () =>
    tags(html(), "a")
      .filter((a) => /^\/(pt|en)\/?$/.test(a.attrs.href ?? ""))
      .map((a) => normHref(a.attrs.href));

  it("dist/index.html existe", () => {
    expect(routeFile("/")).not.toBeNull();
  });

  it("tem links para /pt e /en, com PT primeiro (sem JS)", () => {
    expect(links().slice(0, 2)).toEqual(["/pt", "/en"]);
  });

  it("o texto de cada link é o nome do idioma, vindo do conteúdo ui", () => {
    const text = textOf(html());
    for (const l of LANGS) expect(text).toContain(norm(uiOf(l).langSwitch.name));
  });

  it("escolhe o idioma por navigator.language em script, e não por meta refresh", () => {
    expect(html()).toMatch(/navigator\.language/);
    expect(html()).not.toMatch(/http-equiv=["']?refresh/i);
  });
});

describe("i18n > rotas antigas sem prefixo foram removidas", () => {
  it.each(PAGES)("/%s não existe mais em dist", (p) => {
    expect(routeFile(`/${p}`), `dist ainda tem /${p}`).toBeNull();
  });
});

describe.each(LANGS)("i18n > páginas [%s]", (lang: Lang) => {
  const other = otherLang(lang);
  const ui = uiOf(lang);

  describe.each(["", ...PAGES] as const)("página %j", (page) => {
    const route = page === "" ? pageRoute(lang) : pageRoute(lang, page);
    const target = page === "" ? pageRoute(other) : pageRoute(other, page);

    it("tem um único #lang-switch, apontando para a mesma página no outro idioma", () => {
      const sw = tags(pageHtml(route), "a").filter((a) => a.attrs.id === "lang-switch");
      expect(sw.length, "deve haver exatamente um #lang-switch").toBe(1);
      expect(normHref(sw[0].attrs.href)).toBe(target);
      expect(sw[0].attrs.hreflang).toBe(other);
      expect(sw[0].attrs.lang).toBe(other);
      expect(routeFile(target), `destino ${target} não existe em dist`).not.toBeNull();
    });

    it("#lang-switch mostra ui.langSwitch.text e tem aria-label ui.langSwitch.label", () => {
      const html = pageHtml(route);
      const m = /<a\b[^>]*\bid=["']?lang-switch["']?[^>]*>([\s\S]*?)<\/a>/i.exec(html);
      expect(m, "#lang-switch ausente").not.toBeNull();
      expect(norm(textOf(m![1]))).toBe(norm(ui.langSwitch.text));
      const sw = tags(html, "a").find((a) => a.attrs.id === "lang-switch")!;
      expect(sw.attrs["aria-label"]).toBe(ui.langSwitch.label);
    });

    it("<head> tem link rel=alternate hreflang para o outro idioma, na mesma página", () => {
      const alt = tags(pageHtml(route), "link").find((l) => l.attrs.rel === "alternate" && l.attrs.hreflang === other);
      expect(alt, `sem <link rel="alternate" hreflang="${other}">`).toBeDefined();
      expect(normHref(alt!.attrs.href)).toBe(target);
    });
  });

  it("todo link interno fica no mesmo idioma (exceto #lang-switch) ou em /_astro/", () => {
    const problems: string[] = [];
    for (const f of walk(path.join(dist, lang), /\.html$/)) {
      for (const a of tags(read(f), "a")) {
        const href = a.attrs.href;
        if (href === undefined || href.startsWith("#") || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) continue;
        if (a.attrs.id === "lang-switch") continue;
        if (!(href === `/${lang}` || href.startsWith(`/${lang}/`) || href.startsWith("/_astro/"))) {
          problems.push(`${path.relative(dist, f)}: ${href}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("nenhum texto de navegação do outro idioma aparece nas páginas (nada fixo no código)", () => {
    const otherUi = uiOf(other);
    for (const key of ["activities", "experience", "courses", "projects", "journal"] as const) {
      if (otherUi.nav[key] === ui.nav[key]) continue;
      for (const route of routesFor(lang)) {
        expect(textOf(pageHtml(route)), `${route} contém "${otherUi.nav[key]}"`).not.toContain(otherUi.nav[key]);
      }
    }
  });

  it("títulos das páginas vêm do ui do idioma", () => {
    for (const page of ["activities", "experience", "courses", "projects", "journal"] as const) {
      const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(pageHtml(pageRoute(lang, page)))?.[1] ?? "";
      expect(norm(textOf(h1))).toBe(norm(ui.pages[page].title));
    }
  });
});

describe("i18n > dist sem páginas fora de /pt, /en e da raiz", () => {
  it("todo html está em pt/, en/, _astro/ ou é index.html da raiz", () => {
    const strays = allHtml()
      .map((f) => path.relative(dist, f))
      .filter((r) => !/^(pt|en)\//.test(r) && r !== "index.html");
    expect(strays).toEqual([]);
  });
});
