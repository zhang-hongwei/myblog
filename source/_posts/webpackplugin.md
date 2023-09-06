---
title: webpack插件原理
date: 2021-05-19 11:10:00
tags: webpack
---


## 编写插件

从上面介绍我们了解到，每个插件都需要提供一个 `apply` 方法，此方法接收 `compiler` 作为参数。

通过 `compiler` 可以去订阅 `webpack` 工作期间不同阶段的 `hooks`，以此来影响打包结果或者做一些定制操作。

下面我们编写自定义插件，绑定两个不同时机的 `compiler.hooks` 来扩展 webpack 打包功能：

- `hooks.emit.tap` 绑定一个函数，在 `webpack` 编译资源完成，输出写入磁盘前执行（可以做清除 `output.path` 目录操作）；
- `hooks.done.tap` 绑定一个函数，在 `webpack` 写入磁盘完成之后执行（可以做一些静态资源 `copy` 操作）。

```jsx
// plugins/custom-webpack-plugins
const fs = require('fs-extra');
const path = require('path');

class CustomWebpackPlugin {
  apply(compiler) {
    const outputPath = compiler.options.output.path;
    const hooks = compiler.hooks;

    // 清除 build 目录
    hooks.emit.tap('custom-webpack-plugin', (compilation) => {
      fs.removeSync(outputPath);
    });

    // copy 静态资源
    const otherFilesPath = path.resolve(__dirname, '../src/otherfiles');
    hooks.done.tap('custom-webpack-plugin', (compilation) => {
      fs.copySync(otherFilesPath, path.resolve(outputPath, 'otherfiles'));
    });
  }
}

module.exports = CustomWebpackPlugin;
```

现在，我们通过 `node build.js` 运行文件，最终会在 `webpack-demo` 下生成 `build` 目录以及入口打包资源。