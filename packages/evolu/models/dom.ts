/* eslint-env browser */
import { Predicate, Refinement } from 'fp-ts/lib/function';
import { fromNullable, Option, none, some, chain } from 'fp-ts/lib/Option';
import { IO } from 'fp-ts/lib/IO';
import { pipe } from 'fp-ts/lib/pipeable';
import {
  DOMElement,
  DOMNode,
  DOMRange,
  DOMSelectionMaybeNeverExisted,
  DOMText,
  DOMSelection,
} from '../types/dom';
import { DOMNodeOffset, DOMTextOffset } from '../types';
import { unwrapPathIndex, pathIndex } from './path';

export const isDOMElement: Refinement<DOMNode, DOMElement> = (
  node,
): node is DOMElement => node.nodeType === Node.ELEMENT_NODE;

export const isDOMText: Refinement<DOMNode, DOMText> = (
  node,
): node is DOMText => node.nodeType === Node.TEXT_NODE;

export const isDOMSelection: Refinement<
  DOMSelectionMaybeNeverExisted,
  DOMSelection
> = (selection): selection is DOMSelection =>
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
    ? unwrapPathIndex(offset) <= node.childNodes.length
    : isDOMText(node)
    ? unwrapPathIndex(offset) <= node.data.length
    : false;

export const getDOMRangeFromInputEvent = (
  event: InputEvent,
): Option<DOMRange> =>
  // @ts-ignore Outdated types.
  fromNullable(event.getTargetRanges()[0]);

export const isCollapsedDOMSelectionOnTextOrBR: Predicate<DOMSelection> = selection =>
  selection.isCollapsed &&
  (isDOMText(selection.focusNode) ||
    selection.focusNode.childNodes[selection.focusOffset].nodeName === 'BR');

export const getTextContentFromRangeStartContainer: (
  range: DOMRange,
) => Option<string> = range => fromNullable(range.startContainer.textContent);

export const preventDefault = (event: InputEvent): IO<void> => () => {
  event.preventDefault();
};

export const DOMSelectionToDOMTextOffset = (
  selection: DOMSelection,
): Option<DOMTextOffset> =>
  pipe(
    pathIndex(selection.anchorOffset),
    chain(offset =>
      selection.isCollapsed && isDOMText(selection.anchorNode)
        ? some([selection.anchorNode, offset])
        : none,
    ),
  );

export const isMoveWithinDOMTextOffset = (
  forward: boolean,
): Predicate<DOMTextOffset> => ([node, offset]) =>
  forward
    ? unwrapPathIndex(offset) < node.data.length
    : unwrapPathIndex(offset) > 0;

export const isDOMTextToBeDeletedByRange: (
  node: DOMText,
) => Predicate<DOMRange> = node => range =>
  range.startOffset === 0 && range.endOffset === node.data.length;

export const isInline: Predicate<CSSStyleDeclaration> = declaration =>
  declaration.display === 'inline';
