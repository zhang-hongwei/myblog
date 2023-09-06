---
title: 如何实现代理Ajax
date: 2019-06-20 22:00:00
tags: 前端监控
---

## 原理

`ajaxhook`的原理是通过拦截`XMLHttpRequest`对象，实现对`XMLHttpRequest`对象的代理，从而对其方法和属性进行监听和修改。在`hookAjax`函数中，遍历原生`XMLHttpRequest`对象的属性和方法，并在代理`XMLHttpRequest`对象中挂钩相应的属性和方法。同时，在挂钩`XMLHttpRequest`对象的方法时，会先判断代理是否有相应方法的实现，如果有的话，就会执行代理的方法，否则会执行原生`XMLHttpRequest`对象的方法。通过这种方式，可以在不影响原有功能的前提下，对`XMLHttpRequest`对象的方法和属性进行监听和修改，从而实现代理Ajax的功能。

```jsx
function AjaxHook (ob) {

    // 将原生XMLHttpRequest保存为RealXMLHttpRequest
    var realXhr = "RealXMLHttpRequest"

    // 调用此函数将覆盖`XMLHttpRequest`对象
    ob.hookAjax = function (proxy) {

        // 避免重复挂钩
        window[realXhr] = window[realXhr] || XMLHttpRequest
        XMLHttpRequest = function () {
            var xhr = new window[realXhr];
            // 我们不应该挂钩XMLHttpRequest.prototype，因为我们不能
            // 保证所有属性都在原型上。
            // 相反，挂钩XMLHttpRequest实例可以避免这个问题。
            for (var attr in xhr) {
                var type = "";
                try {
                    type = typeof xhr[attr] // 可能会在某些浏览器上引发异常
                } catch (e) {
                }
                if (type === "function") {
                    // 挂钩xhr的方法，例如`open`、`send`等...
                    this[attr] = hookFunction(attr);
                } else {
                    Object.defineProperty(this, attr, {
                        get: getterFactory(attr),
                        set: setterFactory(attr),
                        enumerable: true
                    })
                }
            }
            this.xhr = xhr;

        }

        // 为xhr属性生成getter
        function getterFactory(attr) {
            return function () {
                var v = this.hasOwnProperty(attr + "_") ? this[attr + "_"] : this.xhr[attr];
                var attrGetterHook = (proxy[attr] || {})["getter"]
                return attrGetterHook && attrGetterHook(v, this) || v
            }
        }

        // 为xhr属性生成setter；我们可以利用此机会挂钩事件回调函数（例如：`onload`）of xhr;
        function setterFactory(attr) {
            return function (v) {
                var xhr = this.xhr;
                var that = this;
                var hook = proxy[attr];
                if (typeof hook === "function") {
                    // 挂钩事件回调函数，例如`onload`、`onreadystatechange`等...
                    xhr[attr] = function () {
                        proxy[attr](that) || v.apply(xhr, arguments);
                    }
                } else {
                    // 如果属性不可写，则生成代理属性
                    var attrSetterHook = (hook || {})["setter"];
                    v = attrSetterHook && attrSetterHook(v, that) || v
                    try {
                        xhr[attr] = v;
                    } catch (e) {
                        this[attr + "_"] = v;
                    }
                }
            }
        }

        // 挂钩xhr的方法。
        function hookFunction(fun) {
            return function () {
                var args = [].slice.call(arguments)
                if (proxy[fun] && proxy[fun].call(this, args, this.xhr)) {
                    return;
                }
                return this.xhr[fun].apply(this.xhr, args);
            }
        }

        // 返回真正的XMLHttpRequest
        return window[realXhr];
    }

    // 取消挂钩
    ob.unHookAjax = function () {
        if (window[realXhr]) XMLHttpRequest = window[realXhr];
        window[realXhr] = undefined;
    }

    // TypeScript用
    ob["default"] = ob;
}

```