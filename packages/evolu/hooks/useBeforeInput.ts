import { sequenceT } from 'fp-ts/lib/Apply';
import { constVoid } from 'fp-ts/lib/function';
import * as i from 'fp-ts/lib/IO';
import { snoc } from 'fp-ts/lib/NonEmptyArray';
import * as o from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Dispatch, RefObject, useEffect } from 'react';
import {
  getDOMRangeFromInputEvent,
  getDOMSelection,
  isCollapsedDOMSelectionOnTextOrBR,
  isExistingDOMSelection,
  onlyTextIsAffected,
} from '../models/dom';
import {
  initNonEmptyPathWithOffset,
  isNonEmptyPathWithOffset,
  movePath,
} from '../models/path';
import {
  collapseToStart,
  initSelection,
  selectionFromInputEvent,
  selectionFromPath,
} from '../models/selection';
import { Action, AfterTyping, GetPathByDOMNode, NonEmptyPath } from '../types';
import { DOMRange, DOMText } from '../types/dom';
import { warn } from '../warn';

const preventDefault = (event: InputEvent): i.IO<void> => () => {
  event.preventDefault();
};

const rangeStartContainerToText: (a: Range) => o.Option<string> = ({
  startContainer,
}) => o.fromNullable(startContainer.textContent);

const getNonEmptyPathWithOffsetFromInputEvent = (
  event: InputEvent,
  getPathByDOMNode: GetPathByDOMNode,
) =>
  pipe(
    selectionFromInputEvent(getPathByDOMNode)(event)(),
    o.map(s => s.anchor),
    o.filter(isNonEmptyPathWithOffset),
  );

const insertText = (
  event: InputEvent,
  afterTyping: AfterTyping,
  dispatch: Dispatch<Action>,
  getPathByDOMNode: GetPathByDOMNode,
  doc: Document,
) => {
  const dispatchSetTextAfterTyping = () =>
    pipe(
      sequenceT(o.option)(
        selectionFromInputEvent(getPathByDOMNode)(event)(),
        getDOMRangeFromInputEvent(event),
        o.fromNullable(event.data),
      ),
      o.chain(([selection, range, eventData]) => {
        const maybeBR = range.startContainer.childNodes[range.startOffset];
        const putBRback =
          range.startContainer === range.endContainer &&
          maybeBR != null &&
          maybeBR.nodeName === 'BR';
        const getText = () => {
          const text = range.startContainer.textContent || '';
          if (putBRback)
            range.startContainer.replaceChild(
              maybeBR,
              range.startContainer.firstChild as ChildNode,
            );
          return text;
        };
        const nonEmptyPath = selection.anchor;
        const selectionAfterInsert = pipe(
          putBRback ? snoc(nonEmptyPath, 0) : nonEmptyPath,
          movePath(eventData.length),
          selectionFromPath,
        );
        if (putBRback)
          return o.some({
            getText,
            selection: selectionAfterInsert,
            path: nonEmptyPath,
          });
        if (isNonEmptyPathWithOffset(nonEmptyPath)) {
          return o.some({
            getText,
            selection: selectionAfterInsert,
            path: initNonEmptyPathWithOffset(nonEmptyPath),
          });
        }
        return o.none;
      }),
      o.fold(preventDefault(event), ({ getText, path, selection }) => {
        afterTyping(() => {
          const text = getText();
          dispatch({
            type: 'setText',
            arg: { text, path, selection },
          });
        });
      }),
    );

  pipe(
    getDOMSelection(doc)(),
    o.filter(isExistingDOMSelection),
    o.fold(preventDefault(event), selection => {
      if (isCollapsedDOMSelectionOnTextOrBR(selection)) {
        dispatchSetTextAfterTyping();
        return;
      }
      event.preventDefault();
      // if (selection.isCollapsed) return;
      // TODO: dispatch insertText
    }),
  );
};

const insertReplacementText = (
  event: InputEvent,
  afterTyping: AfterTyping,
  dispatch: Dispatch<Action>,
  getPathByDOMNode: GetPathByDOMNode,
) => {
  const dispatchAfterTyping = ([range, path]: [DOMRange, NonEmptyPath]) =>
    afterTyping(() =>
      pipe(
        rangeStartContainerToText(range),
        o.fold(constVoid, text => {
          dispatch({ type: 'setText', arg: { text, path } });
        }),
      ),
    );
  pipe(
    sequenceT(o.option)(
      getDOMRangeFromInputEvent(event),
      pipe(
        getNonEmptyPathWithOffsetFromInputEvent(event, getPathByDOMNode),
        o.map(initNonEmptyPathWithOffset),
      ),
    ),
    o.fold(preventDefault(event), dispatchAfterTyping),
  );
};

const deleteContent = (
  event: InputEvent,
  afterTyping: AfterTyping,
  dispatch: Dispatch<Action>,
  getPathByDOMNode: GetPathByDOMNode,
  doc: Document,
) => {
  const dispatchSetTextAfterTyping = () => {
    pipe(
      sequenceT(o.option)(
        selectionFromInputEvent(getPathByDOMNode)(event)(),
        getNonEmptyPathWithOffsetFromInputEvent(event, getPathByDOMNode),
        getDOMRangeFromInputEvent(event),
      ),
      o.fold(preventDefault(event), ([selection, nonEmptyPath, range]) => {
        const textIsGoingToBeReplacedWithBR =
          range.startContainer === range.endContainer &&
          range.startOffset === 0 &&
          (range.startContainer as DOMText).data.length === range.endOffset;
        if (textIsGoingToBeReplacedWithBR) event.preventDefault();
        const getSelectionAfterDelete = () => {
          if (!textIsGoingToBeReplacedWithBR)
            return o.some(collapseToStart(selection));
          return initSelection(selection);
        };
        pipe(
          getSelectionAfterDelete(),
          o.fold(constVoid, selection => {
            afterTyping(() => {
              const { data } = range.startContainer as DOMText;
              const text = textIsGoingToBeReplacedWithBR ? '' : data;
              const path = textIsGoingToBeReplacedWithBR
                ? selection.anchor
                : initNonEmptyPathWithOffset(nonEmptyPath);
              dispatch({
                type: 'setText',
                arg: { text, path, selection },
              });
            });
          }),
        );
      }),
    );
  };

  pipe(
    getDOMSelection(doc)(),
    o.filter(isExistingDOMSelection),
    o.fold(preventDefault(event), selection => {
      const isForward = event.inputType === 'deleteContentForward';
      if (onlyTextIsAffected(isForward)(selection)) {
        dispatchSetTextAfterTyping();
      } else {
        preventDefault(event)();
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
          insertText(event, afterTyping, dispatch, getPathByDOMNode, doc);
          break;
        }
        case 'insertReplacementText': {
          insertReplacementText(event, afterTyping, dispatch, getPathByDOMNode);
          break;
        }
        // I don't understand why deleteContent needs a direction.
        case 'deleteContentBackward':
        case 'deleteContentForward': {
          deleteContent(event, afterTyping, dispatch, getPathByDOMNode, doc);
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
