import type { Lang } from "./i18n";

// Datas AAAA-MM-DD (já normalizadas pelos schemas) sem passar por Date: sem efeito de fuso.
export function monthYear(iso: string, months: string[]): string {
  const [y, m] = iso.split("-");
  return `${months[Number(m) - 1]} ${y}`;
}

export function dayMonth(iso: string, lang: Lang = "pt"): string {
  const [, m, d] = iso.split("-");
  return lang === "en" ? `${m}/${d}` : `${d}/${m}`;
}

// "ago 2024 – jan 2026"; início = fim mostra só um mês; sem fim = em andamento.
export function period(start: string, end: string | undefined, months: string[], present: string): string {
  const a = monthYear(start, months);
  if (end === undefined) return `${a} – ${present}`;
  const b = monthYear(end, months);
  return a === b ? a : `${a} – ${b}`;
}
