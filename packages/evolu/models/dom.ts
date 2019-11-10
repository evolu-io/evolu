/* eslint-env browser */
import { Predicate, Refinement } from 'fp-ts/lib/function';
import * as i from 'fp-ts/lib/IO';
import * as o from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { DOMNodeOffset } from '../types';
import {
  DOMElement,
  DOMNode,
  DOMRange,
  DOMSelection,
  DOMText,
  ExistingDOMSelection,
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
> = (selection): selection is ExistingDOMSelection =>
  selection.anchorNode != null && selection.focusNode != null;

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

export const onlyTextIsAffected = (
  isForward: boolean,
): Predicate<ExistingDOMSelection> => selection =>
  selection.isCollapsed &&
  // nodeValue != null for text node.
  // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeValue
  selection.anchorNode.nodeValue != null &&
  selection.anchorOffset !==
    (isForward ? selection.anchorNode.nodeValue.length : 0);

export const isCollapsedDOMSelectionOnTextOrBR: Predicate<ExistingDOMSelection> = selection =>
  selection.isCollapsed &&
  (isDOMText(selection.focusNode) ||
    selection.focusNode.childNodes[selection.focusOffset].nodeName === 'BR');
