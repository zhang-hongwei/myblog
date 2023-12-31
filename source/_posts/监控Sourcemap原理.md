---
title: Sourcemap 原理
date: 2019-06-18 22:00:00
tags: 前端监控
---

## 代码映射文件 sourcemap

很早之前，为了解决JavaScript脚本越来越复杂、越来越大的问题，通常大部分源码都要通过转换、压缩等方法才能投入到生产环境。通常的情况是**压缩**、**文件合并**以减少HTTP请求、**语言转换**（如CoffeeScript、Typescript到JavaScript）。

最终，生产环境的代码的是混淆的并且难以阅读的：

这样的代码即使devtools告诉你错误发生在了什么位置，你也无法从这些信息中得到什么有用信息，而sourcemap就是为了解决这些问题。

**简单来讲，sourcemap就是一个信息文件，存储了代码的位置信息，能从转换后代码的位置信息映射到转换前代码的位置信息上**。

### 什么是sourcemap？

**sourcemap文件格式**

```jsx
{
  "version": 3,
  "file": "sourceMapDemo.js",
  "sourceRoot": "",
  "sources": [
    "sourceMapDemo.ts"
  ],
  "names": [],
  "mappings": ";;;AAAO,IAAM, ...",
  "sourcesContent": [
    ""
  ]
}
```

- **version**：sourcemap的版本
- **file**：转换后的文件名。
- **sourceRoot**：转换前的文件所在的目录。如果与转换前的文件在同一目录，该项为空。
- **sources**：转换前的文件。该项是一个数组，表示可能存在多个文件合并。
- **names**：转换前的所有变量名和属性名。
- **mappings**：记录位置信息的字符串，下文详细介绍。
- **sourcesContent**：源代码内容（一般没用，当代码无法host或程序性获取的时候）。

## mappings 如何映射文件信息？

### mappings的存储结构

**sourcemap**实现映射的关键便是**mappings**属性。mappings是一个很长的字符串，分为三种标志：

**第一种是行对应**，以分号（;）结尾，每个分号对应转换后源码的一行（group **组**）。

**第二种是位置对应**，以逗号（,）分隔，每个逗号隔开的一串字符对应转换后源码的一个位置（segment **段**）。

**第三种是位置转换**，逗号分隔开的字符串。以Base64 VLQ编码表示，代表该位置对应的转换前的源码位置。

如`{ "mappings": ";;;AAAO,IAAM, ..." }`，三个分号（**;**）表示前三行没有映射信息，第四行的位置信息从**AAAO** 开始且表示第一个位置信息，逗号（**,**）后的下一串字符**IAAM**表示第二个位置，直到下一个分号开始，表示第五行位置信息，依次类推。

### 什么是VLQ编码(Variable-length quantity)？

VLQ是用来表示任意大小数字的编码方式。VLQ的概念很简单（假设这里VLQ单位长度为8 bits）: 数字在VLQ中以n个8位二进制位表示，最高位为标志位，0表示不连续，1表示连续。

1. 将数字以二进制位表示;
2. 将数字以7位二进制位一组进行拆分，最后一组不足7位高位补0；
3. 除最后一组第8位（位置A）补0表示不与接下来的数字连续外，前面的每组第8位（位置A）补1表示；

为了表示有符号整数的正负，则将第一段（最低位）取 1（A0连续位）+ 6（data）+ 1（符号位，0正1负）：

因此，在对数据（二进制）进行编码时，会取长度为7n-1为一组进行编码，分别的正负位和连续位进行补位凑满8位。当然，VLQ只是一种编码概念，像其他引擎（比如Unreal将符号位设置在首段最前面）也可能将段倒置逆序等。

### Base64编码

Base64是以64个**可打印字符串**来表示二进制数据的方法。 2^**6** = 64 即采用6位二进制位为单元。映射表（常用标准）即按顺序的**A-Za-z/=**映射

### Base64-VLQ

由于Base64的单元限制，故Base64 VLQ的单位也是6位，即最高位表示连续，低5位表示实际数据

### mappings如何表示代码位置

**1. 通过记录字符转换前后的位置**

> “feel
> 
> 
> **the**
> 
> **the**
> 

| 输出位置(Output) | 文件(sources) | 输入位置(Input) | 符号（names) |
| --- | --- | --- | --- |
| Line 1, Column 0 | Yoda_input.txt | Line 1, Column 5 | t |
| Line 1, Column 1 | Yoda_input.txt | Line 1, Column 6 | h |
| Line 1, Column 2 | Yoda_input.txt | Line 1, Column 7 | e |

mappings里记录的是符号的输入输出位置信息和字符信息，手动填入mappings以单词**the**为例（line|col|file|line|col)：

`mappings=1|0|Yoda_input.txt|1|5,1|1|Yoda_input.txt|1|6,1|2|Yoda_input.txt|1|7`

因此，可以通过转换后的文本位置映射回之前的文本信息。

**2. 优化行信息**

用**分号**（;)分隔表示输出行信息，这样可以少记录一个标志，如下：

```jsx
feel the force;              line other 1;
other line 1;    ⇒ 转换 ⇒    the force feel;
...                        ...
```

| 输出位置(Output) | 文件(sources) | 输入位置(Input) | 符号（names) |
| --- | --- | --- | --- |
| Line 2, Column 0 | Yoda_input.txt | Line 1, Column 5 | t |
| Line 2, Column 1 | Yoda_input.txt | Line 1, Column 6 | h |
| Line 2, Column 2 | Yoda_input.txt | Line 1, Column 7 | e |

如上，单词**the**从第一行的位置转换后到了第二行，在mappings里用分号表示行分隔信息时，可以如下表示：

`mappings=......;0|Yoda_input.txt|1|5,1|Yoda_input.txt|1|6,2|Yoda_input.txt|1|7`

忽略第一行的信息，在第一个分号之后第二个分号之前表示整个字符串都在第二行。

**3. 整合一下数据**

当然我们不可能在mappings的段里都写上**Yoda_input.txt**文件名，那就用**sources**表示资源位置吧：

```jsx
{
  "sources": [
    "Yoda_input.txt"
  ],
  "mappings": "...;0|0|1|5,1|0|1|6,2|0|1|7"
}
```

**4. 优化字符映射**

我们也不可能在使用sourcemap时真的去读取文件，查询索引信息再恢复输入输出文件，这样即耗费性能也非常的慢，有没有什么方式只需要sourcemap文件就可以还原输入和输出文件呢？答案是有：

sourcemap将转换和修改的符号表保存在names字段里，最后一位新增一个索引位在names里交换出符号信息。

```jsx
{
  "sources": [
    "Yoda_input.txt"
  ],
  "names": [
    "t",
    "h",
    "e"
  ],
  "mappings": "...;0|0|1|5|0,1|0|1|6|1,2|0|1|7|2"
}
```

**5. 用Base64 VLQ优化信息存储**

该有的都有了，但我们还有两个最大的问题要处理：

- 我们不能真用竖线来分割每个位置信息所代表的数字;
- 字符可能是10行40列sources第12个文件names第126个字符，没有竖线区分，对于长度不定的数字没办法有效区分；

首先，不能用数组存储，json序列化很昂贵；其次，不能用竖线去分隔位置信息，这样会使得mappings的长度大幅增加，起不到精简高效的作用。所以需要一个能存储有序数字并且能表示分隔的编码方式，即VLQ。为了保证数据的可靠性，避免国际字符在平台间产生差异和问题，所以采用了最通用的base64编码进行交换和存储。

代码实现：

```jsx
const base64 = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/', '='
]
const base64Table: Map<number, string> = base64.reduce((table, n, idx) => table.set(idx, n), new Map())

const enum Vlq {
  Length = 5,
  Base = 1 << Vlq.Length, // 100000 32
  BaseMask = Vlq.Base - 1, // 011111 31
  Continuation = Vlq.Base
}

const encoder = (num: number) => {
  // 1. 负数末尾标志位设1
  if (num < 0) num = (Math.abs(num) << 1) | 1
  else {
    num <<= 1
  }

  let result = ""
  while (true) {
    const digit = num & Vlq.BaseMask
    result += base64Table.get(num < Vlq.Continuation ? digit : digit | Vlq.Continuation)

    if ((num >>>= Vlq.Length) <= 0) break
  }
  return result
}

const encode = (num: number | number[]) => {
  if (typeof num === "number") return encoder(num)
  else {
    return num.reduce((pre, n) => pre += encoder(n), "")
  }
}

//在线检测 https://www.murzwin.com/base64vlq.html
console.log(encode(7)) // O
console.log(encode(16)) // gB
console.log(encode(1200)) // grC
console.log(encode(-17)) // jB
console.log(encode([710, 0, 0, 0])) // ssBAAA

```

**6. 优化列信息**

如果列信息始终使用绝对位置，则mappings每个字段都会存储过多较大的数字（如列112，列116，列120），如果出行第一个字段保持绝对位置记录行首空格信息为，其他列信息采用相对位置存储，则可以让数字小很多（如列4，列+6=10，列+12=22 依次计算）。

因为数据的可变长以及正负标记等因素，**此优化需要VLQ编码作为前提**。

**7. 优化字符映射**

```jsx
feel the force;              l other 1;
other line 1;    ⇒ 转换 ⇒    t force feel;   （存储   names: [the, line]）
read the line;               read t l
...                        ...
```

实际中代码的转换远比这个例子复杂许多。为了减少代码体积，通常会将单词提取成较短的字母数字组合。

| 输出位置(Output) | 文件(sources) | 输入位置(Input) | 符号（names) |
| --- | --- | --- | --- |
| Line 2, Column 0 | Yoda_input.txt | Line 1, Column 5 | the => t => 0 |
| Line 1, Column 0 | Yoda_input.txt | Line 2, Column 6 | line => l => 1 |
| Line 3, Column 7 | Yoda_input.txt | Line 1, Column 9 | line => l => 1 |

以单词**the**，**line** 为例，分别在转换前和转换后进行了位置改变和字符替换，最后一位新增一个符号映射位索引替换的字符。位置信息记录在上表，则在sourcemap里的结果如下(省略其它字符）：

```jsx
{
  "names": [
    "the",
    "line"
  ],
  "sources": [
    "Yoda_input.txt"
  ],
  "mappings": "0|1|2|6|1;0|1|1|5|0;7|1|1|9|1"
}
```

代码实现

```jsx
export default class SourceMap {
  files: string[] = []
  mappings: Mapping[] = []
  names: string[] = []
  target: string
  sourceRoot?: string

  // 计算相对位置并使用VLQ编码存储
  toMap(sourceContent?: string): string {
    const mappingArray = this.mappings.sort((a, b) => a.offset - b.offset)
    let previousOffset = 0
    let previousLine = 0
    let previousColumn = 0
    let previousFile = 0
    let previousName = 0

    const mappings = mappingArray.map(instance => {
      const offset = instance.offset - previousOffset
      const line = (instance.line - 1) - previousLine
      const column = (instance.column - 1) - previousColumn
      const file = instance.fileIndex - previousFile
      let name: number | undefined = undefined
      const n = instance.name
      if (n) {
        name = n - previousName
        previousName = n
      }
      previousOffset = instance.offset
      previousLine = (instance.line - 1)
      previousColumn = (instance.column - 1)
      previousFile = instance.fileIndex

      return encode([offset, file, line, column]) + (name === undefined ? "" : encode(name))
    }).join(",")

    const mapData: SourceMapData = {
      version: "3",
      sources: this.files,
      names: this.names,
      mappings
    }
    if (sourceContent) {
      mapData.sourceContent = sourceContent
    }
    if (this.target) mapData.file = this.target
    if (this.sourceRoot) mapData.sourceRoot = this.sourceRoot

    return JSON.stringify(mapData)
  }
}

```

### 使用sourcemap

编译转换后的代码要使用sourcemap，只需要在文件末尾加一行注释即可：

`//# sourceMappingURL=/path/to/file.js.map`

同时需要支持sourcemap的浏览器开启sourcemap功能：

## 堆栈信息还原

知道生产环境如何上报错误，知道sourcemap原理如何之后，我们就要着手从错误信息中还原出源代码错误的位置。

**利用第三方库解析sourcemap和定位**

这里要用到Mozilla开发的一个工具库source-map，可以大大降低sourcemap操作的难度。

### sourcemap准备

首先，我们要在发布应用时产出sourcemap文件，并host到我们的收集服务器上（这里就是localhost:4004)。源代码使用的打包工具是vite，所以只需要设置`build.sourcemap = "hidden"`（值有三个，分别为true， false， “hidden”，区别是hidden也输出sourcemap文件，但是在js文件中并不会加上末尾的引用sourcemap url注释）。

为了方便，我就将vite打包的sourcemap直接复制到服务端代码app.ts旁边：

```jsx
server
  | app.ts  // express server
  | frontend.js.map
```

frontend.js.map

```jsx
{
  "version": 3,
  "file": "index-49709e01.js",
  "sources": [
    "../../../../sdk/handler/utils/reporter.ts",
    "../../../../sdk/handler/services/listener.ts",
    "../../src/errors.ts",
    "../../src/main.ts"
  ],
  "sourcesContent": [
    "export interface IReportData {\n  lineno: number\n  colno: number\n ......",
    "import { reportError } from \"../utils/reporter\";\n\nexport const ......",",
    "export const setupTypeError = (el: HTMLButtonElement) => {\n  el.onclick = () => ......",",
    "import { startListener } from \"@lib/error-handler\";\n\nimport {\n  setupReferencesError, ......","
  ],
  "names": [
    "cache",
    "reportError",
    "data",
    "key",
    "..."
  ],
  "mappings": "ssBAQA,MAAMA,MAAY..."
}
```

### 改造收集服务端，利用source-map库获取代码片段

服务端就非常简单了，1.读取sourcemap文件；2.接受位置信息；3. 返回content以及源码间位置。结束。

```jsx
import sourceMap, { RawSourceMap } from "source-map"

// 根据行数获取源文件行数
export const getPosition = async (map: RawSourceMap, rolno: number, colno: number) => {
  const consumer = await new sourceMap.SourceMapConsumer(map)

  if (colno < 0 || colno < 0) return
  const position = consumer.originalPositionFor({
    line: rolno,
    column: colno
  })

  const content = position.source ? consumer.sourceContentFor(position.source) : ""

  return { position, content }
}

app.post("/error", async (req, res) => {
  const { lineno, colno  } = req.body

  // 读取sourcemap文件并格式化成json raw
  fs.readFile("./frontend.js.map", async (err, data) => {
    if (err) return res.json({ message: "failed" })

    const raw = JSON.parse(data.toString())

    const result = await getPosition(raw, lineno, colno)
    console.log("result", result)
    res.json(result)
  })
})

```

### 

## 丰富信息与生产问题

- 界面可以通过传递更多的error type，主动catch易错误点以达到更好的监控效果；
- 实际toC的业务中，打点监控都是非应用域名的，服务端一般不开放跨域，这回造成跨域问题；如果用js/css/font文件进行传参，则会因为挂载dom树竞争页面渲染，频繁时容易造成卡顿；因此，可以考虑使用**new Image**.src进行参数传递，为了减少资源开销，可以使用最小1x1像素的gif进行打点。

> 同样的响应，GIF可以比BMP节约41%的流量，比PNG节约35%的流量。GIF才是最佳选择
> 
- 可以进行跨域
- 不会携带cookie
- 不需要等待服务器返回数据
- 为了使监控不影响应用的加载，不挤兑js的线程，可以将错误结合时间缓存起来，用异步的方法上报。同时，sdk也可以通过inline script异步加载。