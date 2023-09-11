---
title: nginx实现动静分离
date: 2020-04-15 21:00:00
tags: nginx
---

## 什么是动静分离
Nginx 动静分离是一种常见的网站性能优化策略，它的主要思想是将网站的静态内容（如HTML、CSS、JavaScript、图像、视频等）与动态内容（通常是由应用程序生成的内容）分开处理，以提高网站的性能和可维护性。这种策略通过将不同类型的内容交给不同的处理方法来实现。

实现Nginx动静分离通常需要以下步骤：

1. **安装和配置Nginx**：首先，确保您已经安装了Nginx并了解其基本配置。通常，Nginx的配置文件位于**`/etc/nginx/nginx.conf`**或**`/usr/local/nginx/conf/nginx.conf`**。
2. **准备静态资源**：将网站的静态资源（如HTML、CSS、JavaScript、图像、视频等）放置在适当的目录中。通常，这些文件位于您的Web根目录下的子目录，如**`/var/www/html/static`**。
3. **配置Nginx虚拟主机**：在Nginx的配置文件中，创建一个虚拟主机配置块，用于处理静态资源。以下是一个示例配置：

```bash
server {
    listen 80;
    server_name yourdomain.com;

    location /static/ {
        alias /var/www/html/static/;
    }

    # 添加其他静态资源的配置，如图片、样式表、JavaScript文件等
}
```

在上面的配置中，**`location /static/`**指定了Nginx如何处理静态资源请求。**`alias`**指令将请求映射到存储静态资源的目录。

1. **配置动态内容的代理**：接下来，配置Nginx以将动态请求代理给应用程序服务器。假设您使用的是PHP，您可以配置如下：

```bash
location / {
    proxy_pass http://your_app_server;
}
```

其中，**`http://your_app_server`**是应用程序服务器的地址，Nginx将把动态请求转发给该地址。

1. **缓存设置（可选）**：根据需要，您可以配置Nginx来缓存动态内容，以减轻应用程序服务器的负载。这可以通过Nginx的**`proxy_cache`**指令来实现。
2. **测试和重载Nginx**：确保您的Nginx配置没有错误，可以运行以下命令测试配置：

```bash
sudo nginx -t
```

如果没有错误，您可以重新加载Nginx以应用新的配置：

```bash
sudo systemctl reload nginx
```

1. **更新DNS记录**：确保您的域名DNS记录将流量正确路由到Nginx服务器。

通过完成上述步骤，您可以实现Nginx的动静分离，将静态资源直接提供给客户端，并将动态请求代理到应用程序服务器。这有助于提高网站性能，减轻应用程序服务器的负载，并改善用户体验。请根据您的具体需求和环境调整上述配置。