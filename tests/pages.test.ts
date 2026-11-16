import { describe, it, expect, inject } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  ROUTES, PAGE_ROUTES, dist, allHtml, routeFile, pageHtml, read, textOf, norm, tags, elementById, attrs,
  contentEntries, publishedOf, isoDate, decode,
} from "./helpers";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const monthYear = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

// Remove sintaxe markdown simples para comparar o corpo com o texto renderizado.
const plainMd = (s: string) =>
  norm(s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`#>]/g, ""));

describe("build", () => {
  it("astro build conclui sem erro", () => {
    expect(inject("buildError"), "astro build falhou").toBeNull();
  });
});

describe("paginas", () => {
  describe("rotas existem", () => {
    it.each(ROUTES)("%s: arquivo em dist, html lang=pt-BR, um <h1> e um <main>", (route) => {
      expect(routeFile(route), `sem arquivo em dist/ para ${route}`).not.toBeNull();
      const html = pageHtml(route);
      const htmlTag = tags(html, "html")[0];
      expect(htmlTag?.attrs.lang).toBe("pt-BR");
      expect(tags(html, "h1").length, "deve haver exatamente um <h1>").toBe(1);
      expect(tags(html, "main").length, "deve haver exatamente um <main>").toBe(1);
    });
  });

  describe("conteúdo inicial", () => {
    const pageOf: Record<string, string> = { activities: "/activities", experience: "/experience" };

    it.each(Object.keys(pageOf))("%s: mostra org, resumo e período de toda entrada publicada", (c) => {
      const entries = publishedOf(c);
      expect(entries.length).toBeGreaterThan(0);
      const text = textOf(pageHtml(pageOf[c]));
      for (const e of entries) {
        expect(text, `${e.rel}: org`).toContain(norm(e.data.org));
        expect(text, `${e.rel}: summary`).toContain(norm(e.data.summary));
        const start = monthYear(isoDate(e.data.start));
        if (e.data.end === undefined) {
          expect(text, `${e.rel}: período em andamento`).toContain(`${start} – atual`);
        } else {
          const end = monthYear(isoDate(e.data.end));
          // Início = fim (ex.: PRIO, 1 mês): aceita "jan 2025" ou "jan 2025 – jan 2025".
          const ok = start === end ? text.includes(start) : text.includes(`${start} – ${end}`);
          expect(ok, `${e.rel}: período "${start} – ${end}"`).toBe(true);
        }
      }
    });

    it("datas literais do spec: Integração e LEPV em /activities", () => {
      const text = textOf(pageHtml("/activities"));
      expect(text).toContain("ago 2024 – jan 2026");
      expect(text).toContain("jan 2026 – atual");
    });

    it("/activities não mostra 'dez 2025' (fuso: 2026-01-01 deve ser jan)", () => {
      expect(textOf(pageHtml("/activities"))).not.toContain("dez 2025");
    });

    it("/courses mostra título e provedor de todo curso publicado", () => {
      const text = textOf(pageHtml("/courses"));
      const courses = publishedOf("courses");
      expect(courses.length).toBeGreaterThan(0);
      for (const c of courses) {
        expect(text, c.rel).toContain(norm(c.data.title));
        expect(text, c.rel).toContain(norm(c.data.provider));
      }
    });

    it("/projects: título de todo projeto publicado (rascunhos ficam de fora)", () => {
      const text = textOf(pageHtml("/projects"));
      for (const p of publishedOf("projects")) expect(text, p.rel).toContain(norm(p.data.title));
    });

    it("cada página tem link de navegação para as outras (cabeçalho)", () => {
      for (const route of ROUTES) {
        const hrefs = tags(pageHtml(route), "a").map((a) => (a.attrs.href ?? "").replace(/\/$/, "") || "/");
        for (const other of PAGE_ROUTES) expect(hrefs, `${route} -> ${other}`).toContain(other);
      }
    });
  });
});

describe("home", () => {
  describe("foto, texto e botão", () => {
    const about = () => contentEntries().find((e) => e.rel === path.join("about", "pt.md"))!;

    it("<img> da foto com alt igual ao photo_alt de about/pt", () => {
      const a = about();
      expect(a, "about/pt.md ausente").toBeDefined();
      expect(a.data.photo_alt).toBeTruthy();
      const imgs = tags(pageHtml("/"), "img");
      expect(imgs.map((i) => i.attrs.alt)).toContain(a.data.photo_alt);
    });

    it("a foto tem width e height (sem layout shift)", () => {
      const img = tags(pageHtml("/"), "img").find((i) => i.attrs.alt === about().data.photo_alt);
      expect(img, "img da foto não encontrada").toBeDefined();
      expect(Number(img!.attrs.width)).toBeGreaterThan(0);
      expect(Number(img!.attrs.height)).toBeGreaterThan(0);
    });

    it("mostra o texto de about/pt (corpo markdown)", () => {
      const body = plainMd(about().body);
      expect(body.length).toBeGreaterThan(20);
      expect(textOf(pageHtml("/"))).toContain(body);
    });

    it("link com o texto cta_label aponta para #paginas, que existe e tem 5 links", () => {
      const html = pageHtml("/");
      const label = about().data.cta_label;
      expect(label).toBe("Saiba mais");
      const cta = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].find((m) => norm(textOf(m[2])) === label);
      expect(cta, `link "${label}" não encontrado`).toBeDefined();
      expect(attrs(`<a ${cta![1]}>`).href).toBe("#paginas");
      const inner = elementById(html, "paginas");
      expect(inner, 'elemento id="paginas" não existe').not.toBeNull();
      const hrefs = tags(inner!, "a").map((a) => (a.attrs.href ?? "").replace(/\/$/, ""));
      expect(hrefs.length).toBe(5);
      expect([...hrefs].sort()).toEqual([...PAGE_ROUTES].sort());
    });

    it("home não mostra o texto em inglês (about/en não tem rota)", () => {
      const en = contentEntries().find((e) => e.rel === path.join("about", "en.md"));
      expect(en).toBeDefined();
      expect(textOf(pageHtml("/"))).not.toContain(plainMd(en!.body));
    });
  });
});

describe("cursos", () => {
  describe("progresso e data", () => {
    it.each(["30% · atualizado em 15/11", "1% · atualizado em 15/11", "0% · atualizado em 15/11"])(
      "/courses mostra %s",
      (s) => {
        expect(textOf(pageHtml("/courses"))).toContain(s);
      },
    );

    it("todo curso publicado mostra 'N% · atualizado em dd/mm' vindo do conteúdo", () => {
      const text = textOf(pageHtml("/courses"));
      for (const c of publishedOf("courses")) {
        expect(text, c.rel).toContain(`${c.data.progress}% · atualizado em ${ddmm(isoDate(c.data.updated_at))}`);
      }
    });

    it("grupo 'Concluídos' só aparece se houver curso concluído publicado", () => {
      const hasDone = publishedOf("courses").some((c) => c.data.status === "completed");
      expect(textOf(pageHtml("/courses")).includes("Concluídos")).toBe(hasDone);
    });
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
          expect(Object.hasOwn(img.attrs, "alt"), `${path.relative(dist, f)}: ${img.tag}`).toBe(true);
        }
      }
    });

    const idsIn = (html: string) => new Set([...html.matchAll(/\b(?:id|name)=["']?([^\s"'>]+)/gi)].map((m) => decode(m[1])));

    function resolve(pathname: string): string | null {
      const clean = decodeURIComponent(pathname).replace(/^\/+/, "");
      const direct = path.join(dist, clean);
      if (clean === "") return path.join(dist, "index.html");
      if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
      for (const c of [path.join(direct, "index.html"), `${direct}.html`]) if (fs.existsSync(c)) return c;
      return null;
    }

    it("links internos resolvem para arquivo em dist/ ou âncora existente", () => {
      const problems: string[] = [];
      for (const f of files) {
        const rel = path.relative(dist, f);
        const html = read(f);
        const selfPath = "/" + rel.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "");
        for (const a of tags(html, "a")) {
          const href = a.attrs.href;
          if (href === undefined) continue;
          if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) continue; // externo
          const u = new URL(href, `http://x${selfPath === "/" ? "/" : selfPath + "/"}`);
          const target = href.startsWith("#") ? f : resolve(u.pathname);
          if (!target) {
            problems.push(`${rel}: ${href} -> sem arquivo`);
            continue;
          }
          if (u.hash.length > 1 && /\.html$/.test(target)) {
            if (!idsIn(read(target)).has(decodeURIComponent(u.hash.slice(1)))) problems.push(`${rel}: ${href} -> âncora ausente`);
          }
        }
      }
      expect(problems).toEqual([]);
    });
  });
});
