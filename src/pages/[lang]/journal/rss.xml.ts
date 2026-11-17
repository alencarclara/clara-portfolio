import type { APIContext } from "astro";
import { getUi } from "../../../lib/ui";
import { LANGS, htmlLang, localePath, type Lang } from "../../../lib/i18n";
import { getJournal } from "../../../lib/journal-data";
import { buildRss } from "../../../lib/rss";

export function getStaticPaths() {
  return LANGS.map((lang) => ({ params: { lang } }));
}

export async function GET({ params, site }: APIContext) {
  const lang = params.lang as Lang;
  const ui = await getUi(lang);
  const base = import.meta.env.BASE_URL;
  // Sem `site` (dev e testes) usa localhost só para o build não quebrar; o deploy define SITE.
  const origin = site ?? new URL("http://localhost:4321");
  const abs = (p: string) => new URL(p, origin).href;
  const items = (await getJournal(lang)).map((e) => ({
    title: e.data.title,
    link: abs(localePath(lang, `journal/day/${e.data.date}`, base)),
    date: e.data.date,
    description: [e.untranslated ? `(${ui.journal.untranslated})` : "", `${ui.journal.did}: ${e.data.did}`, `${ui.journal.learned}: ${e.data.learned}`].filter(Boolean).join(" "),
  }));
  const body = buildRss({
    title: `${ui.pages.journal.title} · ${ui.site.name}`,
    description: ui.pages.journal.intro,
    link: abs(localePath(lang, "journal", base)),
    selfUrl: abs(localePath(lang, "journal", base).replace(/\/?$/, "/") + "rss.xml"),
    language: htmlLang[lang],
    items,
  });
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
