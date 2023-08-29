---
title: vue路由懒加载和组件懒加载
date: 2023-01-02 15:54:25
tags: vue
---

```jsx
路由 和 组件 的常用两种懒加载方式：

1、vue异步组件实现路由懒加载 `component：resolve=>(['需要加载的路由的地址'，resolve])`

2、es提出的import(推荐使用这种方式) `const HelloWorld = （）=>import('需要加载的模块地址')`
```

# 1. 路由懒加载

### 1.1 为什么要使用路由懒加载？

为给客户更好的客户体验，首屏组件加载速度更快一些，解决白屏问题。

### 1.2 定义

懒加载简单来说就是延迟加载或按需加载，即在需要的时候的时候进行加载。

### 1.3 使用

### 未用懒加载，vue中路由代码如下

javascript

```jsx
import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'

Vue.use(Router)

export default new Router({
    routes: [
        {
            path: '/',
            name: 'HelloWorld',
            component:HelloWorld
        }
    ]
})
```

### vue异步组件实现懒加载

方法如下：`component：resolve=>(require(['需要加载的路由的地址'])，resolve)`

javascript

```jsx
import Vue from 'vue'
import Router from 'vue-router'
/* 此处省去之前导入的HelloWorld模块 */
Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'HelloWorld',
      component: resolve=>(require(["@/components/HelloWorld"],resolve))
    }
  ]
})
```

### ES 提出的import方法（------最常用------）

方法如下：`const HelloWorld = （）=>import('需要加载的模块地址')` 

javascript

```jsx
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'HelloWorld',
      component: ()=>import("@/components/HelloWorld")
    }
  ]
})
```

### webpack提供的require.ensure()

```jsx
{
  path: '/home',
  name: 'Home',
  component: r => require.ensure([],() =>  r(require('@/components/HelloWorld')), 'home')
}
```

# 2. 组件懒加载

### 原来组件中写法

```jsx
<template>
  <div class="hello">
    <One-com></One-com>
  </div>
</template>

<script>
import One from './one'
export default {
  components:{
    "One-com":One
  },
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>
```

### ES 提出的import方法

```jsx
<template>
  <div class="hello">
    <One-com></One-com>
  </div>
</template>

<script>
export default {
  components:{
    "One-com": ()=>import("./one");
  },
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>
```

### 异步方法

```jsx
<template>
  <div class="hello">
    <One-com></One-com>
  </div>
</template>

<script>
export default {
  components:{
    "One-com":resolve=>(['./one'],resolve)
  },
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>
```