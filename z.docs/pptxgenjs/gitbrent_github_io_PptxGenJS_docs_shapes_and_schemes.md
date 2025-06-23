[Skip to main content](https://gitbrent.github.io/PptxGenJS/docs/shapes-and-schemes/#docusaurus_skipToContent_fallback)

⭐️ If you like PptxGenJS, give it a star on [GitHub](https://github.com/gitbrent/PptxGenJS)! ⭐️

On this page

## PowerPoint Shape Types [​](https://gitbrent.github.io/PptxGenJS/docs/shapes-and-schemes/\#powerpoint-shape-types "Direct link to heading")

The library comes with over 180 built-in PowerPoint shapes (thanks to [officegen project](https://github.com/Ziv-Barber/officegen)).

- Use inline typescript definitions to view available shapes
- or see `ShapeType` in [index.d.ts](https://github.com/gitbrent/PptxGenJS/blob/master/types/index.d.ts) for the complete list

## PowerPoint Scheme Colors [​](https://gitbrent.github.io/PptxGenJS/docs/shapes-and-schemes/\#powerpoint-scheme-colors "Direct link to heading")

Scheme color is a variable that changes its value whenever another scheme palette is selected. Using scheme colors, design consistency can be easily preserved throughout the presentation and viewers can change color theme without any text/background contrast issues.

- Use inline typescript definitions to view available colors
- or see `SchemeColor` in [index.d.ts](https://github.com/gitbrent/PptxGenJS/blob/master/types/index.d.ts) for the complete list

To use a scheme color, set a color constant as a property value:

```codeBlockLines_e6Vv
slide.addText("Scheme Color 'text1'", { color: pptx.SchemeColor.text1 });

```

See the [Shapes Demo](https://gitbrent.github.io/PptxGenJS/demo/#shapes) for Scheme Colors demo

![Scheme Demo](https://gitbrent.github.io/PptxGenJS/assets/images/demo-scheme-181c7b8076de1e6badd759f437741022.png)

```codeBlockLines_e6Vv
export enum SchemeColor {
    "text1" = "tx1",
    "text2" = "tx2",
    "background1" = "bg1",
    "background2" = "bg2",
    "accent1" = "accent1",
    "accent2" = "accent2",
    "accent3" = "accent3",
    "accent4" = "accent4",
    "accent5" = "accent5",
    "accent6" = "accent6",
}

```

- [PowerPoint Shape Types](https://gitbrent.github.io/PptxGenJS/docs/shapes-and-schemes/#powerpoint-shape-types)
- [PowerPoint Scheme Colors](https://gitbrent.github.io/PptxGenJS/docs/shapes-and-schemes/#powerpoint-scheme-colors)
