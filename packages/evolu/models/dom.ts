/* eslint-env browser */
import { Refinement } from 'fp-ts/lib/function';
import { fold, none, Option, some } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Path } from './path';

// We aliases DOM types to prevent clashes with Editor types.
// We were using editor namespacing everywhere, but that's verbose and unnecessary,
// because DOM is an implementation detail. Editor user will not need DOM types.
// If so, it's better to be explicit with DOM* types.
export type DOMElement = Element;
export type DOMNode = Node;
export type DOMRange = Range;
export type DOMSelection = Selection;
export type DOMText = Text;

export const isDOMElement: Refinement<DOMNode, DOMElement> = (
  node,
): node is DOMElement => {
  return node.nodeType === Node.ELEMENT_NODE;
};

export type SetDOMNodePathRef = (node: DOMNode | null) => void;

/**
 * Node and offset tuple for selection anchor and focus props.
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection
 */
export type DOMNodeOffset = [DOMNode, number];

export function createDOMNodeOffset(
  path: Path,
): (node: Option<DOMNode>) => Option<DOMNodeOffset> {
  return node =>
    pipe(
      node,
      // TODO: Use last.
      fold(() => none, node => some([node, path[path.length - 1]])),
    );
}

export function getDOMRangeFromInputEvent(event: InputEvent): DOMRange {
  // It always returns so we don't need fromNullable.
  // @ts-ignore Outdated types.
  return event.getTargetRanges()[0];
}
