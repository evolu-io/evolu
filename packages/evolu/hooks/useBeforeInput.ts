import { sequenceT } from 'fp-ts/lib/Apply';
import { constVoid } from 'fp-ts/lib/function';
import {
  chain,
  fold,
  fromNullable,
  Option,
  option,
  some,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Dispatch, RefObject, useEffect } from 'react';
import {
  DOMText,
  getDOMRangeFromInputEvent,
  GetPathByDOMNode,
} from '../models/dom';
import {
  collapseSelectionToStart,
  getSelectionFromInputEvent,
  initSelection,
  isCollapsedSelection,
  moveSelection,
  snocSelection,
} from '../models/selection';
import { EditorAction } from '../reducers/editorReducer';
import { warn } from '../warn';
import { AfterTyping } from './useAfterTyping';

const rangeStartContainerToText: (a: Range) => Option<string> = ({
  startContainer,
}) => fromNullable(startContainer.textContent);

const insertText = (
  getPathByDOMNode: GetPathByDOMNode,
  event: InputEvent,
  afterTyping: AfterTyping,
  dispatch: Dispatch<EditorAction>,
) => {
  pipe(
    sequenceT(option)(
      getSelectionFromInputEvent(getPathByDOMNode)(event),
      getDOMRangeFromInputEvent(event),
      fromNullable(event.data),
    ),
    chain(([selection, domRange, eventData]) => {
      const maybeBR = domRange.startContainer.childNodes[domRange.startOffset];
      const brIsGoingToBeReplacedWithText =
        domRange.startContainer === domRange.endContainer &&
        maybeBR != null &&
        maybeBR.nodeName === 'BR';
      const getText = () => domRange.startContainer.textContent || '';
      const maybeReplaceBRWithText = () => {
        if (!brIsGoingToBeReplacedWithText) return;
        domRange.startContainer.replaceChild(maybeBR, domRange.startContainer
          .firstChild as ChildNode);
      };
      const selectionAfterInsert = brIsGoingToBeReplacedWithText
        ? snocSelection(selection, 1, 1)
        : moveSelection(eventData.length)(selection);
      return some({
        getText,
        maybeReplaceBRWithText,
        selectionAfterInsert,
      });
    }),
    fold(
      constVoid,
      ({ getText, maybeReplaceBRWithText, selectionAfterInsert }) => {
        afterTyping(() => {
          const text = getText();
          maybeReplaceBRWithText();
          dispatch({
            type: 'insertText',
            text,
            selection: selectionAfterInsert,
          });
        });
      },
    ),
  );
};

const deleteContent = (
  getPathByDOMNode: GetPathByDOMNode,
  event: InputEvent,
  afterTyping: AfterTyping,
  dispatch: Dispatch<EditorAction>,
) => {
  pipe(
    sequenceT(option)(
      getSelectionFromInputEvent(getPathByDOMNode)(event),
      getDOMRangeFromInputEvent(event),
    ),
    fold(constVoid, ([selection, domRange]) => {
      if (isCollapsedSelection(selection)) return;
      const textIsGoingToBeReplacedWithBR =
        domRange.startContainer === domRange.endContainer &&
        domRange.startOffset === 0 &&
        (domRange.startContainer as DOMText).data.length === domRange.endOffset;
      if (textIsGoingToBeReplacedWithBR) event.preventDefault();
      const getSelectionAfterDelete = () => {
        if (!textIsGoingToBeReplacedWithBR)
          return some(collapseSelectionToStart(selection));
        return initSelection(selection);
      };
      pipe(
        getSelectionAfterDelete(),
        fold(
          () => {
            warn('Selection should exists.');
          },
          selection => {
            afterTyping(() => {
              const { data } = domRange.startContainer as DOMText;
              const text = textIsGoingToBeReplacedWithBR ? '' : data;
              dispatch({ type: 'deleteText', text, selection });
            });
          },
        ),
      );
    }),
  );
};

const insertReplacementText = (
  event: InputEvent,
  afterTyping: AfterTyping,
  dispatch: Dispatch<EditorAction>,
) => {
  pipe(
    getDOMRangeFromInputEvent(event),
    chain(rangeStartContainerToText),
    fold(constVoid, text => {
      afterTyping(() => {
        dispatch({ type: 'insertReplacementText', text });
      });
    }),
  );
};

export const useBeforeInput = (
  divRef: RefObject<HTMLDivElement>,
  afterTyping: AfterTyping,
  getPathByDOMNode: GetPathByDOMNode,
  dispatch: Dispatch<EditorAction>,
) => {
  useEffect(() => {
    const { current: div } = divRef;
    if (div == null) return;

    const handleBeforeInput = (event: InputEvent) => {
      switch (event.inputType) {
        case 'insertText':
          insertText(getPathByDOMNode, event, afterTyping, dispatch);
          break;
        case 'deleteContentBackward':
        case 'deleteContentForward':
          deleteContent(getPathByDOMNode, event, afterTyping, dispatch);
          break;
        case 'insertReplacementText': {
          insertReplacementText(event, afterTyping, dispatch);
          break;
        }
        default:
          warn(`Unhandled beforeinput inputType: ${event.inputType}`);
      }
    };

    // @ts-ignore Outdated types.
    div.addEventListener('beforeinput', handleBeforeInput);
    return () => {
      // @ts-ignore Outdated types.
      div.removeEventListener('beforeinput', handleBeforeInput);
    };
  }, [afterTyping, dispatch, divRef, getPathByDOMNode]);
};
