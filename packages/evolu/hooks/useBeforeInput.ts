import { sequenceT } from 'fp-ts/lib/Apply';
import { constVoid, constTrue } from 'fp-ts/lib/function';
import {
  chain,
  fold,
  fromNullable,
  Option,
  option,
  some,
  toNullable,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Dispatch, RefObject, useEffect } from 'react';
import { getDOMRangeFromInputEvent, getDOMSelection } from '../models/dom';
import {
  collapseSelectionToStart,
  getSelectionFromInputEvent,
  initSelection,
  isCollapsedSelection,
  moveSelection,
  snocSelection,
} from '../models/selection';
import { Action, AfterTyping, GetPathByDOMNode } from '../types';
import { DOMText } from '../types/dom';
import { warn } from '../warn';

const rangeStartContainerToText: (a: Range) => Option<string> = ({
  startContainer,
}) => fromNullable(startContainer.textContent);

type HandleInputEventArg = {
  getPathByDOMNode: GetPathByDOMNode;
  event: InputEvent;
  afterTyping: AfterTyping;
  dispatch: Dispatch<Action>;
};

// We should handle *OnTyping functions in Reducer, but I am not sure how yet.
// Probably via some kind of transaction. Remember, Reducer has to be pure.
// Meahwhile, *OnTyping functions are internal.

type PreventDefault = boolean;

const insertTextOnTyping = ({
  getPathByDOMNode,
  event,
  afterTyping,
  dispatch,
}: HandleInputEventArg): PreventDefault =>
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
      constTrue,
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
        return false;
      },
    ),
  );

const insertReplacementTextOnTyping = ({
  event,
  afterTyping,
  dispatch,
}: HandleInputEventArg): PreventDefault =>
  pipe(
    getDOMRangeFromInputEvent(event),
    fold(constTrue, range => {
      afterTyping(() => {
        pipe(
          range,
          rangeStartContainerToText,
          fold(constVoid, text => {
            dispatch({ type: 'insertReplacementText', text });
          }),
        );
      });
      return false;
    }),
  );

const deleteContentOnTyping = ({
  getPathByDOMNode,
  event,
  afterTyping,
  dispatch,
}: HandleInputEventArg): PreventDefault =>
  pipe(
    sequenceT(option)(
      getSelectionFromInputEvent(getPathByDOMNode)(event),
      getDOMRangeFromInputEvent(event),
    ),
    fold(constTrue, ([selection, domRange]) => {
      if (isCollapsedSelection(selection)) return true;
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
      return false;
    }),
  );

export const useBeforeInput = (
  divRef: RefObject<HTMLDivElement>,
  afterTyping: AfterTyping,
  getPathByDOMNode: GetPathByDOMNode,
  dispatch: Dispatch<Action>,
) => {
  useEffect(() => {
    const { current: div } = divRef;
    if (div == null) return;

    const handleBeforeInput = (event: InputEvent) => {
      // TODO: Refactor.
      const domSelection = toNullable(getDOMSelection(div));
      if (
        domSelection == null ||
        domSelection.anchorNode == null ||
        domSelection.anchorNode.textContent == null ||
        domSelection.focusNode == null
      ) {
        // TODO: Handle composition events.
        warn('Selection should exists.');
        return;
      }

      const arg: HandleInputEventArg = {
        getPathByDOMNode,
        event,
        afterTyping,
        dispatch,
      };

      // We prevent everything except typing on collapsed selection which can not
      // be prevented, because we have to let browser to update DOM by an extension
      // or spellcheck or by contentEditable itself (it replaces spaces with nbsps).
      // In those cases, we read content from DOM then restore it so React is not
      // confused. We do not handle composition events yet.
      // https://www.w3.org/TR/input-events-2/
      let preventDefault: PreventDefault = true;

      // console.log(event.inputType, event.getTargetRanges());

      switch (event.inputType) {
        case 'insertText':
          if (domSelection.isCollapsed) {
            preventDefault = insertTextOnTyping(arg);
          } else {
            // insertText(arg);
          }
          break;

        case 'insertReplacementText':
          preventDefault = insertReplacementTextOnTyping(arg);
          break;

        case 'deleteContentBackward':
        case 'deleteContentForward': {
          const onlyTextIsAffectedByAction =
            domSelection.isCollapsed &&
            domSelection.anchorOffset !==
              (event.inputType === 'deleteContentBackward'
                ? 0
                : domSelection.anchorNode.textContent.length);
          if (onlyTextIsAffectedByAction) {
            preventDefault = deleteContentOnTyping(arg);
          } else {
            pipe(
              event,
              getSelectionFromInputEvent(getPathByDOMNode),
              fold(constVoid, selection => {
                dispatch({ type: 'deleteContent', selection });
              }),
            );
          }
          break;
        }

        case 'insertParagraph': {
          // console.log('f');
          // jo
          break;
        }

        default:
          event.preventDefault();
          warn(`Unhandled beforeinput inputType: ${event.inputType}`);
      }

      if (preventDefault) event.preventDefault();
    };

    // @ts-ignore Outdated types.
    div.addEventListener('beforeinput', handleBeforeInput);
    return () => {
      // @ts-ignore Outdated types.
      div.removeEventListener('beforeinput', handleBeforeInput);
    };
  }, [afterTyping, dispatch, divRef, getPathByDOMNode]);
};
