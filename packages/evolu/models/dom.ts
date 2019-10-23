/* eslint-env browser */
import { sequenceT } from 'fp-ts/lib/Apply';
import { last } from 'fp-ts/lib/Array';
import { Refinement } from 'fp-ts/lib/function';
import { Option, option, fromNullable, mapNullable } from 'fp-ts/lib/Option';
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
): node is DOMElement => node.nodeType === Node.ELEMENT_NODE;

export type SetDOMNodePathRef = (node: DOMNode | null) => void;

/**
 * Node and offset tuple for selection anchor and focus props.
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection
 */
export type DOMNodeOffset = [DOMNode, number];

export const createDOMNodeOffset = (
  path: Path,
): ((node: Option<DOMNode>) => Option<DOMNodeOffset>) => node =>
  sequenceT(option)(node, last(path));

// TODO: Option.
export const getDOMRangeFromInputEvent = (event: InputEvent): DOMRange =>
  // It always returns so we don't need fromNullable.
  // @ts-ignore Outdated types.
  event.getTargetRanges()[0];

export const getDOMSelection = (
  element: HTMLElement | null,
): Option<DOMSelection> =>
  pipe(
    fromNullable(element),
    mapNullable(element => element.ownerDocument),
    mapNullable(doc => doc.getSelection()),
  );

export const getDOMRange = (element: HTMLElement | null): Option<DOMRange> =>
  pipe(
    fromNullable(element),
    mapNullable(element => element.ownerDocument),
    mapNullable(doc => doc.createRange()),
  );
