import { pipe } from 'fp-ts/lib/pipeable';
import { chain, map, fold, some, option } from 'fp-ts/lib/Option';
import { constVoid, Predicate, constFalse } from 'fp-ts/lib/function';
import { sequenceT } from 'fp-ts/lib/Apply';
import { EditorRef, EditorIO } from '../types';
import { usePlugin } from './usePlugin';
import {
  getDOMRangeFromInputEvent,
  preventDefault,
  DOMSelectionToDOMTextOffset,
  isMoveWithinDOMTextOffset,
} from '../models/dom';
import { tryInitNonEmptyPath } from '../models/path';
import { DOMText, DOMRange, DOMSelection } from '../types/dom';
import { initSelection, collapseToStart } from '../models/selection';
import { setText } from '../models/value';

const createHandler = ({
  afterTyping,
  modifyValue,
  DOMRangeToSelection,
  getDOMSelection,
}: EditorIO) => (event: InputEvent) => () => {
  const setTextAfterTyping = (range: DOMRange) => {
    pipe(
      DOMRangeToSelection(range)(),
      chain(selection =>
        pipe(
          tryInitNonEmptyPath(selection.anchor),
          map(nonEmptyPath => ({ selection, nonEmptyPath })),
        ),
      ),
      chain(arg =>
        pipe(
          tryInitNonEmptyPath(arg.selection.anchor),
          map(nonEmptyPath => ({ ...arg, nonEmptyPath })),
        ),
      ),
      fold(preventDefault(event), ({ selection, nonEmptyPath }) => {
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

  const canUseSetText: Predicate<[DOMSelection, DOMRange]> = ([selection]) =>
    pipe(
      DOMSelectionToDOMTextOffset(selection),
      fold(constFalse, ([node, offset]) => {
        const within = isMoveWithinDOMTextOffset(
          event.inputType === 'deleteContentForward',
        )([node, offset]);
        return within;
      }),
    );

  pipe(
    sequenceT(option)(getDOMSelection(), getDOMRangeFromInputEvent(event)),
    fold(preventDefault(event), ([selection, range]) => {
      if (canUseSetText([selection, range])) {
        setTextAfterTyping(range);
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
