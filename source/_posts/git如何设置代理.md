---
title: Git 设置代理
date: 2019-07-15 20:30:00
tags: git
---
```powershell
// 全局代理
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy https://127.0.0.1:7890

// 本地代理
git config --local http.proxy http://127.0.0.1:7890
git config --local https.proxy https://127.0.0.1:7890
```

## 取消 Git 代理使用以下命令：

```powershell
git config --global --unset http.proxy
git config --global --unset https.proxy
```

```powershell
git config --global --unset http.proxy
git config --global --unset https.proxy
```

## 使用以下命令可以查看 Git 是否设置了代理：

```powershell
git config --global --get http.proxy
git config --global --get https.proxy
```