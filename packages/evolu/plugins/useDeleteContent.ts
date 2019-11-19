import { pipe } from 'fp-ts/lib/pipeable';
import { chain, map, fold, some } from 'fp-ts/lib/Option';
import { constVoid } from 'fp-ts/lib/function';
import { EditorRef, EditorIO } from '../types';
import { usePlugin } from './usePlugin';
import {
  getDOMRangeFromInputEvent,
  preventDefault,
  onlyTextIsAffected,
} from '../models/dom';
import { tryInitNonEmptyPath } from '../models/path';
import { DOMText } from '../types/dom';
import { initSelection, collapseToStart } from '../models/selection';
import { setText } from '../models/value';

const createHandler = ({
  afterTyping,
  modifyValue,
  DOMRangeToSelection,
  getDOMSelection,
}: EditorIO) => (event: InputEvent) => () => {
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
            modifyValue(setText({ text, path, selection }))();
          }),
        );
      }),
    );
  };

  pipe(
    getDOMSelection(),
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

export const useDeleteContent = (editorRef: EditorRef) => {
  usePlugin(editorRef, {
    start: editorIO => {
      editorIO.onDeleteContentBackward.write(createHandler(editorIO))();
      editorIO.onDeleteContentForward.write(createHandler(editorIO))();
    },
  });
};
