import { sequenceT } from 'fp-ts/lib/Apply';
import { constVoid } from 'fp-ts/lib/function';
import * as i from 'fp-ts/lib/IO';
import * as o from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Dispatch, RefObject, useEffect } from 'react';
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
const preventDefault = (event: InputEvent): i.IO<void> => () => {
  event.preventDefault();
};

const rangeStartContainerToText: (a: Range) => o.Option<string> = ({
  startContainer,
}) => o.fromNullable(startContainer.textContent);

const insertText = (
  event: InputEvent,
  afterTyping: AfterTyping,
  dispatch: Dispatch<Action>,
  doc: Document,
  getPathByDOMNode: GetPathByDOMNode,
) =>
  // TODO: Refactor.
  pipe(
    getDOMSelection(doc)(),
    o.fold(preventDefault(event), selection => {
      if (!selection.isCollapsed) {
        event.preventDefault();
        return;
      }
      pipe(
        sequenceT(o.option)(
          getSelectionFromInputEvent(getPathByDOMNode, event)(),
          getDOMRangeFromInputEvent(event),
          o.fromNullable(event.data),
        ),
        o.chain(([selection, domRange, eventData]) => {
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
          return o.some({
            getText,
            maybeReplaceBRWithText,
            selectionAfterInsert,
            // selection,
          });
        }),
        o.fold(
          preventDefault(event),
          ({
            getText,
            maybeReplaceBRWithText,
            selectionAfterInsert,
            // selection,
          }) => {
            afterTyping(() => {
              const text = getText();
              maybeReplaceBRWithText();
              // const [path, offset] = pathToInitAndLast(
              //   selectionAfterInsert.anchor,
              // );
              // pockat, nejde!
              // takze jo, init path melo smysl!
              // text, path, offset
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
  // TODO: Refactor afterTyping to be chainable.
  // Jak to ma vypadat funkcionalne?
  // odstranit async? jak?
  // dispatch jako IO? hmm, lakave
  // ten for IO je v tom, ze ho nastavim, ale
  pipe(
    getDOMRangeFromInputEvent(event),
    o.fold(preventDefault(event), range => {
      afterTyping(() => {
        pipe(
          range,
          rangeStartContainerToText,
          o.fold(constVoid, text => {
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
  // TODO: Make it flat.
  pipe(
    getDOMSelection(doc)(),
    o.filter(isExistingDOMSelection),
    o.fold(preventDefault(event), selection => {
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
          sequenceT(o.option)(
            getSelectionFromInputEvent(getPathByDOMNode, event)(),
            getDOMRangeFromInputEvent(event),
          ),
          o.fold(preventDefault(event), ([selection, domRange]) => {
            if (isCollapsed(selection)) return;
            const textIsGoingToBeReplacedWithBR =
              domRange.startContainer === domRange.endContainer &&
              domRange.startOffset === 0 &&
              (domRange.startContainer as DOMText).data.length ===
                domRange.endOffset;
            if (textIsGoingToBeReplacedWithBR) event.preventDefault();
            const getSelectionAfterDelete = () => {
              if (!textIsGoingToBeReplacedWithBR)
                return o.some(collapseToStart(selection));
              return initSelection(selection);
            };
            pipe(
              getSelectionAfterDelete(),
              o.fold(
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
