[Skip to main content](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#docusaurus_skipToContent_fallback)

⭐️ If you like PptxGenJS, give it a star on [GitHub](https://github.com/gitbrent/PptxGenJS)! ⭐️

On this page

## Metadata [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#metadata "Direct link to heading")

### Metadata Properties [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#metadata-properties "Direct link to heading")

There are several optional PowerPoint metadata properties that can be set.

### Metadata Properties Examples [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#metadata-properties-examples "Direct link to heading")

PptxGenJS uses ES6-style getters/setters.

```codeBlockLines_e6Vv
pptx.author = 'Brent Ely';
pptx.company = 'S.T.A.R. Laboratories';
pptx.revision = '15';
pptx.subject = 'Annual Report';
pptx.title = 'PptxGenJS Sample Presentation';

```

## Slide Layouts (Sizes) [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#slide-layouts-sizes "Direct link to heading")

Layout Option applies to all the Slides in the current Presentation.

### Slide Layout Syntax [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#slide-layout-syntax "Direct link to heading")

```codeBlockLines_e6Vv
pptx.layout = 'LAYOUT_NAME';

```

### Standard Slide Layouts [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#standard-slide-layouts "Direct link to heading")

| Layout Name | Default | Layout Slide Size |
| :-- | :-- | :-- |
| `LAYOUT_16x9` | Yes | 10 x 5.625 inches |
| `LAYOUT_16x10` | No | 10 x 6.25 inches |
| `LAYOUT_4x3` | No | 10 x 7.5 inches |
| `LAYOUT_WIDE` | No | 13.3 x 7.5 inches |

### Custom Slide Layouts [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#custom-slide-layouts "Direct link to heading")

Custom, user-defined layouts are supported

- Use the `defineLayout()` method to create a custom layout of any size
- Create as many layouts as needed, ex: create an 'A3' and 'A4' and set layouts as desired

### Custom Slide Layout Example [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#custom-slide-layout-example "Direct link to heading")

```codeBlockLines_e6Vv
// Define new layout for the Presentation
pptx.defineLayout({ name:'A3', width:16.5, height:11.7 });

// Set presentation to use new layout
pptx.layout = 'A3'

```

## Text Direction [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#text-direction "Direct link to heading")

### Text Direction Options [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#text-direction-options "Direct link to heading")

Right-to-Left (RTL) text is supported. Simply set the RTL mode at the Presentation-level.

### Text Direction Examples [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#text-direction-examples "Direct link to heading")

```codeBlockLines_e6Vv
// Set right-to-left text mode
pptx.rtlMode = true;

```

Notes:

- You may also need to set an RTL lang value such as `lang='he'` as the default lang is 'EN-US'
- See [Issue#600](https://github.com/gitbrent/PptxGenJS/issues/600) for more

## Default Font [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#default-font "Direct link to heading")

### Default Font Options [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#default-font-options "Direct link to heading")

Use the `headFontFace` and `bodyFontFace` properties to set the default font used in the presentation.

### Default Font Examples [​](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/\#default-font-examples "Direct link to heading")

```codeBlockLines_e6Vv
pptx.theme = { headFontFace: "Arial Light" };
pptx.theme = { bodyFontFace: "Arial" };

```

- [Metadata](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#metadata)
  - [Metadata Properties](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#metadata-properties)
  - [Metadata Properties Examples](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#metadata-properties-examples)
- [Slide Layouts (Sizes)](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#slide-layouts-sizes)
  - [Slide Layout Syntax](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#slide-layout-syntax)
  - [Standard Slide Layouts](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#standard-slide-layouts)
  - [Custom Slide Layouts](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#custom-slide-layouts)
  - [Custom Slide Layout Example](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#custom-slide-layout-example)
- [Text Direction](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#text-direction)
  - [Text Direction Options](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#text-direction-options)
  - [Text Direction Examples](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#text-direction-examples)
- [Default Font](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#default-font)
  - [Default Font Options](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#default-font-options)
  - [Default Font Examples](https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#default-font-examples)
