// RSS 2.0 puro (sem imports do Astro, para o vitest carregar). Texto escapado; datas ao meio-dia UTC.
export interface RssItem { title: string; link: string; date: string; description: string }
export interface RssFeed { title: string; description: string; link: string; selfUrl: string; language: string; items: RssItem[] }

export const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const rfc822 = (date: string) => new Date(`${date}T12:00:00Z`).toUTCString();

export function buildRss(feed: RssFeed): string {
  const items = [...feed.items]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (i) => `    <item>
      <title>${escapeXml(i.title)}</title>
      <link>${escapeXml(i.link)}</link>
      <guid>${escapeXml(i.link)}</guid>
      <pubDate>${rfc822(i.date)}</pubDate>
      <description>${escapeXml(i.description)}</description>
    </item>`,
    );
  const newest = feed.items.map((i) => i.date).sort().pop();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feed.title)}</title>
    <link>${escapeXml(feed.link)}</link>
    <description>${escapeXml(feed.description)}</description>
    <language>${escapeXml(feed.language)}</language>
${newest ? `    <lastBuildDate>${rfc822(newest)}</lastBuildDate>\n` : ""}    <atom:link href="${escapeXml(feed.selfUrl)}" rel="self" type="application/rss+xml" />
${items.join("\n")}
  </channel>
</rss>
`;
}
