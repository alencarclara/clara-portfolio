---
date: 2026-11-24
lang: en
title: Week 0 CS50 – Search - Degrees Project
did: >-
  On Sunday I started the CS50 AI course. This week's topic is search:
  algorithms that look for solutions to a problem. They can be used to find a
  path through a maze, play tic-tac-toe, or even play chess. The algorithms we
  covered were BFS, DFS, greedy best-first search, A*, and Minimax.


  Some key concepts: agent, state, action, node, parent, path, and frontier.


  The Degrees project

  The goal is to build a program that calculates the "distance" between two
  Hollywood actors, counting how many movies separate them. For example,
  Jennifer Lawrence and Tom Hanks are 2 degrees apart: she starred with Kevin
  Bacon in X-Men: First Class, and he starred with Tom Hanks in Apollo 13.


  To solve it, I used BFS. It explores the states closest to the source actor
  first, so the first path it finds to the target is always the shortest one in
  number of movies, if one exists. This works because every movie counts as a
  step of equal cost.
learned: >-
  What stood out to me

  In this project you're only allowed to use the course's own AI, and it never
  hands you the answer. When I went to it with questions, instead of giving me
  the solution, it made me think through the concept and suggested ways to test
  my code to figure out what might be wrong.


  It was a very educational exercise. After months of turning to AI the moment a
  question comes up, I realized how much my brain has gotten used to not looking
  for the solution on its own.
tags:
  - AI
  - Search
  - CS50
draft: false
links:
  - https://cs50.harvard.edu/ai/weeks/0/
---
