# Slice 7: RSS do Journal

Branch `feat/slice-7-rss`, a partir da `main` (slices 1 a 6 mergeadas, site no ar).

## Escolhas minhas (simples, reversíveis)

- **Um feed por idioma**: `/pt/journal/rss.xml` e `/en/journal/rss.xml`, RSS 2.0 com `atom:link rel="self"`, gerado no build.
- **Sem dependência nova**: `src/lib/rss.ts` (puro) monta o XML e escapa o texto; o endpoint `src/pages/[lang]/journal/rss.xml.ts` só junta os dados.
- **Conteúdo**: as mesmas entradas do Journal do idioma (`getJournal`, então sem `draft`), da mais nova para a mais antiga; entrada sem tradução leva o aviso "ainda sem tradução" no começo da descrição. Cada item aponta para a página do dia; `guid` é essa URL; `pubDate` é a data da entrada ao meio-dia UTC.
- **URLs absolutas** com `Astro.site`. Sem `SITE` (dev e testes) usa `http://localhost:4321`, só para o build não quebrar; o deploy tem `SITE`.
- **Descoberta**: `<link rel="alternate" type="application/rss+xml">` no `<head>` das páginas do Journal e um link visível "RSS" no calendário (nova chave `journal.rss` em `ui/pt.json` e `ui/en.json`, com `uiSchema`, testes e spec atualizados).

## Testes

- `tests/rss.test.ts`: função pura (escape, ordem, estrutura) e feeds gerados (um item por entrada publicada, idioma, links do dia, aviso de sem tradução, nada de rascunho, link de descoberta só no Journal, link visível).
- `tests/deploy.test.ts`: no build com `SITE` e `BASE_PATH`, os links do feed são absolutos e levam o base.

## Fora do escopo

Feed por tema, texto completo em HTML, `<enclosure>`.
