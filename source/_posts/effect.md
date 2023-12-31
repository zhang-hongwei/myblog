---
title: Effect
date: 2022-04-20 21:00:00
tags: React
---

- 与事件不同，Effect 是由渲染本身，而非特定交互引起的。
- Effect 允许你将组件与某些外部系统（第三方 API、网络等）同步。
- 默认情况下，Effect 在每次渲染（包括初始渲染）后运行。
- 如果 React 的所有依赖项都与上次渲染时的值相同，则将跳过本次 Effect。
- 不能随意选择依赖项，它们是由 Effect 内部的代码决定的。
- 空的依赖数组（`[]`）对应于组件“挂载”，即添加到屏幕上。
- 仅在严格模式下的开发环境中，React 会挂载两次组件，以对 Effect 进行压力测试。
- 如果 Effect 因为重新挂载而中断，那么需要实现一个清理函数。
- React 将在下次 Effect 运行之前以及卸载期间这两个时候调用清理函数。

## Effect 在组件挂载时运行了两次

在开发环境下，如果开启严格模式，React 会在实际运行 setup 之前额外运行一次 setup 和 cleanup。

这是一个压力测试，用于验证 Effect 的逻辑是否正确实现。如果出现可见问题，则 cleanup 函数缺少某些逻辑。cleanup 函数应该停止或撤消 setup 函数所做的任何操作。一般来说，用户不应该能够区分 setup 被调用一次（如在生产环境中）和调用 setup → cleanup → setup 序列（如在开发环境中）。


### Effect 在每次重新渲染后都运行

首先，请检查是否忘记指定依赖项数组：

```
useEffect(() => {
  // ...
}); // 🚩 没有依赖项数组：每次重新渲染后重新运行！
```

如果你已经指定了依赖项数组，你的 Effect 仍循环地重新运行，那是因为你的某个依赖项在每次重新渲染时都是不同的。

你可以通过手动打印依赖项到控制台来调试此问题：

```
  useEffect(() => {
    // ..
  }, [serverUrl, roomId]);

  console.log([serverUrl, roomId]);
```
