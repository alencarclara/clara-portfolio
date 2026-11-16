# Slice 4: Journal (calendário, dias e temas)

Status: plano, aguardando ok de Clara. Branch `feat/slice-4-journal`, a partir da `main` (slices 1 a 3 já mergeadas).

## Estado de partida

- `journal` tem schema (`date`, `lang`, `title`, `did`, `learned`, `tags`, `draft`, `links`, `translation_of`) e as pastas `journal/pt/` e `journal/en/` estão vazias.
- A coleção `themes` existe no schema (`slug`, `lang`, `title`, `summary?`) mas não tem arquivos.
- `/pt/journal` e `/en/journal` mostram só o texto "em breve" (`pages.journal.soon`).

## Escolhas minhas (simples, reversíveis)

- **Sem JavaScript**: o calendário é uma tabela gerada no build; as abas Calendário e Temas são links, não script.
- **Semana começa no domingo**, nos dois idiomas.
- **Tema = tag.** O slug do tema é a tag em kebab-case sem acento (`Machine Learning` vira `machine-learning`). A tradução mantém as `tags` iguais, como no spec, então PT e EN caem no mesmo tema. O título do tema vem da coleção `themes` do idioma, se existir; senão é o texto da tag. O `summary` manual é opcional.
- **Entrada sem tradução** (arquivo só em um idioma, pareado pelo mesmo nome em `pt/` e `en/`): aparece nas páginas do outro idioma com o aviso "ainda sem tradução", sem 404. Isso fecha o item adiado da slice 3.
- **Rascunhos** continuam fora de tudo, pelo `getPublished`.
- **RSS fica de fora** desta slice; entra junto com o deploy, quando houver `site`.

## Rotas (por idioma, `/pt/...` e `/en/...`)

| Rota                             | O que mostra                                                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/<lang>/journal`                | Abas Calendário e Temas; calendário do mês mais recente com entrada, ponto nos dias com entrada, links para os meses anterior e seguinte que têm entrada |
| `/<lang>/journal/month/AAAA-MM`  | Calendário de um mês que tem entrada (o mais recente é o mesmo conteúdo da raiz do Journal)                                                              |
| `/<lang>/journal/day/AAAA-MM-DD` | As entradas do dia, completas (`did`, `learned`, `tags`, `links`)                                                                                        |
| `/<lang>/journal/themes`         | Lista de temas, com contagem de entradas                                                                                                                 |
| `/<lang>/journal/themes/<slug>`  | `summary` do tema (se houver) e a lista de entradas, da mais nova para a mais antiga, cada uma levando ao dia                                            |

Só existem páginas para meses, dias e temas que têm entrada publicada em algum idioma. O botão de idioma leva à mesma rota no outro idioma, que sempre existe pela regra acima.

## Escopo

1. `src/lib/journal.ts` (puro, sem imports do Astro): `tagSlug`, `groupByDay`, `monthGrid(ano, mês)`, `monthsWithEntries`, `entriesByTheme`, `resolveForLang(entries, lang)` (devolve a versão do idioma ou a original com `untranslated: true`).
2. Páginas em `src/pages/[lang]/journal/` (`index`, `month/[month]`, `day/[date]`, `themes/index`, `themes/[slug]`) e componentes `Calendar` e `JournalTabs`. Os dias do calendário são links com `aria-label` ("15 de novembro, 1 entrada").
3. `localePath` passa a aceitar subcaminhos de página (`journal/day/2026-11-15`), e o `Base` leva o subcaminho ao botão de idioma e ao `<link rel="alternate">`.
4. Textos novos em `ui/pt.json` e `ui/en.json` (abas, nomes de dia e mês, "N entradas", "ainda sem tradução", "o que fiz", "o que aprendi", "sem entradas"); `uiSchema` e testes atualizados.
5. Conteúdo inicial: ver "Decisão da Clara" abaixo. Sem entradas reais não há como testar as páginas geradas.
6. `docs/spec.md` com as rotas e regras do Journal.

## Testes (escritos antes, falhando até implementar)

Unitários (vitest, sem build):

- `tagSlug`: acentos, espaços, maiúsculas, hífens repetidos; `"Machine Learning"` = `"machine-learning"`.
- `monthGrid`: semanas começando no domingo, fevereiro bissexto (2028) e não bissexto, mês que começa no domingo e no sábado, dias fora do mês vazios.
- `groupByDay`, `monthsWithEntries` e `entriesByTheme`: ordem, várias entradas no mesmo dia, rascunho já filtrado antes.
- `resolveForLang`: usa a versão do idioma; sem ela, devolve a original com `untranslated: true`; nunca duplica.

Páginas geradas (`dist/`), com as entradas iniciais:

- Calendário: um link por dia com entrada, nenhum nos outros; mês anterior e seguinte só existem se houver entrada.
- Dia: mostra `did`, `learned`, tags e links da entrada; entrada sem tradução mostra o aviso e não dá 404; o botão de idioma leva ao mesmo dia.
- Temas: toda tag de entrada publicada tem página; contagem bate; tema de entrada em `draft: true` não aparece em lugar nenhum (calendário, dia, temas, contagens).
- Todas as novas rotas passam nos testes que já existem: links internos, e-mail e telefone, `<html lang>`, `#lang-switch`, `alternate`, mesmo idioma nos links.
- e2e: abrir o calendário, clicar num dia, voltar; alternar o idioma dentro de um dia; navegação por teclado até um dia com entrada.
- Sem overflow horizontal a 375 px nas novas páginas, nos dois temas.

## Decisão da Clara

Precisamos de entradas reais para o calendário ter o que mostrar e para os testes de página funcionarem. Proposta: **duas entradas** em dias diferentes, cada uma com o par PT e EN, e uma terceira **só em PT** para exercitar o aviso de falta de tradução. Posso rascunhar a partir do que fizemos neste projeto (por exemplo, a spec do site e as slices 2 e 3), e você edita ou aprova antes de eu salvar; rascunhos meus não entram sem o seu ok.

## Fora do escopo

- RSS, `.pages.yml`, `/journal-translate`, deploy, fotos nas entradas.

## Ordem de execução

1. `test-writer`: testes unitários e de página, falhando.
2. `src/lib/journal.ts` e `localePath` com subcaminhos.
3. Páginas, componentes e textos de interface.
4. Entradas iniciais, aprovadas por Clara.
5. Atualizar `docs/spec.md`; lint, vitest e Playwright; `reviewer`; PR com base na `main`.

## Riscos

| Risco                                   | Efeito                            | Plano                                                                                         |
| --------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------- |
| Tag escrita diferente em PT e EN        | O mesmo assunto vira dois temas   | `tagSlug` normaliza maiúsculas e acentos; teste de espelho exige `tags` iguais entre os pares |
| Muitas páginas geradas por dia e mês    | Build mais lento e `dist/` grande | Só geramos o que tem entrada; é pouco por muito tempo                                         |
| Tradução mudar o título e quebrar o par | Entrada duplicada                 | O par é pelo nome do arquivo, não pelo título                                                 |
