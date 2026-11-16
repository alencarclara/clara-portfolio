import { defineConfig } from "astro/config";

// SITE e BASE_PATH só existem no build de deploy (.github/workflows/deploy.yml).
// Sem elas: base "/" e links relativos, como no dev e nos testes.
export default defineConfig({
  ...(process.env.SITE ? { site: process.env.SITE } : {}),
  ...(process.env.BASE_PATH ? { base: process.env.BASE_PATH } : {}),
});
