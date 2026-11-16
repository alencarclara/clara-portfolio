import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { ZodTypeAny } from "astro/zod";
import {
  journalSchema,
  themesSchema,
  coursesSchema,
  projectsSchema,
  experienceSchema,
  activitiesSchema,
  aboutSchema,
  uiSchema,
} from "../src/lib/schemas";

// Valid baseline objects, inline (no fixtures). Each test mutates a copy.
const valid: Record<string, Record<string, unknown>> = {
  journal: {
    date: "2026-11-15",
    lang: "en",
    title: "Site spec",
    did: "Wrote the spec",
    learned: "Schemas catch mistakes",
    tags: ["astro"],
  },
  themes: { slug: "astro-basics", lang: "pt", title: "Astro" },
  courses: {
    lang: "en",
    title: "Intro to ML",
    provider: "Some Provider",
    status: "in_progress",
    progress: 62,
    updated_at: "2026-11-12",
  },
  projects: {
    lang: "en",
    title: "Portfolio",
    status: "in_progress",
    role: "Author",
    stack: ["Astro"],
    summary: "A site",
    period: "2025–2026",
  },
  experience: {
    lang: "en",
    org: "Org",
    role: "Intern",
    start: "2024-01-01",
    end: "2026-01-01",
    summary: "Did things",
  },
  activities: {
    lang: "en",
    org: "Org",
    role: "Member",
    start: "2023-01-01",
    end: "2026-01-01",
    summary: "Did things",
  },
  about: {
    lang: "en",
    title: "About me",
    cta_label: "Learn more",
    linkedin_url: "https://www.linkedin.com/in/example",
  },
};

const schemas: Record<string, ZodTypeAny> = {
  journal: journalSchema,
  themes: themesSchema,
  courses: coursesSchema,
  projects: projectsSchema,
  experience: experienceSchema,
  activities: activitiesSchema,
  about: aboutSchema,
};

const required: Record<string, string[]> = {
  journal: ["date", "lang", "title", "did", "learned", "tags"],
  themes: ["slug", "lang", "title"],
  courses: ["lang", "title", "provider", "status", "progress", "updated_at"],
  projects: ["lang", "title", "status", "role", "stack", "summary", "period"],
  experience: ["lang", "org", "role", "start", "summary"],
  activities: ["lang", "org", "role", "start", "summary"],
  about: ["lang", "title", "cta_label", "linkedin_url"],
};

const collections = Object.keys(schemas);
const make = (c: string, over: Record<string, unknown> = {}) => ({ ...valid[c], ...over });
const parse = (c: string, v: unknown) => schemas[c].safeParse(v);
const issuePaths = (r: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  (r.error?.issues ?? []).flatMap((i) => i.path.map(String));

describe("validação", () => {
  it("baseline inline válido passa em todas as coleções", () => {
    for (const c of collections) {
      const r = parse(c, make(c));
      expect(r.success, `${c}: ${JSON.stringify((r as any).error?.issues)}`).toBe(true);
    }
  });

  describe("campo obrigatório ausente falha", () => {
    const cases = collections.flatMap((c) => required[c].map((f) => [c, f] as const));
    it.each(cases)("%s sem %s", (c, field) => {
      const obj = make(c);
      delete obj[field];
      const r = parse(c, obj);
      expect(r.success).toBe(false);
      expect(issuePaths(r)).toContain(field);
    });

    it.each(cases)("%s com %s string vazia/inválida falha (strings não vazias)", (c, field) => {
      if (["date", "start", "end", "updated_at", "tags", "stack", "progress", "status", "lang", "linkedin_url"].includes(field)) return;
      expect(parse(c, make(c, { [field]: "" })).success).toBe(false);
    });
  });

  describe("progress limites", () => {
    it.each([0, 100])("aceita %s", (p) => {
      expect(parse("courses", make("courses", { progress: p })).success).toBe(true);
    });
    it.each([-1, 101, 62.5, "62"])("rejeita %j", (p) => {
      expect(parse("courses", make("courses", { progress: p })).success).toBe(false);
    });
  });

  describe("datas", () => {
    const dateFields: [string, string][] = [
      ["journal", "date"],
      ["courses", "updated_at"],
      ["courses", "started_at"],
      ["courses", "finished_at"],
      ["experience", "start"],
      ["experience", "end"],
      ["activities", "start"],
      ["activities", "end"],
    ];
    const bad = ["2026-02-30", "15/11/2026", "2026-13-01"];
    const cases = dateFields.flatMap(([c, f]) => bad.map((b) => [c, f, b] as const));

    it.each(cases)("%s.%s rejeita %s", (c, f, b) => {
      expect(parse(c, make(c, { [f]: b })).success).toBe(false);
    });

    it("aceita 2024-02-29 (ano bissexto) e rejeita 2026-02-29", () => {
      expect(parse("journal", make("journal", { date: "2024-02-29" })).success).toBe(true);
      expect(parse("journal", make("journal", { date: "2026-02-29" })).success).toBe(false);
    });

    it("aceita string AAAA-MM-DD e normaliza para string", () => {
      const r = parse("journal", make("journal", { date: "2026-11-15" }));
      expect(r.success).toBe(true);
      expect((r as any).data.date).toBe("2026-11-15");
    });

    it("aceita objeto Date (YAML sem aspas) e normaliza para AAAA-MM-DD", () => {
      const r = parse("journal", make("journal", { date: new Date("2026-11-15") }));
      expect(r.success).toBe(true);
      expect((r as any).data.date).toBe("2026-11-15");
    });

    it("Date inválido (NaN) é rejeitado", () => {
      expect(parse("journal", make("journal", { date: new Date("nope") })).success).toBe(false);
    });

    it.each(["experience", "activities"])("%s: end < start falha, end == start passa", (c) => {
      expect(parse(c, make(c, { start: "2026-05-02", end: "2026-05-01" })).success).toBe(false);
      expect(parse(c, make(c, { start: "2026-05-01", end: "2026-05-01" })).success).toBe(true);
    });

    it("experience: end < start funciona também com objetos Date", () => {
      const r = parse("experience", make("experience", { start: new Date("2026-05-02"), end: new Date("2026-05-01") }));
      expect(r.success).toBe(false);
    });

    it.each(["experience", "activities"])("%s: end ausente é aceito (em andamento)", (c) => {
      const obj = make(c);
      delete obj.end;
      expect(parse(c, obj).success).toBe(true);
    });

    it.each(["experience", "activities"])("%s: end presente e < start falha, nomeando end", (c) => {
      const r = parse(c, make(c, { start: "2026-01-01", end: "2025-12-31" }));
      expect(r.success).toBe(false);
      expect(issuePaths(r)).toContain("end");
    });

    it("courses: finished_at < started_at falha, igual ou maior passa", () => {
      expect(parse("courses", make("courses", { started_at: "2026-05-02", finished_at: "2026-05-01" })).success).toBe(false);
      expect(parse("courses", make("courses", { started_at: "2026-05-01", finished_at: "2026-05-01" })).success).toBe(true);
      expect(parse("courses", make("courses", { started_at: "2026-05-01", finished_at: "2026-06-01" })).success).toBe(true);
    });
  });

  describe("lang", () => {
    const withLang = ["journal", "themes", "about", "courses", "projects", "experience", "activities"];
    it.each(withLang)("%s aceita en e pt", (c) => {
      expect(parse(c, make(c, { lang: "en" })).success).toBe(true);
      expect(parse(c, make(c, { lang: "pt" })).success).toBe(true);
    });
    it.each(withLang.flatMap((c) => ["es", "EN", "PT", "pt-BR", ""].map((l) => [c, l] as const)))(
      "%s rejeita %j",
      (c, l) => {
        expect(parse(c, make(c, { lang: l })).success).toBe(false);
      },
    );
  });

  describe("strict, enum e tags", () => {
    it.each(collections)("%s: campo desconhecido (drfat) falha", (c) => {
      expect(parse(c, make(c, { drfat: true })).success).toBe(false);
    });
    it.each(collections)("%s: campos de e-mail e telefone não existem", (c) => {
      expect(parse(c, make(c, { email: "a@b.com" })).success).toBe(false);
      expect(parse(c, make(c, { phone: "+5511999999999" })).success).toBe(false);
    });
    it.each(["courses", "projects"])("%s: status aceita completed e in_progress", (c) => {
      expect(parse(c, make(c, { status: "completed" })).success).toBe(true);
      expect(parse(c, make(c, { status: "in_progress" })).success).toBe(true);
    });
    it.each(["courses", "projects"].flatMap((c) => ["concluído", "done", "Completed", ""].map((s) => [c, s] as const)))(
      "%s: status %j falha",
      (c, s) => {
        expect(parse(c, make(c, { status: s })).success).toBe(false);
      },
    );
    it("journal: tags [] falha, tags com string vazia falha", () => {
      expect(parse("journal", make("journal", { tags: [] })).success).toBe(false);
      expect(parse("journal", make("journal", { tags: [""] })).success).toBe(false);
    });
    it("projects: stack [] falha", () => {
      expect(parse("projects", make("projects", { stack: [] })).success).toBe(false);
    });
  });

  describe("opcionais, defaults e formatos", () => {
    it("journal: draft padrão é false", () => {
      const r = parse("journal", make("journal"));
      expect((r as any).data.draft).toBe(false);
    });
    it("journal: links precisa ser array de URL", () => {
      expect(parse("journal", make("journal", { links: ["https://example.com"] })).success).toBe(true);
      expect(parse("journal", make("journal", { links: ["not a url"] })).success).toBe(false);
    });
    it("journal: translation_of string opcional", () => {
      expect(parse("journal", make("journal", { translation_of: "2026-11-15-spec" })).success).toBe(true);
    });
    it("themes: slug precisa ser kebab-case", () => {
      expect(parse("themes", make("themes", { slug: "ok-slug-2" })).success).toBe(true);
      for (const s of ["Not Kebab", "snake_case", "UPPER", "-lead", "trail-", "a--b"]) {
        expect(parse("themes", make("themes", { slug: s })).success, s).toBe(false);
      }
    });
    it("courses: certificate_url inválida falha", () => {
      expect(parse("courses", make("courses", { certificate_url: "nope" })).success).toBe(false);
    });
    it("projects: url inválida falha", () => {
      expect(parse("projects", make("projects", { url: "nope" })).success).toBe(false);
    });
    it("about: linkedin_url inválida falha", () => {
      expect(parse("about", make("about", { linkedin_url: "nope" })).success).toBe(false);
    });
  });

  describe("about: photo e photo_alt", () => {
    it("photo sem photo_alt falha, nomeando photo_alt", () => {
      const r = parse("about", make("about", { photo: "/img/me.jpg" }));
      expect(r.success).toBe(false);
      expect(issuePaths(r)).toContain("photo_alt");
    });
    it("photo com photo_alt passa", () => {
      expect(parse("about", make("about", { photo: "/img/me.jpg", photo_alt: "Retrato" })).success).toBe(true);
    });
    it("sem photo passa (foto opcional)", () => {
      expect(parse("about", make("about")).success).toBe(true);
    });
    it("photo com photo_alt vazio falha", () => {
      expect(parse("about", make("about", { photo: "/img/me.jpg", photo_alt: "" })).success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Conteúdo real em disco: todo .md de src/content valida, e ui/*.json valida em uiSchema.
// ---------------------------------------------------------------------------
const contentRoot = path.resolve(__dirname, "../src/content");

function findFiles(dir: string, pattern: RegExp): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return findFiles(p, pattern);
    return e.isFile() && pattern.test(e.name) ? [p] : [];
  });
}
const findMarkdown = (dir: string) => findFiles(dir, /\.md$/);

const PER_LANG = ["activities", "courses", "experience", "projects"];
const mdFiles = findMarkdown(contentRoot);
const collectionOf = (f: string) => path.relative(contentRoot, f).split(path.sep)[0];

describe("validação > conteúdo em disco", () => {
  it("nenhum arquivo fixture-* sobrou em src/content", () => {
    expect(findFiles(contentRoot, /^fixture-/).map((f) => path.relative(contentRoot, f))).toEqual([]);
  });

  it.each(["about", "courses", "projects", "experience", "activities"])(
    "existe conteúdo real para %s",
    (c) => {
      const found = mdFiles.filter((f) => collectionOf(f) === c);
      expect(found.length, `nenhum src/content/${c}/**/*.md encontrado`).toBeGreaterThan(0);
    },
  );

  it.each(["en", "pt"])("about/%s.md existe e tem lang igual ao nome", (lang) => {
    const f = path.join(contentRoot, "about", `${lang}.md`);
    expect(fs.existsSync(f), `falta ${f}`).toBe(true);
    expect(matter(fs.readFileSync(f, "utf8")).data.lang).toBe(lang);
  });

  describe("todo .md de src/content valida no schema da sua coleção", () => {
    it("há ao menos um .md", () => {
      expect(mdFiles.length).toBeGreaterThan(0);
    });
    it.each(mdFiles.map((f) => [path.relative(contentRoot, f), f]))("%s", (_name, f) => {
      const c = collectionOf(f);
      expect(schemas[c], `coleção desconhecida: ${c}`).toBeDefined();
      const { data } = matter(fs.readFileSync(f, "utf8"));
      const r = schemas[c].safeParse(data);
      expect(r.success, JSON.stringify((r as any).error?.issues)).toBe(true);
    });
  });

  describe("lang bate com a pasta", () => {
    for (const lang of ["en", "pt"]) {
      it(`journal/${lang}/ contém só lang: ${lang} (pasta vazia ou ausente é aceita)`, () => {
        const found = findMarkdown(path.join(contentRoot, "journal", lang));
        for (const f of found) {
          expect(matter(fs.readFileSync(f, "utf8")).data.lang, f).toBe(lang);
        }
      });
    }

    for (const c of PER_LANG) {
      it(`${c}: todo .md está em ${c}/pt/ ou ${c}/en/ e o lang bate com a pasta`, () => {
        const files = findMarkdown(path.join(contentRoot, c));
        expect(files.length, `nenhum .md em src/content/${c}`).toBeGreaterThan(0);
        for (const f of files) {
          const [folder, ...rest] = path.relative(path.join(contentRoot, c), f).split(path.sep);
          expect(["en", "pt"], `${c}/${folder}: pasta de idioma esperada (pt ou en), sem subpastas`).toContain(folder);
          expect(rest.length, `${f}: sem subpastas dentro de ${c}/${folder}`).toBe(1);
          expect(matter(fs.readFileSync(f, "utf8")).data.lang, f).toBe(folder);
        }
      });
    }
  });

  describe("journal: nome do arquivo e pares de tradução", () => {
    const journal = findMarkdown(path.join(contentRoot, "journal")).map((f) => ({
      f,
      name: path.basename(f),
      lang: path.basename(path.dirname(f)),
      data: matter(fs.readFileSync(f, "utf8")).data,
    }));
    const iso = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v));

    it("nome do arquivo começa com a data: AAAA-MM-DD-slug.md", () => {
      for (const j of journal) {
        expect(j.name, j.f).toMatch(/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*\.md$/);
        expect(j.name.slice(0, 10), `${j.f}: date diferente do nome`).toBe(iso(j.data.date));
      }
    });

    it("pares (mesmo nome em pt/ e en/) têm a mesma date, as mesmas tags e os mesmos links", () => {
      for (const a of journal.filter((x) => x.lang === "pt")) {
        const b = journal.find((x) => x.lang === "en" && x.name === a.name);
        if (!b) continue;
        expect(iso(b.data.date), a.name).toBe(iso(a.data.date));
        expect(b.data.tags, `${a.name}: tags`).toEqual(a.data.tags);
        expect(b.data.links ?? [], `${a.name}: links`).toEqual(a.data.links ?? []);
        expect(Boolean(b.data.draft), `${a.name}: draft`).toBe(Boolean(a.data.draft));
      }
    });

    it("translation_of, quando existe, é o nome do par sem extensão e o par existe", () => {
      for (const j of journal.filter((x) => x.data.translation_of)) {
        const other = j.lang === "pt" ? "en" : "pt";
        const target = `${j.data.translation_of}.md`;
        expect(target, j.f).toBe(j.name);
        expect(journal.some((x) => x.lang === other && x.name === target), `${j.f}: sem o original em ${other}/`).toBe(true);
      }
    });
  });

  describe("espelho pt/en: mesmo nome de arquivo, mesmo draft", () => {
    const names = (c: string, lang: string) =>
      findMarkdown(path.join(contentRoot, c, lang)).map((f) => path.basename(f)).sort();
    const draftOf = (c: string, lang: string, n: string) =>
      matter(fs.readFileSync(path.join(contentRoot, c, lang, n), "utf8")).data.draft === true;

    for (const c of PER_LANG) {
      it(`${c}: pt/ e en/ têm os mesmos arquivos`, () => {
        expect(names(c, "en")).toEqual(names(c, "pt"));
      });
      it(`${c}: um arquivo e o seu espelho têm o mesmo estado de draft`, () => {
        for (const n of names(c, "pt")) {
          if (!fs.existsSync(path.join(contentRoot, c, "en", n))) continue;
          expect(draftOf(c, "en", n), `${c}/${n}: draft difere entre pt e en`).toBe(draftOf(c, "pt", n));
        }
      });
    }
  });
});

// ---------------------------------------------------------------------------
// uiSchema: sem contrato sobre as chaves; testado de forma genérica.
// ---------------------------------------------------------------------------
type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

// Todos os caminhos de chaves de objetos (recursivo, entrando em arrays).
function keyPaths(v: Json, prefix: (string | number)[] = []): (string | number)[][] {
  if (Array.isArray(v)) return v.flatMap((x, i) => keyPaths(x, [...prefix, i]));
  if (v && typeof v === "object") {
    return Object.entries(v).flatMap(([k, x]) => [[...prefix, k], ...keyPaths(x, [...prefix, k])]);
  }
  return [];
}
function without(v: Json, p: (string | number)[]): Json {
  const copy = structuredClone(v) as any;
  let node = copy;
  for (const k of p.slice(0, -1)) node = node[k];
  delete node[p[p.length - 1]];
  return copy;
}

const uiDir = path.join(contentRoot, "ui");
const uiFiles = findFiles(uiDir, /\.json$/);
const ptFile = path.join(uiDir, "pt.json");

describe("validação > uiSchema", () => {
  it("uiSchema é exportado de src/lib/schemas", () => {
    expect(uiSchema, "uiSchema não exportado").toBeDefined();
    expect(typeof uiSchema.safeParse).toBe("function");
  });

  it("src/content/ui/pt.json existe", () => {
    expect(fs.existsSync(ptFile)).toBe(true);
  });

  it.each(uiFiles.map((f) => [path.relative(contentRoot, f), f]))("%s valida em uiSchema", (_n, f) => {
    const r = uiSchema.safeParse(JSON.parse(fs.readFileSync(f, "utf8")));
    expect(r.success, JSON.stringify((r as any).error?.issues)).toBe(true);
  });

  const real: Json | undefined = fs.existsSync(ptFile) ? JSON.parse(fs.readFileSync(ptFile, "utf8")) : undefined;
  const paths = real ? keyPaths(real) : [];

  it("pt.json tem ao menos uma chave", () => {
    expect(paths.length).toBeGreaterThan(0);
  });

  it.each(paths.map((p) => [p.join(".")]))("remover a chave %s falha", (dotted) => {
    const p = paths.find((x) => x.join(".") === dotted)!;
    expect(uiSchema.safeParse(without(real!, p)).success).toBe(false);
  });

  it("chave desconhecida no topo falha (strict)", () => {
    expect(real).toBeDefined();
    expect(uiSchema.safeParse({ ...(real as object), chave_inexistente_xyz: "x" }).success).toBe(false);
  });

  it("objeto vazio falha", () => {
    expect(uiSchema.safeParse({}).success).toBe(false);
  });
});
