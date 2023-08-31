---
title: js严格模式和普通模式的区别
date: 2018-09-02 23:30:00
tags: js
---

## JavaScript严格模式（"use strict"）与普通模式的区别主要有以下几点：
1. 变量必须声明后再使用
2. 函数的参数不能有同名属性，否则报错
3. 不能使用with语句
4. 不能对只读属性赋值，否则报错
5. 不能使用前缀0表示八进制数，否则报错
6. 不能删除不可删除的属性，否则报错
7. 不能删除变量delete prop，会报错，只能删除属性delete global[prop]
8. eval不会在它的外层作用域引入变量
9. eval和arguments不能被重新赋值
10. arguments不会自动反映函数参数的变化
11. 不能使用arguments.callee
12. 不能使用arguments.caller
13. 禁止this指向全局对象
14. 不能使用fn.caller和fn.arguments获取函数调用的堆栈
15. 增加了保留字（比如protected、static和interface）
16. 在JavaScript严格模式下，如果函数内部的this指向全局对象，它将返回undefined而不是全局对象。
17. 同时，在严格模式下，如果使用call()或apply()方法时，第一个参数将成为this值，不再是全局对象。
18. 在严格模式下，调用构造函数时如果忘记使用new关键字，this将不再指向全局对象，而是返回一个错误。