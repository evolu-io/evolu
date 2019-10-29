/* eslint-env browser */
import { Refinement } from 'fp-ts/lib/function';
import { fromNullable, mapNullable, Option } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { DOMNodeOffset } from '../types';
import { DOMElement, DOMNode, DOMRange, DOMSelection } from '../types/dom';

export const isDOMElement: Refinement<DOMNode, DOMElement> = (
  node,
): node is DOMElement => node.nodeType === Node.ELEMENT_NODE;

export const createDOMNodeOffset = (
  offset: number,
): ((node: DOMNode) => DOMNodeOffset) => node => [node, offset];

export const getDOMRangeFromInputEvent = (
  event: InputEvent,
): Option<DOMRange> =>
  // @ts-ignore Outdated types.
  fromNullable(event.getTargetRanges()[0]);

export const getDOMSelection = (
  element: HTMLElement | null,
): Option<DOMSelection> =>
  pipe(
    fromNullable(element),
    mapNullable(element => element.ownerDocument),
    mapNullable(doc => doc.getSelection()),
  );

export const createDOMRange = (element: HTMLElement | null): Option<DOMRange> =>
  pipe(
    fromNullable(element),
    mapNullable(element => element.ownerDocument),
    mapNullable(doc => doc.createRange()),
  );
