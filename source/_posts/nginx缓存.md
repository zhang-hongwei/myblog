---
title: nginx 缓存
date: 2020-08-15 20:00:00
tags: nginx
---

在 Nginx 中，您可以通过配置 HTTP 头信息来设置资源缓存，以提高网站性能并减少服务器负载。资源缓存是通过设置Cache-Control和Expires等 HTTP 头字段来实现的。以下是如何在 Nginx 中设置资源缓存的一般步骤：

打开 Nginx 配置文件： 使用文本编辑器打开您的 Nginx 配置文件。通常，这个文件位于/etc/nginx/nginx.conf或/etc/nginx/sites-available/default，具体路径可能因您的系统和配置而异。

在配置文件中添加缓存规则： 在 Nginx 配置文件中，您可以使用location块来设置缓存规则。以下是一个示例，将.css和.js文件缓存 7 天：

```bash

location ~* \.(css|js)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800";
}

```

在这个示例中，location块匹配所有以.css或.js结尾的文件。expires指令设置缓存的过期时间为 7 天，Cache-Control头信息设置缓存策略为"public"（允许代理服务器和浏览器缓存）和"max-age"（缓存最大有效时间为 604800 秒，即 7 天）。

重启 Nginx 服务器： 在修改 Nginx 配置后，执行以下命令来重新加载配置并应用更改：

```bash
sudo systemctl restart nginx

```

现在，Nginx 将根据您的配置来设置资源缓存，减少对服务器的请求，提高网站性能。
