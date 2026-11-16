import { describe, it, expect, inject } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  LANGS,
  HTML_LANG,
  ROUTES,
  routesFor,
  pageRoutesFor,
  pageRoute,
  uiOf,
  dist,
  allHtml,
  routeFile,
  pageHtml,
  read,
  textOf,
  norm,
  tags,
  elementById,
  attrs,
  contentEntries,
  publishedOf,
  isoDate,
  decode,
  type Lang,
} from "./helpers";

// Formato de data curta: pt = dd/mm, en = mm/dd.
const shortDate = (lang: Lang, iso: string) =>
  lang === "pt"
    ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
    : `${iso.slice(5, 7)}/${iso.slice(8, 10)}`;

// Remove sintaxe markdown simples para comparar o corpo com o texto renderizado.
const plainMd = (s: string) =>
  norm(s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`#>]/g, ""));

describe("build", () => {
  it("astro build conclui sem erro", () => {
    expect(inject("buildError"), "astro build falhou").toBeNull();
  });
});

describe.each(LANGS)("paginas [%s]", (lang) => {
  const ui = uiOf(lang);
  const monthYear = (iso: string) =>
    `${ui.months[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

  describe("rotas existem", () => {
    it.each(routesFor(lang))(
      "%s: arquivo em dist, html lang correto, um <h1> e um <main>",
      (route) => {
        expect(
          routeFile(route),
          `sem arquivo em dist/ para ${route}`,
        ).not.toBeNull();
        const html = pageHtml(route);
        expect(tags(html, "html")[0]?.attrs.lang).toBe(HTML_LANG[lang]);
        expect(tags(html, "h1").length, "deve haver exatamente um <h1>").toBe(
          1,
        );
        expect(
          tags(html, "main").length,
          "deve haver exatamente um <main>",
        ).toBe(1);
      },
    );
  });

  describe("conteúdo inicial", () => {
    const pageOf = {
      activities: pageRoute(lang, "activities"),
      experience: pageRoute(lang, "experience"),
    };

    it.each(Object.keys(pageOf) as (keyof typeof pageOf)[])(
      "%s: mostra org, resumo e período de toda entrada publicada",
      (c) => {
        const entries = publishedOf(c, lang);
        expect(
          entries.length,
          `nenhuma entrada publicada em ${c}/${lang}`,
        ).toBeGreaterThan(0);
        const text = textOf(pageHtml(pageOf[c]));
        for (const e of entries) {
          expect(text, `${e.rel}: org`).toContain(norm(e.data.org));
          expect(text, `${e.rel}: summary`).toContain(norm(e.data.summary));
          const start = monthYear(isoDate(e.data.start));
          if (e.data.end === undefined) {
            expect(text, `${e.rel}: período em andamento`).toContain(
              `${start} – ${ui.labels.present}`,
            );
          } else {
            const end = monthYear(isoDate(e.data.end));
            // Início = fim (ex.: PRIO, 1 mês): aceita "jan 2025" ou "jan 2025 – jan 2025".
            const ok =
              start === end
                ? text.includes(start)
                : text.includes(`${start} – ${end}`);
            expect(ok, `${e.rel}: período "${start} – ${end}"`).toBe(true);
          }
        }
      },
    );

    it("não mostra entradas do outro idioma", () => {
      const other = LANGS.find((l) => l !== lang)!;
      for (const c of ["activities", "experience"] as const) {
        const text = textOf(pageHtml(pageOf[c]));
        for (const e of publishedOf(c, other)) {
          if (
            publishedOf(c, lang).some(
              (m) => norm(m.data.summary) === norm(e.data.summary),
            )
          )
            continue;
          expect(text, `${e.rel} apareceu em ${pageOf[c]}`).not.toContain(
            norm(e.data.summary),
          );
        }
      }
    });

    it("courses mostra título e provedor de todo curso publicado", () => {
      const text = textOf(pageHtml(pageRoute(lang, "courses")));
      const courses = publishedOf("courses", lang);
      expect(courses.length).toBeGreaterThan(0);
      for (const c of courses) {
        expect(text, c.rel).toContain(norm(c.data.title));
        expect(text, c.rel).toContain(norm(c.data.provider));
      }
    });

    it("projects: título de todo projeto publicado (rascunhos ficam de fora)", () => {
      const text = textOf(pageHtml(pageRoute(lang, "projects")));
      for (const p of publishedOf("projects", lang))
        expect(text, p.rel).toContain(norm(p.data.title));
    });

    it("cada página tem link de navegação para as outras, no mesmo idioma (cabeçalho)", () => {
      for (const route of routesFor(lang)) {
        const hrefs = tags(pageHtml(route), "a").map(
          (a) => (a.attrs.href ?? "").replace(/\/$/, "") || "/",
        );
        for (const other of pageRoutesFor(lang))
          expect(hrefs, `${route} -> ${other}`).toContain(other);
      }
    });
  });

  describe("home", () => {
    const home = pageRoute(lang);
    const about = () =>
      contentEntries().find((e) => e.rel === path.join("about", `${lang}.md`))!;

    it("<img> da foto com alt igual ao photo_alt do about do idioma", () => {
      const a = about();
      expect(a, `about/${lang}.md ausente`).toBeDefined();
      expect(a.data.photo_alt).toBeTruthy();
      expect(tags(pageHtml(home), "img").map((i) => i.attrs.alt)).toContain(
        a.data.photo_alt,
      );
    });

    it("a foto tem width e height (sem layout shift)", () => {
      const img = tags(pageHtml(home), "img").find(
        (i) => i.attrs.alt === about().data.photo_alt,
      );
      expect(img, "img da foto não encontrada").toBeDefined();
      expect(Number(img!.attrs.width)).toBeGreaterThan(0);
      expect(Number(img!.attrs.height)).toBeGreaterThan(0);
    });

    it("mostra o corpo markdown do about do idioma e não o do outro", () => {
      const body = plainMd(about().body);
      expect(body.length).toBeGreaterThan(20);
      const text = textOf(pageHtml(home));
      expect(text).toContain(body);
      const other = contentEntries().find(
        (e) =>
          e.rel === path.join("about", `${lang === "pt" ? "en" : "pt"}.md`),
      )!;
      expect(text).not.toContain(plainMd(other.body));
    });

    it("link com o texto cta_label aponta para #paginas, que existe e tem 5 links do idioma", () => {
      const html = pageHtml(home);
      const label = about().data.cta_label;
      const cta = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].find(
        (m) => norm(textOf(m[2])) === label,
      );
      expect(cta, `link "${label}" não encontrado`).toBeDefined();
      expect(attrs(`<a ${cta![1]}>`).href).toBe("#paginas");
      const inner = elementById(html, "paginas");
      expect(inner, 'elemento id="paginas" não existe').not.toBeNull();
      const hrefs = tags(inner!, "a").map((a) =>
        (a.attrs.href ?? "").replace(/\/$/, ""),
      );
      expect(hrefs.length).toBe(5);
      expect([...hrefs].sort()).toEqual([...pageRoutesFor(lang)].sort());
    });
  });

  describe("cursos: progresso e data", () => {
    it("todo curso publicado mostra 'N% · <atualizado> <data curta>' vindo do conteúdo", () => {
      const text = textOf(pageHtml(pageRoute(lang, "courses")));
      for (const c of publishedOf("courses", lang)) {
        const expected = `${c.data.progress}% · ${ui.labels.updated} ${shortDate(lang, isoDate(c.data.updated_at))}`;
        expect(text, c.rel).toContain(expected);
      }
    });

    it("grupo 'Concluídos' só aparece se houver curso concluído publicado", () => {
      const hasDone = publishedOf("courses", lang).some(
        (c) => c.data.status === "completed",
      );
      expect(
        textOf(pageHtml(pageRoute(lang, "courses"))).includes(
          ui.labels.completed,
        ),
      ).toBe(hasDone);
    });
  });
});

describe("paginas [pt]: textos literais do spec", () => {
  it("datas literais: Integração e LEPV em /pt/activities", () => {
    const text = textOf(pageHtml("/pt/activities"));
    expect(text).toContain("ago 2024 – jan 2026");
    expect(text).toContain("jan 2026 – atual");
  });

  it("/pt/activities não mostra 'dez 2025' (fuso: 2026-01-01 deve ser jan)", () => {
    expect(textOf(pageHtml("/pt/activities"))).not.toContain("dez 2025");
  });

  it.each([
    "30% · atualizado em 15/11",
    "1% · atualizado em 15/11",
    "0% · atualizado em 15/11",
  ])("/pt/courses mostra %s", (s) => {
    expect(textOf(pageHtml("/pt/courses"))).toContain(s);
  });
});

describe("paginas [en]: textos literais", () => {
  it("/en/activities mostra as datas de LEPV e Integração no formato em inglês", () => {
    const text = textOf(pageHtml("/en/activities"));
    expect(text).toContain(
      `${uiOf("en").months[0]} 2026 – ${uiOf("en").labels.present}`,
    );
    expect(text).toContain(
      `${uiOf("en").months[7]} 2024 – ${uiOf("en").months[0]} 2026`,
    );
  });

  it("/en/courses usa mm/dd: '30% · … 11/15'", () => {
    expect(textOf(pageHtml("/en/courses"))).toContain(
      `30% · ${uiOf("en").labels.updated} 11/15`,
    );
  });
});

describe("paginas", () => {
  describe("alt e links internos", () => {
    const files = allHtml();

    it("dist tem html para checar", () => {
      expect(files.length).toBeGreaterThanOrEqual(ROUTES.length);
    });

    it("todo <img> tem atributo alt", () => {
      for (const f of files) {
        for (const img of tags(read(f), "img")) {
          expect(
            Object.hasOwn(img.attrs, "alt"),
            `${path.relative(dist, f)}: ${img.tag}`,
          ).toBe(true);
        }
      }
    });

    const idsIn = (html: string) =>
      new Set(
        [...html.matchAll(/\b(?:id|name)=["']?([^\s"'>]+)/gi)].map((m) =>
          decode(m[1]),
        ),
      );

    function resolve(pathname: string): string | null {
      const clean = decodeURIComponent(pathname).replace(/^\/+/, "");
      const direct = path.join(dist, clean);
      if (clean === "") return path.join(dist, "index.html");
      if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
      for (const c of [path.join(direct, "index.html"), `${direct}.html`])
        if (fs.existsSync(c)) return c;
      return null;
    }

    it("links internos resolvem para arquivo em dist/ ou âncora existente", () => {
      const problems: string[] = [];
      for (const f of files) {
        const rel = path.relative(dist, f);
        const html = read(f);
        const selfPath =
          "/" + rel.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "");
        for (const a of tags(html, "a")) {
          const href = a.attrs.href;
          if (href === undefined) continue;
          if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) continue; // externo
          const u = new URL(
            href,
            `http://x${selfPath === "/" ? "/" : selfPath + "/"}`,
          );
          const target = href.startsWith("#") ? f : resolve(u.pathname);
          if (!target) {
            problems.push(`${rel}: ${href} -> sem arquivo`);
            continue;
          }
          if (u.hash.length > 1 && /\.html$/.test(target)) {
            if (!idsIn(read(target)).has(decodeURIComponent(u.hash.slice(1))))
              problems.push(`${rel}: ${href} -> âncora ausente`);
          }
        }
      }
      expect(problems).toEqual([]);
    });
  });
});
