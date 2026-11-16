# Slice 5: Pages CMS (`.pages.yml`)

Branch `feat/slice-5-pages-cms`, a partir da `main` (slices 1 a 4 mergeadas). Documentação lida em 2026-11-16 (pagescms.org/docs/configuration).

## Escolhas minhas (simples, reversíveis)

- **Uma coleção por tipo e idioma**: `journal-pt`, `journal-en`, `themes-pt`, `themes-en`, `courses-*`, `projects-*`, `experience-*`, `activities-*`, mais `about-pt` e `about-en` como `type: file`. A docs mostra coleções com `path` diferente por entrada, então pasta por idioma funciona; o plano B (um `lang` e uma pasta) não é necessário.
- **`lang` é um `select` obrigatório** com o único valor da coleção e `default` igual. Visível em vez de `hidden`, porque a docs não garante `default` em campo escondido; se faltar, o schema reprova no build.
- **Imagens como texto**: `photo` e `screenshot` ficam como `string` (nome do arquivo em `src/assets`), porque um seletor de imagem gravaria um caminho público e a busca da foto (`endsWith("/clara.jpeg")`) quebraria. Upload pelo CMS fica para a mini-slice de fotos.
- **Número**: `progress` é `number` com `min: 0`, `max: 100` (a docs não tem opção de inteiro; o schema continua exigindo inteiro).
- **Data**: `date` com `format: yyyy-MM-dd`.
- **Arquivo do Journal**: `filename: "{year}-{month}-{day}-{title}.md"` na coleção PT. Entrada nova nasce em PT; o par EN vem do `/journal-translate`, que mantém o mesmo nome (o teste de espelho acusa nome diferente).
- **`ui/*.json` fica fora** do CMS nesta slice (texto de interface muda pouco; vai pelo repo).

## Testes (`tests/pages-cms.test.ts`)

- `.pages.yml` existe, é YAML válido e tem `content`.
- Toda coleção aponta para uma pasta (ou arquivo) que existe; nomes únicos.
- Para cada tipo e idioma: os campos do CMS batem com as chaves do schema Zod (nenhum a mais, nenhum a menos, `body` à parte), e `required` bate com os campos obrigatórios.
- Cada pasta tem uma coleção por idioma, e o `lang` padrão bate com o idioma da pasta.

## Fora do escopo

- Testar no app real do Pages CMS (precisa do repo no GitHub e login; Clara testa depois do merge, passo 3 da ordem de execução).
- Upload de imagens, `ui/*.json`, RSS, deploy.
