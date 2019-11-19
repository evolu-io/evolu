import { pipe } from 'fp-ts/lib/pipeable';
import { chain, map, fold, option } from 'fp-ts/lib/Option';
import { sequenceT } from 'fp-ts/lib/Apply';
import { constVoid } from 'fp-ts/lib/function';
import { EditorRef, EditorIO } from '../types';
import { usePlugin } from './usePlugin';
import {
  getDOMRangeFromInputEvent,
  preventDefault,
  getTextContentFromRangeStartContainer,
} from '../models/dom';
import { tryInitNonEmptyPath } from '../models/path';
import { setText } from '../models/value';

const createHandler = ({
  afterTyping,
  modifyValue,
  DOMRangeToSelection,
  getSelectionFromDOM,
}: EditorIO) => (event: InputEvent) => () =>
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
          modifyValue(setText({ text, path, selection }))();
        }),
      );
    }),
  );

export const useInsertReplacementText = (editorRef: EditorRef) => {
  usePlugin(editorRef, {
    start: editorIO => {
      editorIO.onInsertReplacementText.write(createHandler(editorIO))();
    },
  });
};
