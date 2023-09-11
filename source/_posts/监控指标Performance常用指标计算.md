---
title: 前端监控 - 常用指标计算
date: 2019-06-16 22:00:00
tags: 前端监控
---
PerformanceNavigationTiming是Web Performance API中的一个接口，它提供了有关网页导航性能的详细信息。您可以使用这些信息来计算网页的常用性能指标，例如页面加载时间、DNS解析时间、TCP连接时间等。以下是一些常见的网页性能指标，以及如何使用PerformanceNavigationTiming计算它们：

## 1. 页面加载时间 (Page Load Time):页面加载时间是从导航开始到页面完全加载并可交互的时间

```jsx
  const navigationTiming = performance.getEntriesByType('navigation')[0];
  const pageLoadTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart;
  console.log('Page Load Time:', pageLoadTime, 'ms');
```

## 2. DNS解析时间 (DNS Resolution Time):DNS解析时间是浏览器将域名解析为IP地址所需的时间

```jsx
const navigationTiming = performance.getEntriesByType('navigation')[0];
const dnsTime = navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart;
console.log('DNS Resolution Time:', dnsTime, 'ms');
```

## 3. TCP连接时间 (TCP Connection Time):TCP连接时间是浏览器建立与服务器的TCP连接所需的时间

```jsx
const navigationTiming = performance.getEntriesByType('navigation')[0];
const tcpTime = navigationTiming.connectEnd - navigationTiming.connectStart;
console.log('TCP Connection Time:', tcpTime, 'ms');
```

## 4. 服务器响应时间 (Server Response Time):服务器响应时间是服务器处理请求并开始返回响应的时间

```jsx
const navigationTiming = performance.getEntriesByType('navigation')[0];
const serverResponseTime = navigationTiming.responseStart - navigationTiming.requestStart;
console.log('Server Response Time:', serverResponseTime, 'ms');
```

## 5. 页面渲染时间 (Page Rendering Time):页面渲染时间是从导航开始到页面可见内容完成渲染的时间。

```jsx
const navigationTiming = performance.getEntriesByType('navigation')[0];
const pageRenderTime = navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart;
  console.log('Page Rendering Time:', pageRenderTime, 'ms');
```

## 6. 白屏时间： 从导航开始到首次绘制内容的时间。

```jsx

    // 获取首次绘制事件时间戳
    const firstPaintTime = performance.getEntriesByType('paint')[0].startTime;
		const navigationTiming = performance.getEntriesByType('navigation')[0];
	
		// 计算白屏时间
		const whiteScreenTime = firstPaintTime - navigationTiming.navigationStart;
		console.log('白屏时间:', whiteScreenTime, 'ms');
```

## 7. 首屏时间：从导航开始到首屏内容渲染完成的时间。

```jsx

  // 获取PerformanceNavigationTiming对象
  const navigationTiming = performance.getEntriesByType('navigation')[0];

  // 计算首屏时间
  const firstScreenTime = navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart;
  
  console.log('首屏时间:', firstScreenTime, 'ms');
```