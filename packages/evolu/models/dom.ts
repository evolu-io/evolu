/* eslint-env browser */
import { Refinement, constFalse, constTrue } from 'fp-ts/lib/function';
import {
  fromNullable,
  mapNullable,
  Option,
  option,
  fold,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { sequenceT } from 'fp-ts/lib/Apply';
import { DOMNodeOffset } from '../types';
import {
  DOMElement,
  DOMNode,
  DOMRange,
  DOMSelection,
  ExistingDOMSelection,
} from '../types/dom';

export const isDOMElement: Refinement<DOMNode, DOMElement> = (
  node,
): node is DOMElement => node.nodeType === Node.ELEMENT_NODE;

export const isExistingDOMSelection: Refinement<
  DOMSelection,
  ExistingDOMSelection
> = (s): s is ExistingDOMSelection =>
  // Sure we can just check s.anchorNode != null && s.focusNode != null, but
  // this is like Kata. Excercise to demonstrate how we can generalize a problem.
  // This pipe can be refactored to allIsExisting or something. Maybe fp-ts already
  // has something for that.
  pipe(
    sequenceT(option)(fromNullable(s.anchorNode), fromNullable(s.focusNode)),
    fold(constFalse, constTrue),
  );

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
