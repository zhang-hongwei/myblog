---
title: css 常用单位
date: 2020-02-23 11:00:00
tags: css
---
## rem

rem是一种相对单位，是指相对于根元素（即html元素）的字体大小的倍数。这意味着如果根元素的字体大小为16像素，1rem将等于16像素，2rem将等于32像素，以此类推。rem的优点是可以根据根元素的字体大小自动调整大小，因此非常适合响应式设计。rem通常用于设置字体大小，但也可以用于其他属性，例如间距和宽度等。

```jsx

(function flexible(window, document) {
    var docEl = document.documentElement
    var dpr = window.devicePixelRatio || 1

    // adjust body font size
    function setBodyFontSize() {
        if (document.body) {
            document.body.style.fontSize = (12 * dpr) + 'px'
        }
        else {
            document.addEventListener('DOMContentLoaded', setBodyFontSize)
        }
    }
    setBodyFontSize();

    // set 1rem = viewWidth / 10
    function setRemUnit() {
        var rem = docEl.clientWidth / 10
        docEl.style.fontSize = rem + 'px'
    }

    setRemUnit()

    // reset rem unit on page resize
    window.addEventListener('resize', setRemUnit)
    window.addEventListener('pageshow', function (e) {
        if (e.persisted) {
            setRemUnit()
        }
    })

    // detect 0.5px supports
    if (dpr >= 2) {
        var fakeBody = document.createElement('body')
        var testElement = document.createElement('div')
        testElement.style.border = '.5px solid transparent'
        fakeBody.appendChild(testElement)
        docEl.appendChild(fakeBody)
        if (testElement.offsetHeight === 1) {
            docEl.classList.add('hairlines')
        }
        docEl.removeChild(fakeBody)
    }
}(window, document))

```
设置body元素的字体大小为62.5% (即默认大小16px的62.5%)，等于10px。现在你可以通过计算基准大小10px的倍数，在任何元素上方便的使用em单位。这样有6px = 0.6em, 8px = 0.8em, 12px = 1.2em, 14px = 1.4em, 16px = 1.6em

### em

em是一种相对于父元素字体大小的相对单位。如果父元素的字体大小为16像素，1em将等于16像素，2em将等于32像素，以此类推。与rem不同，em受到其直接父元素字体大小的影响，因此在嵌套元素中使用时需要特别注意。em通常用于设置字体大小，但也可以用于其他属性，例如间距和宽度等。与rem相比，em更适合需要精细控制字体大小的情况，但在响应式设计方面可能不够灵活。

## vh

vh是一种相对于视口高度的单位，即视口高度的百分比。例如，如果视口高度为1000像素，1vh将等于10像素，50vh将等于500像素。vh通常用于设置元素的高度和最小高度，以确保它们在不同大小的屏幕上都具有相似的外观。vh可以与其他单位一起使用，例如像素或em，以实现更精细的控制。但是，需要注意的是，vh的值会随着视口大小的变化而变化，因此在使用vh时需要特别注意响应式设计，以确保元素在不同设备上都有良好的外观。

## vw

vw是一种相对于视口宽度的单位，即可见区域的网页宽度。例如，如果视口宽度为1000像素，1vw将等于10像素，50vw将等于500像素。vw通常用于设置元素的宽度，以确保它们在不同大小的屏幕上都具有相似的外观。vw可以与其他单位一起使用，例如像素或em，以实现更精细的控制。但是，需要注意的是，vw的值会随着视口大小的变化而变化，因此在使用vw时需要特别注意响应式设计，以确保元素在不同设备上都有良好的外观。

### %

百分比（%）是一种相对单位，表示相对于另一个值的百分比。在网页设计中，百分比通常用于设置元素的宽度和高度，以及边距和填充等属性。例如，如果一个元素的父元素的宽度为1000像素，而该元素的宽度设置为50%，那么它将等于500像素的宽度。百分比也可以用于设置字体大小，但这也取决于父元素的字体大小。百分比是一种非常灵活的单位，因为它可以根据任何相对值进行调整，例如父元素的宽度或高度，或视口的宽度或高度。但是，需要注意的是，百分比依赖于父元素或视口的大小，因此在响应式设计方面需要谨慎使用，以确保元素在不同设备上都具有良好的外观。