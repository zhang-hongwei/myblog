---
title: var,const,let 的区别
date: 2018-06-10 21:50:00
tags: ES6
---
<aside>
💡 **变量提升** 
无论在何处声明变量，都会在执行任何代码之前进行处理。

</aside>

## var

**`var` 语句** 用于声明一个**函数范围或全局范围**的变量，并可将其初始化为一个值（可选）。

1. [存在变量提升](https://www.notion.so/29f344d410a6405cbc024a7a64756ab0?pvs=21)
2. 用 `var` 声明的变量的作用域是它当前的执行上下文及其闭包（嵌套函数），**或者对于声明在任何函数外的变量来说是全局。**
3. **可重复声明变量：**使用 `var` 重复声明 JavaScript 变量并不会抛出错误（即使在严格模式 (strict mode) 下），同时，变量也不会丢失其值，直到调用其他的赋值操作。

### 隐式全局变量和外部函数作用域

```jsx
var x = 0; // x 是全局变量，并且赋值为 0

console.log(typeof z); // // undefined，因为 z 还不存在

function a() {
  var y = 2; // y 被声明成函数 a 作用域的变量，并且赋值为 2

  console.log(x, y); // 0 2

  function b() {
    x = 3; // 全局变量 x 被赋值为 3
    y = 4; // 已存在的外部函数的 y 变量被赋值为 4
    z = 5; // 创建新的全局变量 z，并且赋值为 5
           // (在严格模式下抛出 ReferenceError)
  }

  b(); // 调用 b 时创建了全局变量 z
  console.log(x, y, z); // 3 4 5
}

a(); // Also calls b.
console.log(x, z);     // 3 5
console.log(typeof y); // undefined，因为 y 是 a 函数的局部变量
```

## let

1. **`let`** 允许你声明一个作用域被限制在[块](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/block)作用域中的变量、语句或者表达式
2. 不能重复声明变量
3. **[暂时性死区](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/let#%E6%9A%82%E6%97%B6%E6%80%A7%E6%AD%BB%E5%8C%BA)**
    1. 从一个代码块的开始直到代码执行到声明变量的行之前，`let` 或 `const` 声明的变量都处于“暂时性死区”（Temporal dead zone，TDZ）中。
    2. 当变量处于暂时性死区之中时，其尚未被初始化，尝试访问变量将抛出 [ReferenceError](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError)。当代码执行到声明变量所在的行时，变量被初始化为一个值。如果声明中未指定初始值，则变量将被初始化为 `undefined`。
4. **暂时性死区与 `typeof`：**如果使用 `typeof` 检测在暂时性死区中的变量，会抛出 [ReferenceError](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError) 异常：

## const

常量是块级范围的，非常类似用 [let](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/let) 语句定义的变量。但常量的值是无法（通过重新赋值）改变的，也不能被重新声明。

`const`实际上保证的，并不是变量的值不得改动，而是变量指向的那个内存地址所保存的数据不得改动。对于简单类型的数据（数值、字符串、布尔值），值就保存在变量指向的那个内存地址，因此等同于常量。但对于复合类型的数据（主要是对象和数组），变量指向的内存地址，保存的只是一个指向实际数据的指针，`const`只能保证这个指针是固定的（即总是指向另一个固定的地址），至于它指向的数据结构是不是可变的，就完全不能控制了。因此，将一个对象声明为常量必须非常小心。