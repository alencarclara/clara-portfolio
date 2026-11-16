import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
// NOTE: src/lib/published.ts must NOT import "astro:content" at top level, or vitest
// cannot load it (that virtual module only exists inside Astro). getPublished must use
// a dynamic `await import("astro:content")` inside the function body only.
import { isPublished, filterPublished } from "../src/lib/published";

const srcRoot = path.resolve(__dirname, "../src");

describe("publicados", () => {
  describe("exclui rascunhos", () => {
    const entries = [
      { id: "a", data: { draft: true } },
      { id: "b", data: { draft: false } },
      { id: "c", data: {} },
    ];

    it("isPublished: true/false/ausente", () => {
      expect(isPublished({ id: "a", data: { draft: true } })).toBe(false);
      expect(isPublished({ id: "b", data: { draft: false } })).toBe(true);
      expect(isPublished({ id: "c", data: {} })).toBe(true);
    });

    it("filterPublished remove draft: true e mantém false e ausente, na ordem", () => {
      expect(filterPublished(entries).map((e) => e.id)).toEqual(["b", "c"]);
    });

    it("filterPublished não muta a entrada e aceita lista vazia", () => {
      const copy = [...entries];
      filterPublished(entries);
      expect(entries).toEqual(copy);
      expect(filterPublished([])).toEqual([]);
    });
  });

  describe("rascunho lido de arquivo de teste (tests/fixtures, fora de src/content)", () => {
    it("fica fora do resultado de filterPublished", () => {
      const dir = path.resolve(__dirname, "fixtures");
      const names = fs.readdirSync(dir).filter((n) => n.endsWith(".md"));
      const entries = names.map((n) => ({
        id: n.replace(/\.md$/, ""),
        data: matter(fs.readFileSync(path.join(dir, n), "utf8")).data as { draft?: boolean },
      }));
      const drafts = entries.filter((e) => e.data.draft === true);
      expect(drafts.length, "nenhum arquivo com draft: true em tests/fixtures").toBeGreaterThan(0);
      const out = filterPublished(entries).map((e) => e.id);
      for (const d of drafts) expect(out).not.toContain(d.id);
      expect(out.length, "deve sobrar ao menos um publicado").toBeGreaterThan(0);
    });
  });

  describe("getCollection só via helper", () => {
    function walk(dir: string): string[] {
      return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) return walk(p);
        return /\.(ts|tsx|js|jsx|mjs|cjs|astro|mdx)$/.test(e.name) ? [p] : [];
      });
    }
    it("nenhum arquivo em src/ além de src/lib/published.ts menciona getCollection", () => {
      const helper = path.join(srcRoot, "lib/published.ts");
      expect(fs.existsSync(helper), "src/lib/published.ts não existe").toBe(true);
      const offenders = walk(srcRoot)
        .filter((f) => f !== helper)
        .filter((f) => /\bgetCollection\b/.test(fs.readFileSync(f, "utf8")))
        .map((f) => path.relative(srcRoot, f));
      expect(offenders).toEqual([]);
    });
    it("published.ts de fato usa getCollection (o helper é o ponto único)", () => {
      const helper = path.join(srcRoot, "lib/published.ts");
      expect(fs.existsSync(helper)).toBe(true);
      expect(fs.readFileSync(helper, "utf8")).toMatch(/\bgetCollection\b/);
    });
  });
});
