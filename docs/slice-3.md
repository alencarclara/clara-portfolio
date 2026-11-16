# Slice 3: idiomas EN/PT (rotas e troca de idioma)

Status: implementada na branch `feat/slice-3-idiomas`; aguarda revisão e PR. Depende do merge do PR #5 (slice 2); a branch sai de `feat/slice-2-paginas` até lá.

## Decisões (Clara, 2026-11-16)

- URLs com prefixo nos dois idiomas: `/pt/...` e `/en/...`. A raiz `/` só escolhe o idioma.
- Um arquivo por idioma para todos os tipos de conteúdo: `src/content/<tipo>/pt/` e `src/content/<tipo>/en/`, mesmo nome de arquivo, campo `lang` no schema (como journal e about).

## Escolhas minhas (simples, reversíveis)

- A raiz `/` é uma página estática com link para cada idioma e um script que escolhe pelo `navigator.language` (EN se começar com `en`, senão PT). Sem JS, o link PT fica em destaque. Sem redirecionamento no servidor, porque o GitHub Pages não tem.
- Todos os links internos passam por um helper que respeita `import.meta.env.BASE_URL`, porque o GitHub Pages serve em `usuario.github.io/clara-portfolio/`. O `site` e o `base` do `astro.config` ficam para a slice de deploy.
- O idioma não é lembrado em `localStorage`; a URL é a fonte da verdade.

## Escopo

1. **Rotas**: `src/pages/[lang]/{index,activities,experience,courses,projects,journal}.astro` com `getStaticPaths` para `en` e `pt`; as páginas de `src/pages/` saem. `Base.astro` recebe `lang` e escreve `<html lang>` e `<link rel="alternate" hreflang>` para o outro idioma.
2. **Troca de idioma**: componente `LangSwitch` no cabeçalho, ao lado do toggle de tema. Leva à mesma página no outro idioma. O aviso "ainda sem tradução" do Journal fica para a slice 4: hoje não há páginas de entrada nem entradas, então não há o que testar nem mostrar.
3. **Textos de interface**: `src/content/ui/en.json` (mesmo `uiSchema`), `getUi(lang)` em vez de `getUi()`. Chave nova e obrigatória `langSwitch: { label, text, name }`. Em `pt.json`: `name` = "Português" (nome do próprio idioma, usado na raiz `/`), `text` = o que o botão mostra (ex.: "[ EN ]"), `label` = `aria-label` do botão (ex.: "Mudar para inglês"); `en.json` espelha com o outro idioma. A data curta dos cursos é `dd/mm` em PT e `mm/dd` em EN.
4. **Conteúdo**: mover os arquivos atuais de activities, courses, experience e projects para `pt/` e criar o espelho em `en/`. As traduções EN são rascunhadas por mim a partir só do que está nos arquivos PT, sem inferir fatos, e **Clara aprova antes de eu salvar**. Entradas `draft: true` ficam `draft: true` nos dois idiomas.
5. **Schemas**: `lang` obrigatório em activities, courses, experience e projects (`translation_of` opcional, como no journal). Muda a validação, então atualizo os testes e o `docs/spec.md`.
6. **Leitura de conteúdo**: `getPublished` continua sendo o único ponto. Adiciono `filterByLang` (puro, em `published.ts`) e `getPublishedByLang(collection, lang)` em cima dele, sem chamar `getCollection` em outro lugar. Rotas e idiomas ficam em `src/lib/i18n.ts` (`LANGS`, `otherLang`, `localePath(lang, page?, base)`).
7. **Contrato do HTML** (o que os testes checam): botão `<a id="lang-switch" hreflang lang aria-label>`; `<link rel="alternate" hreflang>` no `<head>`; `<html lang>` = `pt-BR` ou `en`; raiz `/` com links `/pt/` e `/en/` (PT primeiro) e script com `navigator.language`, sem `meta refresh`. O `about` continua um arquivo por idioma na pasta plana (`about/pt.md`, `about/en.md`).

## Testes (escritos antes, falhando até implementar)

- Para cada página, existem `dist/pt/...` e `dist/en/...`; `<html lang>` bate com o prefixo.
- Todo `LangSwitch` aponta para a mesma página no outro idioma, e o destino existe em `dist/`.
- Raiz `/` tem os dois links e nenhum e-mail ou telefone.
- Todo arquivo `pt/<nome>` tem o par `en/<nome>` (espelho), e `lang` bate com a pasta, para todas as coleções.
- Os testes existentes de rascunho, sensíveis, links internos, contraste e e2e do tema seguem passando; o e2e do tema ganha um caso em `/en/`.
- Links internos: nenhum link sem prefixo de idioma.

## Fora do escopo

- Calendário e temas do Journal (slice 4), `/journal-translate`, `.pages.yml`, deploy, fotos de projetos e atividades.

## Ordem de execução

1. `test-writer`: testes da seção acima, falhando.
2. Schemas + mover arquivos para `pt/` + `ui/en.json` + `getUi(lang)` + helper de links.
3. Rotas `[lang]`, `LangSwitch`, página `/`.
4. Mostrar a Clara as traduções EN; salvar só após aprovação.
5. Atualizar `docs/spec.md` e `CLAUDE.md`; rodar lint, vitest e Playwright; `reviewer`; PR.

## Riscos

| Risco                                           | Efeito                       | Plano                                                                                               |
| ----------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| Pages CMS não lida bem com duas pastas por tipo | Quebra o fluxo de publicação | Já previsto no spec: plano B é uma pasta só com `lang`. Verificar na slice do CMS, antes do deploy. |
| Tradução EN com fato inventado                  | Texto errado no site público | Só traduzo o que está no arquivo PT; Clara aprova cada arquivo.                                     |
| Muitos arquivos movidos no mesmo PR             | Diff grande                  | Commit separado só com os `git mv`, para o histórico seguir os arquivos.                            |
