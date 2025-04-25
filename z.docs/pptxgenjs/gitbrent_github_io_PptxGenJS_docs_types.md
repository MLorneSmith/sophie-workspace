[Skip to main content](https://gitbrent.github.io/PptxGenJS/docs/types/#docusaurus_skipToContent_fallback)

⭐️ If you like PptxGenJS, give it a star on [GitHub](https://github.com/gitbrent/PptxGenJS)! ⭐️

On this page

The PptxGenJS interfaces referenced in surrounding documentation. See the [complete list](https://github.com/gitbrent/PptxGenJS/blob/master/types/index.d.ts) on GitHub.

## Position Props ( `PositionProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/types/\#position-props-positionprops "Direct link to heading")

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

## Data/Path Props ( `DataOrPathProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/types/\#datapath-props-dataorpathprops "Direct link to heading")

| Name | Type | Description | Possible Values |
| :-- | :-- | :-- | :-- |
| `data` | string | image data (base64) | base64-encoded image string. (either `data` or `path` is required) |
| `path` | string | image path | Same as used in an (img src="") tag. (either `data` or `path` is required) |

## Hyperlink Props ( `HyperlinkProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/types/\#hyperlink-props-hyperlinkprops "Direct link to heading")

| Name | Type | Description | Possible Values |
| :-- | :-- | :-- | :-- |
| `slide` | number | link to a given slide | Ex: `2` |
| `tooltip` | string | link tooltip text | Ex: `Click to visit home page` |
| `url` | string | target URL | Ex: `https://wikipedia.org` |

## Image Props ( `ImageProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/types/\#image-props-imageprops "Direct link to heading")

| Option | Type | Default | Description | Possible Values |
| :-- | :-- | :-- | :-- | :-- |
| `hyperlink` | `HyperlinkProps` |  | add hyperlink | object with `url` or `slide` |
| `placeholder` | string |  | image placeholder | Placeholder location: `title`, `body` |
| `rotate` | integer | `0` | rotation (degrees) | Rotation degress: `0`- `359` |
| `rounding` | boolean | `false` | image rounding | Shapes an image into a circle |
| `sizing` | object |  | transforms image | See [Image Sizing](https://gitbrent.github.io/PptxGenJS/docs/api-images/#sizing-properties) |

## Media Props ( `MediaProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/types/\#media-props-mediaprops "Direct link to heading")

| Option | Type | Description | Possible Values |
| :-- | :-- | :-- | :-- |
| `type` | string | media type | media type: `audio` or `video` (reqs: `data` or `path`) or `online` (reqs: `link`) |
| `link` | string | video URL | (YouTube only): link to online video |

## Shadow Props ( `ShadowProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/types/\#shadow-props-shadowprops "Direct link to heading")

| Name | Type | Default | Description | Possible Values |
| :-- | :-- | :-- | :-- | :-- |
| `type` | string | `none` | shadow type | `outer`, `inner`, `none` |
| `angle` | number | `0` | blue degrees | `0`- `359` |
| `blur` | number | `0` | blur range (points) | `0`- `100` |
| `color` | string | `000000` | color | hex color code |
| `offset` | number | `0` | shadow offset (points) | `0`- `200` |
| `opacity` | number | `0` | opacity percentage | `0.0`- `1.0` |

## Shape Props ( `ShapeProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/types/\#shape-props-shapeprops "Direct link to heading")

| Name | Type | Description | Possible Values |
| :-- | :-- | :-- | :-- |
| `align` | string | alignment | `left` or `center` or `right`. Default: `left` |
| `fill` | [ShapeFillProps](https://gitbrent.github.io/PptxGenJS/docs/types/#shape-fill-props-shapefillprops) | fill props | Fill color/transparency props |
| `flipH` | boolean | flip Horizontal | `true` or `false` |
| `flipV` | boolean | flip Vertical | `true` or `false` |
| `hyperlink` | [HyperlinkProps](https://gitbrent.github.io/PptxGenJS/docs/types/#hyperlink-props-hyperlinkprops) | hyperlink props | (see type link) |
| `line` | [ShapeLineProps](https://gitbrent.github.io/PptxGenJS/docs/types/#shape-line-props-shapelineprops) | border line props | (see type link) |
| `rectRadius` | number | rounding radius | 0-180. (only for `pptx.shapes.ROUNDED_RECTANGLE`) |
| `rotate` | number | rotation (degrees) | -360 to 360. Default: `0` |
| `shadow` | [ShadowProps](https://gitbrent.github.io/PptxGenJS/docs/types/#shadow-props-shadowprops) | shadow props | (see type link) |
| `shapeName` | string | optional shape name | Ex: "Customer Network Diagram 99" |

## Shape Fill Props ( `ShapeFillProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/types/\#shape-fill-props-shapefillprops "Direct link to heading")

| Name | Type | Default | Description | Possible Values |
| :-- | :-- | :-- | :-- | :-- |
| `color` | string | `000000` | fill color | hex color or [scheme color](https://gitbrent.github.io/PptxGenJS/docs/shapes-and-schemes/). |
| `transparency` | number | `0` | transparency | transparency percentage: 0-100 |
| `type` | string | `solid` | fill type | shape fill type |

## Shape Line Props ( `ShapeLineProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/types/\#shape-line-props-shapelineprops "Direct link to heading")

| Name | Type | Default | Description | Possible Values |
| :-- | :-- | :-- | :-- | :-- |
| `beginArrowType` | string |  | line ending | `arrow`, `diamond`, `oval`, `stealth`, `triangle` or `none` |
| `color` | string |  | line color | hex color or [scheme color](https://gitbrent.github.io/PptxGenJS/docs/shapes-and-schemes/). Ex: `{line:'0088CC'}` |
| `dashType` | string | `solid` | line dash style | `dash`, `dashDot`, `lgDash`, `lgDashDot`, `lgDashDotDot`, `solid`, `sysDash` or `sysDot` |
| `endArrowType` | string |  | line heading | `arrow`, `diamond`, `oval`, `stealth`, `triangle` or `none` |
| `transparency` | number | `0` | line transparency | Percentage: 0-100 |
| `width` | number | `1` | line width (points) | 1-256. Ex: `{ width:4 }` |

## Slide Number Props ( `SlideNumberProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/types/\#slide-number-props-slidenumberprops "Direct link to heading")

| Option | Type | Default | Description | Possible Values |
| :-- | :-- | :-- | :-- | :-- |
| `color` | string | `000000` | color | hex color or [scheme color](https://gitbrent.github.io/PptxGenJS/docs/shapes-and-schemes/). |
| `fontFace` | string |  | font face | any available font. Ex: `{ fontFace:'Arial' }` |
| `fontSize` | number |  | font size | 8-256. Ex: `{ fontSize:12 }` |

## Text Underline Props ( `TextUnderlineProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/types/\#text-underline-props-textunderlineprops "Direct link to heading")

| Name | Type | Description | Possible Values |
| :-- | :-- | :-- | :-- |
| `color` | string | underline color | hex color or [scheme color](https://gitbrent.github.io/PptxGenJS/docs/shapes-and-schemes/). |
| `style` | string | underline style | `dash`, `dashHeavy`, `dashLong`, `dashLongHeavy`, `dbl`, `dotDash`, `dotDashHeave`, `dotDotDash`, `dotDotDashHeavy`, `dotted`, `dottedHeavy`, `heavy`, `none`, `sng`, `wavy` , `wavyDbl`, `wavyHeavy` |

- [Position Props ( `PositionProps`)](https://gitbrent.github.io/PptxGenJS/docs/types/#position-props-positionprops)
- [Data/Path Props ( `DataOrPathProps`)](https://gitbrent.github.io/PptxGenJS/docs/types/#datapath-props-dataorpathprops)
- [Hyperlink Props ( `HyperlinkProps`)](https://gitbrent.github.io/PptxGenJS/docs/types/#hyperlink-props-hyperlinkprops)
- [Image Props ( `ImageProps`)](https://gitbrent.github.io/PptxGenJS/docs/types/#image-props-imageprops)
- [Media Props ( `MediaProps`)](https://gitbrent.github.io/PptxGenJS/docs/types/#media-props-mediaprops)
- [Shadow Props ( `ShadowProps`)](https://gitbrent.github.io/PptxGenJS/docs/types/#shadow-props-shadowprops)
- [Shape Props ( `ShapeProps`)](https://gitbrent.github.io/PptxGenJS/docs/types/#shape-props-shapeprops)
- [Shape Fill Props ( `ShapeFillProps`)](https://gitbrent.github.io/PptxGenJS/docs/types/#shape-fill-props-shapefillprops)
- [Shape Line Props ( `ShapeLineProps`)](https://gitbrent.github.io/PptxGenJS/docs/types/#shape-line-props-shapelineprops)
- [Slide Number Props ( `SlideNumberProps`)](https://gitbrent.github.io/PptxGenJS/docs/types/#slide-number-props-slidenumberprops)
- [Text Underline Props ( `TextUnderlineProps`)](https://gitbrent.github.io/PptxGenJS/docs/types/#text-underline-props-textunderlineprops)