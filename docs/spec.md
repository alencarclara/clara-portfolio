# Spec do site: currículo online (Clara Alencar)

Nov 15, 2026 · @Clara

## Decisões tomadas

O site é um currículo online para recrutadores e bancas de admissão, que também funciona como diário público do que Clara faz e aprende por dia. Ele também serve de primeiro teste real dos agentes do `ai-library` e do Fable 5.2.

| Tema | Decisão |
| --- | --- |
| Público | Recrutadores e bancas de admissão |
| Autoria | Clara constrói o site; o demo VeroSedai/portfolio-gamified é só inspiração (o repo não declara licença, então nada de código dele) |
| Visual | Estilo terminal com fonte de código: base neutra, acento suave, abre no tema escuro e alterna para o claro (ver seção Direção visual); inspiração: portfólio CLI em Astro, não o hackbrasil.com (ainda não visto) |
| Ordem de construção | Páginas simples primeiro; mapa do jogo depois, como camada que só aponta para elas |
| Idiomas | Inglês e português, com botão de troca; Clara escreve uma vez e o Claude traduz em lote |
| Publicação | Editor no navegador (Pages CMS), que grava markdown no repositório |
| Stack | Astro (site estático, conteúdo em markdown validado) |
| Hospedagem | GitHub Pages, repositório público, endereço `usuario.github.io` (domínio próprio fica para depois) |
| Rascunhos | Campo `draft: true` esconde a entrada do site, mas o arquivo continua legível no repo público |
| Número de empresas na apresentação | Clara mantém "15" por ora e revisa textos e números com o site pronto |

## Estrutura e páginas

A home apresenta Clara e leva ao mapa do jogo; o mapa tem cinco caixinhas, cada uma levando a uma página de conteúdo que funciona sozinha, sem o jogo.

| Página | O que mostra | Fonte do conteúdo |
| --- | --- | --- |
| Home | Foto, texto de apresentação curto e botão "Saiba mais" que abre o mapa | `about` (EN/PT) |
| Mapa do jogo | Personagem parecido com Clara anda até cinco caixinhas; link "ver versão simples" e botão de baixar o CV sempre visíveis | Lista das 5 páginas |
| Atividades Extracurriculares | Integração IME, STEM IME Girls to Girls e LEPV | `activities` |
| Estágios e Pesquisa | Prio, Ilos, EB (se confirmado) e CNPq | `experience` |
| Cursos | Concluídos e em andamento, com porcentagem e data da última atualização | `courses` |
| Projetos | Site da Dra. Karla e qhoras | `projects` |
| Journal | Aba Calendário (realizações por dia) e aba Temas (resumos de aprendizado por tema) | `journal` |

Regras de estrutura:

- Todas as páginas têm URL própria e abrem sem JavaScript do jogo. O mapa é uma camada por cima.
- O texto da home em inglês: "Hi, I'm Clara. I'm 23 and in the 4th year of Computer Engineering at IME (Instituto Militar de Engenharia, the Military Institute of Engineering). I co-founded and preside over an entrepreneurship league at my school that has connected with 15 companies and startups, and now I'm looking to build my own." A citação das "maiores startups de IA" fica de fora até haver nomes e permissão.
- O e-mail e o telefone não aparecem no site. Contato = link do LinkedIn (e formulário, se Clara quiser).
- Mobile e teclado: o mapa precisa ser navegável por toque e por setas/Tab.

## Modelo de conteúdo

Cada tipo de conteúdo é um arquivo markdown com campos obrigatórios; se faltar um campo, o build falha em vez de publicar uma página quebrada. As datas usam o formato `AAAA-MM-DD`.

| Tipo | Campos obrigatórios | Campos opcionais |
| --- | --- | --- |
| Journal (entrada diária) | `date`, `lang` (en/pt), `title`, `did` (o que fiz), `learned` (o que aprendi), `tags` (temas) | `draft`, `links`, `translation_of` |
| Tema (aba Temas) | `slug`, `lang`, `title` | `summary` escrito à mão; as entradas do tema entram automaticamente pelas tags |
| Curso | `lang`, `title`, `provider`, `status` (concluído ou em andamento), `progress` (0 a 100), `updated_at` | `started_at`, `finished_at`, `url`, `certificate_url`, `notes` |
| Projeto | `lang`, `title`, `status`, `role`, `stack`, `summary`, `period` | `url`, `screenshot`, `outcome`, `draft` |
| Experiência (estágio, pesquisa) | `lang`, `org`, `role`, `start`, `summary` | `end` (ausente = em andamento), `highlights`, `tools`, `draft` |
| Atividade extracurricular | `lang`, `org`, `role`, `start`, `summary` | `end` (ausente = em andamento), `highlights` (números), `draft` |

Decisões de schema da slice 1 (detalhes em `docs/slice-1.md`):

- Todos os schemas rejeitam campos desconhecidos; strings são não vazias; datas existem no calendário.
- `status` (cursos e projetos): `completed` ou `in_progress`; os rótulos "concluído" e "em andamento" vêm do conteúdo i18n.
- Experiência e atividade: `end` >= `start` quando presente (ver slice 2: `end` é opcional). Cursos: `finished_at` >= `started_at`.
- Tema: `slug` em kebab-case, `lang`, `title`, `summary` opcional (coleção `themes`).
- Sobre (`about`, um arquivo por idioma): `lang`, `title`, `cta_label`, `linkedin_url` obrigatórios; `photo` opcional, e `photo_alt` obrigatório quando há `photo`. O corpo markdown é o texto de apresentação.
- `translation_of`: nome do arquivo original sem extensão. `draft` ausente conta como publicado; só `getPublished` lê conteúdo.

Decisões de schema da slice 2 (detalhes em `docs/slice-2.md`):

- Experiência e atividade: `end` passa a ser opcional (ausente = em andamento, exibido como "jan 2026 – atual"); quando presente, `end` >= `start`.
- Nova coleção `ui` (`src/content/ui/pt.json`, `uiSchema` estrito): todos os textos de interface; nenhum componente guarda texto próprio.
- Rotas provisórias da slice 2 (substituídas na slice 3): `/`, `/activities`, `/experience`, `/courses`, `/projects`, `/journal`.

Decisões da slice 3 (detalhes em `docs/slice-3.md`):

- Rotas com prefixo de idioma: `/pt/` e `/en/` (home) e `/pt|en/{activities,experience,courses,projects,journal}`. A raiz `/` escolhe o idioma por `navigator.language` (EN se começar com `en`, senão PT); sem JS mostra os dois links, PT primeiro.
- `lang` (`en` ou `pt`) é obrigatório em cursos, projetos, experiência e atividades; `translation_of` opcional. Um arquivo por idioma em `src/content/<tipo>/pt/` e `src/content/<tipo>/en/`, com o mesmo nome; o `lang` bate com a pasta e o `draft` é igual nos dois. O `about` segue um arquivo por idioma na pasta plana (`about/pt.md`, `about/en.md`).
- `ui` tem um arquivo por idioma (`pt.json`, `en.json`) com as mesmas chaves; chave obrigatória `langSwitch: { label, text, name }`. `getUi(lang)` lê o arquivo do idioma.
- Botão de idioma `#lang-switch` no cabeçalho leva à mesma página no outro idioma; o `<head>` tem `<link rel="alternate" hreflang>`. Todo link interno fica no mesmo idioma e passa por `localePath` (respeita `BASE_URL`).
- Data curta dos cursos: `dd/mm` em PT e `mm/dd` em EN.

Decisões da slice 4 (detalhes em `docs/slice-4.md`):

- Rotas do Journal, por idioma: `/<lang>/journal` (mês mais recente com entrada), `/<lang>/journal/month/AAAA-MM`, `/<lang>/journal/day/AAAA-MM-DD`, `/<lang>/journal/themes` e `/<lang>/journal/themes/<slug>`. Só existem páginas para meses, dias e temas com entrada publicada em algum idioma.
- Sem JavaScript: calendário é tabela gerada no build, semana começa no domingo; abas Calendário e Temas são links.
- Tema = tag, com slug em kebab-case sem acento (`Machine Learning` vira `machine-learning`); `tags` iguais nos dois idiomas de um par. O título do tema vem da coleção `themes`, se existir.
- Entrada sem tradução aparece no outro idioma com o aviso "ainda sem tradução", sem 404 (fecha o item adiado da slice 3).
- Toda tag precisa gerar slug de tema não vazio (ao menos uma letra ou número ASCII depois de tirar acentos); o schema recusa tags como `++` ou `日本語`.
- RSS fica para a slice de deploy.

Regras:

- O calendário do Journal mostra um ponto nos dias que têm entrada; clicar abre o dia.
- A aba Temas agrupa as entradas pelas `tags`. Resumo manual por tema é opcional; sem ele, aparece só a lista de entradas.
- Cursos mostram "62% · atualizado em 12/11". Sem `updated_at` recente, o número parece abandonado.
- Datas de experiência e atividade seguem o LinkedIn (ex.: Integração 2024–2026, STEM 2023–2026), nunca "atual" para o que já terminou.
- Entradas com `draft: true` não aparecem nas páginas nem no RSS.

## Bilíngue e /journal-translate

Clara escreve cada entrada uma vez, no idioma que preferir, e uma tradução em lote cria o arquivo no outro idioma depois. Sem chave de API: a tradução roda dentro do Claude Code, com a assinatura que ela já tem.

Estrutura de pastas (um arquivo por idioma, mesmo nome):

```markdown
src/content/journal/en/2026-11-15-spec-do-site.md
src/content/journal/pt/2026-11-15-spec-do-site.md
```

Comando `/journal-translate` (skill a criar em `~/.claude/skills/journal-translate/`):

1. Lista as entradas que não têm arquivo no outro idioma e ignora as com `draft: true`, a menos que Clara peça.
2. Rascunha a tradução mantendo os campos (`date`, `tags`, `links`) iguais e traduzindo `title`, `did` e `learned`.
3. Mostra cada tradução para aprovação.
4. Só depois de aprovada, salva o arquivo e preenche `translation_of` apontando para o original. Não faz commit sozinha.

Trocar idioma no site leva à mesma página no outro idioma. Se a tradução ainda não existe, o site mostra a entrada original com um aviso "ainda sem tradução", sem página quebrada.

A verificar na implementação: se o Pages CMS lida bem com uma pasta por idioma. Se não lidar, o plano B é um campo `lang` e uma pasta só.

## Pages CMS: publicar pelo navegador

Clara abre o Pages CMS (app.pagescms.org), entra com o GitHub, escolhe o repositório e preenche um formulário; ao salvar, o CMS faz o commit do markdown no repositório e o GitHub Pages republica o site. O Pages CMS é gratuito e de código aberto, e a configuração fica em `.pages.yml` na raiz do repo.

O `.pages.yml` precisa de uma coleção para cada tipo do modelo de conteúdo:

- `journal-en` e `journal-pt`, com os campos da entrada diária e a caixa `draft`.
- `courses`, `projects`, `experience`, `activities` e `about`.
- Imagens (foto, screenshots) numa pasta de mídia própria.

Fluxo diário: abrir o Pages CMS, criar entrada nova em Journal, preencher `did`, `learned` e `tags`, salvar. Se marcar `draft`, a entrada fica fora do site até desmarcar.

A conferir na implementação: nomes exatos dos tipos de campo e se o Pages CMS aceita duas pastas de idioma para o mesmo tipo. O agente de implementação deve ler a documentação atual do Pages CMS antes de escrever o `.pages.yml`, em vez de confiar em exemplos de memória.

## Testes e critérios de aceite

Uma entrega só está pronta quando o CI (job `check`) passa e os critérios abaixo são verdadeiros. Os testes entram no mesmo PR do recurso, não depois.

| Teste | O que garante |
| --- | --- |
| Build | `npm run build` termina sem erro |
| Validação de conteúdo | Todo arquivo de conteúdo tem os campos obrigatórios; `progress` entre 0 e 100; datas válidas; `lang` só en ou pt |
| Links quebrados | Nenhum link interno quebrado; o link externo quebrado vira aviso |
| Rascunhos | Entrada com `draft: true` não aparece em nenhuma página, no calendário nem no RSS |
| Idiomas | A troca de idioma leva à mesma página; sem tradução, mostra o aviso e não dá erro 404 |
| Dados sensíveis | Nenhum e-mail ou telefone no HTML gerado |

Critérios de aceite da versão 1 (sem o jogo):

- Home com foto, texto de apresentação e botão "Saiba mais".
- As cinco páginas de conteúdo e o Journal abrem e mostram o conteúdo inicial.
- Clara cria uma entrada de journal pelo Pages CMS e ela aparece no site em até alguns minutos.
- Boa leitura no celular e navegação por teclado.
- Acessibilidade básica: contraste e textos alternativos nas imagens. \[Suposição\] Medir com Lighthouse na entrega para ter números reais.

## Direção visual

O site tem cara de terminal, mas com base neutra e um único acento suave por tema. Abre no tema escuro; um botão "\[ light \]" no cabeçalho alterna para o claro. A referência de estrutura é o portfólio CLI em Astro (fonte JetBrains Mono, rótulos `$ whoami`, rodapé de barra de status); a cor e a forma são próprias.

| Token | Tema escuro (padrão) | Tema claro |
| --- | --- | --- |
| Fundo | `#14141A` | `#FAFAF8` |
| Texto | `#ECECF1` | `#1E1E24` |
| Texto secundário | `#9A9AA8` | `#6A6A75` |
| Borda | `#2A2A35` | `#E4E2DD` |
| Divisória tracejada | `#33333F` | `#D5D3CD` |
| Acento (links, botão, `$ whoami`) | `#B7A3F0` (lilás) | `#0B7C86` (turquesa) |
| Texto sobre o acento | `#14141A` | `#FAFAF8` |

Regras:

- Uma fonte só: JetBrains Mono, hospedada no próprio site (`@fontsource`), sem Google Fonts.
- Cantos de 6 a 8 px, divisórias tracejadas, pontinhos de janela em cinza com um só na cor do acento.
- Sem efeito de scanlines nem brilho.
- Cor do acento só em links, botões, rótulos `$` e detalhes; nunca em parágrafos longos.
- Textos longos (parágrafos do Journal) precisam de entrelinha confortável e largura máxima de linha. A fonte monoespaçada cansa em texto longo.
- O tema escolhido fica guardado no navegador do visitante; sem escolha salva, segue o escuro.
- Contraste: \[Suposição\] as cores acima têm contraste aproximado acima de 4,5:1 para texto pequeno (conta aproximada, não medida). Medir com Lighthouse na entrega e ajustar o acento se algum par ficar abaixo.

## Conteúdo inicial e pendências

Os dados abaixo vêm do PDF do LinkedIn de Clara e servem de ponto de partida; ela revisa os textos e os números com o site pronto.

| Item | Dados do LinkedIn | A confirmar |
| --- | --- | --- |
| LEPV | Presidente e cofundadora, jan/2026 em diante; viagem a São Paulo com 11 membros e 11 empresas visitadas; hackathon em preparação | "15 empresas" na home: Clara mantém e confere depois; LinkedIn diz 11 na viagem |
| Integração IME | Presidente ago/2024 a jan/2026; 12 eventos com PRIO, XP e Stone; avaliação dos alunos +40%; 10 oportunidades diretas de estágio | Nada pendente |
| STEM IME Girls to Girls | Diretora de Gestão e Financeiro jan/2025 a jun/2026; antes membro da equipe desde ago/2023; calendário semestral e orçamento | Nada pendente |
| ILOS | Estagiária jul/2025 a jan/2026; análise e visualização de dados com R | Nada pendente |
| PRIO | Estagiária de verão, jan/2025 (1 mês); software de RBI para válvulas (API 580/581) | Nada pendente |
| EB | Não consta no LinkedIn | Incluir ou não; se sim, confirmar se há restrição de divulgação |
| CNPq | Bolsista mai/2024 a jan/2025; corrosão de implantes de Ti-6Al-4V | Incluir em "Estágios e Pesquisa" |
| Cursos | CCNA 1 (em andamento), CS50 (semana 0), curso de Stanford (a definir), Metodologias Ágeis (certificação no LinkedIn) | Stanford = Machine Learning Specialization (DeepLearning.AI e Stanford Online, 3 cursos, cerca de 95 h); falta a porcentagem de cada curso |
| Projetos | Site da Dra. Karla; qhoras | qhoras = app de horário em grupo, com documentação própria; Dra. Karla autorizou mostrar o site (antes ficaria como `draft: true` até confirmar) |

Outras pendências:

- Foto de Clara para a home.
- Texto final em inglês e em português para cada página.
- Referência visual: print ou três pontos do que ela gosta no hackbrasil.com.

## Ordem de execução e fase do jogo

A versão 1 é o site sem jogo, entregue pelo fluxo `/feature` do `ai-library`; o mapa do jogo é a versão 2, em cima do mesmo conteúdo.

1. Clara roda `/new-project` num repositório novo. Respostas esperadas: web-app, Node (Astro), público, com testes, sem banco.
2. Guardar esta spec no repositório novo (por exemplo em `docs/spec.md`) e pedir ao `/feature` a versão 1, com os critérios de aceite acima.
3. Criar o `.pages.yml` e testar uma entrada de journal pelo Pages CMS.
4. Criar a skill `/journal-translate` e testar com duas entradas reais.
5. Ativar o GitHub Pages e conferir o endereço público.
6. Clara revisa textos e números (inclusive o "15").
7. Versão 2: mapa do jogo.

Para que o teste do Fable 5.2 valha como comparação, rode uma tarefa pequena e igual (por exemplo, a validação de conteúdo) com outro modelo e compare resultado, tempo e custo.

Versão 2, o mapa do jogo:

- Mapa com personagem parecido com Clara que anda até as cinco caixinhas, e cada caixinha abre a página de conteúdo já existente.
- Biblioteca provisória: Kaplay.js. \[Suposição\] Ainda não foi prototipada com Astro.
- O jogo carrega só na rota do mapa, para não pesar nas outras páginas.
- Teclado e toque funcionam, e o link "ver versão simples" continua visível.
- A arte do personagem precisa ser original ou de uso permitido, sem copiar o demo de referência.

## Riscos e o que mudaria as decisões

| Risco | Por que importa | O que fazer |
| --- | --- | --- |
| Número "15 empresas" diferente do LinkedIn (11) | Recrutador compara os dois | Clara confere antes de divulgar; alinhar LinkedIn e site |
| Repositório público expõe rascunhos | `draft: true` esconde da página, não do repo | Nada sensível em rascunho; Karla só entra no site depois da autorização |
| Estágio no EB | Pode haver restrição de divulgação (suposição) | Confirmar antes de publicar detalhes |
| Diário parado | Site com última entrada de meses atrás parece abandonado | Meta realista (por exemplo, 3 entradas por semana) e entradas curtas |
| Jogo atrapalha o recrutador | Quem tem poucos segundos pode sair | Páginas simples sempre acessíveis, link "ver versão simples" e botão de CV |
| Pages CMS não lida com duas pastas de idioma | Quebra o fluxo de publicação | Plano B: uma pasta só com campo `lang` |
| Custo do Fable 5.2 | Modelo caro (US$ 8 de entrada e US$ 40 de saída por milhão de tokens na API), podendo cobrar do saldo de uso | Acompanhar o uso na primeira semana |

O que mudaria as decisões:

- **Astro:** se o Pages CMS não funcionar com a estrutura de pastas, vale trocar o CMS antes de trocar o framework.
- **Repositório público:** se Clara quiser rascunhos privados, ela passa a precisar de outro tipo de hospedagem ou de um repositório separado só para o conteúdo privado.
- **Jogo na versão 1:** só se as páginas simples já estiverem prontas e testadas.
