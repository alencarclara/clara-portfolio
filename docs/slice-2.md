# Slice 2: páginas e conteúdo inicial

Branch: `feat/slice-2-paginas`. Fonte de verdade: `docs/spec.md` (seções "Direção visual", "Conteúdo inicial e pendências", "Modelo de conteúdo", "Testes e critérios de aceite").

## Objetivo

Home (foto, texto, botão "Saiba mais") e cinco páginas de conteúdo (Atividades, Estágios e Pesquisa, Cursos, Projetos, Journal placeholder) com o conteúdo real do spec, tema escuro/claro e fonte JetBrains Mono self-hosted, tudo sem a camada do jogo.

## Fora do escopo

Rotas EN/PT e troca de idioma (slice 3); calendário e temas do Journal (slice 4); Pages CMS (`.pages.yml`); deploy; jogo/mapa; RSS; Lighthouse; botão de baixar CV.

## Conteúdo (coleções da slice 1; apagar todos os `fixture-*`)

Datas do LinkedIn viram dia 01 e aparecem como mês/ano. Nenhum fato além da tabela "Conteúdo inicial"; cada `summary` tem 1 ou 2 frases reformulando esses fatos.

| Coleção    | Arquivo                              | Campos principais                                                                                                                                                 |
| ---------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| about      | `about/en.md`                        | texto oficial em EN do spec no corpo; `cta_label: "Learn more"`; `linkedin_url` (P9); `photo: clara.jpeg`; `photo_alt` (P8)                                       |
| about      | `about/pt.md`                        | tradução rascunhada para Clara revisar; `cta_label: "Saiba mais"`; mesmos `linkedin_url`, `photo`; é a única que a home renderiza                                 |
| activities | `integracao-ime.md`                  | Presidente; `2024-08-01` a `2026-01-01`; highlights: "12 eventos com PRIO, XP e Stone", "avaliação dos alunos +40%", "10 oportunidades diretas de estágio"        |
| activities | `stem-ime-girls-to-girls.md`         | Diretora de Gestão e Financeiro desde jan/2025, antes membro da equipe desde ago/2023; `2023-08-01` a `2026-06-01`; summary: calendário semestral e orçamento     |
| activities | `lepv.md`                            | Presidente e cofundadora; `start: 2026-01-01`, sem `end` (P3); highlights: "viagem a São Paulo com 11 membros e 11 empresas visitadas", "hackathon em preparação" |
| experience | `ilos.md`                            | Estagiária; `2025-07-01` a `2026-01-01`; análise e visualização de dados com R; `tools: [R]`                                                                      |
| experience | `prio.md`                            | Estagiária de verão (1 mês); `2025-01-01` a `2025-01-01`; software de RBI para válvulas, API 580/581                                                              |
| experience | `cnpq.md`                            | Bolsista; `2024-05-01` a `2025-01-01`; corrosão de implantes de Ti-6Al-4V                                                                                         |
| experience | `eb.md`                              | `draft: true`; só texto marcado "PLACEHOLDER: a confirmar", sem fato inventado                                                                                    |
| courses    | `ccna-1.md`                          | em andamento, `progress: 30`, `updated_at: 2026-11-15`                                                                                                            |
| courses    | `cs50.md`                            | em andamento, `progress: 1`, `updated_at: 2026-11-15`                                                                                                             |
| courses    | `machine-learning-specialization.md` | DeepLearning.AI e Stanford Online; 3 cursos, cerca de 95 h; em andamento, `progress: 0`, `updated_at: 2026-11-15`                                                 |
| projects   | `dra-karla.md`, `qhoras.md`          | `draft: true` até Clara responder (P9); qhoras = app de horário em grupo, com documentação própria                                                                |
| ui         | `ui/pt.json`                         | textos de interface (P2)                                                                                                                                          |

## Rotas

| Rota          | Página                                                                  | Fonte            |
| ------------- | ----------------------------------------------------------------------- | ---------------- |
| `/`           | Home; âncora `#paginas` lista as 5 páginas                              | `about/pt`, `ui` |
| `/activities` | Atividades Extracurriculares                                            | `activities`     |
| `/experience` | Estágios e Pesquisa                                                     | `experience`     |
| `/courses`    | Cursos (grupo "Concluídos" só se não vazio)                             | `courses`        |
| `/projects`   | Projetos (estado vazio vindo de `ui` se tudo for rascunho)              | `projects`       |
| `/journal`    | Placeholder: título e nota "em breve" de `ui`; sem lista nem calendário | `ui`             |

As URLs mudam na slice 3. Todas as páginas usam um layout único com cabeçalho (nav, botão de tema) e rodapé; todo conteúdo lido via `getPublished`.

## Critérios de aceite

| #   | Critério                                                                                                                                                                                                                                           | Teste                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1   | `npm run lint`, `npm test`, `npm run build` e `npm run test:e2e` passam; CI `check` roda os quatro                                                                                                                                                 | CI                                     |
| 2   | As 6 rotas existem em `dist/`, cada uma com `<html lang="pt-BR">`, um `<h1>` e um `<main>`                                                                                                                                                         | `paginas > rotas existem`              |
| 3   | Home tem `<img>` da foto com `alt` igual ao `photo_alt`, o texto do `about/pt` e um link "Saiba mais" com `href="#paginas"` que aponta para um elemento existente com 5 links                                                                      | `home > foto, texto e botão`           |
| 4   | Cada página mostra todas as entradas publicadas da coleção; as datas aparecem como "ago 2024 – jan 2026" e LEPV como "jan 2026 – atual"                                                                                                            | `paginas > conteúdo inicial`           |
| 5   | Cursos mostram "30% · atualizado em 15/11", "1% · atualizado em 15/11" e "0% · atualizado em 15/11"                                                                                                                                                | `cursos > progresso e data`            |
| 6   | Nenhum HTML em `dist/` contém o marcador do EB, de Karla ou de qhoras (enquanto `draft: true`)                                                                                                                                                     | `rascunhos > ausentes do dist`         |
| 7   | Nenhum HTML em `dist/` casa com regex de e-mail ou telefone, nem contém `mailto:` ou `tel:`                                                                                                                                                        | `sensíveis > dist sem e-mail/telefone` |
| 8   | Nenhuma referência a `fonts.googleapis.com` ou `fonts.gstatic.com`; as fontes JetBrains Mono 400 e 700 latin saem do próprio build (`@fontsource`)                                                                                                 | `visual > fonte self-hosted`           |
| 9   | O CSS tem os 7 tokens do spec nos dois temas (hex exatos), `border-radius` de 6 a 8 px, divisórias `dashed`, e nenhum `repeating-linear-gradient`, `text-shadow` ou `scanline`                                                                     | `visual > tokens e regras`             |
| 10  | Pares texto/fundo, secundário/fundo, acento/fundo e texto-sobre-acento/acento têm razão WCAG >= 4,5 nos dois temas (cálculo no teste)                                                                                                              | `visual > contraste`                   |
| 11  | Todo `<img>` tem `alt`; links internos de todas as páginas resolvem para arquivo em `dist/` ou âncora existente                                                                                                                                    | `paginas > alt e links internos`       |
| 12  | Sem valor salvo e sem JS, o tema é escuro (`data-theme="dark"` no HTML estático; sem `prefers-color-scheme`)                                                                                                                                       | `tema > padrão escuro`                 |
| 13  | Botão "[ light ]" troca para claro e passa a mostrar "[ dark ]"; escolha persiste após recarregar; funciona com `localStorage` bloqueado (sem exceção); sem overflow horizontal a 375 px nos dois temas; botão alcançável por Tab com foco visível | `e2e > tema` (Playwright)              |
| 14  | Rodapé em estilo barra de status, textos vindos de `ui`, sem e-mail/telefone                                                                                                                                                                       | coberto por 2, 7 e revisão visual      |
| 15  | Validação: `end` opcional em experience/activities (ausente aceito; presente < `start` falha); `uiSchema` estrito com chave faltando falhando; todo `.md` de `src/content` valida; `lang` bate com a pasta                                         | `validação > ...` (ajustados)          |

## Mudanças nos testes da slice 1

- `content-validation`: trocar a busca por `fixture-*` por todo `.md` em `src/content` (e `ui/*.json` pelo `uiSchema`). "Existe ao menos uma fixture" vira "existe conteúdo real" só para about, courses, projects, experience, activities. O teste `journal/{lang}` mantém a checagem de `lang` mas aceita pasta vazia. Remover `end` de `required` em experience/activities e acrescentar casos de `end` ausente.
- `published`: o caso "fixture de rascunho em disco" passa a usar dados em `tests/fixtures/` (fora de `src/content`) ou inline; a cobertura real vem do critério 6.
- Novo `tests/build.setup.ts` (vitest `globalSetup`) roda `astro build` uma vez; os testes de HTML leem `dist/`.

## Casos de borda

- `Intl` com `timeZone: "UTC"`, senão `2026-01-01` vira dez/2025 em fusos negativos.
- Sem `localStorage` (modo privado): script em `try/catch`, cai no escuro.
- Script inline no `<head>` define `data-theme` antes da pintura, sem flash.
- `journal/en` e `journal/pt` ficam vazios: confirmar que o loader `glob` não quebra o build (manter `.gitkeep` se preciso).
- Entrada com `draft: true` não aparece em nav, listas nem `<title>`.
- Foto: Image do `astro:assets` com `width`/`height` (sem layout shift); arquivo é `src/assets/clara.jpeg`.

## Perguntas em aberto e suposições

Marcadas **[APROVAR]** precisam de resposta de Clara antes de codar.

1. Idioma: sem i18n ainda; chrome e conteúdo em português; home renderiza só `about/pt`; `about/en` existe sem rota até a slice 3.
2. **[APROVAR]** Textos de interface em nova coleção `ui` (`src/content/ui/pt.json`, `uiSchema`). Mudança de schema: testes e `docs/spec.md` no mesmo PR.
3. **[APROVAR]** `end` opcional em experience e activities (ausente = em andamento; `end >= start` quando presente), por causa do LEPV. Alternativa não recomendada: data de término inventada.
4. Datas: mês do LinkedIn = dia 01 (tabela acima).
5. **[APROVAR]** Metodologias Ágeis fica de fora (só 3 cursos pedidos; provedor e progresso desconhecidos). Incluir?
6. "Saiba mais" aponta para `#paginas` (funciona sem JS); o mapa do jogo troca o alvo depois.
7. Journal: só placeholder.
8. **[APROVAR]** Foto: `photo: clara.jpeg` (não `.jpg`), resolvida em `src/assets`; sem mudança de schema. `photo_alt` proposto: "Retrato de Clara sorrindo, de braços cruzados, com a Baía de Guanabara e o Pão de Açúcar ao fundo". Confirmar o texto e que a foto pode ser publicada (repo público; o histórico do git a mantém).
9. **[APROVAR]** Bloqueios: (a) URL do LinkedIn (`linkedin_url` obrigatório; não publicar URL falsa); (b) Karla e qhoras: `role`, `stack`, `period`, `url`; (c) Karla com `draft: true` até Clara confirmar a autorização aqui (regra do CLAUDE.md); placeholders só em rascunho.
10. **[APROVAR]** Playwright (chromium) contra `astro preview`, `npm run test:e2e`, passo novo no CI com `npx playwright install --with-deps chromium`. Adiciona dependência e tempo de CI. Alternativa: teste jsdom do script do tema mais asserções estáticas de CSS (não prova ausência de overflow).
11. Extras além do pedido (Clara pode cortar): teste de links internos e teste de contraste.
12. Rodapé: rótulos tipo `main · pt · feito com Astro` vindos de `ui`.
13. Regras visuais: exatamente a tabela e as regras de "Direção visual"; acento só em links, botões e rótulos `$`; texto longo com largura máxima (~70ch) e entrelinha >= 1,6.
14. Atualizar `docs/spec.md` (coleção `ui`, `end` opcional, rotas) e `CLAUDE.md` (`test:e2e`) neste PR.

## Arquivos

```
src/layouts/Base.astro  src/components/{Header,Footer,ThemeToggle,EntryCard}.astro
src/pages/{index,activities,experience,courses,projects,journal}.astro
src/styles/global.css (tokens, @fontsource imports em Base)
src/lib/{schemas.ts,format.ts}  src/content.config.ts  src/content/**
tests/{build.setup.ts,pages.test.ts,visual.test.ts,sensitive.test.ts,fixtures/}  e2e/theme.spec.ts  playwright.config.ts
.github/workflows/ci-node.yml
```

## Plano de commits (testes primeiro)

1. `docs: spec da slice 2`.
2. `test+feat: end opcional e uiSchema` (schemas, testes, spec).
3. `chore: remove fixtures; testes validam todo o conteúdo` (ajusta os testes da slice 1).
4. `feat: conteúdo inicial` (about, activities, experience, courses, projects, ui).
5. `test: build setup e testes de dist` (2, 6, 7, 11 falhando).
6. `feat: layout, tema, fonte e páginas` (deixa 2 a 12 verdes).
7. `test: e2e do tema` e `ci: playwright`.
8. `docs: spec.md e CLAUDE.md`.

## Riscos

- Foto e Karla públicas no repo: confirmar antes do merge.
- "15 empresas" no texto oficial contra 11 do LinkedIn: Clara já decidiu manter; não mexer.
- Contraste medido pode reprovar um par (acento claro `#0B7C86` sobre `#FAFAF8` é o mais próximo do limite): ajustar o acento e registrar no spec.
- Playwright aumenta o tempo do CI (cabe nos 15 min do job).

## Respostas de Clara e decisões finais

Aprovada em 2026-11-15. Respostas dela: LinkedIn `https://www.linkedin.com/in/clara-alencar/`; Karla (`https://karlahematovet.com.br/`) e qhoras (`https://qhoras.onrender.com/`) com textos provisórios que ela ajusta depois; EB só com placeholder; usar a foto da pasta (`src/assets/clara.jpeg`). Os itens sem resposta seguem o padrão proposto acima (`end` opcional, coleção `ui`, Playwright, Metodologias Ágeis fora, `photo_alt` proposto, extras de links e contraste mantidos).

- Karla e qhoras ficam `draft: true`, mesmo com as URLs: os textos são provisórios (marcados `PLACEHOLDER`) e o CLAUDE.md proíbe tirar `draft` sem perguntar. Por isso `/projects` mostra o estado vazio vindo de `ui` até Clara revisar os textos e liberar.
- O critério 6 vale para qualquer entrada com `draft: true`: o teste lê o frontmatter de `src/content`, e o `summary` de cada rascunho não pode aparecer em `dist/`.
- Contrato para os testes: `html[data-theme]`, botão `#theme-toggle`, chave `localStorage` `theme`, `uiSchema` exportado de `src/lib/schemas.ts`, `src/content/ui/pt.json`.
