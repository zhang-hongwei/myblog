---
title: React 性能优化
date: 2023-01-05 20:00:00
tags: React
---

## 如何查找性能问题
1. ****使用React Profiler分析工具查找React项目的性能问题****
![](https://s2.loli.net/2023/08/28/mHwE71KypnUx6do.png)

2. ****chrome 性能控制台****
![](https://s2.loli.net/2023/08/28/DX4J9IHpvrqVF5n.png)

## 如何解决性能问题
1. 组件合理划分，可以
    1. 细分粒度
2. 避免不必要的更新
    1. memo
    2. useMemo
    3. PureComponent
    4. shouldComponentUpdate
3. 状态下放
    1. 由于react组件更新，会导致所有子组件也更新渲染，我们只需要将变化部分抽离出去，下放到子组件就能解决。
4. 内容提升
    1. 子组件的 re-render 是不会影响 props 的，即与 props 无关。所以我们可以通过 props的方法传递无关的组件，来避免 re-render 。
5. 列表项使用key
6. 按需加载
    1. 懒加载
    2. 懒渲染
    3. 虚拟列表