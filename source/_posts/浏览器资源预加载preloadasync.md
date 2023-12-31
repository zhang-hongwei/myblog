---
title: preload 和 defer async的区别
date: 2020-07-05 21:00:00
tags: 资源加载
---
**`<link rel="preload">`**、**`<script async>`** 和 **`<script defer>`** 是用于加载资源的HTML标签，它们在加载资源时有不同的行为和用途。

1. **`<link rel="preload">`**：
    - **`<link rel="preload">`** 是一种指示浏览器预加载资源的标签。它可以用来在页面加载过程中提前加载关键资源，以改善性能。
    - 使用场景：通常用于加载关键字体、CSS文件或JavaScript文件，以确保这些资源在需要时立即可用。
    - 主要特点：
        - 预加载资源不会立即执行或应用，而是在后续请求中使用。
        - 可以设置**`as`**属性来指定资源类型，如**`as="font"`**或**`as="style"`**。
        - 可以设置**`type`**属性来指定资源的MIME类型，以帮助浏览器正确解析资源。
2. **`<script async>`**：
    - **`<script async>`** 是用于异步加载JavaScript文件的标签。它告诉浏览器立即下载并异步执行脚本，不会阻塞页面的渲染和其他操作。
    - 使用场景：适用于不需要按特定顺序加载的独立脚本，例如分析代码或广告脚本。
    - 主要特点：
        - 脚本的下载和执行是异步的，不会阻塞页面的渲染。
        - 脚本可能在页面中的其他资源加载之前或之后执行，具体取决于网络延迟和脚本的加载速度。
        - 异步脚本不一定按照它们在文档中的顺序执行。
3. **`<script defer>`**：
    - **`<script defer>`** 也用于加载JavaScript文件，但与**`async`**不同，它告诉浏览器要等到文档解析完成后才执行脚本，但在**`DOMContentLoaded`**事件之前执行。
    - 使用场景：适用于需要按照文档顺序执行的脚本，以确保它们在文档完全加载后执行。
    - 主要特点：
        - 脚本的下载是异步的，但执行是延迟的，直到文档解析完成。
        - 多个**`defer`**脚本会按照它们在文档中的顺序执行。
        - **`defer`**脚本会在**`DOMContentLoaded`**事件之前执行，确保它们在文档完全加载后运行。

总结：

- **`<link rel="preload">`** 用于预加载资源，但不会立即执行。
- **`<script async>`** 用于异步加载脚本，不会阻塞页面渲染。
- **`<script defer>`** 用于延迟执行脚本，等待文档解析完成后执行。