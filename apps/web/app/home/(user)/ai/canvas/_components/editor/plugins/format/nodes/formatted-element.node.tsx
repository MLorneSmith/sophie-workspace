import { ElementNode, NodeKey, SerializedElementNode } from 'lexical';
import type { Spread } from 'lexical';

// Define the serialized type
export type SerializedFormattedElementNode = Spread<
  {
    // Any additional properties specific to FormattedElementNode would go here
  },
  SerializedElementNode
>;

export class FormattedElementNode extends ElementNode {
  static getType(): string {
    return 'formatted-element';
  }

  static clone(node: FormattedElementNode): FormattedElementNode {
    return new FormattedElementNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  // Add exportJSON method
  exportJSON(): SerializedFormattedElementNode {
    return {
      ...super.exportJSON(),
      type: 'formatted-element',
      version: 1,
    };
  }

  // Add static importJSON method
  static importJSON(
    serializedNode: SerializedFormattedElementNode,
  ): FormattedElementNode {
    return $createFormattedElementNode().updateFromJSON(serializedNode);
  }
}

export function $createFormattedElementNode(): FormattedElementNode {
  return new FormattedElementNode();
}

export function $isFormattedElementNode(
  node: ElementNode | null | undefined,
): node is FormattedElementNode {
  return node instanceof FormattedElementNode;
}
