import { sequenceT } from 'fp-ts/lib/Apply';
import { IO } from 'fp-ts/lib/IO';
import {
  chain,
  filter,
  fold,
  fromNullable,
  Option,
  option,
  some,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Dispatch, RefObject, useEffect } from 'react';
import { constVoid } from 'fp-ts/lib/function';
import {
  getDOMRangeFromInputEvent,
  getDOMSelection,
  isExistingDOMSelection,
} from '../models/dom';
import {
  collapseToStart,
  getSelectionFromInputEvent,
  initSelection,
  isCollapsed,
  moveSelection,
  snocSelection,
} from '../models/selection';
import { Action, AfterTyping, GetPathByDOMNode } from '../types';
import { DOMText } from '../types/dom';
import { warn } from '../warn';

// We prevent everything except safe typing on the collapsed selection which can not
// be prevented anyway, because browsers update DOM by an extensions or spellcheck
// or by contentEditable itself (whitespaces can be replaced with nbsps).
// In those cases, we read content from DOM then restore it so React is not confused.
// We do not handle composition events yet.
// https://www.w3.org/TR/input-events-2/
const preventDefault = (event: InputEvent): IO<void> => () => {
  event.preventDefault();
};

const rangeStartContainerToText: (a: Range) => Option<string> = ({
  startContainer,
}) => fromNullable(startContainer.textContent);

// TODO: Refactor pyramids of doom, afterTyping and dispatch should be functional.

const insertText = (
  event: InputEvent,
  afterTyping: AfterTyping,
  dispatch: Dispatch<Action>,
  doc: Document,
  getPathByDOMNode: GetPathByDOMNode,
) =>
  pipe(
    getDOMSelection(doc)(),
    fold(preventDefault(event), selection => {
      if (!selection.isCollapsed) {
        event.preventDefault();
        return;
      }
      pipe(
        sequenceT(option)(
          getSelectionFromInputEvent(getPathByDOMNode, event)(),
          getDOMRangeFromInputEvent(event),
          fromNullable(event.data),
        ),
        chain(([selection, domRange, eventData]) => {
          const maybeBR =
            domRange.startContainer.childNodes[domRange.startOffset];
          const brIsGoingToBeReplacedWithText =
            domRange.startContainer === domRange.endContainer &&
            maybeBR != null &&
            maybeBR.nodeName === 'BR';
          const getText = () => domRange.startContainer.textContent || '';
          const maybeReplaceBRWithText = () => {
            if (!brIsGoingToBeReplacedWithText) return;
            domRange.startContainer.replaceChild(maybeBR, domRange
              .startContainer.firstChild as ChildNode);
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
          preventDefault(event),
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
    }),
  );

const insertReplacementText = (
  event: InputEvent,
  afterTyping: AfterTyping,
  dispatch: Dispatch<Action>,
) =>
  pipe(
    getDOMRangeFromInputEvent(event),
    fold(preventDefault(event), range => {
      afterTyping(() => {
        pipe(
          range,
          rangeStartContainerToText,
          fold(constVoid, text => {
            dispatch({ type: 'insertReplacementText', text });
          }),
        );
      });
    }),
  );

const deleteContent = (
  event: InputEvent,
  afterTyping: AfterTyping,
  dispatch: Dispatch<Action>,
  doc: Document,
  getPathByDOMNode: GetPathByDOMNode,
) => {
  pipe(
    getDOMSelection(doc)(),
    filter(isExistingDOMSelection),
    fold(preventDefault(event), selection => {
      const onlyTextIsAffectedByAction =
        selection.isCollapsed &&
        // nodeValue != null for text node.
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeValue
        selection.anchorNode.nodeValue != null &&
        selection.anchorOffset !==
          (event.inputType === 'deleteContentBackward'
            ? 0
            : selection.anchorNode.nodeValue.length);
      if (onlyTextIsAffectedByAction) {
        pipe(
          sequenceT(option)(
            getSelectionFromInputEvent(getPathByDOMNode, event)(),
            getDOMRangeFromInputEvent(event),
          ),
          fold(preventDefault(event), ([selection, domRange]) => {
            if (isCollapsed(selection)) return;
            const textIsGoingToBeReplacedWithBR =
              domRange.startContainer === domRange.endContainer &&
              domRange.startOffset === 0 &&
              (domRange.startContainer as DOMText).data.length ===
                domRange.endOffset;
            if (textIsGoingToBeReplacedWithBR) event.preventDefault();
            const getSelectionAfterDelete = () => {
              if (!textIsGoingToBeReplacedWithBR)
                return some(collapseToStart(selection));
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
      } else {
        preventDefault(event)();
        // pipe(
        //   getSelectionFromInputEvent(getPathByDOMNode, event)(),
        //   fold(constVoid, selection => {
        //     dispatch({ type: 'deleteContent', selection });
        //   }),
        // );
      }
    }),
  );
};

export const useBeforeInput = (
  editorElementRef: RefObject<HTMLDivElement>,
  afterTyping: AfterTyping,
  getPathByDOMNode: GetPathByDOMNode,
  dispatch: Dispatch<Action>,
) => {
  useEffect(() => {
    const { current: editorElement } = editorElementRef;
    if (editorElement == null) return;
    const doc = editorElement.ownerDocument;
    if (doc == null) return;

    const handleBeforeInput = (event: InputEvent) => {
      switch (event.inputType) {
        case 'insertText': {
          insertText(event, afterTyping, dispatch, doc, getPathByDOMNode);
          break;
        }
        case 'insertReplacementText': {
          insertReplacementText(event, afterTyping, dispatch);
          break;
        }
        // I don't understand why deleteContent needs a direction.
        case 'deleteContentBackward':
        case 'deleteContentForward': {
          deleteContent(event, afterTyping, dispatch, doc, getPathByDOMNode);
          break;
        }
        default:
          // Prevent unhandled until it will be handled.
          event.preventDefault();
          warn(`Unhandled beforeinput inputType: ${event.inputType}`);
      }
    };

    // @ts-ignore Outdated types.
    editorElement.addEventListener('beforeinput', handleBeforeInput);
    return () => {
      // @ts-ignore Outdated types.
      editorElement.removeEventListener('beforeinput', handleBeforeInput);
    };
  }, [afterTyping, dispatch, editorElementRef, getPathByDOMNode]);
};
