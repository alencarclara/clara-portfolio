# Slice 1: esqueleto

Branch: `feat/slice-1-esqueleto`. Fonte de verdade dos campos: seção "Modelo de conteúdo" de `docs/spec.md`.

## Objetivo

Ter um projeto Astro (TypeScript strict) com as coleções de conteúdo validadas por Zod, testes de validação e CI rodando lint, testes e build, para que a slice 2 só precise colocar conteúdo real e páginas por cima.

## Dentro do escopo

- Scaffold Astro (template minimal), `tsconfig` strict, scripts `lint`, `test`, `build`.
- Schemas Zod e coleções: `journal` (EN/PT), `themes`, `courses`, `projects`, `experience`, `activities`, `about`.
- Uma fixture pequena por coleção (journal: um par EN/PT mais um rascunho), só para exercitar os schemas.
- Teste de validação de conteúdo e helper único de "publicado" (`getPublished`).
- CI: `npm run build --if-present` depois dos testes; job continua `check`.
- Atualizar comandos no `CLAUDE.md`.

## Fora do escopo

Páginas (além do placeholder do template), design, roteamento i18n, calendário do Journal, Pages CMS (`.pages.yml`), deploy, jogo, teste de links, RSS, teste de dados sensíveis no HTML, teste de troca de idioma, formatador de código.

## Campos por coleção

Todos os schemas são `.strict()` (campo desconhecido, como `drfat`, falha). Strings são não vazias. Datas são `AAAA-MM-DD` e precisam existir no calendário (`2026-02-30` falha). Arrays são de strings não vazias.

| Coleção      | Obrigatórios                                                                                                                     | Opcionais                                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `journal`    | `date` (data), `lang` (`en`\|`pt`), `title`, `did`, `learned` (strings), `tags` (array, mínimo 1)                                | `draft` (bool, padrão `false`), `links` (array de URL), `translation_of` (string, ver P6)                                        |
| `themes`     | `slug` (kebab-case), `lang` (`en`\|`pt`), `title`                                                                                | `summary` (string)                                                                                                               |
| `courses`    | `title`, `provider`, `status` (`completed`\|`in_progress`), `progress` (inteiro 0 a 100), `updated_at` (data)                    | `started_at`, `finished_at` (datas; `finished_at` >= `started_at`), `url`, `certificate_url` (URL), `notes`                      |
| `projects`   | `title`, `status` (mesmo enum de cursos), `role`, `stack` (array, mínimo 1), `summary`, `period` (texto livre, ex.: `2025–2026`) | `url` (URL), `screenshot` (caminho), `outcome`, `draft`                                                                          |
| `experience` | `org`, `role`, `start` (data), `end` (data, >= `start`), `summary`                                                               | `highlights` (array), `tools` (array), `draft`                                                                                   |
| `activities` | `org`, `role`, `start`, `end` (datas, `end` >= `start`), `summary`                                                               | `highlights` (array, números como texto), `draft`                                                                                |
| `about`      | `lang`, `title`, `cta_label` (texto do botão), `linkedin_url` (URL)                                                              | `photo` (caminho), `photo_alt` (obrigatório se `photo` existir), `draft` não existe aqui. Corpo markdown = texto de apresentação |

Nenhum campo de e-mail ou telefone em nenhum schema.

## Critérios de aceite

| #   | Critério                                                                                                                      | Verificação                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | `npm run lint`, `npm test` e `npm run build` terminam com código 0 num clone limpo após `npm ci`                              | CI job `check`                                                                    |
| 2   | Cada fixture válida passa no schema da sua coleção                                                                            | `validação > fixtures válidas passam`                                             |
| 3   | Remover qualquer campo obrigatório de cada coleção faz o schema falhar, nomeando o campo                                      | `validação > campo obrigatório ausente falha` (parametrizado por coleção e campo) |
| 4   | `progress` aceita 0 e 100; rejeita -1, 101, 62.5, `"62"`                                                                      | `validação > progress limites`                                                    |
| 5   | Datas inválidas (`2026-02-30`, `15/11/2026`, `2026-13-01`) falham; `end` < `start` e `finished_at` < `started_at` falham      | `validação > datas`                                                               |
| 6   | `lang` aceita só `en` e `pt` (`es`, `EN` falham); `lang` do frontmatter bate com a pasta (`journal/en/` contém só `lang: en`) | `validação > lang`                                                                |
| 7   | Campo desconhecido falha; `status` fora do enum falha; `tags: []` falha                                                       | `validação > strict, enum e tags`                                                 |
| 8   | Entrada com `draft: true` não está em `filterPublished(entries)`; sem `draft` conta como publicada                            | `publicados > exclui rascunhos`                                                   |
| 9   | A fixture de rascunho em disco fica fora do resultado de `filterPublished` ao ler `src/content/journal/en`                    | `publicados > fixture de rascunho em disco`                                       |
| 10  | Nenhum arquivo em `src/` além de `src/lib/published.ts` chama `getCollection` diretamente                                     | `publicados > getCollection só via helper`                                        |
| 11  | `npm run build` falha se uma fixture perder um campo obrigatório (conferido uma vez à mão na tarefa 5, sem teste permanente)  | comando manual                                                                    |
| 12  | `ci-node.yml` tem `npm run build --if-present` depois de `npm test --if-present`, job ainda chamado `check`                   | revisão do diff e execução do CI                                                  |

## Casos de borda e falhas

- YAML converte `2026-11-15` sem aspas em objeto `Date`; o schema deve aceitar tanto `Date` quanto string e normalizar para `AAAA-MM-DD`, e ainda rejeitar datas impossíveis. Testar os dois formatos.
- `draft` ausente = publicado. `courses` e `about` não têm `draft` no spec, então o helper trata campo ausente como publicado.
- `schemas.ts` não pode importar nada que dependa do runtime do Astro, senão o vitest não o carrega.
- O placeholder `src/pages/index.astro` do template não pode conter texto de conteúdo; é só para o build passar. A slice 2 o substitui.
- Fixtures não contêm dado pessoal real. Nome com prefixo `fixture-` para a slice 2 apagar por busca.

## Notas de design

Arquivos:

```
astro.config.mjs, tsconfig.json (extends astro/tsconfigs/strict), vitest.config.ts, package.json
src/content.config.ts        coleções com loader glob + schemas
src/lib/schemas.ts           schemas Zod puros (importados pela config e pelos testes)
src/lib/published.ts         isPublished, filterPublished, getPublished(collection)
src/content/journal/{en,pt}/fixture-*.md   (en, pt com translation_of, en com draft: true)
src/content/{themes,courses,projects,experience,activities,about}/fixture-*.md
tests/content-validation.test.ts, tests/published.test.ts
```

Interface do helper: `filterPublished(entries)` é pura e testada; `getPublished(collection)` = `getCollection` + `filterPublished`. Páginas, calendário e RSS futuros devem usar só `getPublished` (critério 10 protege isso).

Scripts: `dev`, `build` (`astro build`), `lint` (`astro check`), `test` (`vitest run`). O script `check` do CLAUDE.md é removido em favor de `lint`.

## Perguntas em aberto e suposições

Padrão proposto em cada item; mudar depois exige atualizar schema, testes e `docs/spec.md`.

1. **`about` sem lista de campos.** Padrão: os da tabela acima (`lang`, `title`, `cta_label`, `linkedin_url`, `photo`, `photo_alt`), derivados da Home (foto, texto, botão) e da regra "contato = LinkedIn". Um arquivo por idioma: `about/en.md`, `about/pt.md`. A foto é opcional porque ainda está pendente.
2. **Tema fora da lista do pedido.** Padrão: incluir `themes`, pois está no modelo do spec e custa um schema pequeno. Fica de fora do `.pages.yml` até Clara decidir (o spec não lista coleção de temas lá). Sem checagem cruzada de `tags` contra `themes` nesta slice.
3. **Rascunho sem páginas.** Padrão: helper único `getPublished` (critérios 8 a 10). O teste de página e de RSS do spec entra quando essas páginas existirem.
4. **Enum de `status`.** Padrão: valores ASCII `completed` e `in_progress` (sem acento, estáveis em URL e YAML); os rótulos "concluído" e "em andamento" vêm do conteúdo i18n da slice 2, não do código. Projetos reutilizam o enum (o spec não define os valores de projeto).
5. **Datas de experiência e atividade.** Padrão: `end` obrigatório, como o spec ("nunca atual"), e data completa `AAAA-MM-DD` (mês só do LinkedIn vira dia 01). Conflito conhecido: LEPV está "jan/2026 em diante". Decisão de Clara na slice 2: usar uma data de término prevista ou abrir `end` opcional (mudança de schema com spec e testes).
6. **`translation_of`.** Padrão: string com o nome do arquivo do original sem extensão (ex.: `2026-11-15-spec-do-site`), já que os dois idiomas têm o mesmo nome. A existência do arquivo alvo não é verificada nesta slice.
7. **CLAUDE.md fala em build + teste de links em `npm test`.** Padrão: nesta slice `npm test` = só vitest; build roda como passo separado no CI; teste de links entra com as páginas. Atualizar a linha de Test e a de Lint (`npm run lint`) no CLAUDE.md.
8. **Runner e API do Astro.** Padrão: vitest (integra com TypeScript e Vite sem configuração extra) e `gray-matter` para ler frontmatter dos `.md` nos testes. Loader `glob` com `src/content.config.ts`, e `z` vindo de `astro/zod`. Não confiar em memória: depois do scaffold, conferir na versão instalada do Astro (a) o caminho do arquivo de config e o import do `glob`, (b) se `astro/zod` carrega fora do runtime no vitest (se não, usar `zod` como dependência própria), (c) o Node mínimo exigido contra o `node-version: 22` do CI, (d) se o padrão do glob ignora arquivos com `_` no começo (por isso o prefixo `fixture-` e não `_fixture`).
9. **Extras.** Formatador de código fica para depois da slice 1 (o CLAUDE.md pede decisão aqui; padrão: adiar e registrar). `docs/` hoje está não rastreado; entra no primeiro commit.

## Tarefas e plano de commits

Cada tarefa é um commit pequeno, verificável.

1. `docs: adiciona spec do site e spec da slice 1`. Verificar: `git status` limpo para `docs/`.
2. `chore: scaffold Astro minimal com TypeScript strict e scripts`. Scaffold com `.gitignore` (`node_modules`, `dist`, `.astro`), `@astrojs/check`, `typescript`. Verificar: `npm run lint` e `npm run build` passam; conferir os itens (a) a (d) do P8 e anotar versões.
3. `test: vitest e schemas Zod das 7 coleções` (testes primeiro, depois `src/lib/schemas.ts`). Verificar: critérios 3 a 7 passam com casos inline, sem fixtures.
4. `feat: coleções com loader glob e fixtures`. Verificar: critérios 2, 6 e 1 (build) passam.
5. `test: getPublished e exclusão de rascunhos`. Verificar: critérios 8 a 10; conferir o 11 apagando um campo de uma fixture, vendo o build falhar e desfazendo.
6. `ci: roda build depois dos testes`. Verificar: critério 12, CI verde no PR.
7. `docs: atualiza comandos do CLAUDE.md e modelo de conteúdo no spec`. Registrar em `docs/spec.md` os campos de `about`, `themes` e os enums. Verificar: comandos do CLAUDE.md rodam como escritos.
