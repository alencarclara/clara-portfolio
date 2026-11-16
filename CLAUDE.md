# clara-portfolio

Site de currículo online em Astro (estático, conteúdo em markdown validado), bilíngue EN/PT, com Journal (calendário e temas), páginas de Atividades, Estágios e Pesquisa, Cursos e Projetos. Publicação pelo Pages CMS e hospedagem no GitHub Pages. A spec completa será adicionada em docs/spec.md; a versão 1 é o site sem o jogo.

## Stack and commands
- Stack: Node (Astro)
- Install: `npm install`
- Run: `npm run dev`
- Test: `npm test` (vitest: content validation and published-entries helper). The globalSetup runs `astro build`, so the tests also cover the built pages (draft, email/phone, internal links, contrast). E2E (Playwright, theme toggle): `npm run test:e2e`; first time `npx playwright install chromium`. Build: `npm run build`.
- Lint: `npm run lint` (astro check); formatter deferred until after slice 1
- Read content only through `getPublished` in src/lib/published.ts (never call `getCollection` elsewhere), so `draft: true` stays hidden

## Conventions
- docs/spec.md is the source of truth. Content lives in src/content/ as markdown with frontmatter validated by schemas; components never hard-code text. EN and PT versions of each page mirror each other: one file per language in `src/content/<tipo>/pt|en/` (same name, `lang` matching the folder), routes under `/pt` and `/en`, links built with `localePath` (src/lib/i18n.ts), UI text via `getUi(lang)`. Mobile-first and keyboard-accessible.

## Never do
- commit secrets or .env files, put email/phone or any personal data in content or generated HTML, set draft to false on an entry without asking, change a content schema without updating the validation tests and docs/spec.md, build the game layer before version 1 is merged

## Working style
- Plan first for anything that touches more than 2 files.
- Make small, verifiable changes. Run the tests before saying something is done.
- Ask me only for decisions that are hard to undo. Otherwise pick the simplest option and say what you chose.
- When I correct a mistake, add a one-line rule under "Lessons".

## Lessons
(none yet)