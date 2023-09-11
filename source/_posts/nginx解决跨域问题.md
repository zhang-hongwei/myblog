---
title: nginx解决跨域问题
date: 2020-09-05 20:00:00
tags: nginx
---

## 如果前端文件就在nginx服务下

如果前端文件在当前访问的Nginx服务器上，通常只需要配置反向代理就可以解决跨域问题。跨域问题通常是由于浏览器的同源策略 (Same-Origin Policy) 导致的，它限制了浏览器在不同源（域名、端口、协议）之间进行跨域请求。

通过配置反向代理，前端请求可以发送到同一个域名和端口上，这样就不会触发浏览器的跨域安全策略。下面是一个简单的Nginx配置示例，假设前端文件位于**`/var/www/html`**目录下，后端服务在本地的3000端口上运行：

```bash
server {
    listen 80;
    server_name yourdomain.com;  # 替换成你的域名

    location / {
        root /var/www/html;  # 前端文件所在目录
        index index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;  # 后端服务地址
    }
}

```

上述配置中，Nginx将前端文件提供在根路径下，而对于所有以**`/api/`**开头的请求，它会将请求代理到本地的后端服务，实现了跨域请求的解决方案。前端可以通过相对路径或绝对路径来访问后端API，而不会受到同源策略的限制。

请确保将**`yourdomain.com`**替换为你的实际域名，并根据实际情况修改配置以适应你的项目需求。

## 如果和当前nginx存在跨域

要在 Nginx 中解决跨域问题，你可以使用 Nginx 的配置来添加跨域请求所需的响应头。以下是一个示例 Nginx 配置，用于启用跨域资源共享 (CORS) 支持：

```bash
server {
    listen 80;
    server_name yourdomain.com;  # 替换成你的域名

    location / {
        # 允许所有来源的跨域请求
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';

        root /var/www/html;  # 前端文件所在目录
        index index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;  # 后端服务地址
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # 允许所有来源的跨域请求
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
    }
}

```

上述配置示例中，我们在两个 **`location`** 块中添加了 CORS 相关的响应头：

- **`add_header 'Access-Control-Allow-Origin' '*'`**：允许所有来源的跨域请求，可以根据需求更改为特定的域名。
- **`add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS'`**：指定允许的 HTTP 请求方法。
- **`add_header 'Access-Control-Allow-Headers'`**：指定允许的请求头。
- **`add_header 'Access-Control-Expose-Headers'`**：指定允许浏览器访问的响应头。

请根据你的需求来自定义这些响应头。配置完成后，重新加载 Nginx 配置以使更改生效（使用 **`sudo nginx -s reload`** 命令），然后你的 Nginx 服务器将支持跨域请求。确保配置文件中的路径和域名适应你的具体项目需求。