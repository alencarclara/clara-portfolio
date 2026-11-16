import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import {
  journalSchema,
  themesSchema,
  coursesSchema,
  projectsSchema,
  experienceSchema,
  activitiesSchema,
  aboutSchema,
  uiSchema,
} from "./lib/schemas";

const data = (name: string) => glob({ pattern: "**/*.json", base: `./src/content/${name}` });
const md = (name: string) => glob({ pattern: "**/*.md", base: `./src/content/${name}` });

export const collections = {
  journal: defineCollection({ loader: md("journal"), schema: journalSchema }),
  themes: defineCollection({ loader: md("themes"), schema: themesSchema }),
  courses: defineCollection({ loader: md("courses"), schema: coursesSchema }),
  projects: defineCollection({ loader: md("projects"), schema: projectsSchema }),
  experience: defineCollection({ loader: md("experience"), schema: experienceSchema }),
  activities: defineCollection({ loader: md("activities"), schema: activitiesSchema }),
  about: defineCollection({ loader: md("about"), schema: aboutSchema }),
  ui: defineCollection({ loader: data("ui"), schema: uiSchema }),
};
