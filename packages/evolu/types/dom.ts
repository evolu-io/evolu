// Extends DOM types to prevent name clashes with Editor types.
export interface DOMElement extends Element {}
export interface DOMNode extends Node {}
export interface DOMRange extends Range {}
export interface DOMSelection extends Selection {}
export interface DOMText extends Text {}

/**
 * DOMSelection with existing anchorNode and focusNode.
 * They can be null if selection never existed in the document.
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection
 */
export type ExistingDOMSelection = DOMSelection & {
  readonly anchorNode: Node;
  readonly focusNode: Node;
};

export type DOMNodeOffset = [DOMNode, number];
