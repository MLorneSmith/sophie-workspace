[Skip to main content](https://gitbrent.github.io/PptxGenJS/docs/api-images/#docusaurus_skipToContent_fallback)

⭐️ If you like PptxGenJS, give it a star on [GitHub](https://github.com/gitbrent/PptxGenJS)! ⭐️

On this page

Images of almost any type can be added to Slides.

## Usage [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#usage "Direct link to heading")

```codeBlockLines_e6Vv
// Image from remote URL
slide.addImage({ path: "https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg" });

// Image by local URL
slide.addImage({ path: "images/chart_world_peace_near.png" });

// Image by data (pre-encoded base64)
slide.addImage({ data: "image/png;base64,iVtDafDrBF[...]=" });

```

### Usage Notes [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#usage-notes "Direct link to heading")

Either provide a URL location or base64 data to create an image.

- `path` \- URL: relative or full
- `data` \- base64: string representing an encoded image

### Supported Formats and Notes [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#supported-formats-and-notes "Direct link to heading")

- Standard image types: png, jpg, gif, et al.
- Animated gifs: only shown animated on Microsoft 365/Office365 and the newest desktop versions, older versions will animate them in presentation mode only
- SVG images: supported in the newest version of desktop PowerPoint or Microsoft 365/Office365

### Performance Considerations [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#performance-considerations "Direct link to heading")

It takes CPU time to read and encode images! The more images you include and the larger they are, the more time will be consumed.

- The time needed to read/encode images can be completely eliminated by pre-encoding any images
- Pre-encode images into a base64 strings and use the `data` option value instead
- This will both reduce dependencies (who needs another image asset to keep track of?) and provide a performance
boost (no time will need to be consumed reading and encoding the image)

## Base Properties [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#base-properties "Direct link to heading")

### Position/Size Props ( [PositionProps](https://gitbrent.github.io/PptxGenJS/docs/types/\#datapath-props-dataorpathprops)) [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#positionsize-props-positionprops "Direct link to heading")

| Option | Type | Default | Description | Possible Values |
| :-- | :-- | :-- | :-- | :-- |
| `x` | number | `1.0` | hor location (inches) | 0-n |
| `x` | string |  | hor location (percent) | 'n%'. (Ex: `{x:'50%'}` middle of the Slide) |
| `y` | number | `1.0` | ver location (inches) | 0-n |
| `y` | string |  | ver location (percent) | 'n%'. (Ex: `{y:'50%'}` middle of the Slide) |
| `w` | number | `1.0` | width (inches) | 0-n |
| `w` | string |  | width (percent) | 'n%'. (Ex: `{w:'50%'}` 50% the Slide width) |
| `h` | number | `1.0` | height (inches) | 0-n |
| `h` | string |  | height (percent) | 'n%'. (Ex: `{h:'50%'}` 50% the Slide height) |

### Data/Path Props ( [DataOrPathProps](https://gitbrent.github.io/PptxGenJS/docs/types/\#datapath-props-dataorpathprops)) [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#datapath-props-dataorpathprops "Direct link to heading")

| Option | Type | Default | Description | Possible Values |
| :-- | :-- | :-- | :-- | :-- |
| `data` | string |  | image data (base64) | base64-encoded image string. (either `data` or `path` is required) |
| `path` | string |  | image path | Same as used in an (img src="") tag. (either `data` or `path` is required) |

### Image Props ( [ImageProps](https://gitbrent.github.io/PptxGenJS/docs/types/\#image-props-imageprops)) [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#image-props-imageprops "Direct link to heading")

| Option | Type | Default | Description | Possible Values |
| :-- | :-- | :-- | :-- | :-- |
| `altText` | string |  | alt text value | description of what image shows |
| `flipH` | boolean | `false` | Flip horizontally? | `true`, `false` |
| `flipV` | boolean | `false` | Flip vertical? | `true`, `false` |
| `hyperlink` | [HyperlinkProps](https://gitbrent.github.io/PptxGenJS/docs/types/#hyperlink-props-hyperlinkprops) |  | add hyperlink | object with `url` or `slide` |
| `placeholder` | string |  | image placeholder | Placeholder location: `title`, `body` |
| `rotate` | integer | `0` | rotation (degrees) | Rotation degress: `0`- `359` |
| `rounding` | boolean | `false` | image rounding | Shapes an image into a circle |
| `sizing` | object |  | transforms image | See [Image Sizing](https://gitbrent.github.io/PptxGenJS/docs/api-images/#sizing-properties) |
| `transparency` | number | `0` | changes opacity of an image | `0`- `100` where `0` means image is completely visible |

## Sizing Properties [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#sizing-properties "Direct link to heading")

The `sizing` option provides cropping and scaling an image to a specified area. The property expects an object with the following structure:

| Property | Type | Unit | Default | Description | Possible Values |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `type` | string |  |  | sizing algorithm | `'crop'`, `'contain'` or `'cover'` |
| `w` | number | inches | `w` of the image | area width | 0-n |
| `h` | number | inches | `h` of the image | area height | 0-n |
| `x` | number | inches | `0` | area horizontal position related to the image | 0-n (effective for `crop` only) |
| `y` | number | inches | `0` | area vertical position related to the image | 0-n (effective for `crop` only) |

### Sizing Types [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#sizing-types "Direct link to heading")

- `contain` works as CSS property `background-size` — shrinks the image (ratio preserved) to the area given by `w` and `h` so that the image is completely visible. If the area's ratio differs from the image ratio, an empty space will surround the image.
- `cover` works as CSS property `background-size` — shrinks the image (ratio preserved) to the area given by `w` and `h` so that the area is completely filled. If the area's ratio differs from the image ratio, the image is centered to the area and cropped.
- `crop` cuts off a part specified by image-related coordinates `x`, `y` and size `w`, `h`.

### Sizing Notes [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#sizing-notes "Direct link to heading")

- If you specify an area size larger than the image for the `contain` and `cover` type, then the image will be stretched, not shrunken.
- In case of the `crop` option, if the specified area reaches out of the image, then the covered empty space will be a part of the image.
- When the `sizing` property is used, its `w` and `h` values represent the effective image size. For example, in the following snippet, width and height of the image will both equal to 2 inches and its top-left corner will be located at `[1 inch, 1 inch]`:

## Shadow Properties ( `ShadowProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#shadow-properties-shadowprops "Direct link to heading")

The [ShadowProps](https://gitbrent.github.io/PptxGenJS/docs/types/#shadow-props-shadowprops) property adds a shadow to an image.

## Examples [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#examples "Direct link to heading")

### Image Types Examples [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#image-types-examples "Direct link to heading")

![Image Types Examples](https://gitbrent.github.io/PptxGenJS/assets/images/ex-image-types-5ae6b30654051b868a1d6dfceda84cd5.gif)

### Data/Path Examples [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#datapath-examples "Direct link to heading")

![Image Paths Examples](https://gitbrent.github.io/PptxGenJS/assets/images/ex-image-paths-463e8319af86aa415a3ff1cf31a6e936.png)

### Rotate Examples [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#rotate-examples "Direct link to heading")

![Image Rotate Examples](https://gitbrent.github.io/PptxGenJS/assets/images/ex-image-rotate-6e3c33bf8f3c6856bfe579c835a2d1f2.png)

### Shadow Examples [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#shadow-examples "Direct link to heading")

![Image Shadow Examples](https://gitbrent.github.io/PptxGenJS/assets/images/ex-image-shadow-3d5df3e3d9662e5a49d161f99b2f9ea6.png)

### Sizing Examples [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#sizing-examples "Direct link to heading")

![Image Sizing Examples](https://gitbrent.github.io/PptxGenJS/assets/images/ex-image-sizing-61fc95b1ccc58b0cc2d34f4676bf3a2b.png)

## All Image Samples [​](https://gitbrent.github.io/PptxGenJS/docs/api-images/\#all-image-samples "Direct link to heading")

All sample javascript code: [demos/modules/demo\_image.mjs](https://github.com/gitbrent/PptxGenJS/blob/master/demos/modules/demo_image.mjs)

- [Usage](https://gitbrent.github.io/PptxGenJS/docs/api-images/#usage)
  - [Usage Notes](https://gitbrent.github.io/PptxGenJS/docs/api-images/#usage-notes)
  - [Supported Formats and Notes](https://gitbrent.github.io/PptxGenJS/docs/api-images/#supported-formats-and-notes)
  - [Performance Considerations](https://gitbrent.github.io/PptxGenJS/docs/api-images/#performance-considerations)
- [Base Properties](https://gitbrent.github.io/PptxGenJS/docs/api-images/#base-properties)
  - [Position/Size Props (PositionProps)](https://gitbrent.github.io/PptxGenJS/docs/api-images/#positionsize-props-positionprops)
  - [Data/Path Props (DataOrPathProps)](https://gitbrent.github.io/PptxGenJS/docs/api-images/#datapath-props-dataorpathprops)
  - [Image Props (ImageProps)](https://gitbrent.github.io/PptxGenJS/docs/api-images/#image-props-imageprops)
- [Sizing Properties](https://gitbrent.github.io/PptxGenJS/docs/api-images/#sizing-properties)
  - [Sizing Types](https://gitbrent.github.io/PptxGenJS/docs/api-images/#sizing-types)
  - [Sizing Notes](https://gitbrent.github.io/PptxGenJS/docs/api-images/#sizing-notes)
- [Shadow Properties ( `ShadowProps`)](https://gitbrent.github.io/PptxGenJS/docs/api-images/#shadow-properties-shadowprops)
- [Examples](https://gitbrent.github.io/PptxGenJS/docs/api-images/#examples)
  - [Image Types Examples](https://gitbrent.github.io/PptxGenJS/docs/api-images/#image-types-examples)
  - [Data/Path Examples](https://gitbrent.github.io/PptxGenJS/docs/api-images/#datapath-examples)
  - [Rotate Examples](https://gitbrent.github.io/PptxGenJS/docs/api-images/#rotate-examples)
  - [Shadow Examples](https://gitbrent.github.io/PptxGenJS/docs/api-images/#shadow-examples)
  - [Sizing Examples](https://gitbrent.github.io/PptxGenJS/docs/api-images/#sizing-examples)
- [All Image Samples](https://gitbrent.github.io/PptxGenJS/docs/api-images/#all-image-samples)