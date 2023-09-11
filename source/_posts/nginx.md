---
title: nginx 基础知识
date: 2020-04-10 20:30:00
tags: nginx
---
<aside>
💡 **是一个高性能、轻量级的开源Web服务器和反向代理服务器**

</aside>

## 什么是nginx

Nginx（发音为"engine-x"）是一个开源的高性能、轻量级的Web服务器和反向代理服务器。它以其出色的性能、稳定性和可扩展性而闻名，并广泛用于构建和部署Web应用程序。以下是Nginx的详细介绍：

1. **高性能**：Nginx以其卓越的性能而著称。它能够处理大量的并发连接，有效地分发请求，并迅速响应客户端的HTTP请求。这使得Nginx成为处理高流量和负载的网站的理想选择。
2. **轻量级**：Nginx的设计目标之一是保持轻量级。它使用较少的内存和资源，因此可以在资源有限的环境中运行得非常出色。这使得Nginx非常适合用作边缘服务器或嵌入式设备。
3. **反向代理**：Nginx可以作为反向代理服务器，充当客户端和后端服务器之间的中介。它接收来自客户端的请求，然后将请求转发到一个或多个后端服务器，然后将后端服务器的响应返回给客户端。这对于负载均衡、SSL终端、缓存和安全性非常有用。
4. **负载均衡**：Nginx支持多种负载均衡算法，如轮询、加权轮询、IP哈希等。这使得它能够将流量均匀分发到多个后端服务器，提高了系统的性能和可扩展性。
5. **静态文件服务**：Nginx可以高效地提供静态文件，如HTML、CSS、JavaScript、图像和视频等。它支持高速缓存和智能HTTP请求处理，以提高静态内容的传送速度。
6. **SSL/TLS支持**：Nginx支持SSL/TLS协议，可以用于安全地终止加密连接，提供加密和解密功能，以确保数据在传输过程中的安全性。
7. **虚拟主机**：Nginx允许配置多个虚拟主机，使多个域名可以在同一台服务器上共存。这使得它非常适合用于托管多个网站或应用程序的服务器。
8. **模块化架构**：Nginx采用模块化架构，允许用户通过添加模块来扩展其功能。它具有丰富的第三方模块和插件生态系统，可以实现各种高级功能，如缓存、安全性、压缩等。
9. **社区和支持**：Nginx是一个开源项目，拥有强大的用户社区和活跃的开发者社区。这意味着您可以轻松找到文档、教程和支持资源来解决问题和学习如何使用Nginx。

## **Nginx能干什么**

1. **Web服务器**：Nginx可以用作静态和动态内容的Web服务器。它可以处理HTTP请求，并根据配置文件将请求路由到相应的网站或应用程序。Nginx的高性能和低资源消耗使其成为处理高流量网站的理想选择。
2. **反向代理服务器**：Nginx经常用作反向代理服务器，充当客户端和一个或多个后端服务器之间的中介。当客户端发送请求时，Nginx接收请求并将其转发到后端服务器，然后将后端服务器的响应返回给客户端。这对于负载均衡、SSL终端、缓存、安全性和高可用性等方面都非常有用。
3. **负载均衡**：Nginx支持负载均衡算法，可以将流量均匀分布到多个后端服务器上，以提高应用程序的性能和可扩展性。它可以用于分散Web流量、API请求、数据库查询等。
4. **反向代理缓存**：Nginx可以缓存后端服务器的响应，以减轻后端服务器的负载，提高响应速度，并减少对后端的请求。这对于动态内容的加速和减少数据库负载非常有用。
5. **SSL/TLS终端**：Nginx可以用于终止SSL/TLS加密，将加密和解密的负担从后端服务器转移到Nginx服务器上。这有助于提高性能并简化SSL证书管理。
6. **静态文件服务**：Nginx可以有效地提供静态文件，如HTML、CSS、JavaScript、图像和视频等。它可以通过高速缓存和智能HTTP请求处理来加速静态内容的传送。
7. **反向代理保护**：Nginx可以用于保护后端服务器免受恶意攻击，如DDoS（分布式拒绝服务）攻击。它可以限制请求速率、过滤恶意流量，并提供一定程度的安全性。
8. **TCP和UDP代理**：Nginx还可以用于代理TCP和UDP流量，不仅限于HTTP。这使其非常适合用于代理游戏服务器、邮件服务器、DNS服务器等。
9. **动静分离：**Nginx 动静分离是一种常见的网站性能优化策略，它的主要思想是将网站的静态内容（如HTML、CSS、JavaScript、图像、视频等）与动态内容（通常是由应用程序生成的内容）分开处理，以提高网站的性能和可维护性。这种策略通过将不同类型的内容交给不同的处理方法来实现。

## Nginx的安装

```bash
第一步:下载我们的nginx 这里以1.6.2版本为例
第二步:共享安装文件到我们的linux上面
第三步:将文件拷贝到/usr/local下面
第四步:安装 tar -zxvf xxxx.tar.gz
第五步:下载所需要的依赖库 yum install pcre  yum install pcre-devel  yum install zlib   yum install zlib-devel
第六步:进行config的配置
cd nginx-1.6.2 && ./configure --prefix=/usr/local/nginx
第七步:安装
make && make install
第八步:启动nginx
/usr/local/nginx/sbin/nginx
关闭: .... -s stop -s reload
查看端口是否有问题
netstat -tunpl |grep 80
浏览器进行验证没问题就可以

```