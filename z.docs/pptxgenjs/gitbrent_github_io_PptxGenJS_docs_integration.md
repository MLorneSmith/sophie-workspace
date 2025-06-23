[Skip to main content](https://gitbrent.github.io/PptxGenJS/docs/integration/#docusaurus_skipToContent_fallback)

⭐️ If you like PptxGenJS, give it a star on [GitHub](https://github.com/gitbrent/PptxGenJS)! ⭐️

On this page

## Available Distributions [​](https://gitbrent.github.io/PptxGenJS/docs/integration/\#available-distributions "Direct link to heading")

- Browser `dist/pptxgen.min.js`
- CommonJS `dist/pptxgen.cjs.js`
- ES6 Module `dist/pptxgen.es.js`

## Integration with Angular/React [​](https://gitbrent.github.io/PptxGenJS/docs/integration/\#integration-with-angularreact "Direct link to heading")

- There is a working demo available: [demos/react-demo](https://github.com/gitbrent/PptxGenJS/tree/master/demos/react-demo)

### React Example [​](https://gitbrent.github.io/PptxGenJS/docs/integration/\#react-example "Direct link to heading")

```codeBlockLines_e6Vv
import pptxgen from "pptxgenjs";
let pptx = new pptxgen();

let slide = pptx.addSlide();
slide.addText("React Demo!", { x: 1, y: 1, w: 10, fontSize: 36, fill: { color: "F1F1F1" }, align: "center" });

pptx.writeFile({ fileName: "react-demo.pptx" });

```

## Webpack Troubleshooting [​](https://gitbrent.github.io/PptxGenJS/docs/integration/\#webpack-troubleshooting "Direct link to heading")

Some users have modified their webpack config to avoid a module resolution error using:

- `node: { fs: "empty" }`

### Related Issues [​](https://gitbrent.github.io/PptxGenJS/docs/integration/\#related-issues "Direct link to heading")

- [See Issue #72 for more information](https://github.com/gitbrent/PptxGenJS/issues/72)
- [See Issue #220 for more information](https://github.com/gitbrent/PptxGenJS/issues/220)
- [See Issue #308 for more information](https://github.com/gitbrent/PptxGenJS/issues/308)

- [Available Distributions](https://gitbrent.github.io/PptxGenJS/docs/integration/#available-distributions)
- [Integration with Angular/React](https://gitbrent.github.io/PptxGenJS/docs/integration/#integration-with-angularreact)
  - [React Example](https://gitbrent.github.io/PptxGenJS/docs/integration/#react-example)
- [Webpack Troubleshooting](https://gitbrent.github.io/PptxGenJS/docs/integration/#webpack-troubleshooting)
  - [Related Issues](https://gitbrent.github.io/PptxGenJS/docs/integration/#related-issues)
