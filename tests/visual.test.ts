import { describe, it, expect } from "vitest";
import path from "node:path";
import { dist, allHtml, allCss, read, tags, walk, ROUTES, pageHtml } from "./helpers";

// Tabela de tokens do spec (docs/spec.md, "Direção visual").
const TOKENS = {
  dark: { bg: "#14141A", text: "#ECECF1", muted: "#9A9AA8", border: "#2A2A35", dashed: "#33333F", accent: "#B7A3F0", onAccent: "#14141A" },
  light: { bg: "#FAFAF8", text: "#1E1E24", muted: "#6A6A75", border: "#E4E2DD", dashed: "#D5D3CD", accent: "#0B7C86", onAccent: "#FAFAF8" },
} as const;

// CSS do build: arquivos .css de dist + blocos <style> inline.
function shippedCss(): string {
  const inline = allHtml().flatMap((f) => [...read(f).matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]));
  return [...allCss().map(read), ...inline].join("\n").toLowerCase();
}

// Regras planas "seletor{declarações}" (a mais interna, serve para @media/@layer).
function rules(css: string): { sel: string; body: string }[] {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
}
const themeSel = (name: "dark" | "light") => new RegExp(`data-theme\\s*=\\s*["']?${name}\\b`);

function hexesFor(css: string, theme: "dark" | "light"): Set<string> {
  const out = new Set<string>();
  for (const r of rules(css)) {
    const mentionsLight = themeSel("light").test(r.sel);
    const mentionsDark = themeSel("dark").test(r.sel);
    const applies = theme === "light" ? mentionsLight && !mentionsDark : mentionsDark || (/:root|\bhtml\b/.test(r.sel) && !mentionsLight);
    if (applies) for (const m of r.body.matchAll(/#[0-9a-f]{6}\b/g)) out.add(m[0]);
  }
  return out;
}

// WCAG 2.x
const lin = (c: number) => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("visual", () => {
  describe("fonte self-hosted", () => {
    it("nenhuma referência a fonts.googleapis.com ou fonts.gstatic.com em dist", () => {
      const files = [...allHtml(), ...allCss(), ...walk(dist, /\.js$/)];
      expect(files.length).toBeGreaterThan(0);
      for (const f of files) expect(read(f), path.relative(dist, f)).not.toMatch(/fonts\.(googleapis|gstatic)\.com/i);
    });

    it.each(["400", "700"])("JetBrains Mono %s latin sai do próprio build (@fontsource)", (w) => {
      const fonts = walk(dist, /\.woff2?$/).map((f) => path.basename(f).toLowerCase());
      expect(fonts.some((n) => n.startsWith(`jetbrains-mono-latin-${w}-`)), `fontes em dist: ${fonts.join(", ")}`).toBe(true);
    });

    it("o CSS declara @font-face de JetBrains Mono nos pesos 400 e 700 e usa a família", () => {
      const css = shippedCss();
      const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]).filter((b) => /jetbrains mono/.test(b));
      for (const w of ["400", "700"]) {
        expect(faces.some((b) => new RegExp(`font-weight:\\s*${w}\\b`).test(b)), `peso ${w}`).toBe(true);
      }
      expect(css).toMatch(/font-family:[^;}]*jetbrains mono/);
    });
  });

  describe("tokens e regras", () => {
    it("CSS de dist existe", () => {
      expect(shippedCss().trim().length).toBeGreaterThan(0);
    });

    for (const theme of ["dark", "light"] as const) {
      it(`os 7 tokens do tema ${theme} (hex exatos) estão no bloco do tema`, () => {
        const found = hexesFor(shippedCss(), theme);
        for (const [name, hex] of Object.entries(TOKENS[theme])) {
          expect(found.has(hex.toLowerCase()), `${theme}.${name} ${hex}; achados: ${[...found].join(" ")}`).toBe(true);
        }
      });
    }

    it("border-radius: todo valor em px fica entre 6 e 8 (0, 50% e 999px ficam de fora)", () => {
      const css = shippedCss();
      const decls = [...css.matchAll(/border-radius:\s*([^;}]+)/g)].map((m) => m[1].trim());
      expect(decls.length, "nenhum border-radius no CSS").toBeGreaterThan(0);
      const nums = decls.filter((d) => !/var\(/.test(d)).flatMap((d) => [...d.matchAll(/([\d.]+)px/g)].map((m) => Number(m[1])));
      expect(nums.some((n) => n >= 6 && n <= 8), `valores: ${decls.join(" | ")}`).toBe(true);
      for (const n of nums) {
        if (n === 0 || n === 999) continue;
        expect(n >= 6 && n <= 8, `border-radius ${n}px fora de 6 a 8`).toBe(true);
      }
    });

    it("divisórias são dashed", () => {
      expect(shippedCss()).toMatch(/\bdashed\b/);
    });

    it("sem repeating-linear-gradient, text-shadow ou scanline (CSS e HTML)", () => {
      const all = [shippedCss(), ...allHtml().map((f) => read(f).toLowerCase())];
      for (const s of all) expect(s).not.toMatch(/repeating-linear-gradient|text-shadow|scanline/);
    });
  });

  describe("contraste", () => {
    for (const theme of ["dark", "light"] as const) {
      const t = TOKENS[theme];
      const pairs: [string, string, string][] = [
        ["texto/fundo", t.text, t.bg],
        ["secundário/fundo", t.muted, t.bg],
        ["acento/fundo", t.accent, t.bg],
        ["texto-sobre-acento/acento", t.onAccent, t.accent],
      ];
      it.each(pairs)(`${theme}: %s >= 4,5`, (_n, fg, bg) => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
      });
    }

    it("a conta de contraste está certa (preto/branco = 21)", () => {
      expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    });
  });
});

describe("tema", () => {
  describe("padrão escuro", () => {
    it.each(ROUTES)("%s: <html data-theme=\"dark\"> no HTML estático", (route) => {
      expect(tags(pageHtml(route), "html")[0]?.attrs["data-theme"]).toBe("dark");
    });

    it("sem prefers-color-scheme no CSS nem no HTML", () => {
      expect(shippedCss()).not.toContain("prefers-color-scheme");
      for (const f of allHtml()) expect(read(f)).not.toContain("prefers-color-scheme");
    });

    it("script inline no <head> lê localStorage dentro de try/catch (sem flash)", () => {
      const head = /<head\b[\s\S]*?<\/head>/i.exec(pageHtml("/pt"))?.[0] ?? "";
      const inline = [...head.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
      expect(inline.some((s) => /localStorage/.test(s) && /\btry\b/.test(s) && /\bcatch\b/.test(s) && /data-theme|dataset\.theme/.test(s))).toBe(true);
    });
  });
});
