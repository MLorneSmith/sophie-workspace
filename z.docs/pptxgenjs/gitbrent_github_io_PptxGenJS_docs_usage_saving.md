[Skip to main content](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/#docusaurus_skipToContent_fallback)

⭐️ If you like PptxGenJS, give it a star on [GitHub](https://github.com/gitbrent/PptxGenJS)! ⭐️

On this page

Several methods are available when generating a presentation.

- All methods return a Promise
- Working examples are available under [/demos](https://github.com/gitbrent/PptxGenJS/tree/master/demos)

## Write File [​](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/\#write-file "Direct link to heading")

Export the presentation as a regular flat file. Browser-based apps will prompt the user to download the file and push a
PowerPoint Presentation MIME-type pptx file. Node.js apps will use `fs` to save the file to the local file system.

### Write File Props ( `WriteFileProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/\#write-file-props-writefileprops "Direct link to heading")

| Option | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `compression` | boolean | false | apply zip compression (exports take longer but saves signifcant space) |
| `fileName` | string | 'Presentation.pptx' | output filename |

### Write File Example [​](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/\#write-file-example "Direct link to heading")

```codeBlockLines_e6Vv
// For simple cases, you can omit `then`
pptx.writeFile({ fileName: 'Browser-PowerPoint-Demo.pptx' });

// Using Promise to determine when the file has actually completed generating
pptx.writeFile({ fileName: 'Browser-PowerPoint-Demo.pptx' });
    .then(fileName => {
        console.log(`created file: ${fileName}`);
    });

```

## Write [​](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/\#write "Direct link to heading")

Export the presentation into other data formats for cloud storage.

### Write Props ( `WriteProps`) [​](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/\#write-props-writeprops "Direct link to heading")

| Option | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `compression` | boolean | false | apply zip compression (exports take longer but saves signifcant space) |
| `outputType` | string | blob | 'arraybuffer', 'base64', 'binarystring', 'blob', 'nodebuffer', 'uint8array' |

### Write Example [​](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/\#write-example "Direct link to heading")

```codeBlockLines_e6Vv
pptx.write("base64")
    .then((data) => {
        console.log("write as base64: Here are 0-100 chars of `data`:\n");
        console.log(data.substring(0, 100));
    })
    .catch((err) => {
        console.error(err);
    });

```

## Stream [​](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/\#stream "Direct link to heading")

Export the presentation into a binary stream format for cloud storage, etc.

### Stream Example [​](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/\#stream-example "Direct link to heading")

```codeBlockLines_e6Vv
// Ex using: `const app = express();``
pptx.stream()
    .then((data) => {
        app.get("/", (req, res) => {
            res.writeHead(200, { "Content-disposition": "attachment;filename=" + fileName, "Content-Length": data.length });
            res.end(new Buffer(data, "binary"));
        });

        app.listen(3000, () => {
            console.log("PptxGenJS Node Stream Demo app listening on port 3000!");
            console.log("Visit: http://localhost:3000/");
            console.log("(press Ctrl-C to quit demo)");
        });
    })
    .catch((err) => {
        console.log("ERROR: " + err);
    });

```

## Saving Multiple Presentations [​](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/\#saving-multiple-presentations "Direct link to heading")

### Client Browser [​](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/\#client-browser "Direct link to heading")

- In order to generate a new, unique Presentation just create a new instance of the library then add objects and save as normal.

```codeBlockLines_e6Vv
let pptx = null;

// Presentation 1:
pptx = new PptxGenJS();
pptx.addSlide().addText("Presentation 1", { x: 1, y: 1 });
pptx.writeFile({ fileName: "PptxGenJS-Presentation-1" });

// Presentation 2:
pptx = new PptxGenJS();
pptx.addSlide().addText("Presentation 2", { x: 1, y: 1 });
pptx.writeFile({ fileName: "PptxGenJS-Presentation-2" });

```

### Node.js [​](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/\#nodejs "Direct link to heading")

- See `demos/node/demo.js` for a working demo with multiple presentations, promises, etc.
- See `demos/node/demo_stream.js` for a working demo using streaming

```codeBlockLines_e6Vv
import pptxgen from "pptxgenjs";

// Presentation 1:
let pptx1 = new pptxgen();
pptx1.addSlide().addText("Presentation 1", { x: 1, y: 1 });
pptx1.writeFile({ fileName: "PptxGenJS-NodePres-1" });

// Presentation 2:
let pptx2 = new pptxgen();
pptx2.addSlide().addText("Presentation 2", { x: 1, y: 1 });
pptx2.writeFile({ fileName: "PptxGenJS-NodePres-2" });

```

- [Write File](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/#write-file)
  - [Write File Props ( `WriteFileProps`)](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/#write-file-props-writefileprops)
  - [Write File Example](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/#write-file-example)
- [Write](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/#write)
  - [Write Props ( `WriteProps`)](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/#write-props-writeprops)
  - [Write Example](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/#write-example)
- [Stream](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/#stream)
  - [Stream Example](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/#stream-example)
- [Saving Multiple Presentations](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/#saving-multiple-presentations)
  - [Client Browser](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/#client-browser)
  - [Node.js](https://gitbrent.github.io/PptxGenJS/docs/usage-saving/#nodejs)
