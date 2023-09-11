---
title: 前端监控 - 如何测量FID
date: 2019-06-16 22:00:00
tags: 前端监控
---


```js

new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    const delay = entry.processingStart - entry.startTime;
    console.log('FID candidate:', delay, entry);
  }
}).observe({type: 'first-input', buffered: true});

```