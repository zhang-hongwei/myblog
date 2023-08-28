---
title: useMemo 和 memo 的区别
date: 2023-01-02 15:54:25
tags: React
---

它们都可以用来缓存数据，避免子组件的无效重复渲染。

**不同点：**React.memo是一个高阶组件，useMemo是一个hook。

**联系：**当我们的父子组件之间不需要传值通信时，可以选择用React.memo来避免子组件的无效重复渲染。但我们的父子组件之间需要进行传值通信时，React.memo和useMemo都可以使用。

React.memo() 和 useMemo() 都是 React 提供的性能优化的钩子函数，它们的作用虽然有些类似，但是使用方式和效果是有区别的。

React.memo() 和 shouldComponentUpdate() 方法类似，都是用来优化组件的渲染性能的。React.memo() 会对组件的 props 进行浅比较，如果 props 没有发生变化，就不会触发组件的重新渲染。React.memo() 的语法如下：

```jsx
const MyComponent = React.memo(functionMyComponent(props) {
/* render using props */
});

```

useMemo() 则是用来优化组件的计算性能的。它会缓存函数的计算结果，并在下一次渲染时直接使用缓存结果，避免重复计算。useMemo() 接收两个参数：计算函数和依赖项数组。只有依赖项数组发生变化时，才会重新计算函数的结果。useMemo() 的语法如下：

```jsx
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

```

React.memo() 和 useMemo() 的区别在于优化的方面不同。React.memo() 优化的是组件的渲染性能，而 useMemo() 优化的是组件的计算性能。React.memo() 只需要在函数组件的定义处添加一个包装即可，而 useMemo() 需要在函数组件内部使用，并且需要手动管理依赖项数组。