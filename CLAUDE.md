# clara-portfolio

Site de currículo online em Astro (estático, conteúdo em markdown validado), bilíngue EN/PT, com Journal (calendário e temas), páginas de Atividades, Estágios e Pesquisa, Cursos e Projetos. Publicação pelo Pages CMS e hospedagem no GitHub Pages. A spec completa será adicionada em docs/spec.md; a versão 1 é o site sem o jogo.

## Stack and commands
- Stack: Node (Astro)
- Install: `npm install` (package.json is created in slice 1)
- Run: `npm run dev`
- Test: `npm test` (defined in slice 1: content validation, build, internal link check)
- Lint/format: `npm run check` (astro check); formatter to be decided in slice 1

## Conventions
- docs/spec.md is the source of truth. Content lives in src/content/ as markdown with frontmatter validated by schemas; components never hard-code text. EN and PT versions of each page mirror each other. Mobile-first and keyboard-accessible.

## Never do
- commit secrets or .env files, put email/phone or any personal data in content or generated HTML, set draft to false on an entry without asking, change a content schema without updating the validation tests and docs/spec.md, build the game layer before version 1 is merged

## Working style
- Plan first for anything that touches more than 2 files.
- Make small, verifiable changes. Run the tests before saying something is done.
- Ask me only for decisions that are hard to undo. Otherwise pick the simplest option and say what you chose.
- When I correct a mistake, add a one-line rule under "Lessons".

## Lessons
(none yet)