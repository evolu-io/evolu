import { Overwrite } from 'utility-types';

// Aliase DOM types to prevent clashes with Editor types and to enforce consistent naming.
export type DOMElement = Element;
export type DOMNode = Node;
export type DOMRange = Range;
export type DOMSelection = Selection;
export type DOMText = Text;

/**
 * DOMSelection with non-null anchorNode and focusNode. They can be null if selection
 * never existed in the document (e.g., an iframe that was never clicked on).
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection
 */
export type ExistingDOMSelection = Overwrite<
  DOMSelection,
  {
    readonly anchorNode: Node;
    readonly focusNode: Node;
  }
>;
