---
title: sendBeacon API介绍
date: 2019-06-22 22:00:00
tags: js
---
# sendBeacon API介绍

背景：最近在做h5-sdk的埋点上报需求。在考虑数据稳定性保障策略时，想到页面离开时需要及时发送数据到服务端。一开始使用的是使用ajax发送，但是因为ajax是异步的，并且会可能会受到容器destroy影响来不及发送，或者页面卸载了请求还没返回，浏览器可能会取消ajax请求，导致数据没有发送成功。

于是经过调研，我注意到了浏览器提出的新发送策略 -> navigator.sendBeacon。

## 介绍

navigator.sendBeacon是啥？我们看下mdn的解释：

此方法旨在用于分析和诊断代码，以将数据发送到服务器。发送分析数据的问题是，网站通常希望在用户完成页面后（例如，当用户导航到另一个页面时）发送分析数据。在这种情况下，浏览器可能即将卸载页面，在这种情况下，浏览器可能选择不发送异步 XMLHttpRequest请求。

在sendBeacon没有出现之前，想要在页面离开前把数据发送出去，一般是通过延长页面卸载时间，来及时发送数据的。

以前一般在unload/beforeunload/pagehide方法里面执行以下几种策略：

1、通过使用阻塞的同步ajax方法来发送数据

2、创建一个img元素+setTimeout延迟来发送数据

3、创建一个无操作的一段时间循环

以上方法确实能延迟页面的卸载，但缺点是：一是会导致下一页的跳转变慢，给用户带来不好的体验；二是不稳定，如果请求返回比较慢，可能一样会被浏览器取消请求。

如果使用sendBeacon()方法，虽然它也是异步发出请求，但是它的请求与当前页面线程脱钩，作为浏览器进程的任务，因此可以保证会把数据发出去，不拖延卸载流程。

## sendBeacon

- sendBeacon只支持post方法
- data支持哪些类型
    
    data类型可以是：ArrayBuffer，ArrayBufferView，Blob， DOMString，FormData，URLSearchParams。
    

如果你的data是字符串类型，那么content-type会自动匹配为text/plain，如果是FormData类型，

则会自动匹配为multipart/form-data类型。

那如果我想支持json格式的内容怎么办？

可以使用Blob类型来实现。把Blob内容的格式类型设置为json格式就可以，看如下代码：

```jsx
const headers = { type: 'application/json' }; 
const blob = new Blob([JSON.stringify({a:1})], headers); 
window.navigator.sendBeacon(url, blob);
```

## sendBeacon支持跨域吗

sendBeacon是支持跨域的。

w3c文档是这么说的：

如果请求的content-type类型是application/x-www-form-urlencoded, multipart/form-data, text/plain，

它不需要一个option预检请求来检查cors，所以它可以直接跨域，不需要任何设置。

如果请求的content-type不是这3种类型之一，那它所得到的Content-Type就不是一个简单的包，会产生一个预检请求，会检验

Access-Control-Allow-Credentials，Access-Control-Allow-Origin，Access-Control-Allow-Headers这些cors头是否符合跨域要求。

## sendBeacon没有回调函数，只返回一个true/false。

sendBeacon返回true表示的是请求排队成功，等待下一步的执行。（下一步指的是啥，看下面的底层实现）

false表示请求排队失败。

## 浏览器兼容性还可以，目前只是ie不支持，看下面这张图：

![](https://s2.loli.net/2023/09/05/GCYl1x2KrLqdiFh.png)
## 二、navigator.sendBeacon的底层实现

sendBeacon的底层是通过fetch api实现的。

在执行sendBeacon时，会按照以下3个步骤执行：

1、检测数据量大小。

如果sendBeacon要发送的数据量大小超过最大限制则返回false，否则进行下一步。

数据量大小限制：Chrome40-86约65536个字符，数据大小的限制64kb，这些是浏览器层面的限制，不同的浏览器可能还存在细微的差别。

2、检测mimeType类型

如果mimeType值不是CORS安全列出的请求标头值且是跨域的，则直接返回false，否则进行下一步。

3、发起fetch请求 它构造的fetch请求，参数如下：

```jsx
fetch('/xxx', 
{ method: 'POST', 
  url:'', 
  keep-alive: true, 
  body:transmittedData, 
  mode:corsMode, 
  credentials: 'include' 
 });
```

可以注意到，Fetch API 支持一个 keep-alive 选项，

当设置为 true 时，保证不管发送请求的页面关闭与否，请求都会持续到结束。

credentials设置为include，即使是跨域调用，也总是携带cookie。