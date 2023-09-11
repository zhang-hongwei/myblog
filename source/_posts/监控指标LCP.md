---
title: 前端监控 - 如何计算LCP
date: 2019-06-16 22:00:00
tags: 前端监控
---

```js
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    console.log('LCP candidate:', entry.startTime, entry);
  }
}).observe({type: 'largest-contentful-paint', buffered: true});

```