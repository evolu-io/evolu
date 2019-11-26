// Alias DOM types to prevent name clashes with Editor types.
export type DOMElement = Element;
export type DOMNode = Node;
export type DOMRange = Range;
export type DOMText = Text;

/**
 * By default, the anchorNode and the focusNode can be null if selection never
 * existed in the document. Such type is not useful, so we fix it by refinement.
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection
 */
export type DOMSelectionMaybeNeverExisted = Selection;

export interface DOMSelection extends DOMSelectionMaybeNeverExisted {
  readonly anchorNode: DOMNode;
  readonly focusNode: DOMNode;
}
