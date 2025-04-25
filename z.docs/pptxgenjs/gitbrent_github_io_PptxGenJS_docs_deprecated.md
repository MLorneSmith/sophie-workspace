[Skip to main content](https://gitbrent.github.io/PptxGenJS/docs/deprecated/#docusaurus_skipToContent_fallback)

⭐️ If you like PptxGenJS, give it a star on [GitHub](https://github.com/gitbrent/PptxGenJS)! ⭐️

On this page

## Version 3.0 Breaking Changes [​](https://gitbrent.github.io/PptxGenJS/docs/deprecated/\#version-30-breaking-changes "Direct link to heading")

Please see the [Version 3.0 Migration Guide](https://github.com/gitbrent/PptxGenJS/wiki/Version-3.0-Migration-Guide)

- `pptx.colors` is deprecated - use `pptx.SchemeColor`
- `pptx.charts` is deprecated - use `pptx.ChartType`
- `pptx.shapes` is deprecated - use `pptx.ShapeType`

## Version 2.0 Breaking Changes [​](https://gitbrent.github.io/PptxGenJS/docs/deprecated/\#version-20-breaking-changes "Direct link to heading")

Please note that version 2.0.0 enabled some much needed cleanup, but may break your previous code...
(however, a quick search-and-replace will fix any issues).

While the changes may only impact cosmetic properties, it's recommended you test your solutions thoroughly before upgrading PptxGenJS to the 2.0 version.

### All Users [​](https://gitbrent.github.io/PptxGenJS/docs/deprecated/\#all-users "Direct link to heading")

The library `getVersion()` method is now a property: `version`

Option names are now caseCase across all methods:

- `font_face` renamed to `fontFace`
- `font_size` renamed to `fontSize`
- `line_dash` renamed to `lineDash`
- `line_head` renamed to `lineHead`
- `line_size` renamed to `lineSize`
- `line_tail` renamed to `lineTail`

Options deprecated in early 1.0 versions (hopefully nobody still uses these):

- `marginPt` renamed to `margin`

### Node Users [​](https://gitbrent.github.io/PptxGenJS/docs/deprecated/\#node-users "Direct link to heading")

- `require('pptxgenjs')` no longer returns a singleton instance
- `pptx = new PptxGenJS()` will create a single, unique instance
- Advantage: Creating [multiple presentations](https://gitbrent.github.io/PptxGenJS/docs/deprecated/#saving-multiple-presentations) is much easier now - see [Issue #83](https://github.com/gitbrent/PptxGenJS/issues/83) for more).

- [Version 3.0 Breaking Changes](https://gitbrent.github.io/PptxGenJS/docs/deprecated/#version-30-breaking-changes)
- [Version 2.0 Breaking Changes](https://gitbrent.github.io/PptxGenJS/docs/deprecated/#version-20-breaking-changes)
  - [All Users](https://gitbrent.github.io/PptxGenJS/docs/deprecated/#all-users)
  - [Node Users](https://gitbrent.github.io/PptxGenJS/docs/deprecated/#node-users)