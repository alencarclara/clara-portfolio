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
    title: "Intro to ML",
    provider: "Some Provider",
    status: "in_progress",
    progress: 62,
    updated_at: "2026-11-12",
  },
  projects: {
    title: "Portfolio",
    status: "in_progress",
    role: "Author",
    stack: ["Astro"],
    summary: "A site",
    period: "2025–2026",
  },
  experience: {
    org: "Org",
    role: "Intern",
    start: "2024-01-01",
    end: "2026-01-01",
    summary: "Did things",
  },
  activities: {
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
  courses: ["title", "provider", "status", "progress", "updated_at"],
  projects: ["title", "status", "role", "stack", "summary", "period"],
  experience: ["org", "role", "start", "end", "summary"],
  activities: ["org", "role", "start", "end", "summary"],
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

    it("courses: finished_at < started_at falha, igual ou maior passa", () => {
      expect(parse("courses", make("courses", { started_at: "2026-05-02", finished_at: "2026-05-01" })).success).toBe(false);
      expect(parse("courses", make("courses", { started_at: "2026-05-01", finished_at: "2026-05-01" })).success).toBe(true);
      expect(parse("courses", make("courses", { started_at: "2026-05-01", finished_at: "2026-06-01" })).success).toBe(true);
    });
  });

  describe("lang", () => {
    const withLang = ["journal", "themes", "about"];
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
// On-disk fixtures (criteria 2 and 6). These FAIL until src/content/**/fixture-*.md exist.
// ---------------------------------------------------------------------------
const contentRoot = path.resolve(__dirname, "../src/content");

function findMarkdown(dir: string, pattern = /\.md$/): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return findMarkdown(p, pattern);
    return e.isFile() && pattern.test(e.name) ? [p] : [];
  });
}
const findFixtures = (dir: string) => findMarkdown(dir, /^fixture-.*\.md$/);

const fixtures = findFixtures(contentRoot);
const collectionOf = (f: string) => path.relative(contentRoot, f).split(path.sep)[0];

describe("validação > fixtures em disco", () => {
  it.each(collections)("existe ao menos uma fixture para %s", (c) => {
    const found = fixtures.filter((f) => collectionOf(f) === c);
    expect(found.length, `nenhum src/content/${c}/**/fixture-*.md encontrado`).toBeGreaterThan(0);
  });

  it("journal tem fixtures em en e pt", () => {
    for (const lang of ["en", "pt"]) {
      const found = fixtures.filter((f) => f.startsWith(path.join(contentRoot, "journal", lang) + path.sep));
      expect(found.length, `nenhuma fixture em journal/${lang}`).toBeGreaterThan(0);
    }
  });

  describe("fixtures válidas passam", () => {
    it.each(fixtures.map((f) => [path.relative(contentRoot, f), f]))("%s", (_name, f) => {
      const c = collectionOf(f);
      expect(schemas[c], `coleção desconhecida: ${c}`).toBeDefined();
      const { data } = matter(fs.readFileSync(f, "utf8"));
      const r = schemas[c].safeParse(data);
      expect(r.success, JSON.stringify((r as any).error?.issues)).toBe(true);
    });
  });

  describe("lang bate com a pasta", () => {
    for (const lang of ["en", "pt"]) {
      it(`journal/${lang}/ contém só lang: ${lang}`, () => {
        // Todos os .md da pasta (não só fixtures): vale também para o conteúdo real.
        const dir = path.join(contentRoot, "journal", lang);
        const found = findMarkdown(dir);
        expect(found.length, `nenhum arquivo em journal/${lang}`).toBeGreaterThan(0);
        for (const f of found) {
          expect(matter(fs.readFileSync(f, "utf8")).data.lang, f).toBe(lang);
        }
      });
    }
  });
});
