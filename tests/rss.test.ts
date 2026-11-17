import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { buildRss } from "../src/lib/rss";
import { LANGS, HTML_LANG, dist, routeFile, pageHtml, tags, uiOf, journalResolved, type Lang } from "./helpers";
import path from "node:path";

const feedFile = (lang: Lang) => path.join(dist, lang, "journal", "rss.xml");
const feed = (lang: Lang) => fs.readFileSync(feedFile(lang), "utf8");
const items = (xml: string) => [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
const field = (xml: string, tag: string) => xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1];

describe("buildRss (puro)", () => {
  const base = { title: "T & <J>", description: "D", link: "https://x.test/pt/journal", selfUrl: "https://x.test/pt/journal/rss.xml", language: "pt-BR" };
  const it1 = { title: "A", link: "https://x.test/d/1", date: "2026-11-14", description: "a" };
  const it2 = { title: "B & <b>", link: "https://x.test/d/2", date: "2026-11-15", description: 'x "y" \'z\'' };

  it("escapa &, < e > no texto e declara XML, RSS 2.0 e atom", () => {
    const xml = buildRss({ ...base, items: [it2] });
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(xml).toContain("<title>T &amp; &lt;J&gt;</title>");
    expect(xml).toContain("<title>B &amp; &lt;b&gt;</title>");
    expect(xml).not.toMatch(/<title>[^<]*[&](?!amp;|lt;|gt;|quot;|apos;)/);
  });
  it("itens da mais nova para a mais antiga, com guid, link e pubDate RFC 822", () => {
    const xml = buildRss({ ...base, items: [it1, it2] });
    const its = items(xml);
    expect(its).toHaveLength(2);
    expect(field(its[0], "title")).toContain("B");
    expect(field(its[0], "pubDate")).toBe("Sun, 15 Nov 2026 12:00:00 GMT");
    expect(field(its[0], "guid")).toBe("https://x.test/d/2");
    expect(field(its[1], "link")).toBe("https://x.test/d/1");
  });
  it("tem language e atom:link self; sem itens continua válido", () => {
    const xml = buildRss({ ...base, items: [] });
    expect(field(xml, "language")).toBe("pt-BR");
    expect(xml).toContain('<atom:link href="https://x.test/pt/journal/rss.xml" rel="self" type="application/rss+xml"');
    expect(items(xml)).toHaveLength(0);
  });
});

describe.each(LANGS)("feeds gerados [%s]", (lang: Lang) => {
  const ui = uiOf(lang);
  const resolved = journalResolved(lang);

  it("existe /<lang>/journal/rss.xml e tem language certo", () => {
    expect(fs.existsSync(feedFile(lang)), "rss.xml ausente").toBe(true);
    expect(field(feed(lang), "language")).toBe(HTML_LANG[lang]);
  });
  it("um item por entrada publicada, apontando para a página do dia, do mais novo para o mais antigo", () => {
    const its = items(feed(lang));
    expect(its).toHaveLength(resolved.length);
    const dates = its.map((i) => new Date(field(i, "pubDate")!).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    for (const r of resolved) {
      const it = its.find((i) => field(i, "link")!.endsWith(`/${lang}/journal/day/${r.date}`) && field(i, "title")!.includes(r.entry.data.title.replace(/&/g, "&amp;")));
      expect(it, `${r.name}: item`).toBeDefined();
      expect(field(it!, "guid")).toBe(field(it!, "link"));
      expect(field(it!, "description")!.includes(ui.journal.untranslated), `${r.name}: aviso`).toBe(r.untranslated);
    }
  });
  it("todo link do feed é absoluto", () => {
    for (const m of feed(lang).matchAll(/<(?:link|guid)>([^<]+)</g)) expect(m[1]).toMatch(/^https?:\/\//);
  });
});

describe.each(LANGS)("descoberta [%s]", (lang: Lang) => {
  const ui = uiOf(lang);
  const rssHref = `/${lang}/journal/rss.xml`;
  const autodiscovery = (html: string) => tags(html, "link").filter((l) => l.attrs.type === "application/rss+xml");

  it("páginas do Journal têm <link rel=alternate type=rss> e link visível para o feed", () => {
    for (const r of [`/${lang}/journal`, `/${lang}/journal/themes`, ...journalResolved(lang).map((x) => `/${lang}/journal/day/${x.date}`)]) {
      const html = pageHtml(r);
      const links = autodiscovery(html);
      expect(links, `${r}: autodiscovery`).toHaveLength(1);
      expect(links[0].attrs.rel).toBe("alternate");
      expect((links[0].attrs.href ?? "").replace(/\/$/, "")).toBe(rssHref);
    }
    const idx = pageHtml(`/${lang}/journal`);
    expect(tags(idx, "a").some((a) => (a.attrs.href ?? "") === rssHref && ui.journal.rss && idx.includes(`>${ui.journal.rss}<`))).toBe(true);
  });
  it("outras páginas não anunciam o feed", () => {
    for (const r of [`/${lang}`, `/${lang}/courses`, `/${lang}/projects`]) expect(autodiscovery(pageHtml(r)), r).toHaveLength(0);
  });
  it("a rota do feed existe", () => expect(routeFile(rssHref) ?? (fs.existsSync(feedFile(lang)) ? "ok" : null)).not.toBeNull());
});
