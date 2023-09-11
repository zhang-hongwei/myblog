---
title: 前端监控 - PerformanceNavigationTiming
date: 2019-06-16 22:00:00
tags: 前端监控
---

# **`PerformanceNavigationTiming`**

**`PerformanceNavigationTiming`** 是 Web Performance API 的一部分，用于提供有关页面导航和加载性能的详细信息。它可以帮助开发人员分析页面导航过程中的各种性能指标，包括页面加载时间、重定向次数、DNS查询时间、TCP连接时间等。

**`PerformanceNavigationTiming`** 对象包含了以下主要属性：

1. **`navigationStart`：** 表示浏览器开始导航的时间戳。
2. **`unloadEventStart` 和 `unloadEventEnd`：** 表示页面卸载事件（**`beforeunload`**）的开始和结束时间。
3. **`redirectStart` 和 `redirectEnd`：** 表示重定向的开始和结束时间。
4. **`fetchStart` 和 `domainLookupStart`：** 分别表示开始获取文档和开始进行DNS查询的时间。
5. **`domainLookupEnd` 和 `connectStart`：** 分别表示DNS查询结束和开始建立TCP连接的时间。
6. **`connectEnd` 和 `secureConnectionStart`：** 分别表示TCP连接建立结束和开始安全连接的时间。
7. **`requestStart` 和 `responseStart`：** 分别表示开始发送请求和接收响应的时间。
8. **`responseEnd`：** 表示接收响应完成的时间。
9. **`domLoading` 和 `domInteractive`：** 分别表示DOM开始加载和变得可交互的时间。
10. **`domContentLoadedEventStart` 和 `domContentLoadedEventEnd`：** 分别表示DOMContentLoaded事件的开始和结束时间。
11. **`domComplete`：** 表示DOM加载完成的时间。
12. **`loadEventStart` 和 `loadEventEnd`：** 分别表示load事件的开始和结束时间。

这些属性提供了关于浏览器页面导航和加载过程的详细时间戳，可以用于分析性能问题并优化页面加载速度。通过检查这些时间戳，开发人员可以了解哪个阶段的性能较差，并采取措施来改进用户体验。

例如，可以使用 **`PerformanceNavigationTiming`** 来计算页面的总加载时间，检测重定向的时间，分析DNS查询和TCP连接的时间等等。这些信息对于前端性能优化和问题排查非常有帮助。