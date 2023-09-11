---
title: nginx常用命令
date: 2020-04-12 20:30:00
tags: nginx
---

Nginx 是一个流行的开源反向代理服务器和 Web 服务器，以下是一些常用的 Nginx 命令，用于控制 Nginx 的运行和配置：

1. 启动 Nginx：
    
    ```bash
    sudo nginx
    ```
    
2. 停止 Nginx：
    
    ```bash
    sudo nginx -s stop
    ```
    
3. 重新加载配置文件（不中断正在处理的连接）：
    
    ```bash
    sudo nginx -s reload
    ```
    
4. 重启 Nginx（停止并重新启动）：
    
    ```bash
    sudo nginx -s restart
    ```
    
5. 检查配置文件语法是否正确：
    
    ```bash
    sudo nginx -t
    ```
    
6. 查看 Nginx 版本信息：
    
    ```bash
    nginx -v
    ```
    
7. 查看 Nginx 运行状态（列出当前活动的连接）：
    
    ```bash
    sudo nginx -s status
    ```
    
8. 停止 Nginx 并退出（用于升级 Nginx 版本）：
    
    ```bash
    sudo nginx -s quit
    ```
    
9. 显示 Nginx 的帮助信息：
    
    ```bash
    nginx -h
    ```
    

这些命令可以帮助你管理 Nginx 服务器的运行状态和配置。请根据你的需求和操作系统类型（Linux、macOS、Windows等）来使用适当的命令。注意，在执行配置文件修改后，使用 **`sudo nginx -s reload`** 命令可以重新加载配置文件，而不需要停止 Nginx，以确保新的配置生效。