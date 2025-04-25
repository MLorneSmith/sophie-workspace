[Skip to main content](https://gitbrent.github.io/PptxGenJS/docs/speaker-notes/#docusaurus_skipToContent_fallback)

⭐️ If you like PptxGenJS, give it a star on [GitHub](https://github.com/gitbrent/PptxGenJS)! ⭐️

On this page

Speaker Notes can be included on any Slide.

## Syntax [​](https://gitbrent.github.io/PptxGenJS/docs/speaker-notes/\#syntax "Direct link to heading")

```codeBlockLines_e6Vv
slide.addNotes('TEXT');

```

## Example: JavaScript [​](https://gitbrent.github.io/PptxGenJS/docs/speaker-notes/\#example-javascript "Direct link to heading")

```codeBlockLines_e6Vv
let pres = new PptxGenJS();
let slide = pptx.addSlide();

slide.addText('Hello World!', { x:1.5, y:1.5, fontSize:18, color:'363636' });

slide.addNotes('This is my favorite slide!');

pptx.writeFile('Sample Speaker Notes');

```

## Example: TypeScript [​](https://gitbrent.github.io/PptxGenJS/docs/speaker-notes/\#example-typescript "Direct link to heading")

```codeBlockLines_e6Vv
import pptxgen from "pptxgenjs";

let pres = new pptxgen();
let slide = pptx.addSlide();

slide.addText('Hello World!', { x:1.5, y:1.5, fontSize:18, color:'363636' });

slide.addNotes('This is my favorite slide!');

pptx.writeFile('Sample Speaker Notes');

```

- [Syntax](https://gitbrent.github.io/PptxGenJS/docs/speaker-notes/#syntax)
- [Example: JavaScript](https://gitbrent.github.io/PptxGenJS/docs/speaker-notes/#example-javascript)
- [Example: TypeScript](https://gitbrent.github.io/PptxGenJS/docs/speaker-notes/#example-typescript)