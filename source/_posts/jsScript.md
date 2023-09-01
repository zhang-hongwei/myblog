---
title: 使用async和defer高效加载 JavaScript
date: 2020-05-09 19:30:00
tags: js
---
在 HTML 页面上加载脚本时，需要注意不要损害页面的加载性能。根据将脚本添加到 HTML 页面的位置和方式，将影响加载时间

一个脚本传统上以这种方式包括在页面中:

```html
<script src="script.js"></script>
```

只要 HTML 解析器找到这一行，就会发出获取脚本的请求，并执行脚本。一旦完成了这个过程，就可以继续解析，并且可以分析 HTML 的其余部分。可以想象，这个操作会对页面的加载时间产生巨大的影响。

如果加载脚本的时间比预期的要长一些，例如，如果网络有点慢，或者如果你在移动设备上，连接有点慢，访问者可能会看到一个空白页面，直到加载并执行脚本。

## 加载脚本的位置

初学HTML 时，会被告知 script 标签存在于 < head > 标签中:

```html
<html>  
	<head>    
		<title>Title</title>    
		<script src="script.js"></script>  
	</head>  
	<body>   
		 ...  
	</body>
</html>
```

正如上面所说的，当解析器找到script标签的时候，它就会去获取脚本并执行它。然后，在完成这个任务之后，它继续解析主体。这很糟糕，因为引入了大量的延迟。这个问题的一个非常常见的解决方案是将 script 标记放在页面的底部，就在关闭的 </body > 标记之前。

在这样做的时候，脚本是在所有页面都已经被解析和加载之后加载和执行的，这比头部方案有了很大的改进。

如果您需要支持不支持 HTML 的两个相对较新的特性(异步和延迟)的旧浏览器，那么这是能做的最好的处理了。

## async**和defer**

异步和延迟都是布尔属性，它们的用法相似:

```jsx
<script async src="script.js"></script>
```

```jsx
<script defer src="script.js"></script>
```

**如果两者都指定，则异步在现代浏览器上优先，而支持延迟但不支持异步的旧浏览器将回退到延迟。**

**只有在页面的头部使用脚本时，这些属性才有意义，如果像我们上面看到的那样将脚本放在正文脚注中，那么它们就毫无用处。**

## **性能比较**

### 在header标签中，没有defer和async

```jsx
<head>
	<script src="script.js"></script>
</head>
```
![](https://s2.loli.net/2023/09/01/zVZpsJOKNcRxBSr.png)

可以看到html解析被暂停，然后开始加载脚本，直到脚本加载完成并被执行，才继续解析html。

### 在body中，没有defer和async

```jsx
<body>
	<script src="script.js"></script>
</body>
```

下面是页面如何在没有延迟或异步的情况下加载脚本，放在 body 标记的末尾，在它关闭之前:

![](https://s2.loli.net/2023/09/01/NQkzERvKBSeh45f.png)

解析过程没有任何停顿，当解析结束时，脚本被提取并执行。解析是在脚本下载之前完成的，所以页面显示在前面的示例之前。

### script位于head标签，使用async属性

```jsx
<head>
	<script async src="script.js"></script>
</head>
```

下面是一个页面如何加载一个具有异步的脚本，放在 head 标签中:

![](https://s2.loli.net/2023/09/01/hp9GlqjdsmPVe7O.png)

可以看到脚本是异步获取的，当脚本准备好后，将暂停 HTML 解析以执行脚本，然后继续执行html解析。

### script **在header标签中，使用**defer

```jsx
<head>
	<script defer src="script.js"></script>
</head>
```

![](https://s2.loli.net/2023/09/01/4sx7hAyogk5vFNp.png)

可以看到脚本是异步获取的，但是，只有在完成 HTML 解析之后才会执行。

解析结束时，就像我们将脚本放在 body 标记的末尾时一样，但是总的来说，脚本执行在这之前就结束了，因为脚本是与 HTML 解析并行下载的。

所以这是速度方面的最佳解决方案

## **阻塞解析**

async阻塞页面的解析，而defer则不阻塞。

## **阻止渲染**

无论是async还是defer都不能保证阻塞渲染。这取决于你的脚本(例如，确保脚本在 onLoad 事件之后运行)。

## ****domInteractive****

标记为 Defer 的脚本在 domInteractive 事件之后立即执行，后者发生在 HTML 加载、解析和构建 DOM 之后。

此时 CSS 和图像仍有待解析和加载。完成此操作后，浏览器将发出 domComplete 事件，然后发出 onLoad。

****domInteractive**** 很重要，因为它的时间被认为是感知加载速度的度量。

## **维持顺序**

另一种情况是pro defer: 标记为async的脚本在可用时按随意顺序执行。 标记为 defer 的脚本按照标记中定义的顺序执行（解析完成后）。

## **告诉我最好的办法**

在使用脚本时，加快页面加载速度的最佳方法是将脚本放在头部，并在 script 标记中添加一个 Defer 属性:

```jsx
<script defer src="script.js"></script>
```

这是触发更快 domInteractive 事件的场景。

考虑到延迟的优点，在很多情况下，async似乎是一个更好的选择。

除非可以延迟页面的第一次渲染，否则请确保在解析页面时已经执行了所需的 JavaScript。