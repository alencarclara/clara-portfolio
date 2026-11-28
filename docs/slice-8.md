# Slice 8: versão 2, o mapa do jogo

Branch `feat/slice-8-mapa`, a partir da `main` (versão 1 mergeada e no ar). Pré-requisito da spec cumprido: as páginas simples já existem e têm testes. Mudar texto de conteúdo ou schema de conteúdo está fora desta slice; só `ui/*.json` cresce.

## Objetivo

Uma camada de jogo em `/pt/map` e `/en/map`: um personagem parecido com Clara anda até cinco caixinhas (Atividades, Estágios e Pesquisa, Cursos, Projetos, Journal) e cada uma abre a página que já existe. As páginas continuam iguais e funcionam sem o jogo.

## Escolhas minhas (simples, reversíveis)

- **Rota**: `src/pages/[lang]/map.astro` (`/pt/map`, `/en/map`). `"map"` entra em `localePath` como rota própria, mas fora do tipo `Page` (não é uma das 5 páginas de conteúdo, não aparece na lista da home). Motivo: reusa `getStaticPaths` e hreflang, sem tocar nas outras rotas.
- **Sem JS, o mapa já é útil**: o HTML da rota traz a lista das 5 páginas como `<ul>` de links reais, o link "ver versão simples" (para a home) e o botão do CV. O jogo é um canvas que, ao iniciar, esconde só a lista (não os dois links fixos). Motivo: JS falhou, o recrutador ainda navega; e o teste de HTML estático funciona.
- **Carregamento**: o jogo fica em `src/game/main.ts`, importado por um único `<script>` em `map.astro`. Kaplay só é `import` dentro de `src/game/`. Motivo: o Astro só emite o bundle nas páginas que referenciam o script, o que dá o critério 4 de graça.
- **Kaplay.js** como padrão (a suposição da spec). Se o protótipo (passo 1) falhar (build, tamanho, toque), a alternativa é canvas 2D puro, sem mudar o resto do plano. Versão do Kaplay fixa no `package.json`.
- **Dados do mapa fora do código**: `src/lib/map.ts` (puro, testável) devolve as 5 caixinhas `{ page, label, href, x, y }` a partir de `getUi(lang)` e `localePath`; o jogo recebe isso serializado num `data-` do canvas container. Nenhum texto fixo no jogo, nem dentro do canvas.
- **Controles**: setas/WASD movem; ao chegar na caixinha, Enter/Espaço abre; toque: tocar numa caixinha anda até ela e abre; tocar no chão anda até o ponto. Tab percorre os links reais (lista, versão simples, CV) mesmo com o jogo ativo, para o teclado nunca depender do canvas. Passos discretos numa grade (sem física), mais simples de testar.
- **Movimento reduzido**: com `prefers-reduced-motion`, o personagem teleporta para a caixinha escolhida, sem animação de andar.
- **Tema**: o jogo lê as variáveis CSS do tema (`--bg`, `--text`, `--accent`) na hora de montar e reage ao botão do tema. Paleta da direção visual, sem scanlines nem brilho. Arte em pixel art simples, 2 a 3 tons.
- **Sem dado pessoal**: o personagem não leva nome, e-mail nem telefone; texto do canvas vem só de `ui`.
- **"Saiba mais"**: o botão da home passa a apontar para `localePath(lang, "map")`; a lista `#paginas` continua na home como está. Mudar para "rolar até #paginas" de novo é trocar um `href`.
- **CV**: link para `public/cv/clara-alencar-<lang>.pdf`, atributo `download`, visível no mapa e também no cabeçalho do mapa em 375 px. O arquivo vem de Clara (pergunta 1); até lá o teste usa um PDF mínimo de fixture e o passo do CV fica bloqueado.
- **Chaves de UI novas**: `map.title`, `map.intro` (instrução de controles), `map.simple` ("ver versão simples"), `map.cv`, `map.enter` ("abrir {página}"), `map.loading`, `map.fallback` (se o canvas falhar). Entram em `ui/pt.json`, `ui/en.json`, `uiSchema`, testes e `docs/spec.md`.

## Rota proposta

`/pt/map` e `/en/map`; links entre idiomas pelo `otherHref` já existente (hreflang igual às outras páginas).

## Critérios de aceite

1. `dist/pt/map/index.html` e `dist/en/map/index.html` existem, com `lang` certo, hreflang do outro idioma e as 5 caixinhas como `<a>` cujos `href` batem com `localePath` (inclusive com `BASE_PATH`).
2. Sem JS (HTML estático e Playwright com `javaScriptEnabled: false`): o mapa mostra a lista das 5 páginas, "ver versão simples" (para `/<lang>/`) e o CV; as 5 páginas e a home são idênticas às de antes (o teste compara os HTML de `dist/` das rotas antigas, exceto o `href` do "Saiba mais", com um snapshot gerado na `main` antes da mudança).
3. Home: o "Saiba mais" leva a `/<lang>/map` em PT e EN.
4. Bundle do jogo: nenhuma página fora de `/pt/map` e `/en/map` referencia um `.js` do jogo (nem o chunk do Kaplay) nem tem `<canvas>`; o mapa referencia. Teste lê `dist/**/*.html`.
5. Teclado: no Playwright, setas movem o personagem; Enter na caixinha navega para a página certa; Tab alcança "ver versão simples" e CV sem passar por armadilha de foco; foco visível.
6. Toque (Playwright com `hasTouch`, viewport 375x667): tocar numa caixinha navega para a página dela; tocar no chão move o personagem sem navegar.
7. A 375 px não há rolagem horizontal (`scrollWidth <= clientWidth`) e o canvas cabe na largura; "ver versão simples" e CV visíveis sem rolar, tanto antes quanto depois do jogo iniciar.
8. "Ver versão simples" e CV sempre visíveis e fora do canvas, em PT e EN; o CV tem `download` e o arquivo existe em `dist/`.
9. `prefers-reduced-motion: reduce` (emulado): o movimento não anima (posição final em um quadro); contraste de rótulos e botões do mapa nos dois temas passa no teste de contraste existente (>= 4,5:1).
10. Troca de tema atualiza as cores do canvas sem recarregar.
11. Nenhum e-mail, telefone ou texto fixo: `tests/sensitive.test.ts` passa no HTML do mapa; todo texto visível vem de `ui` (teste varre as chaves `map.*` em PT e EN, mesmas chaves nos dois).
12. Nenhum `draft: true` aparece; `npm test`, `npm run test:e2e`, `npm run lint` e `npm run build` passam.
13. Direitos da arte: `docs/credits.md` (ou `src/game/ART.md`) diz a origem e a licença de cada arquivo de arte; teste falha se houver imagem em `src/game/` sem linha lá.

## Casos de borda

- Canvas ou WebGL indisponível: o jogo mostra `map.fallback` e a lista continua visível.
- Kaplay lança erro ao iniciar: capturado, lista fica visível, nenhum erro não tratado.
- Redimensionar ou girar o aparelho: o canvas reajusta sem estourar a largura.
- Duas caixinhas próximas no toque: alvo mínimo de 44 px.
- Base path do deploy (`/clara-portfolio/`): assets do jogo e do CV levam o base.
- Voltar do navegador depois de abrir uma página: o mapa recarrega no estado inicial sem erro.

## Plano de testes (escritos antes, falhando)

- vitest sobre `dist/` (`tests/map.test.ts`): critérios 1, 3, 4, 8, 11, 13; `tests/map-lib.test.ts` para `src/lib/map.ts` (5 caixinhas, hrefs, ordem, ambos idiomas); `tests/i18n.test.ts` e `tests/pages.test.ts` ajustados para a rota nova e o "Saiba mais".
- Playwright (`e2e/map.spec.ts`, mesmo padrão do teste do tema): critérios 2 (sem JS), 5, 6, 7, 9, 10. O teste espera um `data-ready="true"` no container, que o jogo marca ao iniciar (evita sleeps).

## Fora do escopo

Pontuação, inimigos, som, salvar progresso, multiplayer, mini-jogos dentro das caixinhas, animações elaboradas, mapa que leia o Journal por dia, mudar conteúdo das páginas, e e-mail/telefone no CV do site.

## Ordem de execução

1. **Protótipo descartável** (branch ou pasta fora do `src/` final): Astro + Kaplay, um quadrado que anda no canvas numa rota `/pt/map`. Verificar: `npm run build` passa; o bundle só aparece nessa rota; tamanho gzip do JS anotado (se passar de uns 300 KB, avaliar canvas puro); toque funciona no celular. Decidir Kaplay ou plano B e registrar aqui.
2. Escrever os testes vitest e Playwright (falhando), com snapshot das rotas atuais feito na `main`.
3. Chaves `map.*` em `ui/*.json`, `uiSchema`, `docs/spec.md`; `localePath` com `"map"`; `src/lib/map.ts`.
4. `map.astro` só com HTML sem JS (lista, versão simples, CV com fixture): critérios 1, 2, 8 verdes.
5. "Saiba mais" na home aponta para o mapa: critério 3.
6. Jogo: cena, personagem placeholder (retângulo), caixinhas, teclado: critério 5.
7. Toque e 375 px: critérios 6 e 7.
8. Movimento reduzido, tema, fallback de erro: critérios 9, 10 e casos de borda.
9. Arte real do personagem (depende da pergunta 2) e `credits`: critério 13.
10. CV real (depende da pergunta 1), Lighthouse de contraste e peso, PR.

## Riscos

| Risco                                                   | O que fazer                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Kaplay não casa com Astro/Vite (SSR, `window` no build) | Importar só no cliente dentro do script; o protótipo do passo 1 prova antes de tudo |
| Bundle pesado atrapalha no celular                      | Só na rota do mapa; medir no passo 1; plano B canvas puro                           |
| Canvas não é acessível                                  | Links reais fora do canvas, sempre navegáveis por Tab                               |
| Arte copiada do demo de referência                      | Origem registrada e testada (critério 13)                                           |
| CV com e-mail/telefone                                  | Perguntar antes de publicar; o PDF é público no repo                                |
| Recrutador se perde no jogo                             | Versão simples e CV sempre visíveis                                                 |

## Decisões da Clara

1. **CV**: de onde vem o PDF, em quais idiomas (um PT e um EN, ou só um), e posso publicá-lo no repositório público? Ele tem e-mail ou telefone? (A regra do projeto proíbe dado pessoal; se tiver, precisa de uma versão sem.)
2. **Arte do personagem**: você desenha, uso um pacote livre (com licença registrada), ou começo com um boneco simples meu e você troca depois?
3. **Referência visual**: alguma imagem ou três pontos do que você gosta no hackbrasil.com para o clima do mapa (ainda pendente na spec)?
4. **Tema**: o mapa deve seguir o claro/escuro do site (minha escolha) ou ter um visual próprio fixo?
5. **"Saiba mais"**: vai direto para o mapa (minha escolha) ou continua rolando até a lista de páginas, com o mapa só num segundo botão?
