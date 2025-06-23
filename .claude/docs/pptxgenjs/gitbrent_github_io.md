[Skip to main content](https://gitbrent.github.io/PptxGenJS/docs/quick-start/#docusaurus_skipToContent_fallback)

⭐️ If you like PptxGenJS, give it a star on [GitHub](https://github.com/gitbrent/PptxGenJS)! ⭐️

On this page

## Create a PowerPoint in 4 easy steps [​](https://gitbrent.github.io/PptxGenJS/docs/quick-start/\#create-a-powerpoint-in-4-easy-steps "Direct link to heading")

PptxGenJS PowerPoint presentations are created by following 4 basic steps. See examples below by environment.

That's really all there is to it!

## Node-Based Applications [​](https://gitbrent.github.io/PptxGenJS/docs/quick-start/\#node-based-applications "Direct link to heading")

HelloWorld.ts

```codeBlockLines_e6Vv
import pptxgen from "pptxgenjs";

// 1. Create a Presentation
let pres = new pptxgen();

// 2. Add a Slide to the presentation
let slide = pres.addSlide();

// 3. Add 1+ objects (Tables, Shapes, etc.) to the Slide
slide.addText("Hello World from PptxGenJS...", {
    x: 1.5,
    y: 1.5,
    color: "363636",
    fill: { color: "F1F1F1" },
    align: pres.AlignH.center,
});

// 4. Save the Presentation
pres.writeFile({ fileName: "Sample Presentation.pptx" });

```

### TypeScript Support [​](https://gitbrent.github.io/PptxGenJS/docs/quick-start/\#typescript-support "Direct link to heading")

Modern application developers using ES6 with Angular, React, TypeScript, etc. benefit from full typescript defs.

Learn as you code in a modern development with included TypeScript definitions the documentation comes to you.

![TypeScript Support](https://gitbrent.github.io/PptxGenJS/assets/images/ex-typescript-18c6d43b8103150ebd102d90aadbbdcd.png)

Develop your apps quickly without needing to look up documentation.

![TypeScript Support](https://gitbrent.github.io/PptxGenJS/assets/images/ex-typescript-writefile-9bd6c8e20e4db6ed90bc7177e4bf3e76.png)

## Client Web Browser [​](https://gitbrent.github.io/PptxGenJS/docs/quick-start/\#client-web-browser "Direct link to heading")

HelloWorld.js

```codeBlockLines_e6Vv
// 1. Create a new Presentation
let pres = new PptxGenJS();

// 2. Add a Slide
let slide = pres.addSlide();

// 3. Add one or more objects (Tables, Shapes, Images, Text and Media) to the Slide
slide.addText("Hello World from PptxGenJS...", {
    x: 1.5,
    y: 1.5,
    color: "363636",
    fill: { color: "F1F1F1" },
    align: pres.AlignH.center,
});

// 4. Save the Presentation
pres.writeFile({ fileName: "Sample Presentation.pptx" });

```

- [Create a PowerPoint in 4 easy steps](https://gitbrent.github.io/PptxGenJS/docs/quick-start/#create-a-powerpoint-in-4-easy-steps)
- [Node-Based Applications](https://gitbrent.github.io/PptxGenJS/docs/quick-start/#node-based-applications)
  - [TypeScript Support](https://gitbrent.github.io/PptxGenJS/docs/quick-start/#typescript-support)
- [Client Web Browser](https://gitbrent.github.io/PptxGenJS/docs/quick-start/#client-web-browser)
