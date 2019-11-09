/* eslint-env browser */
import { Refinement, constFalse, constTrue } from 'fp-ts/lib/function';
import * as o from 'fp-ts/lib/Option';
import * as i from 'fp-ts/lib/IO';
import { pipe } from 'fp-ts/lib/pipeable';
import { sequenceT } from 'fp-ts/lib/Apply';
import { DOMNodeOffset } from '../types';
import {
  DOMElement,
  DOMNode,
  DOMRange,
  DOMSelection,
  ExistingDOMSelection,
  DOMText,
} from '../types/dom';

export const isDOMElement: Refinement<DOMNode, DOMElement> = (
  node,
): node is DOMElement => node.nodeType === Node.ELEMENT_NODE;

export const isDOMText: Refinement<DOMNode, DOMText> = (
  node,
): node is DOMText => node.nodeType === Node.TEXT_NODE;

export const isExistingDOMSelection: Refinement<
  DOMSelection,
  ExistingDOMSelection
> = (s): s is ExistingDOMSelection =>
  // Sure we can just check s.anchorNode != null && s.focusNode != null, but
  // this is like Kata. Excercise to demonstrate how we can generalize a problem.
  // This pipe can be refactored to allIsExisting or something. Maybe fp-ts already
  // has something for that.
  pipe(
    sequenceT(o.option)(
      o.fromNullable(s.anchorNode),
      o.fromNullable(s.focusNode),
    ),
    o.fold(constFalse, constTrue),
  );

export const createDOMNodeOffset = (
  offset: number,
): ((node: DOMNode) => DOMNodeOffset) => node => [node, offset];

export const getDOMRangeFromInputEvent = (
  event: InputEvent,
): o.Option<DOMRange> =>
  // @ts-ignore Outdated types.
  o.fromNullable(event.getTargetRanges()[0]);

export const getDOMSelection = (
  doc: Document,
): i.IO<o.Option<DOMSelection>> => () => o.fromNullable(doc.getSelection());

export const createDOMRange = (
  element: HTMLElement | null,
): i.IO<o.Option<DOMRange>> => () =>
  pipe(
    o.fromNullable(element),
    o.mapNullable(element => element.ownerDocument),
    o.mapNullable(doc => doc.createRange()),
  );
