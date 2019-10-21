import { sequenceT } from 'fp-ts/lib/Apply';
import { init, snoc } from 'fp-ts/lib/Array';
import { Eq, getStructEq } from 'fp-ts/lib/Eq';
import { Endomorphism, Predicate } from 'fp-ts/lib/function';
import { chain, none, Option, option, some } from 'fp-ts/lib/Option';
import { geq } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import {
  DOMNode,
  DOMRange,
  DOMSelection,
  getDOMRangeFromInputEvent,
} from './dom';
import { Range } from './range';
import { byDirection, eqPath, movePath, Path } from './path';

/**
 * Like DOM Selection, but with Path for the anchor and the focus.
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection
 */
export interface Selection {
  readonly anchor: Path;
  readonly focus: Path;
}

/**
 * The focus in not before the anchor.
 */
export const isForwardSelection: Predicate<Selection> = selection =>
  geq(byDirection)(selection.anchor, selection.focus);

export function mapSelectionToRange(selection: Selection): Range {
  if (isForwardSelection(selection))
    return { start: selection.anchor, end: selection.focus };
  return { start: selection.focus, end: selection.anchor };
}

export const isCollapsedSelection: Predicate<Selection> = selection =>
  eqPath.equals(selection.anchor, selection.focus);

export const eqSelection: Eq<Selection> = getStructEq({
  anchor: eqPath,
  focus: eqPath,
});

export function mapDOMSelectionToSelection(
  getPathByNode: (node: DOMNode) => Option<Path>,
): (selection: DOMSelection) => Option<Selection> {
  return ({ anchorNode, anchorOffset, focusNode, focusOffset }) =>
    pipe(
      sequenceT(option)(
        anchorNode ? getPathByNode(anchorNode) : none,
        focusNode ? getPathByNode(focusNode) : none,
      ),
      chain(([anchorPath, focusPath]) =>
        some({
          anchor: snoc(anchorPath, anchorOffset),
          focus: snoc(focusPath, focusOffset),
        }),
      ),
    );
}

export function mapDOMRangeToSelection(
  getPathByNode: (node: DOMNode) => Option<Path>,
): (range: DOMRange) => Option<Selection> {
  return ({ startContainer, startOffset, endContainer, endOffset }) =>
    pipe(
      sequenceT(option)(
        getPathByNode(startContainer),
        getPathByNode(endContainer),
      ),
      chain(([anchorPath, focusPath]) =>
        some({
          anchor: snoc(anchorPath, startOffset),
          focus: snoc(focusPath, endOffset),
        }),
      ),
    );
}

export function moveSelectionAnchor(offset: number): Endomorphism<Selection> {
  return selection => {
    return {
      ...selection,
      anchor: movePath(offset)(selection.anchor),
    };
  };
}

export function moveSelectionFocus(offset: number): Endomorphism<Selection> {
  return selection => {
    return {
      ...selection,
      focus: movePath(offset)(selection.focus),
    };
  };
}

export function moveSelection(offset: number): Endomorphism<Selection> {
  return selection =>
    pipe(
      selection,
      moveSelectionAnchor(offset),
      moveSelectionFocus(offset),
    );
}

export const collapseSelectionToStart: Endomorphism<Selection> = selection => {
  if (isCollapsedSelection(selection)) return selection;
  const range = mapSelectionToRange(selection);
  return { anchor: range.start, focus: range.start };
};

export const collapseSelectionToEnd: Endomorphism<Selection> = selection => {
  if (isCollapsedSelection(selection)) return selection;
  const range = mapSelectionToRange(selection);
  return { anchor: range.end, focus: range.end };
};

export function getSelectionFromInputEvent(
  getPathByNode: (node: DOMNode) => Option<Path>,
): (event: InputEvent) => Option<Selection> {
  return event => {
    return pipe(
      getDOMRangeFromInputEvent(event),
      mapDOMRangeToSelection(getPathByNode),
    );
  };
}

/**
 * `{ anchor: [0, 0], focus: [0, 0] }` to `{ anchor: [0], focus: [0] }`
 */
export function initSelection(selection: Selection): Option<Selection> {
  return pipe(
    sequenceT(option)(init(selection.anchor), init(selection.focus)),
    chain(([anchor, focus]) => some({ anchor, focus })),
  );
}

/**
 * `{ anchor: [0], focus: [0] }` to `{ anchor: [0, 0], focus: [0, 0] }`
 */
export function snocSelection(
  selection: Selection,
  anchorLastIndex: number,
  focusLastIndex: number,
): Selection {
  return {
    anchor: snoc(selection.anchor, anchorLastIndex),
    focus: snoc(selection.focus, focusLastIndex),
  };
}
