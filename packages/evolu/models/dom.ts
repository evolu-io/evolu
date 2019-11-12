/* eslint-env browser */
import { Predicate, Refinement } from 'fp-ts/lib/function';
import { fromNullable, Option } from 'fp-ts/lib/Option';
import { IO } from 'fp-ts/lib/IO';
import {
  DOMElement,
  DOMNode,
  DOMNodeOffset,
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

/**
 * Chrome has a bug when it can return obsolete DOMSelection. It happens when a long
 * text is deleted by holding delete key, so it's probably a race condition, because
 * Safari is ok. Therefore, we have to validate DOMNodeOffset to prevent:
 * `Uncaught DOMException: Failed to execute 'setEnd' on 'Range'`
 */
export const isValidDOMNodeOffset: Predicate<DOMNodeOffset> = ([
  node,
  offset,
]) =>
  isDOMElement(node)
    ? offset <= node.childNodes.length
    : isDOMText(node)
    ? offset <= node.data.length
    : false;

export const getDOMRangeFromInputEvent = (
  event: InputEvent,
): Option<DOMRange> =>
  // @ts-ignore Outdated types.
  fromNullable(event.getTargetRanges()[0]);

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

export const getTextContentFromRangeStartContainer: (
  a: DOMRange,
) => Option<string> = range => fromNullable(range.startContainer.textContent);

// It's ok to have IOs here. Only Editor related IOs belong to EditorIO.
export const preventDefault = (event: InputEvent): IO<void> => () => {
  event.preventDefault();
};
