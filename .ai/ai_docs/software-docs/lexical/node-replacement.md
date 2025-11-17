[Skip to main content](https://lexical.dev/docs/concepts/node-replacement#__docusaurus_skipToContent_fallback)

Some of the most commonly used Lexical Nodes are owned and maintained by the core library. For example, ParagraphNode, HeadingNode, QuoteNode, List(Item)Node etc - these are all provided by Lexical packages, which provides an easier out-of-the-box experience for some editor features, but makes it difficult to override their behavior. For instance, if you wanted to change the behavior of ListNode, you would typically extend the class and override the methods. However, how would you tell Lexical to use _your_ ListNode subclass in the ListPlugin instead of using the core ListNode? That's where Node Overrides can help.

Node Overrides allow you to replace all instances of a given node in your editor with instances of a different node class. This can be done through the nodes array in the Editor config:

```codeBlockLines_AdAo
const editorConfig = {
    ...
    nodes=[\
        // Don't forget to register your custom node separately!\
        CustomParagraphNode,\
        {\
            replace: ParagraphNode,\
            with: (node: ParagraphNode) => {\
                return new CustomParagraphNode();\
            },\
            withKlass: CustomParagraphNode,\
        }\
    ]
}

```

In the snippet above,

- `replace`: Specifies the core node type to be replaced.
- `with`: Defines a transformation function to replace instances of the original node to the custom node.
- `withKlass`: This option ensures that behaviors associated with the original node type work seamlessly with the replacement. For instance, node transforms or mutation listeners targeting ParagraphNode will also apply to CustomParagraphNode when withKlass is specified. Without this option, the custom node might not fully integrate with the editor's built-in features, leading to unexpected behavior.

Once this is done, Lexical will replace all ParagraphNode instances with CustomParagraphNode instances. One important use case for this feature is overriding the serialization behavior of core nodes. Check out the full example below.

ecstatic-maxwell-kw5utu - CodeSandbox

CodeSandbox

# ecstatic-maxwell-kw5utu

![](https://avatars.githubusercontent.com/u/14864325?v=4)acywatson

256.3k

1

476

[Edit Sandbox](https://codesandbox.io/p/sandbox/ecstatic-maxwell-kw5utu?from-embed)

Files

.codesandbox

public

src

nodes

plugins

themes

App.js

Editor.js

index.js

styles.css

package.json

Dependencies

[@lexical/react](https://codesandbox.io/examples/package/@lexical/react) 0.6.4

[lexical](https://codesandbox.io/examples/package/lexical) 0.6.4

[react](https://codesandbox.io/examples/package/react) 18.1.0

[react-dom](https://codesandbox.io/examples/package/react-dom) 18.1.0

[react-scripts](https://codesandbox.io/examples/package/react-scripts) 5.0.1

[Open Sandbox](https://codesandbox.io/p/sandbox/ecstatic-maxwell-kw5utu?from-embed)

Editor.js

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

importExampleThemefrom"./themes/ExampleTheme";

import { LexicalComposer } from"@lexical/react/LexicalComposer";

import { RichTextPlugin } from"@lexical/react/LexicalRichTextPlugin";

import { ContentEditable } from"@lexical/react/LexicalContentEditable";

import { HistoryPlugin } from"@lexical/react/LexicalHistoryPlugin";

import { AutoFocusPlugin } from"@lexical/react/LexicalAutoFocusPlugin";

importLexicalErrorBoundaryfrom"@lexical/react/LexicalErrorBoundary";

importTreeViewPluginfrom"./plugins/TreeViewPlugin";

importToolbarPluginfrom"./plugins/ToolbarPlugin";

import { HeadingNode, QuoteNode } from"@lexical/rich-text";

import { TableCellNode, TableNode, TableRowNode } from"@lexical/table";

import { ListItemNode, ListNode } from"@lexical/list";

import { CodeHighlightNode, CodeNode } from"@lexical/code";

import { AutoLinkNode, LinkNode } from"@lexical/link";

import { LinkPlugin } from"@lexical/react/LexicalLinkPlugin";

import { ListPlugin } from"@lexical/react/LexicalListPlugin";

import { MarkdownShortcutPlugin } from"@lexical/react/LexicalMarkdownShortcutPlugin";

import { TRANSFORMERS } from"@lexical/markdown";

importListMaxIndentLevelPluginfrom"./plugins/ListMaxIndentLevelPlugin";

importCodeHighlightPluginfrom"./plugins/CodeHighlightPlugin";

importAutoLinkPluginfrom"./plugins/AutoLinkPlugin";

import { ParagraphNode } from"lexical";

import { CustomParagraphNode } from"./nodes/CustomParagraphNode";

functionPlaceholder() {

return <divclassName="editor-placeholder">Enter some rich text...</div>;

}

consteditorConfig= {

React App

Console

0

Problems

0

React DevTools

0

AllInfoWarningErrorDebug
