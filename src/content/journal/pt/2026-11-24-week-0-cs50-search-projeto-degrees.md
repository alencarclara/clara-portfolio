---
date: 2026-11-24
lang: pt
title: Week 0 CS50 - Search - Projeto Degrees
did: >-
  No domingo comecei o curso CS50 AI. O tema da primeira semana é busca:
  algoritmos que procuram a solução de um problema e que podem ser usados para
  achar o caminho em um labirinto, jogar jogo da velha ou até xadrez. Os
  algoritmos que vimos foram BFS, DFS, greedy best-first, A* e Minimax.


  Alguns conceitos importantes: agente, estado, ação, nó, nó pai (parent),
  caminho (path) e fronteira.


  O projeto Degrees

  O objetivo é construir um programa que calcula a "distância" entre dois atores
  de Hollywood, contando quantos filmes os separam. Por exemplo, Jennifer
  Lawrence e Tom Hanks estão a 2 graus de distância: ela atuou com Kevin Bacon
  em X-Men: First Class, e ele atuou com Tom Hanks em Apollo 13.


  Para resolver, usei BFS. Ele explora primeiro os estados mais próximos do ator
  de origem, então o primeiro caminho que encontra até o destino é sempre o mais
  curto em número de filmes, caso exista. Isso funciona porque cada filme conta
  como um passo de mesmo custo
learned: >-
  O que mais me marcou

  Neste projeto só é permitido usar a IA do próprio curso, e ela nunca entrega a
  resposta. Quando fui tirar dúvidas, em vez de me dar a solução, ela me fez
  pensar no conceito e sugeriu formas de testar o código para descobrir o que
  podia estar errado.


  Depois de meses recorrendo à IA assim que surge uma dúvida, percebi o quanto
  meu cérebro se acostumou a não procurar a solução por conta própria.
tags:
  - AI
  - Search
  - CS50
draft: false
links:
  - https://cs50.harvard.edu/ai/weeks/0/
---
