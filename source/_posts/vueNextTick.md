---
title: nextTick的原理
date: 2022-08-10 22:30:00
tags: vue
---

本质是：利用微任务队列

**Vue 官方描述：** 可能你还没有注意到，Vue 在更新 DOM 时是异步执行的。只要侦听到数据变化，Vue 将开启一个队列，并缓冲在同一事件循环中发生的所有数据变更。 如果同一个 watcher 被多次触发，只会被推入到队列中一次。这种在缓冲时去除重复数据对于避免不必要的计算和 DOM 操作是非常重要的。 然后，在下一个的事件循环“tick”中，Vue 刷新队列并执行实际 (已去重的) 工作。Vue 在内部对异步队列尝试使用原生的 Promise.then、MutationObserver 和 setImmediate， 如果执行环境不支持，则会采用 setTimeout(fn, 0) 代替

**直白的说，就是数据更新是同步的，视图更新是异步的，当我们数据更新完毕，视图的更新还处在任务队列中， 如果我们频繁更新数据，Vue 不会马上更新视图，通过将更新操作放入队列，同时进行去重处理，提高性能， 最后，我们需要通过 nextTick 的回调函数，告诉 Vue 底层，当视图更新完毕帮我们执行 nextTick 的回调函数， 完成我们的需求**

**源码分析：nextTick 函数实现，pending 控制 timerFunc 同一时间只能执行一次**


```js

const callbacks = [];
let pending = false;

function flushCallbacks() {
  pending = false;
  const copies = callbacks.slice(0);
  callbacks.length = 0;
  for (let i = 0; i < copies.length; i++) {
    copies[i]();
  }
}

const timerFunc = () => {
  Promise.resolve().then(flushCallbacks);
};

function nextTick(cb) {
  callbacks.push(() => {
    cb();
  });
  if (!pending) {
    pending = true;
    timerFunc();
  }
}

```