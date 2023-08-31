---
title: webpack 打包流程
date: 2022-03-22 11:10:00
tags: webpack
---

## 前言

`webpack` 在前端工程领域起到了中流砥柱的作用，理解它的内部实现机制会对你的工程建设提供很大的帮助（不论是定制功能还是优化打包）。

下面我们基于 webpack5 源码结构，对整个打包流程进行简单梳理并进行实现，便与思考和理解每个阶段所做的事情，为今后扩展和定制工程化能力打下基础。

## 一、准备工作

在流程分析过程中我们会简单实现 `webpack` 的一些功能，部分功能的实现会借助第三方工具：

- `tapable` 提供 Hooks 机制来接入插件进行工作；
- `babel` 相关依赖可用于将源代码解析为 AST，进行模块依赖收集和代码改写。

bash

复制代码

```jsx
// 创建仓库
mkdir webpack-demo && cd webpack-demo && npm init -y

// 安装 babel 相关依赖
npm install @babel/parser @babel/traverse @babel/types @babel/generator -D

// 安装 tapable（注册/触发事件流）和 fs-extra 文件操作依赖
npm install tapable fs-extra -D
```

接下来我们在 `src` 目录下新建两个入口文件和一个公共模块文件：

`mkdir src && cd src && touch entry1.js && touch entry2.js && touch module.js`

并分别为文件添加一些内容：

```jsx

// src/entry1.js
const module = require('./module');
const start = () => 'start';
start();
console.log('entry1 module: ', module);

// src/entry2.js
const module = require('./module');
const end = () => 'end';
end();
console.log('entry2 module: ', module);

// src/module.js
const name = 'cegz';
module.exports = {
  name,
};
```

有了打包入口，我们再来创建一个 `webpack.config.js` 配置文件做一些基础配置：

```jsx
// ./webpack.config.js
const path = require('path');
const CustomWebpackPlugin = require('./plugins/custom-webpack-plugin.js');

module.exports = {
  entry: {
    entry1: path.resolve(__dirname, './src/entry1.js'),
    entry2: path.resolve(__dirname, './src/entry2.js'),
  },
  context: process.cwd(),
  output: {
    path: path.resolve(__dirname, './build'),
    filename: '[name].js',
  },
  plugins: [new CustomWebpackPlugin()],
  resolve: {
    extensions: ['.js', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.js/,
        use: [
          path.resolve(__dirname, './loaders/transformArrowFnLoader.js'), // 转换箭头函数
        ],
      },
    ],
  },
};
```

以上配置，指定了两个入口文件，以及一个 `output.build` 输出目录，同时还指定了一个 `plugin` 和一个 `loader`。

接下来我们编写 `webpack` 的核心入口文件，来实现打包逻辑。这里我们创建 webpack 核心实现所需的文件：

bash

```jsx
// cd webpack-demo
mkdir lib && cd lib
touch webpack.js // webpack 入口文件
touch compiler.js // webpack 核心编译器
touch compilation.js // webpack 核心编译对象
touch utils.js // 工具函数
```

这里我们创建了两个比较相似的文件：`compiler` 和 `compilation`，在这里做下简要说明：

- `compiler`：webpack 的编译器，它提供的 `run` 方法可用于创建 `compilation` 编译对象来处理代码构建工作；
- `compilation`：由 `compiler.run` 创建生成，打包编译的工作都由它来完成，并将打包产物移交给 `compiler` 做输出写入操作。

对于入口文件 `lib/webpack.js`，你会看到大致如下结构：

javascript

```jsx
// lib/webpack.js
function webpack(options) {
  ...
}

module.exports = webpack;
```

对于执行入口文件的测试用例，代码如下：

```jsx
// 测试用例 webpack-demo/build.js
const webpack = require('./lib/webpack');
const config = require('./webpack.config');

const compiler = webpack(config);

// 调用run方法进行打包
compiler.run((err, stats) => {
  if (err) {
    console.log(err, 'err');
  }
  // console.log('构建完成！', stats.toJSON());
});
```

接下来，我们从 `lib/webpack.js` 入口文件，按照以下步骤开始分析打包流程。

## 初始化阶段 - `webpack`

- 合并配置项
- 创建 compiler
- 注册插件

## 编译阶段 - `build`

- 读取入口文件
- 从入口文件开始进行编译
- 调用 loader 对源代码进行转换
- 借助 babel 解析为 AST 收集依赖模块
- 递归对依赖模块进行编译操作

## 生成阶段 - `seal`

- 创建 chunk 对象
- 生成 assets 对象

## 写入阶段 - `emit`

## 初始化阶段

初始化阶段的逻辑集中在调用 `webpack(config)` 时候，下面我们来看看 `webpack()` 函数体内做了哪些事项。

### 读取与合并配置信息

通常，在我们的工程的根目录下，会有一个 `webpack.config.js` 作为 `webpack` 的配置来源；

除此之外，还有一种是通过 webpak bin cli 命令进行打包时，命令行上携带的参数也会作为 webpack 的配置。

在配置文件中包含了我们要让 webpack 打包处理的入口模块、输出位置、以及各种 loader、plugin 等；

在命令行上也同样可以指定相关的配置，且`权重高于`配置文件。（下面将模拟 webpack cli 参数合并处理）

所以，我们在 webpack 入口文件这里将先做一件事情：合并配置文件与命令行的配置。

```jsx
// lib/webpack.js
function webpack(options) {
  // 1、合并配置项
  const mergeOptions = _mergeOptions(options);
  ...
}

function _mergeOptions(options) {
  const shellOptions = process.argv.slice(2).reduce((option, argv) => {
    // argv -> --mode=production
    const [key, value] = argv.split('=');
    if (key && value) {
      const parseKey = key.slice(2);
      option[parseKey] = value;
    }
    return option;
  }, {});
  return { ...options, ...shellOptions };
}

module.exports = webpack;
```

### 创建编译器（compiler）对象

好的程序结构离不开一个实例对象，webpack 同样也不甘示弱，其编译运转是由一个叫做 `compiler` 的实例对象来驱动运转。

在 `compiler` 实例对象上会记录我们传入的配置参数，以及一些串联插件进行工作的 `hooks` API。

同时，还提供了 `run` 方法启动打包构建，`emitAssets` 对打包产物进行输出磁盘写入。这部分内容后面介绍。参考webpack视频讲解：[进入学习](https://link.juejin.cn/?target=https%3A%2F%2Fkc7474.com%2Farchives%2F1497)

```jsx
// lib/webpack.js
const Compiler = require('./compiler');

function webpack(options) {
  // 1、合并配置项
  const mergeOptions = _mergeOptions(options);
  // 2、创建 compiler
  const compiler = new Compiler(mergeOptions);
  ...
  return compiler;
}

module.exports = webpack;
```

`Compiler` 构造函数基础结构如下：

```jsx
// core/compiler.js
const fs = require('fs');
const path = require('path');
const { SyncHook } = require('tapable'); // 串联 compiler 打包流程的订阅与通知钩子
const Compilation = require('./compilation'); // 编译构造函数

class Compiler {
  constructor(options) {
    this.options = options;
    this.context = this.options.context || process.cwd().replace(/\\/g, '/');
    this.hooks = {
      // 开始编译时的钩子
      run: new SyncHook(),
      // 模块解析完成，在向磁盘写入输出文件时执行
      emit: new SyncHook(),
      // 在输出文件写入完成后执行
      done: new SyncHook(),
    };
  }

  run(callback) {
    ...
  }

  emitAssets(compilation, callback) {
    ...
  }
}

module.exports = Compiler;
```

当需要进行编译时，调用 `compiler.run` 方法即可：

```jsx
compiler.run((err, stats) => { ... });
```

### 插件注册

有 compiler 实例对象后，就可以注册配置文件中的一个个插件，在合适的时机来干预打包构建。

插件需要接收 `compiler` 对象作为参数，以此来对打包过程及产物产生 `side effect`。

插件的格式可以是函数或对象，如果为对象，需要自定义提供一个 `apply` 方法。常见的插件结构如下：

```jsx
class WebpackPlugin {
  apply(compiler) {
    ...
  }
}
```

注册插件逻辑如下：

```jsx
// lib/webpack.js
function webpack(options) {
  // 1、合并配置项
  const mergeOptions = _mergeOptions(options);
  // 2、创建 compiler
  const compiler = new Compiler(mergeOptions);
  // 3、注册插件，让插件去影响打包结果
  if (Array.isArray(options.plugins)) {
    for (const plugin of options.plugins) {
      if (typeof plugin === "function") {
        plugin.call(compiler, compiler); // 当插件为函数时
      } else {
        plugin.apply(compiler); // 如果插件是一个对象，需要提供 apply 方法。
      }
    }
  }
  return compiler;
}
```

到这里，webpack 的初始工作已经完成，接下来是调用 `compiler.run()` 进入编译构建阶段。

## 编译阶段

编译工作的起点是在 `compiler.run`，它会：

1. 发起构建通知，触发 `hooks.run` 通知相关插件；
2. 创建 `compilation` 编译对象；
3. 读取 entry 入口文件；
4. 编译 entry 入口文件；

### 创建 compilation 编译对象

模块的打包（`build`）和 代码生成（`seal`）都是由 `compilation` 来实现。

```jsx
// lib/compiler.js
class Compiler {
  ...
  run(callback) {
    // 触发 run hook
    this.hooks.run.call();
    // 创建 compilation 编译对象
    const compilation = new Compilation(this);
    ...
  }
}
```

`compilation` 实例上记录了构建过程中的 `entries`、`module`、`chunks`、`assets` 等编译信息，同时提供 `build` 和 `seal` 方法进行代码构建和代码生成。

javascript

```jsx
// lib/compilation.js
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;
const t = require('@babel/types');
const { tryExtensions, getSourceCode } = require('./utils');

class Compilation {
  constructor(compiler) {
    this.compiler = compiler;
    this.context = compiler.context;
    this.options = compiler.options;
    // 记录当前 module code
    this.moduleCode = null;
    // 保存所有依赖模块对象
    this.modules = new Set();
    // 保存所有入口模块对象
    this.entries = new Map();
    // 所有的代码块对象
    this.chunks = new Set();
    // 存放本次产出的文件对象（与 chunks 一一对应）
    this.assets = {};
  }
  build() {}
  seal() {}
}
```

有了 `compilation` 对象后，通过执行 `compilation.build` 开始模块构建。

```jsx
// lib/compiler.js
class Compiler {
  ...
  run(callback) {
    // 触发 run hook
    this.hooks.run.call();
    // 创建 compilation 编译对象
    const compilation = new Compilation(this);
    // 编译模块
    compilation.build();
  }
}
```

### 读取 entry 入口文件

构建模块首先从 entry 入口模块开始，此时首要工作是根据配置文件拿到入口模块信息。

entry 配置的方式多样化，如：可以不传（有默认值）、可以传入 string，也可以传入对象指定多个入口。

所以读取入口文件需要考虑并兼容这几种灵活配置方式。

javascript

```jsx
// lib/compilation.js
class Compilation {
  ...
  build() {
    // 1、读取配置入口
    const entry = this.getEntry();
    ...
  }

  getEntry() {
    let entry = Object.create(null);
    const { entry: optionsEntry } = this.options;
    if (!optionsEntry) {
      entry['main'] = 'src/index.js'; // 默认找寻 src 目录进行打包
    } else if (typeof optionsEntry === 'string') {
      entry['main'] = optionsEntry;
    } else {
      entry = optionsEntry; // 视为对象，比如多入口配置
    }
    // 相对于项目启动根目录计算出相对路径
    Object.keys(entry).forEach((key) => {
      entry[key] = './' + path.posix.relative(this.context, entry[key]);
    });
    return entry;
  }
}
```

### 编译 entry 入口文件

拿到入口文件后，依次对每个入口进行构建。

```jsx
// lib/compilation.js
class Compilation {
  ...
  build() {
    // 1、读取配置入口
    const entry = this.getEntry();
    // 2、构建入口模块
    Object.keys(entry).forEach((entryName) => {
      const entryPath = entry[entryName];
      const entryData = this.buildModule(entryName, entryPath);
      this.entries.set(entryName, entryData);
    });
  }
}
```

构建阶段执行如下操作：

1. 通过 `fs` 模块读取 entry 入口文件内容；
2. 调用 `loader` 来转换（更改）文件内容；
3. 为模块创建 `module` 对象，通过 AST 解析源代码收集依赖模块，并改写依赖模块的路径；
4. 如果存在依赖模块，递归进行上述三步操作；

读取文件内容：

```jsx
// lib/compilation.js
class Compilation {
  ...
  buildModule(moduleName, modulePath) {
    // 1. 读取文件原始代码
    const originSourceCode = fs.readFileSync(modulePath, 'utf-8');
    this.moduleCode = originSourceCode;
    ...
  }
}
```

调用 loader 转换源代码：

```jsx
// lib/compilation.js
class Compilation {
  ...
  buildModule(moduleName, modulePath) {
    // 1. 读取文件原始代码
    const originSourceCode = fs.readFileSync(modulePath, 'utf-8');
    this.moduleCode = originSourceCode;
    // 2. 调用 loader 进行处理
    this.runLoaders(modulePath);
    ...
  }
}
```

`loader` 本身是一个 JS 函数，接收模块文件的源代码作为参数，经过加工改造后返回新的代码。

```jsx
`// lib/compilation.js
class Compilation {
  ...
  runLoaders(modulePath) {
    const matchLoaders = [];
    // 1、找到与模块相匹配的 loader
    const rules = this.options.module.rules;
    rules.forEach((loader) => {
      const testRule = loader.test;
      if (testRule.test(modulePath)) {
        // 如：{ test:/\.js$/g, use:['babel-loader'] }, { test:/\.js$/, loader:'babel-loader' }
        loader.loader ? matchLoaders.push(loader.loader) : matchLoaders.push(...loader.use);
      }
    });
    // 2. 倒序执行 loader
    for (let i = matchLoaders.length - 1; i >= 0; i--) {
      const loaderFn = require(matchLoaders[i]);
      // 调用 loader 处理源代码
      this.moduleCode = loaderFn(this.moduleCode);
    }
  }
}
```

执行 webpack 模块编译逻辑：

```jsx
// lib/compilation.js
class Compilation {
  ...
  buildModule(moduleName, modulePath) {
    // 1. 读取文件原始代码
    const originSourceCode = fs.readFileSync(modulePath, 'utf-8');
    this.moduleCode = originSourceCode;
    // 2. 调用 loader 进行处理
    this.runLoaders(modulePath);
    // 3. 调用 webpack 进行模块编译 为模块创建 module 对象
    const module = this.handleWebpackCompiler(moduleName, modulePath);
    return module; // 返回模块
  }
}
```

1. 创建 `module` 对象；
2. 对 module code 解析为 `AST` 语法树；
3. 遍历 AST 去识别 `require` 模块语法，将模块收集在 `module.dependencies` 之中，并改写 `require` 语法为 `__webpack_require__`；
4. 将修改后的 AST 转换为源代码；
5. 若存在依赖模块，深度递归构建依赖模块。

```jsx
// lib/compilation.js
class Compilation {
  ...
  handleWebpackCompiler(moduleName, modulePath) {
    // 1、创建 module
    const moduleId = './' + path.posix.relative(this.context, modulePath);
    const module = {
      id: moduleId, // 将当前模块相对于项目启动根目录计算出相对路径 作为模块ID
      dependencies: new Set(), // 存储该模块所依赖的子模块
      entryPoint: [moduleName], // 该模块所属的入口文件
    };

    // 2、对模块内容解析为 AST，收集依赖模块，并改写模块导入语法为 __webpack_require__
    const ast = parser.parse(this.moduleCode, {
      sourceType: 'module',
    });

    // 遍历 ast，识别 require 语法
    traverse(ast, {
      CallExpression: (nodePath) => {
        const node = nodePath.node;
        if (node.callee.name === 'require') {
          const requirePath = node.arguments[0].value;
          // 寻找模块绝对路径
          const moduleDirName = path.posix.dirname(modulePath);
          const absolutePath = tryExtensions(
            path.posix.join(moduleDirName, requirePath),
            this.options.resolve.extensions,
            requirePath,
            moduleDirName
          );
          // 创建 moduleId
          const moduleId = './' + path.posix.relative(this.context, absolutePath);
          // 将 require 变成 __webpack_require__ 语句
          node.callee = t.identifier('__webpack_require__');
          // 修改模块路径（参考 this.context 的相对路径）
          node.arguments = [t.stringLiteral(moduleId)];

          if (!Array.from(this.modules).find(module => module.id === moduleId)) {
            // 在模块的依赖集合中记录子依赖
            module.dependencies.add(moduleId);
          } else {
            // 已经存在模块集合中。虽然不添加进入模块编译 但是仍要在这个模块上记录被依赖的入口模块
            this.modules.forEach((module) => {
              if (module.id === moduleId) {
                module.entryPoint.push(moduleName);
              }
            });
          }
        }
      },
    });

    // 3、将 ast 生成新代码
    const { code } = generator(ast);
    module._source = code;

    // 4、深度递归构建依赖模块
    module.dependencies.forEach((dependency) => {
      const depModule = this.buildModule(moduleName, dependency);
      // 将编译后的任何依赖模块对象加入到 modules 对象中去
      this.modules.add(depModule);
    });

    return module;
  }
}
```

通常我们 require 一个模块文件时习惯不去指定文件后缀，默认会查找 .js 文件。

这跟我们在配置文件中指定的 `resolve.extensions` 配置有关，在 `tryExtensions` 方法中会尝试为每个未填写后缀的 Path 应用 `resolve.extensions`：

```jsx
// lib/utils.js
const fs = require('fs');

function tryExtensions(
  modulePath,  extensions,  originModulePath,  moduleContext
) {
  // 优先尝试不需要扩展名选项（用户如果已经传入了后缀，那就使用用户填入的，无需再应用 extensions）
  extensions.unshift('');
  for (let extension of extensions) {
    if (fs.existsSync(modulePath + extension)) {
      return modulePath + extension;
    }
  }
  // 未匹配对应文件
  throw new Error(
    `No module, Error: Can't resolve ${originModulePath} in  ${moduleContext}`
  );
}

module.exports = {
  tryExtensions,
  ...
}
```

至此，「编译阶段」到此结束，接下来是「生成阶段」 `seal`。

## 生成阶段

在「编译阶段」会将一个个文件构建成 `module` 存储在 `this.modules` 之中。

在「生成阶段」，会根据 `entry` 创建对应 `chunk` 并从 `this.modules` 中查找被 `entry` 所依赖的 `module` 集合。

最后，结合 `runtime` webpack 模块机制运行代码，经过拼接生成最终的 `assets` 产物。

```jsx
// lib/compiler.js
class Compiler {
  ...
  run(callback) {
    // 触发 run hook
    this.hooks.run.call();
    // 创建 compilation 编译对象
    const compilation = new Compilation(this);
    // 编译模块
    compilation.build();
    // 生成产物
    compilation.seal();
    ...
  }
}
```

`entry + module` --> `chunk` --> `assets` 过程如下：

```jsx
// lib/compilation.js
class Compilation {
  ...
  seal() {
    // 1、根据 entry 创建 chunk
    this.entries.forEach((entryData, entryName) => {
      // 根据当前入口文件和模块的相互依赖关系，组装成为一个个包含当前入口所有依赖模块的 chunk
      this.createChunk(entryName, entryData);
    });
    // 2、根据 chunk 创建 assets
    this.createAssets();
  }

  // 根据入口文件和依赖模块组装chunks
  createChunk(entryName, entryData) {
    const chunk = {
      // 每一个入口文件作为一个 chunk
      name: entryName,
      // entry build 后的数据信息
      entryModule: entryData,
      // entry 的所依赖模块
      modules: Array.from(this.modules).filter((i) =>
        i.entryPoint.includes(entryName)
      ),
    };
    // add chunk
    this.chunks.add(chunk);
  }

  createAssets() {
    const output = this.options.output;
    // 根据 chunks 生成 assets
    this.chunks.forEach((chunk) => {
      const parseFileName = output.filename.replace('[name]', chunk.name);
      // 为每一个 chunk 文件代码拼接 runtime 运行时语法
      this.assets[parseFileName] = getSourceCode(chunk);
    });
  }
}
```

`getSourceCode` 是将 `entry` 和 `modules` 组合而成的 `chunk`，接入到 `runtime` 代码模板之中。

```jsx
// lib/utils.js
function getSourceCode(chunk) {
  const { entryModule, modules } = chunk;
  return `  (() => {    var __webpack_modules__ = {      ${modules        .map((module) => {          return `          '${module.id}': (module) => {            ${module._source}
      }        `;        })        .join(',')}
    };    var __webpack_module_cache__ = {};    function __webpack_require__(moduleId) {      var cachedModule = __webpack_module_cache__[moduleId];      if (cachedModule !== undefined) {        return cachedModule.exports;      }      var module = (__webpack_module_cache__[moduleId] = {        exports: {},      });      __webpack_modules__[moduleId](module, module.exports, __webpack_require__);      return module.exports;    }    (() => {      ${entryModule._source}
    })();  })();  `;
}
```

到这里，「生成阶段」处理完成，这也意味着 `compilation` 编译工作的完成，接下来我们回到 `compiler` 进行最后的「产物输出」。

## 写入阶段

「写入阶段」比较容易理解，`assets` 上已经拥有了最终打包后的代码内容，最后要做的就是将代码内容写入到本地磁盘之中。

```jsx
// lib/compiler.js
class Compiler {
  ...
  run(callback) {
    // 触发 run hook
    this.hooks.run.call();
    // 创建 compilation 编译对象
    const compilation = new Compilation(this);
    // 编译模块
    compilation.build();
    // 生成产物
    compilation.seal();
    // 输出产物
    this.emitAssets(compilation, callback);
  }

  emitAssets(compilation, callback) {
    const { entries, modules, chunks, assets } = compilation;
    const output = this.options.output;

    // 调用 Plugin emit 钩子
    this.hooks.emit.call();

    // 若 output.path 不存在，进行创建
    if (!fs.existsSync(output.path)) {
      fs.mkdirSync(output.path);
    }

    // 将 assets 中的内容写入文件系统中
    Object.keys(assets).forEach((fileName) => {
      const filePath = path.join(output.path, fileName);
      fs.writeFileSync(filePath, assets[fileName]);
    });

    // 结束之后触发钩子
    this.hooks.done.call();

    callback(null, {
      toJSON: () => {
        return {
          entries,
          modules,
          chunks,
          assets,
        };
      },
    });
  }
}
```

至此，webpack 的打包流程就以完成。

接下来我们完善配置文件中未实现的 `loader` 和 `plugin`，然后调用测试用例，测试一下上面的实现。
