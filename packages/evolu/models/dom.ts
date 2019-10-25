/* eslint-env browser */
import { sequenceT } from 'fp-ts/lib/Apply';
import { last } from 'fp-ts/lib/Array';
import { Refinement } from 'fp-ts/lib/function';
import { fromNullable, mapNullable, Option, option } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { DOMNodeOffset, Path } from '../types';
import { DOMNode, DOMElement, DOMRange, DOMSelection } from '../types/dom';

export const isDOMElement: Refinement<DOMNode, DOMElement> = (
  node,
): node is DOMElement => node.nodeType === Node.ELEMENT_NODE;

export const createDOMNodeOffset = (
  path: Path,
): ((node: Option<DOMNode>) => Option<DOMNodeOffset>) => node =>
  sequenceT(option)(node, last(path));

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
