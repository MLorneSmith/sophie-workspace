[Skip to main content](https://gitbrent.github.io/PptxGenJS/docs/usage-add-slide/#docusaurus_skipToContent_fallback)

⭐️ If you like PptxGenJS, give it a star on [GitHub](https://github.com/gitbrent/PptxGenJS)! ⭐️

On this page

## Syntax [​](https://gitbrent.github.io/PptxGenJS/docs/usage-add-slide/\#syntax "Direct link to heading")

```codeBlockLines_e6Vv
let slide = pptx.addSlide();

```

## Slide Templates/Master Slides [​](https://gitbrent.github.io/PptxGenJS/docs/usage-add-slide/\#slide-templatesmaster-slides "Direct link to heading")

### Master Slide Syntax [​](https://gitbrent.github.io/PptxGenJS/docs/usage-add-slide/\#master-slide-syntax "Direct link to heading")

```codeBlockLines_e6Vv
let slide = pptx.addSlide("MASTER_NAME");

```

(See [Master Slides](https://gitbrent.github.io/PptxGenJS/docs/masters/) for more about creating masters/templates)

### Master Slide Examples [​](https://gitbrent.github.io/PptxGenJS/docs/usage-add-slide/\#master-slide-examples "Direct link to heading")

```codeBlockLines_e6Vv
// Create a new Slide that will inherit properties from a pre-defined master page (margins, logos, text, background, etc.)
let slide = pptx.addSlide("TITLE_SLIDE");

```

## Slides Return Themselves [​](https://gitbrent.github.io/PptxGenJS/docs/usage-add-slide/\#slides-return-themselves "Direct link to heading")

The Slide object returns a reference to itself, so calls can be chained.

Example:

```codeBlockLines_e6Vv
slide.addImage({ path: "img1.png", x: 1, y: 2 }).addImage({ path: "img2.jpg", x: 5, y: 3 });

```

## Slide Methods [​](https://gitbrent.github.io/PptxGenJS/docs/usage-add-slide/\#slide-methods "Direct link to heading")

See [Slide Methods](https://gitbrent.github.io/PptxGenJS/docs/usage-slide-options/) for features such as Background and Slide Numbers.

- [Syntax](https://gitbrent.github.io/PptxGenJS/docs/usage-add-slide/#syntax)
- [Slide Templates/Master Slides](https://gitbrent.github.io/PptxGenJS/docs/usage-add-slide/#slide-templatesmaster-slides)
  - [Master Slide Syntax](https://gitbrent.github.io/PptxGenJS/docs/usage-add-slide/#master-slide-syntax)
  - [Master Slide Examples](https://gitbrent.github.io/PptxGenJS/docs/usage-add-slide/#master-slide-examples)
- [Slides Return Themselves](https://gitbrent.github.io/PptxGenJS/docs/usage-add-slide/#slides-return-themselves)
- [Slide Methods](https://gitbrent.github.io/PptxGenJS/docs/usage-add-slide/#slide-methods)