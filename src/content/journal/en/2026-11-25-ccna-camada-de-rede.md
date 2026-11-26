---
date: 2026-11-25
lang: en
title: "CCNA, module 8: the network layer"
did: I completed the eighth module of CCNA Introduction to Networks, about the network layer of the OSI model. This is the layer that provides the services that let end devices exchange data across different networks, and its best-known protocols are IPv4, IPv6 and OSPF.
learned: "Network layer protocols handle end device addressing, encapsulation, routing and de-encapsulation. IP is connectionless, best effort and media independent, which means it does not guarantee that a sent packet reaches its destination. I also saw how a host decides where to send a packet. It can send to itself, to another local host or to a remote host. In IPv4, the host compares its own address and subnet mask with the destination address to tell whether the destination is on the same network; in IPv6, the local router advertises the local network prefix. Anything that is not local goes to the default gateway, the router with an address in the local network's range that forwards traffic to other networks. The host learns this gateway through DHCP or manual configuration in IPv4, and through the router's advertisement or manual configuration in IPv6. On Windows, route print or netstat -r shows the host's routing table."
tags: [CCNA, Networking]
draft: false
links: ["https://www.netacad.com/launch?id=6abe5e7e-dcad-4a60-aec5-03ea0376504e&tab=curriculum&view=c36af831-3574-11ee-8257-9bcd80fefc7d"]
translation_of: 2026-11-25-ccna-camada-de-rede
---
