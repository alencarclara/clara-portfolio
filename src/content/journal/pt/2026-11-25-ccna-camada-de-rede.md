---
date: 2026-11-25
lang: pt
title: "CCNA, módulo 8: a camada de rede"
did: Fiz o oitavo módulo do CCNA Introdução às Redes, sobre a camada de rede do modelo OSI. É a camada que fornece os serviços para que dispositivos finais troquem dados entre redes diferentes, e seus protocolos mais conhecidos são IPv4, IPv6 e OSPF.
learned: "Os protocolos da camada de rede cuidam do endereçamento dos dispositivos finais, do encapsulamento, do roteamento e do desencapsulamento. O IP é sem conexão, de melhor esforço e independente de mídia, ou seja, não garante que o pacote enviado chegue ao destino. Também vi como um host decide para onde mandar um pacote. Ele pode enviar para si mesmo, para outro host local ou para um host remoto. No IPv4, o host compara o próprio endereço e a máscara de sub-rede com o endereço de destino para saber se o destino está na mesma rede; no IPv6, quem anuncia o prefixo da rede local é o roteador. O que não é local vai para o gateway padrão, o roteador com endereço na mesma faixa da rede local que encaminha o tráfego para outras redes. O host aprende esse gateway por DHCP ou configuração manual no IPv4, e pelo anúncio do roteador ou configuração manual no IPv6. No Windows, route print ou netstat -r mostram a tabela de roteamento do host."
tags: [CCNA, Networking]
draft: false
links: ["https://www.netacad.com/launch?id=6abe5e7e-dcad-4a60-aec5-03ea0376504e&tab=curriculum&view=c36af831-3574-11ee-8257-9bcd80fefc7d"]
---
