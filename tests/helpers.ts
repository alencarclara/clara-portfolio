import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const root = path.resolve(__dirname, "..");
export const dist = path.join(root, "dist");
export const contentRoot = path.join(root, "src/content");

export const ROUTES = ["/", "/activities", "/experience", "/courses", "/projects", "/journal"] as const;
export const PAGE_ROUTES = ROUTES.filter((r) => r !== "/");

export function walk(dir: string, pattern: RegExp): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p, pattern);
    return pattern.test(e.name) ? [p] : [];
  });
}

export const allHtml = () => walk(dist, /\.html$/);
export const allCss = () => walk(dist, /\.css$/);
export const read = (f: string) => fs.readFileSync(f, "utf8");

/** Arquivo em dist/ para uma rota (aceita /rota/index.html e /rota.html). */
export function routeFile(route: string): string | null {
  const clean = route.replace(/^\/+|\/+$/g, "");
  const candidates = clean === "" ? ["index.html"] : [`${clean}/index.html`, `${clean}.html`];
  for (const c of candidates) {
    const f = path.join(dist, c);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

export function pageHtml(route: string): string {
  const f = routeFile(route);
  if (!f) throw new Error(`dist não tem página para ${route} (build falhou ou rota ausente)`);
  return read(f);
}

const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", middot: "·", ndash: "–", mdash: "—" };
export function decode(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}

/** Texto visível aproximado: sem script/style/tags, entidades decodificadas, espaços normalizados. */
export function textOf(html: string): string {
  return decode(
    html
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \s]+/g, " ")
    .trim();
}

export const norm = (s: string) => s.replace(/[ \s]+/g, " ").trim();

/** Atributos de uma tag de abertura como objeto. */
export function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return out;
}

export function tags(html: string, name: string): { tag: string; attrs: Record<string, string>; index: number }[] {
  const re = new RegExp(`<${name}\\b[^>]*>`, "gi");
  return [...html.matchAll(re)].map((m) => ({ tag: m[0], attrs: attrs(m[0]), index: m.index! }));
}

/** HTML interno do elemento com o id dado (contagem de abre/fecha da mesma tag). */
export function elementById(html: string, id: string): string | null {
  const open = new RegExp(`<([a-zA-Z0-9]+)\\b[^>]*\\bid=["']?${id}["']?[^>]*>`, "i").exec(html);
  if (!open) return null;
  const name = open[1];
  const re = new RegExp(`<(/?)${name}\\b[^>]*>`, "gi");
  re.lastIndex = open.index + open[0].length;
  let depth = 1;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(open.index + open[0].length, m.index);
  }
  return html.slice(open.index + open[0].length);
}

// ---- conteúdo ----
export type Entry = { file: string; rel: string; collection: string; data: Record<string, any>; body: string };

export function contentEntries(): Entry[] {
  return walk(contentRoot, /\.md$/).map((file) => {
    const m = matter(fs.readFileSync(file, "utf8"));
    const rel = path.relative(contentRoot, file);
    return { file, rel, collection: rel.split(path.sep)[0], data: m.data, body: m.content };
  });
}
export const publishedOf = (collection: string) =>
  contentEntries().filter((e) => e.collection === collection && e.data.draft !== true);

export function isoDate(v: unknown): string {
  return v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
}
