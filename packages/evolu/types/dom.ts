// Extends DOM types to prevent name clashes with Editor types.
export interface DOMElement extends Element {}
export interface DOMNode extends Node {}
export interface DOMRange extends Range {}
export interface DOMText extends Text {}

/**
 * By default, the anchorNode and the focusNode can be null if selection never
 * existed in the document. Such type is not useful, so we fix it by refinement.
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection
 */
export interface DOMSelectionMaybeNeverExisted extends Selection {}

export type DOMSelection = DOMSelectionMaybeNeverExisted & {
  readonly anchorNode: DOMNode;
  readonly focusNode: DOMNode;
};

export type DOMNodeOffset = [DOMNode, number];
export type DOMTextOffset = [DOMText, number];
