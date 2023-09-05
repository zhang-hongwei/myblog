---
title: 什么是Back/forward cache
date: 2019-06-22 22:00:00
tags: 浏览器
---
# 什么是**Back/forward cache**

后退/前进缓存(或 bfcache)是一种浏览器优化，支持即时后退和前进导航。它显著改善了用户的浏览体验，尤其是那些网络或设备速度较慢的用户。

作为 Web 开发人员，了解如何在所有浏览器上优化页面以适应 bfcache 是至关重要的，这样用户就可以从中获益。

## 浏览器兼容

Bfcache 已经在 Firefox 和 Safari 中得到支持很多年了，无论是在桌面还是移动设备上。

从86版本开始，Chrome 为一小部分 Android 用户启用了跨站点导航的 bfcache。在随后的版本中，额外的支持缓慢推出。自96版本以来，bfcache 已经为所有桌面和手机上的 Chrome 用户启用。

## Bfcache 基础知识

Bfcache 是一个**内存缓存**，它在用户导航离开时**存储页面的完整快照(包括 JavaScript 堆)**。当整个页面在内存中时，如果用户决定返回，浏览器可以快速轻松地恢复它。

有多少次你访问一个网站，点击一个链接到另一个页面，只是意识到这不是你想要的，然后点击后退按钮？在这个时候，bfcache 可以对前一页面的加载速度产生很大的影响:

| 没有启用 bfcache | 一个新的请求被发起来加载前一个页面，并且，根据页面为重复访问优化的程度，浏览器可能需要重新下载、重新解析和重新执行它刚刚下载的一些(或全部)资源。 |
| --- | --- |
| 启用 bfcache | 加载前一页基本上是即时的，因为可以从内存还原整个页面，根本不需要进入网络 |

Bfcache 不仅加速了导航，还减少了数据使用，因为资源不必再次下载。

Chrome 使用数据显示，10个桌面导航中有1个是向后或向前导航，5个手机导航中有1个是向后或向前导航。启用 bfcache 后，浏览器可以减少每天数十亿网页的数据传输和加载时间！

### “缓存”是怎么运作的

Bfcache 使用的“ cache”与 HTTP 缓存不同(HTTP 缓存在加速重复导航方面也很有用)。**Bfcache 是内存中整个页面(包括 JavaScript 堆)的快照**，**而 HTTP 缓存只包含以前发出的请求的响应**。由于加载页面所需的所有请求很少能够从 HTTP 缓存中完成，因此使用 bfcache 还原的重复访问总是比最优化的非 bfcache 导航更快。

但是，在内存中创建页面的快照涉及到一些复杂性，比如如何最好地保存正在进行的代码。例如，当页面在 bfcache 中时达到超时时，如何处理 setTimeout ()调用？

答案是，浏览器会暂停运行任何挂起的计时器或未解决的承诺(本质上是 JavaScript 任务队列中的所有挂起的任务) ，并在从 bfcache 还原页面时(或如果)恢复处理任务。

在某些情况下，这是相当低的风险(例如，超时或承诺) ，但在其他情况下，它可能会导致非常混乱或意想不到的行为。例如，如果浏览器暂停作为 IndexedDB 事务的一部分所需的任务，它可能会影响同一起源中的其他打开的选项卡(因为同一 IndexedDB 数据库可以同时被多个选项卡访问)。因此，浏览器通常不会尝试在 IndexedDB 事务中缓存页面，或者使用可能影响其他页面的 API。

有关各种 API 使用如何影响页面的 bfcache 资格的详细信息，请参阅下面的 bfcache 优化页面。

### 观察 bfcache 的 API

虽然 bfcache 是浏览器自动进行的优化，但对于开发人员来说，知道它何时发生仍然很重要，这样他们就可以为此优化页面，并相应地调整任何指标或性能度量。

用于观察 bfcache 的主要事件是页面转换事件(pageshow 和 pagehide) ，这些事件与 bfcache 存在的时间一样长，目前几乎所有的浏览器都支持它。

当页面进入或离开 bfcache 时，以及在其他一些情况下，也会发送较新的 Page LifCycle 事件(冻结和恢复)。例如，当后台选项卡被冻结以最小化 CPU 使用时。注意，**页面生命周期事件目前只在基于 Chromium 的浏览器中受支持。**

### 观察从 bfcache 还原页面的时间

页面显示事件在页面最初加载时以及从 bfcache 恢复页面时的 load 事件之后立即触发。页面显示事件具有一个持久化属性，如果从 bfcache 还原了页面，该属性将为 true (如果没有还原，则为 false)。可以使用持久化属性来区分常规页面加载和 bfcache 还原。例如:

```jsx
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    console.log('This page was restored from the bfcache.');
  } else {
    console.log('This page was loaded normally.');
  }
});
```

在支持页面生命周期 API 的浏览器中，当从 bfcache 恢复页面时(紧接在页面显示事件之前) ，恢复事件也会触发，但是当用户重新访问一个冻结的背景选项卡时，它也会触发。如果你想在页面被冻结后恢复它的状态(包括 bfcache 中的页面) ，你可以使用恢复事件，但是如果你想测量你的站点的 bfcache 命中率，你需要使用页面显示事件。在某些情况下，您可能需要同时使用这两种方法。

### 观察页面何时进入 bfcache

页面隐藏事件与页面显示事件相对应。当正常加载页面或从 bfcache 还原页面时，页面显示事件将触发。当正常卸载页面或浏览器试图将页面放入 bfcache 时，将触发 pagehide 事件。

Pagehide 事件还有一个持久化属性，如果该属性为 false，那么您可以确信页面不会进入 bfcache。但是，如果持久化属性为 true，则不保证将缓存页。这意味着浏览器打算缓存页面，但可能存在一些因素使其无法缓存。

```jsx
window.addEventListener('pagehide', (event) => {
  if (event.persisted) {
    console.log('This page *might* be entering the bfcache.');
  } else {
    console.log('This page will unload normally and be discarded.');
  }
});
```

类似地，冻结事件将在页面隐藏事件之后立即触发(如果事件的持久化属性为 true) ，但这同样只意味着浏览器打算缓存页面。由于下面解释的一些原因，它可能仍然不得不放弃它。

## 为 bfcache 优化页面

并非所有页面都存储在 bfcache 中，即使页面存储在那里，也不会无限期地保持在那里。至关重要的是，开发人员要了解是什么使页面符合(和不符合) bfcache 的条件，以最大限度地提高缓存命中率。

以下各节概述了使浏览器尽可能缓存页面的最佳实践。

### 永远不要使用卸载事件

在所有浏览器中优化 bfcache 最重要的方法就是永远不要使用 unload 事件！

卸载事件对浏览器来说是有问题的，因为它早于 bfcache，而且互联网上的许多页面都是在卸载事件触发后页面将不再继续存在的(合理的)假设下运行的。这是一个挑战，因为很多页面都是基于这样的假设构建的: 卸载事件将在用户导航离开时触发，这种假设已经不再成立(而且很长时间以来都不成立)。

因此，浏览器面临着一个两难境地，它们必须在能够改善用户体验的东西之间做出选择，但这样做也可能导致页面崩溃。

在桌面上，Chrome 和 Firefox 已经选择使页面不符合 bfcache 标准，如果他们添加卸载侦听器，这是风险较小，但也取消了很多页面的资格。Safari 将尝试使用卸载事件侦听器缓存一些页面，但是为了减少潜在的破坏，当用户导航离开时，它将不运行卸载事件，这使得事件非常不可靠。

在移动端，Chrome 和 Safari 将尝试使用卸载事件侦听器缓存页面，因为卸载事件在移动端一直是非常不可靠的，所以破坏的风险较低。Firefox 将使用 unload 的页面视为不适合 bfcache，但 iOS 除外，iOS 要求所有浏览器都使用 WebKit 呈现引擎，因此它的行为类似于 Safari。

不要使用 unload 事件，而是使用 pagehide 事件。当卸载事件当前触发的所有情况下，pagehide 事件都会触发，当将页放入 bfcache 中时，它也会触发。

实际上，Lighthouse 有一个“无卸载侦听器”审计，如果开发人员的页面上有任何 JavaScript (包括来自第三方库的 JavaScript)添加卸载事件侦听器，它会发出警告。

**Warning**

<aside>
💡 永远不要添加卸载事件侦听器！而是使用 pagehide 事件。添加卸载事件监听器会让你的网站在 Firefox 中运行速度变慢，而且这段代码在 Chrome 和 Safari 中大部分时间都不会运行。

</aside>

### Only add `beforeunload` listeners conditionally [#](https://web.dev/bfcache/#only-add-beforeunload-listeners-conditionally)

### 只能有条件地添加 before 卸载侦听器

Before unload 事件不会使你的页面不适合在 Chrome 或 Safari 中使用 bfcache，但会使它们不适合在 Firefox 中使用，所以除非绝对必要，否则不要使用它。

但是，与 unload 事件不同，before unload 有合法的用法。例如，当您想警告用户他们有未保存的更改时，如果他们离开页面，就会丢失这些更改。在这种情况下，建议您只在用户有未保存的更改时添加 before 卸载侦听器，然后在保存未保存的更改后立即删除它们。

Don't

不要

```jsx
window.addEventListener('beforeunload', (event) => {
  if (pageHasUnsavedChanges()) {
    event.preventDefault();
    return event.returnValue = 'Are you sure you want to exit?';
  }
});
上面的代码无条件地添加了一个 before 卸载侦听器。
```

```jsx
function beforeUnloadListener(event) {
  event.preventDefault();
  return event.returnValue = 'Are you sure you want to exit?';
};

// A function that invokes a callback when the page has unsaved changes.
onPageHasUnsavedChanges(() => {
  window.addEventListener('beforeunload', beforeUnloadListener);
});

// A function that invokes a callback when the page's unsaved changes are resolved.
onAllChangesSaved(() => {
  window.removeEventListener('beforeunload', beforeUnloadListener);
});
```

The code above only adds the `beforeunload` listener when it's needed (and removes it when it's not).
上面的代码只在需要的时候添加 before 卸载侦听器(在不需要的时候删除它)。

### Minimize use of `Cache-Control: no-store` [#](https://web.dev/bfcache/#minimize-use-of-cache-control-no-store)

### 尽量减少使用 Cache-Control: no-store

Cache-Control: no-store 是 Web 服务器可以设置在响应上的 HTTP 头，指示浏览器不要将响应存储在任何 HTTP 缓存中。这应该用于包含敏感用户信息的资源，例如登录后面的页面。

虽然 bfcache 不是 HTTP 缓存，但是从历史上看，当 Cache-Control: no-store 设置在页面资源本身(与任何子资源相反)时，浏览器选择不将页面存储在 bfcache 中。目前正在进行工作，以保护隐私的方式改变 Chrome 的这种行为，但目前任何使用 Cache-Control: no-store 的页面都不符合 bfcache 的条件。

因为 Cache-Control: no-store 限制了页面对 bfcache 的合格性，所以它应该只设置在包含敏感信息的页面上，而任何类型的缓存都是不合适的。

对于希望始终提供最新内容ーー且内容不包含敏感信息的页面，请使用 Cache-Control: no-cache 或 Cache-Control: max-age = 0。这些指令指示浏览器在提供内容之前重新验证内容，并且它们不影响页面的 bfcache 资格。

请注意，当从 bfcache 恢复页面时，它是从内存恢复的，而不是从 HTTP 缓存恢复的。因此，像 Cache-Control: no-cache 或 Cache-Control: max-age = 0这样的指令不会被考虑在内容显示给用户之前进行重新验证。

不过，这仍然可能是一种更好的用户体验，因为 bfcache 恢复是即时的，而且ーー由于页面不会在 bfcache 中停留很长时间ーー内容不太可能过期。但是，如果您的内容每分钟都发生变化，您可以使用页面显示事件获取任何更新，如下一节所述。

### 在 bfcache 恢复后更新过期或敏感数据

如果您的站点保持用户状态(特别是任何敏感的用户信息) ，那么在从 bfcache 还原页面之后，需要更新或清除该数据。

例如，如果用户导航到一个结帐页面，然后更新他们的购物车，那么如果从 bfcache 还原一个过时的页面，那么回退导航可能会暴露过时的信息。

另一个更关键的例子是，如果一个用户在公共计算机上登出一个站点，下一个用户单击后退按钮。这可能会暴露用户在登出时假设已清除的私有数据。

为了避免出现这种情况，最好总是在页面显示事件之后更新页面，如果 event。

下面的代码检查页显示事件中是否存在站点特定的 Cookie，如果找不到 Cookie，则重新加载该 Cookie:

```jsx
window.addEventListener('pageshow', (event) => {
  if (event.persisted && !document.cookie.match(/my-cookie/)) {
    // Force a reload if the user has logged out.
    location.reload();
  }
});
```

### 避免使用 window.opener 引用

在一些浏览器(包括基于 Chromium 的浏览器)中，如果一个页面是使用 window.open ()打开的，或者(在88版之前的基于 Chromium 的浏览器中)从 target = _ black ーー没有指定 rel = “ noopener”ーー的链接打开的，那么打开的页面将会有一个对打开的页面的窗口对象的引用。

除了存在安全风险之外，带有非空 window.opener 引用的页面不能安全地放入 bfcache，因为这可能会破坏任何试图访问它的页面。

因此，最好避免创建 window.opener 引用。您可以尽可能使用 rel = “ noopener”来实现这一点。如果您的站点需要打开一个窗口并通过 window.postMessage ()或直接引用 window 对象来控制它，那么无论是打开的窗口还是打开器都不适合使用 bfcache。

### 在用户导航离开之前，始终关闭打开的连接

如上所述，当一个页面被放入 bfcache 时，所有计划的 JavaScript 任务都会暂停，然后当该页面被从缓存中取出时继续执行。

如果这些预定的 JavaScript 任务只访问 DOM API ーー或者其他仅与当前页面隔离的 API ーー那么在页面对用户不可见时暂停这些任务不会造成任何问题。

然而，如果这些任务被连接到 API，这些 API 也可以从同一起源的其他页面访问(例如: IndexedDB、 Web Locks、 WebSocket 等) ，这可能是有问题的，因为暂停这些任务可能会阻止其他选项卡中的代码运行。

因此，一些浏览器不会尝试在以下场景中将页面放入 bfcache:

- 具有打开的 IndexedDB 连接的页
- 带有正在进行的 get ()或 XMLHttpRequest 的页面
- 具有打开的 WebSocket 或 WebRTC 连接的页

如果您的页面正在使用这些 API 中的任何一个，那么最好在页面隐藏或冻结事件期间始终关闭连接并删除或断开观察者。这将使浏览器能够安全地缓存页面，而不会影响其他打开的选项卡。

Then, if the page is restored from the bfcache, you can re-open or re-connect to those APIs (in the `pageshow` or `resume` event).

然后，如果从 bfcache 还原了页面，则可以重新打开或重新连接到这些 API (在页面显示或恢复事件中)。

下面的示例演示如何通过关闭 pagehide 事件侦听器中的打开连接来确保在使用 IndexedDB 时页面符合 bfcache 的条件:

```jsx
let dbPromise;
function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('my-db', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('keyval');
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
  }
  return dbPromise;
}

// Close the connection to the database when the user is leaving.
window.addEventListener('pagehide', () => {
  if (dbPromise) {
    dbPromise.then(db => db.close());
    dbPromise = null;
  }
});

// Open the connection when the page is loaded or restored from bfcache.
window.addEventListener('pageshow', () => openDB());
```

### 测试以确保页是可缓存的

Chrome DevTools 可以帮助您测试页面，以确保它们针对 bfcache 进行了优化，并识别任何可能阻止它们符合条件的问题。

要测试一个特定的页面，在 Chrome 中导航到它，然后在 DevTools 中转到 Application > Back-forward Cache。接下来单击 Run Test 按钮，DevTools 将尝试导航离开和返回，以确定是否可以从 bfcache 恢复页面。

![](https://s2.loli.net/2023/09/05/vVq17WlyhKpPuec.png)

中的后退/前进缓存特性目前正在积极开发中。我们强烈鼓励开发人员在 Chrome Canary 中测试他们的页面，以确保他们运行的是最新版本的 DevTools，并获得最新的 bfcache 建议。

If successful, the panel will report "Restored from back-forward cache":

如果成功，面板将报告“从后向缓存恢复”:

![](https://s2.loli.net/2023/09/05/K3kgrc1abLDzuHN.png)

如果不成功，面板将指示页面未被还原，并列出原因。如果原因是你作为一个开发人员可以解决的问题，这也会被指出:

![](https://s2.loli.net/2023/09/05/IifNv6OCaXTP5eU.png)

In the screenshot above, the use of an `unload` event listener is [preventing](https://web.dev/bfcache/#never-use-the-unload-event) the page from being eligible for bfcache. You can fix that by switching from `unload` to using `pagehide` instead:

在上面的屏幕快照中，卸载事件侦听器的使用阻止了页面符合 bfcache 的条件。你可以通过从卸载切换到使用 pagehide 来解决这个问题:

不要

```jsx
window.addEventListener('unload', ...);
```

做

```jsx
window.addEventListener('pagehide', ...);
```

Lighthouse 10.0还添加了一个 bfcache 审计，它执行与 DevTools 类似的测试，并提供了审计失败时页面不合格的原因。有关更多信息，请查看 bfcache 审计的文档。

## Bfcache 如何影响分析和性能度量

如果你使用分析工具跟踪网站访问量，你可能会注意到随着 Chrome 继续为更多用户启用 bfcache，报告的总页面访问量有所下降。

实际上，由于大多数流行的分析库不会将 bfcache 还原作为新的页面视图来跟踪，因此您可能已经低报了其他实现 bfcache 的浏览器的页面视图。

如果您不希望由于 Chrome 启用 bfcache 而导致页面视图数量下降，您可以通过监听页面显示事件并检查持久化属性，将 bfcache 还原报告为页面视图(推荐)。

下面的例子展示了如何使用 Google Analytics; 其逻辑应该与其他分析工具类似:

```jsx
// Send a pageview when the page is first loaded.
gtag('event', 'page_view');

window.addEventListener('pageshow', (event) => {
  // Send another pageview if the page is restored from bfcache.
  if (event.persisted) {
    gtag('event', 'page_view');
  }
});
```

### 测量 bfcache 命中率

您可能还希望跟踪是否使用了 bfcache，以帮助识别没有使用 bfcache 的页面。例如，对于一个事件:

```jsx
window.addEventListener('pageshow', (event) => {
  // You can measure bfcache hit rate by tracking all bfcache restores and
  // other back/forward navigations via a separate event.
  const navigationType = performance.getEntriesByType('navigation')[0].type;
  if (event.persisted || navigationType == 'back_forward' ) {
    gtag('event', 'back_forward_navigation', {
      'isBFCache': event.persisted,
    });
  }
});
```

重要的是要认识到，当前退/前进导航不使用 bfcache 时，除了站点所有者控制之外，还有许多场景，包括:

- 当用户退出浏览器并重新启动它时
- 当用户复制一个选项卡时
- 当用户关闭一个选项卡并打开它时

即使没有这些排除，bfcache 也会在一段时间后被丢弃，以节省内存。

因此，网站所有者不应该期望所有的后向导航都有100% 的 bfcache 命中率。然而，测量它们之间的比率对于识别页面本身阻止 bfcache 在大部分向后和向前导航中使用的页面非常有用。

Chrome 团队正在开发一个 NotRestoredStories API，以帮助开发人员了解为什么没有使用 bfcache，以及这是否是他们可以改进的地方。

### 性能测量

Bfcache 还可能对在字段中收集的性能指标产生负面影响，特别是衡量页面加载时间的指标。

由于 bfcache 导航还原现有页面而不是启动新的页面加载，因此启用 bfcache 时收集的页面加载总数将减少。但是，重要的是，被 bfcache 还原替换的页面加载很可能是数据集中最快的页面加载。这是因为根据定义，回传和转发导航是重复访问，重复页面加载通常比第一次访问者的页面加载更快(如前所述，这是由于 HTTP 缓存)。

其结果是数据集中的快速页面加载减少，这可能会降低分发的速度ーー尽管用户体验到的性能可能已经提高了！

有几种方法可以解决这个问题。一种是使用各自的导航类型对所有页面加载指标进行注释: 导航、重新加载、 back _ forward 或 preender。这将允许您继续监视这些导航类型中的性能ーー即使整个发行版倾斜为负值。对于非以用户为中心的页面加载指标(如 Time to First Byte (TTFB)) ，建议使用此方法。

对于像 Core Web Vitals 这样以用户为中心的指标，更好的选择是报告一个更准确地表示用户体验的值。
注意

不要将导航计时 API 中的 back _ forward 导航类型与 bfcache 还原混淆。导航定时 API 只注释页面加载，而 bfcache 还原则重用从前一个导航中加载的页面。

### 对核心网络重要性的影响

Core Web Vitals 衡量用户在不同维度(加载速度、交互性、视觉稳定性)的网页体验，由于用户体验 bfcache 恢复为比传统页面加载更快的导航，所以 Core Web Vitals 指标反映这一点非常重要。毕竟，用户并不关心是否启用了 bfcache，他们只关心导航是否快速！

像 Chrome 用户体验报告这样的工具，收集并报告核心 Web 重要性指标，将 bfcache 还原视为数据集中的单独页面访问。

虽然目前还没有专门的 web 性能 API 用于在 bfcache 恢复后测量这些指标，但是它们的值可以使用现有的 web API 进行近似。

- 对于 Larest Contentful Paint (LCP) ，您可以使用页面显示事件的时间戳和下一个绘制框架的时间戳之间的增量(因为框架中的所有元素将在同一时间绘制)。注意，在 bfcache 恢复的情况下，LCP 和 FCP 将是相同的。
- 对于第一个输入延迟(FID) ，您可以在页面显示事件中重新添加事件侦听器(与 FID polyfill 使用的侦听器相同) ，并将 FID 报告为 bfcache 恢复后第一个输入的延迟。
- 对于 CumulativeLayoutShift (CLS) ，您可以继续使用现有的性能观察器; 您所要做的就是将当前 CLS 值重置为0。

有关 bfcache 如何影响每个指标的详细信息，请参阅各个 CoreWebVitals 指南页面。关于如何在代码中实现这些指标的 bfcache 版本的特定示例，请参考将它们添加到 web-vitals JS 库的 PR。

在 v1中，web-vitals JavaScript 库支持在其报告的指标中恢复 bfcache。使用 v1或更高版本的开发人员不需要更新他们的代码。