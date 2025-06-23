[Skip to main content](https://lexical.dev/docs/react/plugins#__docusaurus_skipToContent_fallback)

On this page

React-based plugins are using Lexical editor instance from `<LexicalComposer>` context:

```codeBlockLines_AdAo
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';

```

```codeBlockLines_AdAo
const initialConfig = {
  namespace: 'MyEditor',
  theme,
  onError,
};

<LexicalComposer initialConfig={initialConfig}>
  <PlainTextPlugin
    contentEditable={<ContentEditable />}
    placeholder={<div>Enter some text...</div>}
  />
  <HistoryPlugin />
  <OnChangePlugin onChange={onChange} />
  ...
</LexicalComposer>;

```

> Note: Many plugins might require you to register the one or many Lexical nodes in order for the plugin to work. You can do this by passing a reference to the node to the `nodes` array in your initial editor configuration.

```codeBlockLines_AdAo
const initialConfig = {
  namespace: 'MyEditor',
  theme,
  nodes: [ListNode, ListItemNode], // Pass the references to the nodes here
  onError,
};

```

### `LexicalPlainTextPlugin` [​](https://lexical.dev/docs/react/plugins\#lexicalplaintextplugin "Direct link to heading")

React wrapper for `@lexical/plain-text` that adds major features for plain text editing, including typing, deletion and copy/pasting.

```codeBlockLines_AdAo
<PlainTextPlugin
  contentEditable={
    <ContentEditable
      aria-placeholder={'Enter some text...'}
      placeholder={<div>Enter some text...</div>}
    />
  }
  ErrorBoundary={LexicalErrorBoundary}
/>

```

### `LexicalRichTextPlugin` [​](https://lexical.dev/docs/react/plugins\#lexicalrichtextplugin "Direct link to heading")

React wrapper for `@lexical/rich-text` that adds major features for rich text editing, including typing, deletion, copy/pasting, indent/outdent and bold/italic/underline/strikethrough text formatting.

```codeBlockLines_AdAo
<RichTextPlugin
  contentEditable={
    <ContentEditable
      aria-placeholder={'Enter some text...'}
      placeholder={<div>Enter some text...</div>}
    />
  }
  ErrorBoundary={LexicalErrorBoundary}
/>

```

### `LexicalOnChangePlugin` [​](https://lexical.dev/docs/react/plugins\#lexicalonchangeplugin "Direct link to heading")

Plugin that calls `onChange` whenever Lexical state is updated. Using `ignoreHistoryMergeTagChange` ( `true` by default) and `ignoreSelectionChange` ( `false` by default) can give more granular control over changes that are causing `onChange` call.

```codeBlockLines_AdAo
<OnChangePlugin onChange={onChange} />

```

### `LexicalHistoryPlugin` [​](https://lexical.dev/docs/react/plugins\#lexicalhistoryplugin "Direct link to heading")

React wrapper for `@lexical/history` that adds support for history stack management and `undo` / `redo` commands.

```codeBlockLines_AdAo
<HistoryPlugin />

```

### `LexicalLinkPlugin` [​](https://lexical.dev/docs/react/plugins\#lexicallinkplugin "Direct link to heading")

React wrapper for `@lexical/link` that adds support for links, including `$toggleLink` command support that toggles link for selected text.

```codeBlockLines_AdAo
<LinkPlugin />

```

### `LexicalListPlugin` [​](https://lexical.dev/docs/react/plugins\#lexicallistplugin "Direct link to heading")

React wrapper for `@lexical/list` that adds support for lists (ordered and unordered)

```codeBlockLines_AdAo
<ListPlugin />

```

### `LexicalCheckListPlugin` [​](https://lexical.dev/docs/react/plugins\#lexicalchecklistplugin "Direct link to heading")

React wrapper for `@lexical/list` that adds support for check lists. Note that it requires some css to render check/uncheck marks. See PlaygroundEditorTheme.css for details.

```codeBlockLines_AdAo
<CheckListPlugin />

```

### `LexicalTablePlugin` [​](https://lexical.dev/docs/react/plugins\#lexicaltableplugin "Direct link to heading")

[![See API Documentation](<Base64-Image-Removed>)](https://lexical.dev/docs/api/modules/lexical_react_LexicalTablePlugin)

React wrapper for `@lexical/table` that adds support for tables.

```codeBlockLines_AdAo
<TablePlugin />

```

### `LexicalTabIndentationPlugin` [​](https://lexical.dev/docs/react/plugins\#lexicaltabindentationplugin "Direct link to heading")

Plugin that allows tab indentation in combination with `@lexical/rich-text`.

```codeBlockLines_AdAo
<TabIndentationPlugin />

```

### `LexicalAutoLinkPlugin` [​](https://lexical.dev/docs/react/plugins\#lexicalautolinkplugin "Direct link to heading")

Plugin will convert text into links based on passed matchers list. In example below whenever user types url-like string it will automaticaly convert it into a link node

```codeBlockLines_AdAo
const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const MATCHERS = [\
  (text) => {\
    const match = URL_MATCHER.exec(text);\
    if (match === null) {\
      return null;\
    }\
    const fullMatch = match[0];\
    return {\
      index: match.index,\
      length: fullMatch.length,\
      text: fullMatch,\
      url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,\
      // attributes: { rel: 'noreferrer', target: '_blank' }, // Optional link attributes\
    };\
  },\
];

...

<AutoLinkPlugin matchers={MATCHERS} />

```

### `LexicalClearEditorPlugin` [​](https://lexical.dev/docs/react/plugins\#lexicalcleareditorplugin "Direct link to heading")

Adds `clearEditor` command support to clear editor's content.

```codeBlockLines_AdAo
<ClearEditorPlugin />

```

### `LexicalMarkdownShortcutPlugin` [​](https://lexical.dev/docs/react/plugins\#lexicalmarkdownshortcutplugin "Direct link to heading")

Adds markdown shortcut support: headings, lists, code blocks, quotes, links and inline styles (bold, italic, strikethrough).

```codeBlockLines_AdAo
<MarkdownShortcutPlugin />

```

### `LexicalTableOfContentsPlugin` [​](https://lexical.dev/docs/react/plugins\#lexicaltableofcontentsplugin "Direct link to heading")

This plugin allows you to render a table of contents for a page from the headings from the editor. It listens to any deletions or modifications to those headings and updates the table of contents. Additionally, it's able to track any newly added headings and inserts them in the table of contents once they are created. This plugin also supports lazy loading - so you can defer adding the plugin until when the user needs it.

In order to use `TableOfContentsPlugin`, you need to pass a callback function in its children. This callback function gives you access to the up-to-date data of the table of contents. You can access this data through a single parameter for the callback which comes in the form of an array of arrays `[[headingKey, headingTextContent, headingTag], [], [], ...]`

`headingKey`: Unique key that identifies the heading.
`headingTextContent`: A string of the exact text of the heading.
`headingTag`: A string that reads either 'h1', 'h2', or 'h3'.

```codeBlockLines_AdAo
<TableOfContentsPlugin>
  {(tableOfContentsArray) => {
    return (
      <MyCustomTableOfContentsPlugin tableOfContents={tableOfContentsArray} />
    );
  }}
</TableOfContentsPlugin>

```

### `LexicalEditorRefPlugin` [​](https://lexical.dev/docs/react/plugins\#lexicaleditorrefplugin "Direct link to heading")

Allows you to get a ref to the underlying editor instance outside of LexicalComposer, which is convenient when you want to interact with the editor
from a separate part of your application.

```codeBlockLines_AdAo
const editorRef = useRef(null);
<EditorRefPlugin editorRef={editorRef} />;

```

### `LexicalSelectionAlwaysOnDisplay` [​](https://lexical.dev/docs/react/plugins\#lexicalselectionalwaysondisplay "Direct link to heading")

By default, browser text selection becomes invisible when clicking away from the editor. This plugin ensures the selection remains visible.

```codeBlockLines_AdAo
<SelectionAlwaysOnDisplay />

```

- [`LexicalPlainTextPlugin`](https://lexical.dev/docs/react/plugins#lexicalplaintextplugin)
- [`LexicalRichTextPlugin`](https://lexical.dev/docs/react/plugins#lexicalrichtextplugin)
- [`LexicalOnChangePlugin`](https://lexical.dev/docs/react/plugins#lexicalonchangeplugin)
- [`LexicalHistoryPlugin`](https://lexical.dev/docs/react/plugins#lexicalhistoryplugin)
- [`LexicalLinkPlugin`](https://lexical.dev/docs/react/plugins#lexicallinkplugin)
- [`LexicalListPlugin`](https://lexical.dev/docs/react/plugins#lexicallistplugin)
- [`LexicalCheckListPlugin`](https://lexical.dev/docs/react/plugins#lexicalchecklistplugin)
- [`LexicalTablePlugin`](https://lexical.dev/docs/react/plugins#lexicaltableplugin)
- [`LexicalTabIndentationPlugin`](https://lexical.dev/docs/react/plugins#lexicaltabindentationplugin)
- [`LexicalAutoLinkPlugin`](https://lexical.dev/docs/react/plugins#lexicalautolinkplugin)
- [`LexicalClearEditorPlugin`](https://lexical.dev/docs/react/plugins#lexicalcleareditorplugin)
- [`LexicalMarkdownShortcutPlugin`](https://lexical.dev/docs/react/plugins#lexicalmarkdownshortcutplugin)
- [`LexicalTableOfContentsPlugin`](https://lexical.dev/docs/react/plugins#lexicaltableofcontentsplugin)
- [`LexicalEditorRefPlugin`](https://lexical.dev/docs/react/plugins#lexicaleditorrefplugin)
- [`LexicalSelectionAlwaysOnDisplay`](https://lexical.dev/docs/react/plugins#lexicalselectionalwaysondisplay)
