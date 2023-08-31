---
title: vue数组如何实现响应式的
date: 2019-05-18 10:30:00
tags: vue
---

## 先看一段代码，思考几个问题

```jsx
<template>
    <div>
        <div v-for="item in testArr" :key='item'>
            {{item}}
        </div>
    </div>
</template>
export defaut {
    data() {
        return {
            testArr: [1, 2, 3]
        }
    }，
    method: {
        changeArr() {
            this.testArr = [1, 2, 3, 4]
        },
        changeLength() {
            this.testArr.length = 2
        },
        changeArrItemByIndex() {
            this.testArr[0] = 100;
        },
        addArrItem() {
            this.testArr.push(4);
        }
    }
}
```

1. 当将`testArr`数组直接赋值，执行`changeArr`方法；
2. 当改变数据的length属性，执行`changeLength`方法；
3. 当通过数组下标来改变数据中某个元素，执行`changeArrItemByIndex`方法；
4. 通过push方法，执行`addArrItem`方法；

上述4种情况，思考下页面数据是否会更新？

## 数组响应式原理解析

vue的数据观测是是通过对象的`defineProperty`方法来为数据添加`get`和`set`方法，然后调用get方法的时候做依赖收集，在set改变数据的时候，通知`watcher`对象来更新数据。然而这个方法仅仅支持对象。因此vue中是通过重写可以改变数组的7个方法实现的。

```jsx
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    Object.defineProperty
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }
```

从Observer类的代码上可以看到，当要监听的数据是一个数组时，他会做特殊处理。现在我们来解析这段代码。

## hasProto

```jsx
export const hasProto = '__proto__' in {}
```

判断下当前浏览器中对象是否有`__proto__`属性，是为了做浏览器兼容的。

## protoAugment

当前浏览器支持`__proto__`属性的话就会调用`protoAugment`方法，我们来看下代码

```jsx
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}
```

这个方法的代码也很少，其实就是将我们传入数组的原型设置为传入的`arrayMethods`。

我们来看下`arrayMethods`相关的代码

```jsx
/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  // 重写数组原型方法
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args)
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    // notify change
    ob.dep.notify()
    return result
  })
})
```

可以看到通过`Object.create(arrayProto)`创建出一个原型是原始数组原型的对象，然后在`methodsToPatch`数组中存储了一些数组的方法，他们有一个共同点，就是这些方法都会改变原数组。这样的目的是为了当执行这些改变数组的方法时，可以方便后续为修改这些方法，添加监听。

observeArray方法代码

```jsx

observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
}`
```

## def方法代码

def方法就是为对象的key设置值。

```jsx
export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}
```

为每项数据添加监听。

## copyAugment

copyAugment 与 protoAugment方法总用一样，都是为数组添加监听，只不过是处理了浏览器的兼容问题。

```jsx
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}
```

## 总结

vue中数组的响应式数据是通过对数组原始方法修改，然后对数组中的每项进行监听。

所以之前的问题也能得出，vue中没有对2,3的情况做处理，只是在调用改变数组的几个方法的时候才是响应式的。而第1中情况中直接赋值的话，vue的响应式实现中会处理，所以只有2，3不会更新视图。