import { sequenceT } from 'fp-ts/lib/Apply';
import { constVoid } from 'fp-ts/lib/function';
import { IO } from 'fp-ts/lib/IO';
import { snoc } from 'fp-ts/lib/NonEmptyArray';
import {
  chain,
  filter,
  fold,
  fromNullable,
  map,
  none,
  Option,
  option,
  some,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { useEffect } from 'react';
import {
  getDOMRangeFromInputEvent,
  isCollapsedDOMSelectionOnTextOrBR,
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
import { EditorIO, GetPathByDOMNode, NonEmptyPath } from '../types';
import { DOMRange, DOMText } from '../types/dom';
import { warn } from '../warn';

const preventDefault = (event: InputEvent): IO<void> => () => {
  event.preventDefault();
};

const rangeStartContainerToText: (a: Range) => Option<string> = ({
  startContainer,
}) => fromNullable(startContainer.textContent);

const getNonEmptyPathWithOffsetFromInputEvent = (
  event: InputEvent,
  getPathByDOMNode: GetPathByDOMNode,
) =>
  pipe(
    selectionFromInputEvent(getPathByDOMNode)(event)(),
    map(s => s.anchor),
    filter(isNonEmptyPathWithOffset),
  );

const insertText = (
  event: InputEvent,
  {
    getPathByDOMNode,
    afterTyping,
    dispatch,
    getExistingDOMSelection,
  }: EditorIO,
) => {
  const dispatchSetTextAfterTyping = () =>
    pipe(
      sequenceT(option)(
        selectionFromInputEvent(getPathByDOMNode)(event)(),
        getDOMRangeFromInputEvent(event),
        fromNullable(event.data),
      ),
      chain(([selection, range, eventData]) => {
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
          return some({
            getText,
            selection: selectionAfterInsert,
            path: nonEmptyPath,
          });
        if (isNonEmptyPathWithOffset(nonEmptyPath)) {
          return some({
            getText,
            selection: selectionAfterInsert,
            path: initNonEmptyPathWithOffset(nonEmptyPath),
          });
        }
        return none;
      }),
      fold(preventDefault(event), ({ getText, path, selection }) => {
        afterTyping(() => {
          const text = getText();
          dispatch({
            type: 'setText',
            arg: { text, path, selection },
          })();
        });
      }),
    );

  pipe(
    getExistingDOMSelection(),
    fold(preventDefault(event), selection => {
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
  { afterTyping, dispatch, getPathByDOMNode }: EditorIO,
) => {
  const dispatchAfterTyping = ([range, path]: [DOMRange, NonEmptyPath]) =>
    afterTyping(() =>
      pipe(
        rangeStartContainerToText(range),
        fold(constVoid, text => {
          dispatch({ type: 'setText', arg: { text, path } })();
        }),
      ),
    );
  pipe(
    sequenceT(option)(
      getDOMRangeFromInputEvent(event),
      pipe(
        getNonEmptyPathWithOffsetFromInputEvent(event, getPathByDOMNode),
        map(initNonEmptyPathWithOffset),
      ),
    ),
    fold(preventDefault(event), dispatchAfterTyping),
  );
};

const deleteContent = (
  event: InputEvent,
  {
    afterTyping,
    dispatch,
    getPathByDOMNode,
    getExistingDOMSelection,
  }: EditorIO,
) => {
  const dispatchSetTextAfterTyping = () => {
    pipe(
      sequenceT(option)(
        selectionFromInputEvent(getPathByDOMNode)(event)(),
        getNonEmptyPathWithOffsetFromInputEvent(event, getPathByDOMNode),
        getDOMRangeFromInputEvent(event),
      ),
      fold(preventDefault(event), ([selection, nonEmptyPath, range]) => {
        const textIsGoingToBeReplacedWithBR =
          range.startContainer === range.endContainer &&
          range.startOffset === 0 &&
          (range.startContainer as DOMText).data.length === range.endOffset;
        if (textIsGoingToBeReplacedWithBR) event.preventDefault();
        const getSelectionAfterDelete = () => {
          if (!textIsGoingToBeReplacedWithBR)
            return some(collapseToStart(selection));
          return initSelection(selection);
        };
        pipe(
          getSelectionAfterDelete(),
          fold(constVoid, selection => {
            afterTyping(() => {
              const { data } = range.startContainer as DOMText;
              const text = textIsGoingToBeReplacedWithBR ? '' : data;
              const path = textIsGoingToBeReplacedWithBR
                ? selection.anchor
                : initNonEmptyPathWithOffset(nonEmptyPath);
              dispatch({
                type: 'setText',
                arg: { text, path, selection },
              })();
            });
          }),
        );
      }),
    );
  };

  pipe(
    getExistingDOMSelection(),
    fold(preventDefault(event), selection => {
      const isForward = event.inputType === 'deleteContentForward';
      if (onlyTextIsAffected(isForward)(selection)) {
        dispatchSetTextAfterTyping();
      } else {
        preventDefault(event)();
      }
    }),
  );
};

export const useBeforeInput = (editorIO: EditorIO): void => {
  useEffect(
    () =>
      pipe(
        editorIO.getElement(),
        fold(constVoid, element => {
          const handleBeforeInput = (event: InputEvent) => {
            switch (event.inputType) {
              case 'insertText': {
                insertText(event, editorIO);
                break;
              }
              case 'insertReplacementText': {
                insertReplacementText(event, editorIO);
                break;
              }
              // I don't understand why deleteContent needs a direction.
              case 'deleteContentBackward':
              case 'deleteContentForward': {
                deleteContent(event, editorIO);
                break;
              }
              default:
                // Prevent unhandled until it will be handled.
                event.preventDefault();
                warn(`Unhandled beforeinput inputType: ${event.inputType}`);
            }
          };

          // @ts-ignore Outdated types.
          element.addEventListener('beforeinput', handleBeforeInput);
          return () => {
            // @ts-ignore Outdated types.
            element.removeEventListener('beforeinput', handleBeforeInput);
          };
        }),
      ),
    [editorIO],
  );
};
