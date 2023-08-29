---
title: Vue响应式原理
date: 2023-01-01 15:54:25
tags: vue
---

[深入响应式系统 | Vue.js](https://cn.vuejs.org/guide/extras/reactivity-in-depth.html#how-reactivity-works-in-vue)

1. 如果一个变量在当前运行的副作用中被读取了，就将该副作用设为此变量的一个订阅者。例如由于 和 在 执行时被访问到了，则 需要在第一次调用之后成为 `A0` 和 `A1` 的订阅者。
2. 探测一个变量的变化。例如当我们给 `A0` 赋了一个新的值后，应该通知其所有订阅了的副作用重新执行。

## Vue 中的响应性是如何工作的

我们无法直接追踪对上述示例中局部变量的读写，原生 JavaScript 没有提供任何机制能做到这一点。**但是**，我们是可以追踪**对象属性**的读写的。

在 JavaScript 中有两种劫持 property 访问的方式：[getter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) / [setters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set) 和 [Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)。Vue 2 使用 getter / setters 完全是出于支持旧版本浏览器的限制。而在 Vue 3 中则使用了 Proxy 来创建响应式对象，仅将 getter / setter 用于 ref。下面的伪代码将会说明它们是如何工作的：

```jsx
function reactive(obj) {
	return new Proxy(obj, {
    get(target, key) {
			track(target, key)
			return target[key]
		},
	  set(target, key, value) {
			target[key] = value
			trigger(target, key)
		}
	})
}

function ref(value) {
	const refObject = {
		get value() {
			track(refObject, 'value')
			return value
		},
		set value(newValue) {
				value = newValue
				trigger(refObject, 'value')
			}
		}
	return refObject
}
```

这里和下面的代码片段皆旨在以最简单的形式解释核心概念，因此省略了许多细节和边界情况。

以上代码解释了我们在基础章节部分讨论过的一些 [reactive() 的局限性](https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html#limitations-of-reactive)：

- 当你将一个响应式对象的属性赋值或解构到一个本地变量时，访问或赋值该变量是非响应式的，因为它将不再触发源对象上的 get / set 代理。注意这种“断开”只影响变量绑定——如果变量指向一个对象之类的非原始值，那么对该对象的修改仍然是响应式的。
- 从 `reactive()` 返回的代理尽管行为上表现得像原始对象，但我们通过使用 `===` 运算符还是能够比较出它们的不同。

在 `track()` 内部，我们会检查当前是否有正在运行的副作用。如果有，我们会查找到一个存储了所有追踪了该属性的订阅者的 Set，然后将当前这个副作用作为新订阅者添加到该 Set 中。

```jsx
// 这会在一个副作用就要运行之前被设置
// 我们会在后面处理它
let activeEffect

function track(target, key) {
	if (activeEffect) {
		const effects = getSubscribersForProperty(target, key)
		effects.add(activeEffect)
	}
}
```

副作用订阅将被存储在一个全局的 `WeakMap<target, Map<key, Set<effect>>>` 数据结构中。如果在第一次追踪时没有找到对相应属性订阅的副作用集合，它将会在这里新建。这就是 `getSubscribersForProperty()` 函数所做的事。为了简化描述，我们跳过了它其中的细节。

在 `trigger()` 之中，我们会再查找到该属性的所有订阅副作用。但这一次我们需要执行它们：

```jsx
function trigger(target, key) {
	const effects = getSubscribersForProperty(target, key)
	effects.forEach((effect) => effect())
}
```

现在让我们回到 `whenDepsChange()` 函数中：

```jsx
function whenDepsChange(update) {
const effect = () => {
	activeEffect = effect
	update()
	activeEffect = null
}
	effect()
}
```

它将原本的 `update` 函数包装在了一个副作用函数中。在运行实际的更新之前，这个外部函数会将自己设为当前活跃的副作用。这使得在更新期间的 `track()` 调用都能定位到这个当前活跃的副作用。

此时，我们已经创建了一个能自动跟踪其依赖的副作用，它会在任意依赖被改动时重新运行。我们称其为**响应式副作用**。

Vue 提供了一个 API 来让你创建响应式副作用 [watchEffect()](https://cn.vuejs.org/api/reactivity-core.html#watcheffect)。事实上，你会发现它的使用方式和我们上面示例中说的魔法函数 `whenDepsChange()` 非常相似。我们可以用真正的 Vue API 改写上面的例子：

```jsx
import { ref, watchEffect } from 'vue'

const A0 = ref(0)
const A1 = ref(1)
const A2 = ref()

watchEffect(() => {
// 追踪 A0 和 A1
A2.value = A0.value + A1.value
})

// 将触发副作用
A0.value = 2
```

使用一个响应式副作用来更改一个 ref 并不是最优解，事实上使用计算属性会更直观简洁：

```jsx
import { ref, computed } from 'vue'

const A0 = ref(0)
const A1 = ref(1)
const A2 = computed(() => A0.value + A1.value)

A0.value = 2
```

在内部，`computed` 会使用响应式副作用来管理失效与重新计算的过程。

那么，常见的响应式副作用的用例是什么呢？自然是更新 DOM！我们可以像下面这样实现一个简单的“响应式渲染”：

```jsx
import { ref, watchEffect } from 'vue'

const count = ref(0)

watchEffect(() => {
document.body.innerHTML = `计数：${count.value}`
})

// 更新 DOM
count.value++
```

实际上，这与 Vue 组件保持状态和 DOM 同步的方式非常接近——每个组件实例创建一个响应式副作用来渲染和更新 DOM。当然，Vue 组件使用了比 `innerHTML` 更高效的方式来更新 DOM。这会在[渲染机制](https://cn.vuejs.org/guide/extras/rendering-mechanism.html)一章中详细介绍。

## 运行时 vs. 编译时响应性

Vue 的响应式系统基本是基于运行时的。追踪和触发都是在浏览器中运行时进行的。运行时响应性的优点是，它可以在没有构建步骤的情况下工作，而且边界情况较少。另一方面，这使得它受到了 JavaScript 语法的制约，导致需要使用一些例如 Vue ref 这样的值的容器。

一些框架，如 [Svelte](https://svelte.dev/)，选择通过编译时实现响应性来克服这种限制。它对代码进行分析和转换，以模拟响应性。该编译步骤允许框架改变 JavaScript 本身的语义——例如，隐式地注入执行依赖性分析的代码，以及围绕对本地定义的变量的访问进行作用触发。这样做的缺点是，该转换需要一个构建步骤，而改变 JavaScript 的语义实质上是在创造一种新语言，看起来像 JavaScript 但编译出来的东西是另外一回事。

Vue 团队确实曾通过一个名为[响应性语法糖](https://cn.vuejs.org/guide/extras/reactivity-transform.html)的实验性功能来探索这个方向，但最后由于[这个原因](https://github.com/vuejs/rfcs/discussions/369#discussioncomment-5059028)，我们认为它不适合这个项目。

## 响应性调试

Vue 的响应性系统可以自动跟踪依赖关系，但在某些情况下，我们可能希望确切地知道正在跟踪什么，或者是什么导致了组件重新渲染。

### 组件调试钩子

我们可以在一个组件渲染时使用 `onRenderTracked` 生命周期钩子来调试查看哪些依赖正在被使用，或是用 `onRenderTriggered` 来确定哪个依赖正在触发更新。这些钩子都会收到一个调试事件，其中包含了触发相关事件的依赖的信息。推荐在回调中放置一个 `debugger` 语句，使你可以在开发者工具中交互式地查看依赖：

```jsx
<script setup>
import { onRenderTracked, onRenderTriggered } from 'vue'

onRenderTracked((event) => {
debugger
})

onRenderTriggered((event) => {
debugger
})
</script>
```

TIP

组件调试钩子仅会在开发模式下工作

调试事件对象有如下的类型定义：

ts

```jsx
type DebuggerEvent = {
effect: ReactiveEffect
target: object
type:
| TrackOpTypes /* 'get' | 'has' | 'iterate' */
| TriggerOpTypes /* 'set' | 'add' | 'delete' | 'clear' */
key: any
newValue?: any
oldValue?: any
oldTarget?: Map<any, any> | Set<any>
}
```

### 计算属性调试

我们可以向 `computed()` 传入第二个参数，是一个包含了 `onTrack` 和 `onTrigger` 两个回调函数的对象：

- `onTrack` 将在响应属性或引用作为依赖项被跟踪时被调用。
- `onTrigger` 将在侦听器回调被依赖项的变更触发时被调用。

这两个回调都会作为组件调试的钩子，接受[相同格式](https://cn.vuejs.org/guide/extras/reactivity-in-depth.html#debugger-event)的调试事件：

js

```
const plusOne = computed(() => count.value + 1, {
onTrack(e) {
// 当 count.value 被追踪为依赖时触发
debugger
},
onTrigger(e) {
// 当 count.value 被更改时触发
debugger
}
})

// 访问 plusOne，会触发 onTrack
console.log(plusOne.value)

// 更改 count.value，应该会触发 onTrigger
count.value++
```

TIP

计算属性的 `onTrack` 和 `onTrigger` 选项仅会在开发模式下工作。

### 侦听器调试

和 `computed()` 类似，侦听器也支持 `onTrack` 和 `onTrigger` 选项：

js

```jsx
watch(source, callback, {
onTrack(e) {
debugger
},
onTrigger(e) {
debugger
}
})

watchEffect(callback, {
onTrack(e) {
debugger
},
onTrigger(e) {
debugger
}
})
```

TIP

侦听器的 `onTrack` 和 `onTrigger` 选项仅会在开发模式下工作。
