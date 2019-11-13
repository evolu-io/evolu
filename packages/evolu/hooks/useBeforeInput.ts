import { sequenceT } from 'fp-ts/lib/Apply';
import { constVoid } from 'fp-ts/lib/function';
import { snoc } from 'fp-ts/lib/NonEmptyArray';
import {
  chain,
  fold,
  fromNullable,
  none,
  option,
  some,
  map,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { useEffect } from 'react';
import { IO } from 'fp-ts/lib/IO';
import {
  getDOMRangeFromInputEvent,
  getTextContentFromRangeStartContainer,
  isCollapsedDOMSelectionOnTextOrBR,
  onlyTextIsAffected,
  preventDefault,
} from '../models/dom';
import {
  initNonEmptyPathWithOffset,
  isNonEmptyPathWithOffset,
  movePath,
  tryInitNonEmptyPath,
} from '../models/path';
import {
  collapseToStart,
  initSelection,
  pathToSelection,
} from '../models/selection';
import { EditorIO } from '../types';
import { DOMText } from '../types/dom';
import { warn } from '../warn';

// Consider Task if we will need to queue it.
type HandlerIO = (event: InputEvent, editorIO: EditorIO) => IO<void>;

const insertText: HandlerIO = (
  event,
  { afterTyping, dispatch, DOMRangeToSelection, getExistingDOMSelection },
) => () => {
  const dispatchSetTextAfterTyping = () =>
    pipe(
      sequenceT(option)(
        getDOMRangeFromInputEvent(event),
        fromNullable(event.data),
      ),
      chain(([range, eventData]) =>
        pipe(
          DOMRangeToSelection(range)(),
          map(({ anchor }) => ({ range, eventData, anchor })),
        ),
      ),
      chain(({ range, eventData, anchor }) => {
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
        const selectionAfterInsert = pipe(
          putBRback ? snoc(anchor, 0) : anchor,
          movePath(eventData.length),
          pathToSelection,
        );
        if (putBRback)
          return some({
            getText,
            selection: selectionAfterInsert,
            path: anchor,
          });
        if (isNonEmptyPathWithOffset(anchor)) {
          return some({
            getText,
            selection: selectionAfterInsert,
            path: initNonEmptyPathWithOffset(anchor),
          });
        }
        return none;
      }),
      fold(preventDefault(event), async ({ getText, path, selection }) => {
        await afterTyping();
        const text = getText();
        dispatch({
          type: 'setText',
          arg: { text, path, selection },
        })();
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

const insertReplacementText: HandlerIO = (
  event,
  { afterTyping, dispatch, DOMRangeToSelection, getSelectionFromDOM },
) => () =>
  pipe(
    getDOMRangeFromInputEvent(event),
    chain(range =>
      pipe(
        DOMRangeToSelection(range)(),
        chain(selection => tryInitNonEmptyPath(selection.anchor)),
        map(path => ({ range, path })),
      ),
    ),
    fold(preventDefault(event), async ({ range, path }) => {
      await afterTyping();
      pipe(
        sequenceT(option)(
          getTextContentFromRangeStartContainer(range),
          getSelectionFromDOM(),
        ),
        fold(constVoid, ([text, selection]) => {
          dispatch({
            type: 'setText',
            arg: { text, path, selection },
          })();
        }),
      );
    }),
  );

const deleteContent: HandlerIO = (
  event,
  { afterTyping, dispatch, DOMRangeToSelection, getExistingDOMSelection },
) => () => {
  const dispatchSetTextAfterTyping = () => {
    pipe(
      getDOMRangeFromInputEvent(event),
      chain(range =>
        pipe(
          DOMRangeToSelection(range)(),
          map(selection => ({ range, selection })),
        ),
      ),
      chain(arg =>
        pipe(
          tryInitNonEmptyPath(arg.selection.anchor),
          map(nonEmptyPath => ({ ...arg, nonEmptyPath })),
        ),
      ),
      fold(preventDefault(event), ({ range, selection, nonEmptyPath }) => {
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
          fold(constVoid, async selection => {
            await afterTyping();
            const { data } = range.startContainer as DOMText;
            const text = textIsGoingToBeReplacedWithBR ? '' : data;
            const path = textIsGoingToBeReplacedWithBR
              ? selection.anchor
              : nonEmptyPath;
            dispatch({
              type: 'setText',
              arg: { text, path, selection },
            })();
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
                insertText(event, editorIO)();
                break;
              }
              case 'insertReplacementText': {
                insertReplacementText(event, editorIO)();
                break;
              }
              case 'deleteContentBackward':
              case 'deleteContentForward': {
                deleteContent(event, editorIO)();
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
