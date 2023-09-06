---
title: Webpack之如何配置资源预加载
date: 2020-07-03 21:00:00
tags: webpack
---


`preload-webpack-plugin`插件是`html-webpack-plugin`插件的扩展，他可以自动获取异步js模块文件，并通过`<link rel='preload'>`或者`<link rel='preload'>`的方式引入到页面中。

- `preload`: 页面加载的过程中，在浏览器开始主体渲染之前加载，适用于首屏加载；
- `prefetch`: 页面加载完成后，利用空闲时间提前加载，适用于非首屏加载。

# 2.安装

```bash
$ npm install --save-dev preload-webpack-plugin
```

# 3.配置

## 1.基础配置

```jsx
const PreloadWebpackPlugin = require('preload-webpack-plugin');
```

必须用在HtmlWebpackPlugin插件之后：

```jsx
plugins: [
  new HtmlWebpackPlugin(),
  new PreloadWebpackPlugin()
]
```

## 2.配置项

### as

当<link>元素设置了 `rel="preload"` 或者 `rel="prefetch"` 时,可以使用as属性用来规定加载的内容的类型。

在预加载文件的时候，插件会根据每个文件的类型使用不同的as属性：

- `.css`结尾，`as=style`;
- `.woff2`结尾，`as=font`;
- 其他，`as=script`;

```jsx
<link href="xx/xx/chunk-xxx.f01555ba.css" rel="preload" as="style">
```

如果不希望as取自文件名的后缀，也可以使用as显示命名：

```jsx
plugins: [
  new HtmlWebpackPlugin(),
  new PreloadWebpackPlugin({
    rel: 'preload',
    as: 'script'
  })
]
```

也可以使用一个函数来进行更细粒度的控制：

```jsx
plugins: [
  new HtmlWebpackPlugin(),
  new PreloadWebpackPlugin({
    rel: 'preload',
    as(entry) {
      if (/.css$/.test(entry)) return 'style';
      if (/.woff$/.test(entry)) return 'font';
      if (/.png$/.test(entry)) return 'image';
      return 'script';
    }
  })
]
```

### include 需要预加载的模块

有以下几个值可以选择：

- `asyncChunks`：异步模块对应生成的chunk文件；
- `allChunks`：所有的chunk文件(vendor, async, and normal chunks)；
- `initial`：entry项对应生成的chunk文件；
- `allAssets`：所有chunk文件 + loaders生成的文件；
- `[文件name]`：如果chunks是显示命名的，可以使用这种方式；

```jsx
plugins: [
  new HtmlWebpackPlugin(),
  new PreloadWebpackPlugin({
    rel: 'preload',
    include: 'allChunks' // or 'initial', or 'allAssets'
  })
]
 plugins: [
  new HtmlWebpackPlugin(),
  new PreloadWebpackPlugin({
    rel: 'preload',
    include: ['home']
  })
]
```

结果：

```jsx
<link rel="preload" as="script" href="home.31132ae6680e598f8879.js">
```

### fileBlacklist黑名单

1.默认值，不会加载任何sourcemaps：

```jsx
new PreloadWebpackPlugin({
  fileBlacklist: [/\.map/]
})
```

2.其他例子：

```jsx
new PreloadWebpackPlugin({
  fileBlacklist: [/.map/, /.whatever/]
})
```

### excludeHtmlNames 需要忽略的html文件

```jsx
plugins: [
  new HtmlWebpackPlugin({
    filename: 'index.html',
    template: 'src/index.html',
    chunks: ['main']
  }),
  new HtmlWebpackPlugin({
    filename: 'example.html',
    template: 'src/example.html',
    chunks: ['exampleEntry']
  }),
  // Only apply the plugin to index.html, not example.html.
  new PreloadWebpackPlugin({
    excludeHtmlNames: ['example.html'],
  })
```

### prefetch

```jsx
plugins: [
  new HtmlWebpackPlugin(),
  new PreloadWebpackPlugin({
    rel: 'prefetch'
  })
]
```

### media

```jsx
plugins: [
  new HtmlWebpackPlugin(),
  new PreloadWebpackPlugin({
    rel: 'preload',
    media: '(min-width: 600px)'
  })
]
```