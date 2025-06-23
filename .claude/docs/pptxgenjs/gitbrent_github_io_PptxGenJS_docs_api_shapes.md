[Skip to main content](https://gitbrent.github.io/PptxGenJS/docs/api-shapes/#docusaurus_skipToContent_fallback)

⭐️ If you like PptxGenJS, give it a star on [GitHub](https://github.com/gitbrent/PptxGenJS)! ⭐️

On this page

Almost 200 shape types can be added to Slides (see [`ShapeType`](https://github.com/gitbrent/PptxGenJS/blob/master/types/index.d.ts) enum).

## Usage [​](https://gitbrent.github.io/PptxGenJS/docs/api-shapes/\#usage "Direct link to heading")

```codeBlockLines_e6Vv
// Shapes without text
slide.addShape(pres.ShapeType.rect, { fill: { color: "FF0000" } });
slide.addShape(pres.ShapeType.ellipse, {
  fill: { type: "solid", color: "0088CC" },
});
slide.addShape(pres.ShapeType.line, { line: { color: "FF0000", width: 1 } });

// Shapes with text
slide.addText("ShapeType.rect", {
  shape: pres.ShapeType.rect,
  fill: { color: "FF0000" },
});
slide.addText("ShapeType.ellipse", {
  shape: pres.ShapeType.ellipse,
  fill: { color: "FF0000" },
});
slide.addText("ShapeType.line", {
  shape: pres.ShapeType.line,
  line: { color: "FF0000", width: 1, dashType: "lgDash" },
});

```

## Properties [​](https://gitbrent.github.io/PptxGenJS/docs/api-shapes/\#properties "Direct link to heading")

### Position/Size Props ( [PositionProps](https://gitbrent.github.io/PptxGenJS/docs/types/\#position-props)) [​](https://gitbrent.github.io/PptxGenJS/docs/api-shapes/\#positionsize-props-positionprops "Direct link to heading")

| Name | Type | Default | Description | Possible Values |
| :-- | :-- | :-- | :-- | :-- |
| `x` | number | `1.0` | hor location (inches) | 0-n |
| `x` | string |  | hor location (percent) | 'n%'. (Ex: `{x:'50%'}` middle of the Slide) |
| `y` | number | `1.0` | ver location (inches) | 0-n |
| `y` | string |  | ver location (percent) | 'n%'. (Ex: `{y:'50%'}` middle of the Slide) |
| `w` | number | `1.0` | width (inches) | 0-n |
| `w` | string |  | width (percent) | 'n%'. (Ex: `{w:'50%'}` 50% the Slide width) |
| `h` | number | `1.0` | height (inches) | 0-n |
| `h` | string |  | height (percent) | 'n%'. (Ex: `{h:'50%'}` 50% the Slide height) |

### Shape Props ( [ShapeProps](https://gitbrent.github.io/PptxGenJS/docs/types/\#shape-props-shapeprops)) [​](https://gitbrent.github.io/PptxGenJS/docs/api-shapes/\#shape-props-shapeprops "Direct link to heading")

| Name | Type | Description | Possible Values |
| :-- | :-- | :-- | :-- |
| `align` | string | alignment | `left` or `center` or `right`. Default: `left` |
| `fill` | [ShapeFillProps](https://gitbrent.github.io/PptxGenJS/docs/types/#fill-props-shapefillprops) | fill props | Fill color/transparency props |
| `flipH` | boolean | flip Horizontal | `true` or `false` |
| `flipV` | boolean | flip Vertical | `true` or `false` |
| `hyperlink` | [HyperlinkProps](https://gitbrent.github.io/PptxGenJS/docs/types/#hyperlink-props-hyperlinkprops) | hyperlink props | (see type link) |
| `line` | [ShapeLineProps](https://gitbrent.github.io/PptxGenJS/docs/types/#shape-line-props-shapelineprops) | border line props | (see type link) |
| `rectRadius` | number | rounding radius | 0 to 1. (Ex: 0.5. Only for `pptx.shapes.ROUNDED_RECTANGLE`) |
| `rotate` | number | rotation (degrees) | -360 to 360. Default: `0` |
| `shadow` | [ShadowProps](https://gitbrent.github.io/PptxGenJS/docs/types/#shadow-props-shadowprops) | shadow props | (see type link) |
| `shapeName` | string | optional shape name | Ex: "Customer Network Diagram 99" |

## Examples [​](https://gitbrent.github.io/PptxGenJS/docs/api-shapes/\#examples "Direct link to heading")

![Shapes with Text Demo](https://gitbrent.github.io/PptxGenJS/assets/images/ex-shape-slide-da6d30f411b3140efc58bef6b275c2b5.png)

## Samples [​](https://gitbrent.github.io/PptxGenJS/docs/api-shapes/\#samples "Direct link to heading")

Sample code all available types: [demos/modules/demo\_shape.mjs](https://github.com/gitbrent/PptxGenJS/blob/master/demos/modules/demo_shape.mjs)

- [Usage](https://gitbrent.github.io/PptxGenJS/docs/api-shapes/#usage)
- [Properties](https://gitbrent.github.io/PptxGenJS/docs/api-shapes/#properties)
  - [Position/Size Props (PositionProps)](https://gitbrent.github.io/PptxGenJS/docs/api-shapes/#positionsize-props-positionprops)
  - [Shape Props (ShapeProps)](https://gitbrent.github.io/PptxGenJS/docs/api-shapes/#shape-props-shapeprops)
- [Examples](https://gitbrent.github.io/PptxGenJS/docs/api-shapes/#examples)
- [Samples](https://gitbrent.github.io/PptxGenJS/docs/api-shapes/#samples)
