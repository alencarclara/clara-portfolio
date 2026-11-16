import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { dist, allHtml, read, textOf, contentEntries, contentRoot, walk } from "./helpers";

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+/;
// Telefone: +CC com dígitos, (DDD) número, DDD + 9XXXX-XXXX, ou 10+ dígitos seguidos.
const PHONES: [string, RegExp][] = [
  ["+código do país", /\+\d{1,3}[\s.-]?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/],
  ["(DDD) número", /\(\d{2}\)\s?9?\d{4}[\s.-]?\d{4}/],
  ["DDD 9XXXX-XXXX", /\b\d{2}[\s.-]?9\d{4}[\s.-]?\d{4}\b/],
  ["10+ dígitos seguidos", /(?<![\w.-])\d{10,}(?![\w.-])/],
];

describe("sensíveis", () => {
  describe("dist sem e-mail/telefone", () => {
    const files = allHtml();

    it("dist tem html", () => {
      expect(files.length).toBeGreaterThan(0);
    });

    it("nenhum html casa com e-mail", () => {
      for (const f of files) {
        const m = EMAIL.exec(read(f));
        expect(m?.[0], `${path.relative(dist, f)} contém e-mail`).toBeUndefined();
      }
    });

    it.each(PHONES)("nenhum html casa com telefone (%s)", (_n, re) => {
      for (const f of files) {
        const m = re.exec(read(f));
        expect(m?.[0], `${path.relative(dist, f)} contém telefone`).toBeUndefined();
      }
    });

    it("nenhum html contém mailto: ou tel:", () => {
      for (const f of files) {
        expect(read(f), path.relative(dist, f)).not.toMatch(/\b(mailto|tel):/i);
      }
    });

    it("nenhum arquivo de src/content contém e-mail", () => {
      for (const f of walk(contentRoot, /\.(md|json)$/)) {
        expect(EMAIL.exec(fs.readFileSync(f, "utf8"))?.[0], path.relative(contentRoot, f)).toBeUndefined();
      }
    });
  });
});

// Critério 6, genérico: vale para qualquer entrada com draft: true em src/content.
describe("rascunhos", () => {
  describe("ausentes do dist", () => {
    const drafts = contentEntries().filter((e) => e.data.draft === true);
    const html = allHtml().map((f) => ({ f: path.relative(dist, f), raw: read(f) }));
    const texts = html.map((h) => ({ ...h, text: textOf(h.raw) }));

    it("dist tem html para checar", () => {
      expect(html.length).toBeGreaterThan(0);
    });

    it("o marcador PLACEHOLDER não aparece em nenhum html de dist", () => {
      for (const h of html) expect(h.raw, h.f).not.toContain("PLACEHOLDER");
    });

    it.each(drafts.map((d) => [d.rel, d] as const))("%s: summary, title e url fora de dist", (_rel, d) => {
      const needles = ["summary", "title", "url"]
        .map((k) => d.data[k])
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
      for (const n of needles) {
        for (const h of texts) {
          expect(h.text.includes(n.trim()) || h.raw.includes(n.trim()), `${h.f} contém "${n}" de ${d.rel}`).toBe(false);
        }
      }
    });
  });
});
