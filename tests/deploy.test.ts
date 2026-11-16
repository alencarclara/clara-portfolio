import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { parse } from "yaml";
import { root, walk, tags } from "./helpers";

const SITE = "https://alencarclara.github.io";
const BASE = "/clara-portfolio";
const out = fs.mkdtempSync(path.join(os.tmpdir(), "clara-deploy-"));
const pages = () => walk(out, /\.html$/);
const rel = (f: string) => "/" + path.relative(out, f).replace(/index\.html$/, "").replace(/\.html$/, "").replace(/\/$/, "");

beforeAll(() => {
  // O vitest define BASE_URL="/" no ambiente; herdado, ele vence o base da config.
  const env: NodeJS.ProcessEnv = { ...process.env, SITE, BASE_PATH: BASE };
  delete env.BASE_URL;
  execSync(`npx astro build --outDir ${JSON.stringify(out)}`, { cwd: root, env, stdio: "pipe" });
}, 240_000);

describe("build de deploy (SITE e BASE_PATH)", () => {
  it("gera páginas", () => expect(pages().length).toBeGreaterThan(20));

  it("todo href/src que começa com / leva o base", () => {
    for (const f of pages()) {
      const html = fs.readFileSync(f, "utf8");
      for (const m of html.matchAll(/\b(?:href|src)="(\/[^"]*)"/g)) {
        if (m[1].startsWith("//")) continue;
        expect(m[1] === BASE || m[1].startsWith(`${BASE}/`), `${rel(f)}: ${m[1]}`).toBe(true);
      }
    }
  });

  it("páginas de idioma: canonical, alternate pt, en e x-default, todos absolutos e com base", () => {
    const langPages = pages().filter((f) => /^\/(pt|en)(\/|$)/.test(rel(f)));
    expect(langPages.length).toBeGreaterThan(20);
    for (const f of langPages) {
      const links = tags(fs.readFileSync(f, "utf8"), "link");
      const canonical = links.find((l) => l.attrs.rel === "canonical");
      expect(canonical?.attrs.href, `${rel(f)}: canonical`).toMatch(new RegExp(`^${SITE}${BASE}/(pt|en)(/|$)`));
      for (const h of ["pt", "en", "x-default"]) {
        const alt = links.find((l) => l.attrs.rel === "alternate" && l.attrs.hreflang === h);
        expect(alt?.attrs.href, `${rel(f)}: alternate ${h}`).toMatch(new RegExp(`^${SITE}${BASE}/`));
      }
      expect(links.find((l) => l.attrs.rel === "alternate" && l.attrs.hreflang === "x-default")!.attrs.href).toBe(`${SITE}${BASE}/`);
    }
  });

  it("a raiz tem os links de idioma com o base", () => {
    const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
    expect(html).toContain(`href="${BASE}/pt/"`);
    expect(html).toContain(`href="${BASE}/en/"`);
  });
});

describe(".github/workflows/deploy.yml", () => {
  const file = path.join(root, ".github/workflows/deploy.yml");
  const wf = fs.existsSync(file) ? parse(fs.readFileSync(file, "utf8")) : null;
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const uses = () => Object.values<any>(wf.jobs).flatMap((j) => (j.steps ?? []).map((s: any) => s.uses).filter(Boolean)) as string[];

  it("existe, dispara em push na main e manualmente", () => {
    expect(wf, "deploy.yml ausente").not.toBeNull();
    expect(wf.on.push.branches).toEqual(["main"]);
    expect(wf.on).toHaveProperty("workflow_dispatch");
  });
  it("permissões do Pages e ambiente github-pages", () => {
    expect(wf.permissions.pages).toBe("write");
    expect(wf.permissions["id-token"]).toBe("write");
    expect(JSON.stringify(wf.jobs)).toContain("github-pages");
  });
  it("usa configure, upload e deploy do Pages e define SITE e BASE_PATH no build", () => {
    for (const a of ["actions/configure-pages", "actions/upload-pages-artifact", "actions/deploy-pages"]) {
      expect(uses().some((u) => u.startsWith(a + "@")), a).toBe(true);
    }
    expect(text).toContain("SITE: https://alencarclara.github.io");
    expect(text).toContain("BASE_PATH: /clara-portfolio");
    expect(text).toMatch(/npm run build/);
  });
  it("sem e-mail, telefone ou segredo", () => {
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(text).not.toMatch(/secrets\.(?!GITHUB_TOKEN)/);
  });
});
