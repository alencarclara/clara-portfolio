// Lógica pura do Journal (sem imports do Astro, para o vitest carregar).
type Base = { id: string; data: { date: string } };

const basename = (id: string) => id.split("/").pop()!;
const byDateThenName = (a: Base, b: Base) =>
  a.data.date.localeCompare(b.data.date) || basename(a.id).localeCompare(basename(b.id));

// "Machine Learning" -> "machine-learning"; sem acento, minúsculas, hífens simples.
export function tagSlug(tag: string): string {
  return tag
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Semanas (domingo primeiro) de um mês (1 a 12); células fora do mês são null.
export function monthGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function groupByDay<T extends Base>(entries: T[]): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const e of [...entries].sort(byDateThenName)) out.set(e.data.date, [...(out.get(e.data.date) ?? []), e]);
  return out;
}

export function monthsWithEntries(entries: Base[]): string[] {
  return [...new Set(entries.map((e) => e.data.date.slice(0, 7)))].sort();
}

// Um tema por slug de tag; entradas da mais nova para a mais antiga.
export function entriesByTheme<T extends Base & { data: { tags: string[] } }>(entries: T[]) {
  const map = new Map<string, T[]>();
  for (const e of entries) {
    for (const slug of new Set(e.data.tags.map(tagSlug))) map.set(slug, [...(map.get(slug) ?? []), e]);
  }
  return [...map.entries()]
    .map(([slug, list]) => ({ slug, entries: [...list].sort((a, b) => byDateThenName(b, a)) }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

// Um resultado por par (mesmo nome de arquivo em pt/ e en/): a versão do idioma ou a original.
export function resolveForLang<T extends Base & { data: { lang: string } }>(entries: T[], lang: string) {
  const groups = new Map<string, T[]>();
  for (const e of entries) groups.set(basename(e.id), [...(groups.get(basename(e.id)) ?? []), e]);
  return [...groups.values()]
    .map((list) => {
      const own = list.find((e) => e.data.lang === lang);
      const entry = own ?? [...list].sort((a, b) => a.id.localeCompare(b.id))[0];
      return { ...entry, untranslated: !own };
    })
    .sort(byDateThenName);
}

// "15 de novembro de 2026" (pt) ou "November 15, 2026" (en).
export function longDate(iso: string, monthNames: string[], lang: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return lang === "en" ? `${monthNames[m - 1]} ${d}, ${y}` : `${d} de ${monthNames[m - 1]} de ${y}`;
}

// "15 de novembro" (pt) ou "November 15" (en), para o aria-label dos dias.
export function dayMonthName(day: number, month: number, monthNames: string[], lang: string): string {
  return lang === "en" ? `${monthNames[month - 1]} ${day}` : `${day} de ${monthNames[month - 1]}`;
}
