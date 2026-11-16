// Schemas Zod puros. Não importar nada do runtime do Astro além de `astro/zod`,
// para que o vitest consiga carregar este arquivo.
import { z } from "astro/zod";

const text = z.string().min(1);
const textList = z.array(text);
const url = z.url();
const lang = z.enum(["en", "pt"]);
const status = z.enum(["completed", "in_progress"]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(s: string): boolean {
  if (!ISO_DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// YAML sem aspas vira Date (UTC); aceita Date ou string e normaliza para AAAA-MM-DD.
const date = z
  .union([z.date(), z.string()])
  .transform((v) => (v instanceof Date ? (Number.isNaN(v.getTime()) ? "invalid" : v.toISOString().slice(0, 10)) : v))
  .refine(isRealDate, { message: "data inválida, use AAAA-MM-DD" });

const order =
  (from: string, to: string) =>
  (v: Record<string, unknown>, ctx: { addIssue: (i: { code: "custom"; path: string[]; message: string }) => void }) => {
    const a = v[from] as string | undefined;
    const b = v[to] as string | undefined;
    if (a && b && b < a) ctx.addIssue({ code: "custom", path: [to], message: `${to} deve ser >= ${from}` });
  };

export const journalSchema = z
  .object({
    date,
    lang,
    title: text,
    did: text,
    learned: text,
    tags: textList.min(1),
    draft: z.boolean().default(false),
    links: z.array(url).optional(),
    translation_of: text.optional(),
  })
  .strict();

export const themesSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug deve ser kebab-case"),
    lang,
    title: text,
    summary: text.optional(),
  })
  .strict();

export const coursesSchema = z
  .object({
    lang,
    title: text,
    provider: text,
    status,
    progress: z.number().int().min(0).max(100),
    updated_at: date,
    started_at: date.optional(),
    finished_at: date.optional(),
    url: url.optional(),
    certificate_url: url.optional(),
    notes: text.optional(),
    translation_of: text.optional(),
  })
  .strict()
  .superRefine(order("started_at", "finished_at"));

export const projectsSchema = z
  .object({
    lang,
    title: text,
    status,
    role: text,
    stack: textList.min(1),
    summary: text,
    period: text,
    url: url.optional(),
    screenshot: text.optional(),
    outcome: text.optional(),
    draft: z.boolean().default(false),
    translation_of: text.optional(),
  })
  .strict();

export const experienceSchema = z
  .object({
    lang,
    org: text,
    role: text,
    start: date,
    end: date.optional(),
    summary: text,
    highlights: textList.optional(),
    tools: textList.optional(),
    draft: z.boolean().default(false),
    translation_of: text.optional(),
  })
  .strict()
  .superRefine(order("start", "end"));

export const activitiesSchema = z
  .object({
    lang,
    org: text,
    role: text,
    start: date,
    end: date.optional(),
    summary: text,
    highlights: textList.optional(),
    draft: z.boolean().default(false),
    translation_of: text.optional(),
  })
  .strict()
  .superRefine(order("start", "end"));

export const aboutSchema = z
  .object({
    lang,
    title: text,
    cta_label: text,
    linkedin_url: url,
    photo: text.optional(),
    photo_alt: text.optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.photo && !v.photo_alt) {
      ctx.addIssue({ code: "custom", path: ["photo_alt"], message: "photo_alt é obrigatório quando há photo" });
    }
  });

// Textos de interface (src/content/ui/<lang>.json). Nenhum componente guarda texto próprio.
const pageText = z.object({ title: text, intro: text }).strict();

export const uiSchema = z
  .object({
    site: z.object({ name: text, skip: text }).strict(),
    nav: z
      .object({ label: text, home: text, activities: text, experience: text, courses: text, projects: text, journal: text })
      .strict(),
    theme: z.object({ toLight: text, toDark: text, label: text }).strict(),
    langSwitch: z.object({ label: text, text, name: text }).strict(),
    home: z.object({ whoami: text, pages: text, contact: text }).strict(),
    pages: z
      .object({
        activities: pageText,
        experience: pageText,
        courses: pageText,
        projects: pageText.extend({ empty: text }).strict(),
        journal: pageText.extend({ soon: text }).strict(),
      })
      .strict(),
    labels: z
      .object({
        present: text,
        updated: text,
        inProgress: text,
        completed: text,
        highlights: text,
        tools: text,
        stack: text,
        role: text,
        visit: text,
      })
      .strict(),
    months: z.array(text).length(12),
    footer: z.object({ branch: text, lang: text, built: text }).strict(),
  })
  .strict();
