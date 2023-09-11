---
title: 前端监控 - 如何测量TTFB
date: 2019-06-16 22:00:00
tags: 前端监控
---

```js

new PerformanceObserver((entryList) => {
  const [pageNav] = entryList.getEntriesByType('navigation');

  console.log(`TTFB: ${pageNav.responseStart}`);
}).observe({
  type: 'navigation',
  buffered: true
});

```