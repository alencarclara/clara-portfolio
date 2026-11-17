# Slice 6: deploy no GitHub Pages

Branch `feat/slice-6-deploy`, a partir da `main` (slices 1 a 5 mergeadas). Site de projeto: `https://alencarclara.github.io/clara-portfolio/`.

## Escolhas minhas (simples, reversíveis)

- **`site` e `base` por variável de ambiente** (`SITE`, `BASE_PATH`) lidas em `astro.config.mjs`, definidas só no workflow de deploy. Sem elas o build é o de sempre (base `/`, links relativos), então os testes e o `npm run dev` não mudam.
- **`<head>` com `site`**: `canonical`, `alternate` absoluto para os dois idiomas e `x-default` apontando para a raiz (que escolhe o idioma). Sem `site`, fica como hoje.
- **Workflow `deploy.yml`**: a cada push na `main` (e manual), `npm ci`, `npm run build` com as variáveis, `upload-pages-artifact` e `deploy-pages`. Os testes já rodam no CI de PR.
- **Ativar o Pages (Settings > Pages > Source: GitHub Actions) é com Clara** (ou com ok dela via `gh api`): é configuração do repositório.
- **RSS fica para a slice 7**: precisa de `site` e é funcionalidade à parte.

## Testes (`tests/deploy.test.ts`)

- Build extra em pasta temporária com `SITE` e `BASE_PATH`: todo `href`/`src` que começa com `/` leva o base; `canonical`, `alternate` (pt, en) e `x-default` são absolutos e existem em todas as páginas de idioma; a raiz `/` tem os links de idioma com o base.
- `deploy.yml`: YAML válido, dispara em push na `main`, permissões `pages: write` e `id-token: write`, usa configure/upload/deploy do Pages e define `SITE` e `BASE_PATH`.
- Sem e-mail, telefone ou segredo no workflow.

## Fora do escopo

RSS, domínio próprio, `404.html`, analytics.
