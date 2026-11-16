import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import {
  journalSchema, themesSchema, coursesSchema, projectsSchema, experienceSchema, activitiesSchema, aboutSchema,
} from "../src/lib/schemas";
import { root, contentRoot, LANGS } from "./helpers";

const file = path.join(root, ".pages.yml");
const cfg = fs.existsSync(file) ? parse(fs.readFileSync(file, "utf8")) : null;
const collections: any[] = cfg?.content ?? [];

const FOLDER_TYPES = { journal: journalSchema, themes: themesSchema, courses: coursesSchema, projects: projectsSchema, experience: experienceSchema, activities: activitiesSchema } as const;

const keysOf = (schema: any) => Object.keys(schema.shape);
const requiredOf = (schema: any) => keysOf(schema).filter((k) => !schema.shape[k].safeParse(undefined).success);
const fieldNames = (c: any) => (c.fields ?? []).map((f: any) => f.name).filter((n: string) => n !== "body");
const requiredFields = (c: any) => (c.fields ?? []).filter((f: any) => f.required && f.name !== "body").map((f: any) => f.name);

describe(".pages.yml", () => {
  it("existe, é YAML válido e tem content", () => {
    expect(cfg, ".pages.yml ausente").not.toBeNull();
    expect(Array.isArray(cfg.content) && cfg.content.length > 0).toBe(true);
  });

  it("nomes de coleção únicos e todo path existe no repo", () => {
    const names = collections.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const c of collections) expect(fs.existsSync(path.join(root, c.path)), `${c.name}: ${c.path}`).toBe(true);
  });

  describe.each(Object.entries(FOLDER_TYPES))("%s", (type, schema) => {
    it.each(LANGS)("coleção %s-%s: pasta certa, campos e obrigatórios batem com o schema", (lang) => {
      const c = collections.find((x) => x.name === `${type}-${lang}`);
      expect(c, `falta coleção ${type}-${lang}`).toBeDefined();
      expect(c.type).toBe("collection");
      expect(path.normalize(c.path)).toBe(path.normalize(`src/content/${type}/${lang}`));
      expect(c.format ?? "yaml-frontmatter").toBe("yaml-frontmatter");
      expect(fieldNames(c).sort()).toEqual(keysOf(schema).sort());
      expect(requiredFields(c).sort()).toEqual(requiredOf(schema).sort());
      const l = c.fields.find((f: any) => f.name === "lang");
      expect(l.type).toBe("select");
      expect(l.default).toBe(lang);
      expect(l.options.values).toEqual([lang]);
    });
  });

  describe("about", () => {
    it.each(LANGS)("about-%s: arquivo único, campos e obrigatórios batem com o schema", (lang) => {
      const c = collections.find((x) => x.name === `about-${lang}`);
      expect(c, `falta about-${lang}`).toBeDefined();
      expect(c.type).toBe("file");
      expect(path.normalize(c.path)).toBe(path.normalize(`src/content/about/${lang}.md`));
      expect(fieldNames(c).sort()).toEqual(keysOf(aboutSchema).sort());
      expect(requiredFields(c).sort()).toEqual(requiredOf(aboutSchema).sort());
      expect((c.fields as any[]).some((f) => f.name === "body")).toBe(true);
    });
  });

  it("journal: arquivo novo recebe nome com a data", () => {
    const c = collections.find((x) => x.name === "journal-pt");
    const tpl = typeof c.filename === "string" ? c.filename : c.filename?.template;
    expect(tpl).toMatch(/\{year\}-\{month\}-\{day\}/);
  });

  it("nenhum campo de imagem grava caminho público (photo e screenshot são texto)", () => {
    for (const c of collections) for (const f of c.fields ?? []) {
      if (f.name === "photo" || f.name === "screenshot") expect(f.type, `${c.name}.${f.name}`).toBe("string");
    }
  });

  it("sem e-mail ou telefone no arquivo", () => {
    const t = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    expect(t).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(t).not.toMatch(/\+?\d{2}[\s-]?\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}/);
  });
});
