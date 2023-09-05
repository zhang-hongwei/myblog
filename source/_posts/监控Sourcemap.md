---
title: Sourcemap 使用
date: 2019-06-17 22:00:00
tags: 前端监控
---
### 使用source map

```jsx
const rawSourceMap = {
  version: 3,
  file: "min.js",
  names: ["bar", "baz", "n"],
  sources: ["one.js", "two.js"],
  sourceRoot: "http://example.com/www/js/",
  mappings:
    "CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID;CCDb,IAAI,IAAM,SAAUE,GAClB,OAAOA",
};

const whatever = await SourceMapConsumer.with(rawSourceMap, null, consumer => {
  console.log(consumer.sources);
  // [ 'http://example.com/www/js/one.js',
  //   'http://example.com/www/js/two.js' ]

  console.log(
    consumer.originalPositionFor({
      line: 2,
      column: 28,
    })
  );
  // { source: 'http://example.com/www/js/two.js',
  //   line: 2,
  //   column: 10,
  //   name: 'n' }

  console.log(
    consumer.generatedPositionFor({
      source: "http://example.com/www/js/two.js",
      line: 2,
      column: 10,
    })
  );
  // { line: 2, column: 28 }

  consumer.eachMapping(function (m) {
    // ...
  });

  return computeWhatever();
});
```

### 生成source map

深度指南: 编译为 JavaScript，并使用sourcemap进行调试

### 使用 SourceNode (高级 API)

```jsx
function compile(ast) {
  switch (ast.type) {
    case "BinaryExpression":
      return new SourceNode(
        ast.location.line,
        ast.location.column,
        ast.location.source,
        [compile(ast.left), " + ", compile(ast.right)]
      );
    case "Literal":
      return new SourceNode(
        ast.location.line,
        ast.location.column,
        ast.location.source,
        String(ast.value)
      );
    // ...
    default:
      throw new Error("Bad AST");
  }
}

var ast = parse("40 + 2", "add.js");
console.log(
  compile(ast).toStringWithSourceMap({
    file: "add.js",
  })
);
// { code: '40 + 2',
//   map: [object SourceMapGenerator] }
```

### 使用 SourceMapGenerator (低级 API)

```jsx
var map = new SourceMapGenerator({
  file: "source-mapped.js",
});

map.addMapping({
  generated: {
    line: 10,
    column: 35,
  },
  source: "foo.js",
  original: {
    line: 33,
    column: 2,
  },
  name: "christopher",
});

console.log(map.toString());
// '{"version":3,"file":"source-mapped.js","sources":["foo.js"],"names":["christopher"],"mappings":";;;;;;;;;mCAgCEA"}'
```

获取模块的引用:

```jsx
// Node.js
var sourceMap = require("source-map");

// Browser builds
var sourceMap = window.sourceMap;

// Inside Firefox
const sourceMap = require("devtools/toolkit/sourcemap/source-map.js");
```

### SourceMapConsumer

SourceMapConsumer 实例表示一个经过解析的source map，我们可以通过在生成的源中给它一个文件位置来查询关于原始文件位置的信息。

### SourceMapConsumer.initialize(options)

当在 node.js 之外使用 SourceMapConsumer 时，例如在 Web 上，它需要知道从哪个 URL 加载 lib/mappings.wasm。在构造任何 SourceMapConsumer 之前，必须通过调用 initialize 通知它。

Options 对象具有以下属性:

- `"lib/mappings.wasm"`: A `String` containing the URL of the `lib/mappings.wasm` file, or an `ArrayBuffer` with the contents of `lib/mappings.wasm`.
- “ lib/mappings.wasm”: 包含 lib/mappings.wasm 文件的 URL 的 String，或包含 lib/mappings.wasm 内容的 ArrayBuffer。

```jsx
sourceMap.SourceMapConsumer.initialize({
  "lib/mappings.wasm": "https://example.com/source-map/lib/mappings.wasm",
});
```

### new SourceMapConsumer(rawSourceMap)

唯一的参数是原始sourcemap(作为一个字符串，可以是 JSON.parse’d，也可以是一个对象)。根据规范，source map具有以下属性:

- `version`: 此映射遵循源映射规范的哪个版本。
- `sources`: 指向原始源文件的 URL 数组。
- `names`: 可由单个映射引用的标识符数组。
- `sourceRoot`: 可选项。所有来源都是相对的 URL 根。
- `sourcesContent`: 可选项。原始源文件的内容数组。
- `mappings`: 映射: 包含实际映射的 base64 VLQs 字符串。
- `file`: 可选。此源映射与生成的文件名相关联。
- `x_google_ignoreList`: 可选。一个附加的扩展字段，它是一个索引数组，引用源数组中的 url。这用于标识开发人员在调试时可能希望避免的第三方源。继续读

返回构造的sourcemap使用者的Promise。

当 SourceMapConsumer 不再使用时，您必须调用它的 delete 方法。

```jsx
const consumer = await new sourceMap.SourceMapConsumer(rawSourceMapJsonData);
doStuffWith(consumer);
consumer.destroy();
```

或者，您可以使用 SourceMapConsumer.with 来避免需要记住调用 delete。

### SourceMapConsumer.with

从 rawSourceMap 和 sourceMapUrl 构造一个新的 SourceMapConsumer (有关详细信息，请参阅 SourceMapConsumer 构造函数)。然后，对新构建的使用者调用异步函数 f (SourceMapConsumer)-> T，等待 f 完成，对使用者调用 delete，并返回 f 的返回值。

在 f 完成之后，您不能使用消费者！

通过使用 with，您不必记得在使用者上手动调用 delete，因为一旦 f 完成，它将被自动调用。

```jsx
const xSquared = await SourceMapConsumer.with(
  myRawSourceMap,
  null,
  async function (consumer) {
    // Use `consumer` inside here and don't worry about remembering
    // to call `destroy`.

    const x = await whatever(consumer);
    return x * x;
  }
);

// You may not use that `consumer` anymore out here; it has
// been destroyed. But you can use `xSquared`.
console.log(xSquared);
```

### SourceMapConsumer.prototype.destroy()

释放这个source map消费者相关的手动管理的浪费数据。

```jsx
consumer.destroy();
```

或者，您可以使用 SourceMapConsumer.with 来避免需要记住调用 delete。

### SourceMapConsumer.prototype.computeColumnSpans()

计算每个生成的映射的最后一列。最后一列包含在内。

```jsx
// Before:
consumer.allGeneratedPositionsFor({ line: 2, source: "foo.coffee" });
// [ { line: 2,
//     column: 1 },
//   { line: 2,
//     column: 10 },
//   { line: 2,
//     column: 20 } ]

consumer.computeColumnSpans();

// After:
consumer.allGeneratedPositionsFor({ line: 2, source: "foo.coffee" });
// [ { line: 2,
//     column: 1,
//     lastColumn: 9 },
//   { line: 2,
//     column: 10,
//     lastColumn: 19 },
//   { line: 2,
//     column: 20,
//     lastColumn: Infinity } ]
```

### SourceMapConsumer.prototype.originalPositionFor(generatedPosition)

返回生成源的行和列位置提供的原始源、行和列信息。唯一的参数是具有以下属性的对象:

- `line`: 生成源中的行号。这个库中的行号是从1开始的(注意，底层源映射规范使用从0开始的行号——这个库处理转换)。
- `column`: 生成的源中的列号。此库中的列号从0开始。
- `bias`: SourceMapConsumer.GREATEST _ LOWER _ Bound 或 SourceMapConsumer.LEAST _ UPPER _ Bound。指定如果找不到确切的元素，是否返回分别小于或大于正在搜索的元素的最接近的元素。默认值为 SourceMapConsumer.GREATEST _ LOWER _ BOound。

返回具有下列属性的对象:

- `source`: 原始源文件，如果该信息不可用，则为 null。
- `line`: 原始信息源中的行号，如果这个信息不可用，则为 null。行号是以1为基础的。
- `column`: 原始源中的列号，如果该信息不可用，则为 null。列号从0开始。
- `name`: 原始标识符，如果该信息不可用，则为 null。

```jsx
consumer.originalPositionFor({ line: 2, column: 10 });
// { source: 'foo.coffee',
//   line: 2,
//   column: 2,
//   name: null }

consumer.originalPositionFor({
  line: 99999999999999999,
  column: 999999999999999,
});
// { source: null,
//   line: null,
//   column: null,
//   name: null }
```

### SourceMapConsumer.prototype.generatedPositionFor(originalPosition)

返回为原始源、行和列提供的位置生成的行和列信息。唯一的参数是具有以下属性的对象:

- `source`: 原始源文件的文件名。
- `line`: 原始源文件中的行号。行号以1为基础。
- `column`: 原始源中的列号。列号从0开始。

返回具有下列属性的对象:

- `line`: 生成源中的行号，或者空。行号以1为基础。
- `column`: 生成源中的列号，即 null。列号从0开始。

```jsx
consumer.generatedPositionFor({ source: "example.js", line: 2, column: 10 });
// { line: 1,  column: 56 }
```

### SourceMapConsumer.prototype.allGeneratedPositionsFor(originalPosition)

返回所提供的原始源、行和列的所有生成的行和列信息。如果没有提供列，则返回与我们正在搜索的行或具有任何映射的下一个最近的行对应的所有映射。否则，返回与给定行对应的所有映射，以及我们正在搜索的列或具有任何偏移量的下一个最接近的列。

唯一的参数是具有以下属性的对象:

- `source`: 原始源文件的文件名。
- `line`: 原始源文件中的行号。行号以1为基础。
- `column`: 可选项。原始源中的列号。列号从0开始。

并返回一个对象数组，每个对象具有以下属性:

- `line`: 生成源中的行号，或者空。行号以1为基础。
- `column`: 生成源中的列号，即 null。列号从0开始。

```jsx
consumer.allGeneratedPositionsFor({ line: 2, source: "foo.coffee" });
// [ { line: 2,
//     column: 1 },
//   { line: 2,
//     column: 10 },
//   { line: 2,
//     column: 20 } ]
```

### SourceMapConsumer.prototype.hasContentsOfAllSources()

如果我们在源映射中列出了每个源的内嵌源内容，则返回 true，否则返回 false。

换句话说，如果这个方法返回 true，那么 consumer.sourceContentFor (s)对于 consumer.source 中的每个源都将成功。

```jsx
// ...
if (consumer.hasContentsOfAllSources()) {
  consumerReadyCallback(consumer);
} else {
  fetchSources(consumer, consumerReadyCallback);
}
// ...
```

### SourceMapConsumer.prototype.sourceContentFor(source[, returnNullOnMissing])

返回所提供源的原始源内容。唯一的参数是原始源文件的 URL。

如果找不到给定源的源内容，则抛出错误。可选地，将 true 作为第二个参数传递，以使其返回 null。

```jsx
consumer.sources;
// [ "my-cool-lib.clj" ]

consumer.sourceContentFor("my-cool-lib.clj");
// "..."

consumer.sourceContentFor("this is not in the source map");
// Error: "this is not in the source map" is not in the source map

consumer.sourceContentFor("this is not in the source map", true);
// null
```

### SourceMapConsumer.prototype.eachMapping(callback, context, order)

迭代源映射中原始源/行/列和生成的行/列之间的每个映射。

- `callback`:  用每个映射调用的函数。映射的格式为{ source、 generatedLine、 generatedColumn、 OrigalLine、 OrigalColumn、 name }
- `context`:可选的。如果指定了，这个对象将是每次调用回调时 this 的值。
- `order`: SourceMapConsumer.GENERated _ ORDER 或 SourceMapConsumer.ORIGINAL _ ORDER。指定是否要分别迭代按照生成的文件的行/列顺序或原始文件的源/行/列顺序排序的映射。默认为 SourceMapConsumer.GENERated _ ORDER。

```jsx
consumer.eachMapping(function (m) {
  console.log(m);
});
// ...
// { source: 'illmatic.js',
//   generatedLine: 1,
//   generatedColumn: 0,
//   originalLine: 1,
//   originalColumn: 0,
//   name: null }
// { source: 'illmatic.js',
//   generatedLine: 2,
//   generatedColumn: 0,
//   originalLine: 2,
//   originalColumn: 0,
//   name: null }
// ...
```

### SourceMapGenerator

SourceMapGenerator 的一个实例表示一个正在逐步构建的源映射。

### new SourceMapGenerator([startOfSourceMap])

您可以传递具有以下属性的对象:

- `file`: 与此源映射关联的生成源的文件名。
- `sourceRoot`:  这个源映射中所有相关 URL 的根。
- `skipValidation`: 可选项。如果为 true，则在添加映射时禁用它们的验证。这可以提高性能，但作为最后手段，应谨慎使用。即使这样，如果可能的话，在运行测试时也应该避免使用这个标志。

```jsx
var generator = new sourceMap.SourceMapGenerator({
  file: "my-generated-javascript-file.js",
  sourceRoot: "http://example.com/app/js/",
});
```

### SourceMapGenerator.fromSourceMap(sourceMapConsumer)

从现有的 SourceMapConsumer 实例创建新的 SourceMapGenerator。

- `sourceMapConsumer` The SourceMap.

```jsx
var generator = sourceMap.SourceMapGenerator.fromSourceMap(consumer);
```

### SourceMapGenerator.prototype.addMapping(mapping)

为正在创建的源映射添加一个从原始源行和列到生成源的行和列的映射。映射对象应该具有以下属性:

- `generated`: 生成的: 具有生成的行和列位置的对象。
- `original`: 原始的: 具有原始行和列位置的对象。
- `source`:  原始源文件(相对于 sourceRoot)。
- `name`:  此映射的可选原始标记名称。

```jsx
generator.addMapping({
  source: "module-one.scm",
  original: { line: 128, column: 0 },
  generated: { line: 3, column: 456 },
});
```

### SourceMapGenerator.prototype.setSourceContent(sourceFile, sourceContent)

Set the source content for an original source file.

为原始源文件设置源内容。

- `sourceFile` 文件原始源文件的 URL。
- `sourceContent` 文件的内容。

```jsx
generator.setSourceContent(
  "module-one.scm",
  fs.readFileSync("path/to/module-one.scm")
);
```

### SourceMapGenerator.prototype.applySourceMap(sourceMapConsumer[, sourceFile[, sourceMapPath]])

将源文件的 SourceMap 应用于 SourceMap。使用提供的 SourceMap 重写到提供的源文件的每个映射。注意: 结果映射的分辨率是此映射和提供的映射的最小值。

- `sourceMapConsumer`: 要应用的 SourceMap。
- `sourceFile`: 可选。源文件的文件名。如果忽略，将使用 sourceMapConsumer.file，如果它存在的话。否则将引发错误。
- `sourceMapPath`: 可选。要应用的 SourceMap 路径的目录名。如果是相对的，那么它就是相对于 SourceMap 的。
    
    如果两个 SourceMap 不在同一个目录中，并且要应用的 SourceMap 包含相对源路径，则需要此参数。如果是这样，那么需要相对于 SourceMap 重写这些相对源路径。
    
    如果省略，则假定两个 SourceMaps 都在同一个目录中，因此不需要任何重写。(供应’有同样的效果。)
    

### SourceMapGenerator.prototype.toString()

将生成的源映射呈现为字符串。

```jsx
generator.toString();
// '{"version":3,"sources":["module-one.scm"],"names":[],"mappings":"...snip...","file":"my-generated-javascript-file.js","sourceRoot":"http://example.com/app/js/"}'
```

### SourceNode源节点

SourceNodes 提供了一种对生成的 JavaScript 源代码片段进行抽象和/或连接的方法，同时维护这些片段和原始源代码之间关联的行和列信息。这是编译器在输出生成的 JS 和源映射之前可能使用的最终中间表示形式。

### new SourceNode([line, column, source[, chunk[, name]]])

- `line`: 与此源节点关联的原始行号，如果与原始行无关，则为 null。行号是以1为基础的。
- `column`: 与此源节点关联的原始列号，如果不与原始列关联，则为空。列号从0开始。
- `source`: 原始源的文件名; 如果没有提供文件名，则为 null。
- `chunk`: 可选。将立即传递给 SourceNode.Prototype.add，见下文。
- `name`: 可选。原始标识符。

```jsx
var node = new SourceNode(1, 2, "a.cpp", [
  new SourceNode(3, 4, "b.cpp", "extern int status;\n"),
  new SourceNode(5, 6, "c.cpp", "std::string* make_string(size_t n);\n"),
  new SourceNode(7, 8, "d.cpp", "int main(int argc, char** argv) {}\n"),
]);
```

### SourceNode.fromStringWithSourceMap(code, sourceMapConsumer[, relativePath])

从生成的代码和 SourceMapConsumer 创建 SourceNode。

- `code`: 生成的代码
- `sourceMapConsumer` 生成代码的 SourceMap
- `relativePath` SourceMapConsumer 中的相对源应该相对于的可选路径。

```jsx
const consumer = await new SourceMapConsumer(
  fs.readFileSync("path/to/my-file.js.map", "utf8")
);
const node = SourceNode.fromStringWithSourceMap(
  fs.readFileSync("path/to/my-file.js"),
  consumer
);
```

### SourceNode.prototype.add(chunk)

将生成的 JS 块添加到此源节点。

- `chunk`:  生成的 JS 代码的字符串片段、 SourceNode 的另一个实例或数组，其中每个成员都是其中之一。

```jsx
node.add(" + ");
node.add(otherNode);
node.add([leftHandOperandNode, " + ", rightHandOperandNode]);
```

### SourceNode.prototype.prepend(chunk)

将生成的 JS 块添加到这个源节点。

- `chunk`: 生成的 JS 代码的字符串片段、 SourceNode 的另一个实例或数组，其中每个成员都是其中之一。

```jsx
node.prepend("/** Build Id: f783haef86324gf **/\n\n");
```

### SourceNode.prototype.setSourceContent(sourceFile, sourceContent)

为源文件设置源内容。这将被添加到 sourcesContent 字段中的 SourceMap。

- `sourceFile`: 源文件的文件名
- `sourceContent`: 源文件的内容

```jsx
node.setSourceContent(
  "module-one.scm",
  fs.readFileSync("path/to/module-one.scm")
);
```

### SourceNode.prototype.walk(fn)

遍历此节点及其子节点中的 JS 代码段树。对 JS 的每个代码片段调用 walk 函数一次，并传递该代码片段及其原始关联源的行/列位置。

- `fn`: 遍历函数。

```
var node = new SourceNode(1, 2, "a.js", [
  new SourceNode(3, 4, "b.js", "uno"),
  "dos",
  ["tres", new SourceNode(5, 6, "c.js", "quatro")],
]);

node.walk(function (code, loc) {
  console.log("WALK:", code, loc);
});
// WALK: uno { source: 'b.js', line: 3, column: 4, name: null }
// WALK: dos { source: 'a.js', line: 1, column: 2, name: null }
// WALK: tres { source: 'a.js', line: 1, column: 2, name: null }
// WALK: quatro { source: 'c.js', line: 5, column: 6, name: null }
```

### SourceNode.prototype.walkSourceContents(fn)

遍历源节点树。对每个源文件内容调用遍历函数，并将文件名和源内容传递给遍历函数。

- `fn`:  遍历函数。

```jsx
var a = new SourceNode(1, 2, "a.js", "generated from a");
a.setSourceContent("a.js", "original a");
var b = new SourceNode(1, 2, "b.js", "generated from b");
b.setSourceContent("b.js", "original b");
var c = new SourceNode(1, 2, "c.js", "generated from c");
c.setSourceContent("c.js", "original c");

var node = new SourceNode(null, null, null, [a, b, c]);
node.walkSourceContents(function (source, contents) {
  console.log("WALK:", source, ":", contents);
});
// WALK: a.js : original a
// WALK: b.js : original b
// WALK: c.js : original c
```

### SourceNode.prototype.join(sep)Join (sep)

除了 SourceNodes 之外，与 Array.Prototype.join 类似。在每个源节点的子节点之间插入分隔符。

- `sep`: The separator.

```jsx
var lhs = new SourceNode(1, 2, "a.rs", "my_copy");
var operand = new SourceNode(3, 4, "a.rs", "=");
var rhs = new SourceNode(5, 6, "a.rs", "orig.clone()");

var node = new SourceNode(null, null, null, [lhs, operand, rhs]);
var joinedNode = node.join(" ");
```

### SourceNode.prototype.replaceRight(pattern, replacement)

在最右边的源代码片段上调用 String.Prototype.place。用于修剪源节点末尾的空白，等等。

- `pattern`:  要替换的模式。
- `replacement`: 用来替换模式的东西。

```jsx
// Trim trailing white space.
node.replaceRight(/\s*$/, "");
```

### SourceNode.prototype.toString()

返回此源节点的字符串表示形式。遍历树并将所有不同的代码段连接到一个字符串。

```jsx
var node = new SourceNode(1, 2, "a.js", [
  new SourceNode(3, 4, "b.js", "uno"),
  "dos",
  ["tres", new SourceNode(5, 6, "c.js", "quatro")],
]);

node.toString();
// 'unodostresquatro'
```

### SourceNode.prototype.toStringWithSourceMap([startOfSourceMap])

返回此源节点树的字符串表示形式，以及包含所生成源和原始源之间所有映射的 SourceMapGenerator。

参数与新的 SourceMapGenerator 的参数相同。

```jsx
var node = new SourceNode(1, 2, "a.js", [
  new SourceNode(3, 4, "b.js", "uno"),
  "dos",
  ["tres", new SourceNode(5, 6, "c.js", "quatro")],
]);

node.toStringWithSourceMap({ file: "my-output-file.js" });
// { code: 'unodostresquatro',
//   map: [object SourceMapGenerator] }
```
