---
title: Vue Domdiff
date: 2022-08-10 22:30:00
tags: vue
---

## diff 算法是什么

在之前的更新中，每次更新都会产生新的虚拟节点，通过新的虚拟节点生成真实节点来直接替换老的节点。在更新内容不多时，比如只更新了文本时，还是直接全部替换然后全部重新渲染的话，无疑会造成性能浪费。

`diff` 算法就是比对新旧虚拟节点，找出要更新的内容，做差异更新即可，无需全部替换。

注意

diff 算法是一种同级比较的算法，只会对同一级的节点进行比较，而不会跨级比较。

我们知道了 `diff` 算法的目的就是比对新旧节点，做差异化更新。Vue 将这个操作放在了 [patch](https://blog.xqtcat.cn/vue/source-code/v2_write/9_vnode_to_dom.html#%E5%AE%9E%E7%8E%B0-update-%E5%B0%86-vnode-%E8%BD%AC%E5%8C%96%E4%B8%BA%E7%9C%9F%E5%AE%9E-dom-%E5%B9%B6%E6%9B%BF%E6%8D%A2) 这一将新 `vnode` 转化为真实 DOM 替换旧 `vnode` 的方法中，具体步骤如下：

1. 两个节点不是同一种类型的节点或同一种类型的节点但 `key` 值不同，直接用新的替换老的，如 span 变成了 div，直接用 div 替换 span；`<div key="a"></div>` 变成 `<div key="b"></div>`，直接用 b div 替换 a div。
2. 两个节点是同一种类型的节点，且 key 值相同，则比较属性是否有差异，将差异的属性更新，如 `<div key="a"></div>` 变成 `<div key="a" id="app"></div>`，同为 div 元素且 key 相同，则更新属性。
3. 节点比较完毕后比较双方的子节点。

## 新旧虚拟节点不同，直接替换

不同指的是两个节点类型不同或类型相同但 key 值不同。

```jsx
export function isSameVnode (vnode1, vnode2) {
  // 注意节点是否相同除了判断节点的 tag 属性还要判断节点的 key 属性
  return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key
}

```

## 新旧虚拟节点相同，比对属性

> 注意：两个虚拟节点是否相同除了判断其类型 tag，还要看 key 是否相同。
> 

```jsx
function createElm (vnode) {
  let { tag, data, children, text } = vnode
  if (typeof tag === 'string') {  // 标签
    vnode.el = document.createElement(tag)  // 将生成的 dom 与虚拟节点关联起来，方便下次更新时取到
    patchProps(vnode.el, {}, data)
    children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    })
  } else {
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}

export function patchProps (el, oldProps = {}, props = {}) {
  // 旧属性有的，新属性没有，需要删除
  const oldStyles = oldProps.style || {}
  const newStyles = props.style || {}
  for (const key in oldStyles) {
    if (!newStyles[key]) {  // 旧样式有，新样式没有，删除
      el.style[key] = ''
    }
  }
  for (const key in oldProps) {
    if (!props[key]) {
      el.removeAttribute(key)
    }
  }

  // 旧属性没有的，新属性有，需要插入；旧属性有，新属性也有，则覆盖
  for (const key in props) {
    if (key === 'style') {
      for (const styleName in props.style) {
        el.style[styleName] = props.style[styleName]
      }
    } else {
      el.setAttribute(key, props[key])
    }
  }
}

function patchVnode (oldVnode, vnode) {
  if (!isSameVnode(oldVnode, vnode)) {  // 两个虚拟节点类型不同
    // ...
  }

  // 两个虚拟节点类型相同且 key 相同
  const el = vnode.el = oldVndoe.el  // 节点类型相同，那么直接复用老节点的 dom 节点

  if (!oldVnode.tag) {  // 如果虚拟节点是文本类型
    if (oldVnode.text !== vnode.text) {  // 文本改变了
      el.textContent = vnode.text  // 覆盖旧文本
    }
  }

  // 虚拟节点是元素类型，则比对属性并更新
  patchProps(el, oldVnode.data, vnode.data)

  return el
}

```
## 比较子节点

vue2 中采用 **双指针** 的方式来比较两个子节点数组。

**标签和key相同，就认为是同一个节点**

1. **从头部开始对比，如果两个节点相同**
2. 如果头部不同，就从尾部开始对比
3. 旧元素的头部和新元素的尾部对比
4. 旧元素的尾部和新元素的头部
5. 直接对比


![](https://s2.loli.net/2023/08/28/hdbjc1LGYMBURrZ.png)

![](https://s2.loli.net/2023/08/28/hdbjc1LGYMBURrZ.png)

![](https://s2.loli.net/2023/08/28/Xx6SsURMKnjFpJH.png)

![](https://s2.loli.net/2023/08/28/AHT3RkIbrEuWQcY.png)

![](https://s2.loli.net/2023/08/28/7USF8HKc9MIPJqd.png)

![](https://s2.loli.net/2023/08/28/hEJzPCwfglqxSI3.png)

> insertBefore 方法具有移动性，会将原来的元素移动到要出现的地方。且当第二个参数为 null 时效果相当于 appendChild 方法。
> 

> 对子节点做处理时，我们在代码中看到每次循环都会做出移动、新增或删除操作，好像是一次一次的操作，但其实像这样批量向页面中修改或插入内容，浏览器会自动优化，不需要使用文档片段。
> 

```jsx
function patchVnode (oldVnode, vnode) {
  if (!isSameVnode(oldVnode, vnode)) {  // 两个虚拟节点类型不同
    // ...
  }

  // 两个虚拟节点类型相同且 key 相同
  // ...

  // 比较子节点
  const oldChildren = oldVnode.children || []
  const newChildren = vnode.children || []
  if (oldChildren.length > 0 && newChildren.length > 0) {  // 两方都有子节点，比对子节点并更新
    updateChildren(el, oldChildren, newChildren)
  } else if (newChildren.length > 0) {  // 新节点有子节点，旧节点没有子节点，插入
    mountChildren(el, newChildren)
  } else if (oldChildren.length > 0) {  // 新节点没有子节点，旧节点有子节点，删除
    el.innerHTML = ''  // 简单点直接设为空
  }

  return el
}

function mountChildren (el, newChildren) {
  for (let i = 0; i < newChildren.length; i++) {
    const child = newChildren[i]
    el.appendChild(createElm(child))
  }
}

function updateChildren (el, oldChildren, newChildren) {
  let oldStartIndex = 0
  let newStartIndex = 0
  let oldEndIndex = oldChildren.length - 1
  let newEndIndex = newChildren.length - 1

  let oldStartVnode = oldChildren[0]
  let newStartVnode = newChildren[0]
  let oldEndVnode = oldChildren[oldEndIndex]
  let newEndVnode = newChildren[newEndIndex]

  function makeIndexByKey (children) {
    const map = {}
    children.forEach((child, index) => {
      map[child.key] = index
    })
    return map
  }
  const map = makeIndexByKey(oldChildren)  // 乱序比对的映射表

  // 新旧子数组只要有一方的头指针大于尾指针就停止循环
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (!oldStartVnode) {  // 乱序比对中旧数组节点可能为空
      oldStartVnode = oldChildren[++oldStartIndex]
    } else if (!oldEndVnode) {  // 乱序比对中旧数组节点可能为空
      oldEndVnode = oldChildren[--oldEndIndex]
    } else if (isSameVnode(oldStartVnode, newStartVnode)) {  // 头头比对，对应 abc -> abcd 情况
      patchVnode(oldStartVnode, newStartVnode)
      oldStartVnode = oldChildren[++oldStartIndex]
      newStartVnode = newChildren[++newStartIndex]
    } else if (isSameVnode(oldEndVnode, newEndVnode)) {  // 尾尾比对，对应 abc -> dabc 情况
      patchVnode(oldEndVnode, newEndVnode)
      oldEndVnode = oldChildren[--oldEndIndex]
      newEndVnode = newChildren[--newEndIndex]
    } else if (isSameVnode(oldEndVnode, newStartVnode)) {  // 尾头比对，对应 abcd -> dabc 情况，也可以对应 reverse 倒序和 sort 排序情况
      patchVnode(oldEndVnode, newStartVnode)
      el.insertBefore(oldEndVnode.el, oldStartVnode.el)  // 将旧数组的尾巴移到最前面
      oldEndVnode = oldChildren[--oldEndIndex]
      newStartVnode = newChildren[++newStartIndex]
    } else if (isSameVnode(oldStartVnode, newEndVnode)) {  // 头尾比对，对应 abcd -> bcda 情况，也可以对应 reverse 倒序和 sort 排序情况
      patchVnode(oldStartVnode, newEndVnode)
      el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)  // 将旧数组的头移动到最后面
      oldStartVnode = oldChildren[++oldStartIndex]
      newEndVnode = newChildren[--newEndIndex]
    } else {  // 乱序比对：根据旧数组做一个映射关系，用新数组节点去找，找到则复用移动，找不到则添加，最后旧数组多余的节点就删除
      const moveIndex = map[newStartVnode.key]
      if (moveIndex !== undefined) {  // 新数组节点存在于映射关系中，复用
        const moveVnode = oldChildren[moveIndex]
        el.insertBefore(moveVnode.el, oldStartVnode.el)
        oldChildren[moveIndex] = undefined  // 移动后设为空
        patchVnode(moveVnode, newStartVnode)  // 比对属性和子节点
      } else {  // 不存在于映射关系中，新增
        el.insertBefore(createElm(newStartVnode), oldStartVnode.el)
      }
      newStartVnode = newChildren[++newStartIndex]
    }
  }

  if (newStartIndex <= newEndIndex) {  // 插入新数组头尾指针间的节点，例如 push 以及 unshift 情况
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      const childEl = createElm(newChildren[i])
      // 如果新数组的尾指针下一个有值，证明是从后向前比，例如 unshift 情况
      // 如果新数组的尾指针下一个没有值，证明是从前向后比，例如 push 情况
      const anchor = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].el : null
      el.insertBefore(childEl, anchor)  // insertBefore 在 anchor 为 null 时会认为是 appendChild
    }
  }

  if (oldStartIndex <= oldEndIndex) {  // 删除旧数组头尾指针间的节点，例如 pop 以及 shift 情况
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      if (oldChildren[i]) {  // 乱序比对中可能会将旧数组节点设为空
        const childEl = oldChildren[i].el
        el.removeChild(childEl)
      }
    }
  }
}

```

## 在 vm._update 中运用 diff 算法

`vm._update` 方法内部是通过 `patch` 方法来将 vnode 转化为真实 DOM 的。在第一次调用 `vm._update` 方法时，进行初次渲染后，应该保留 vnode 以便后面进行 diff 算法；后面再调用 `vm._update` 方法，就是更新渲染了，此时就要用上次更新时的 vnode 与本次更新时的 vnode 做 diff 算法。

```
// src/lifecycle.js
export function initLifeCycle (Vue) {
  Vue.prototype._update = function (vnode) {
    const vm = this
    const el = vm.$el
    const prevVnode = vm._vnode  // 拿到上次的 vnode，如果不存在就是初次渲染
    vm._vnode = vnode  // 将 vnode 保留到实例上
    if (prevVnode) {  // 更新渲染
      vm.$el = patch(prevVnode, vnode)
    } else {  // 初次渲染
      vm.$el = patch(el, vnode)
    }
  }
}

```

## 面试题：v-for 循环时为什么 key 不能用 index

因为 index 索引在数组变换前后都是从 0 开始的，如果用了 index 可能会导致错误复用，如图所示：

![](https://s2.loli.net/2023/08/28/y6JHPbnB5kjFTdZ.png)

如图所示，用 index 作为 key 时，会有错误复用的情况发生，进行了三次 patchVnode 改变 item 值。而不用 index 作为 key 时，patchVnode 没有改变值，直接复用。