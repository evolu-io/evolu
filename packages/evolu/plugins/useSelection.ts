import { pipe } from 'fp-ts/lib/pipeable';
import { none, filter, fold } from 'fp-ts/lib/Option';
import { constTrue, constVoid } from 'fp-ts/lib/function';
import { EditorRef, EditorIO } from '../types';
import { usePlugin } from './usePlugin';
import { eqSelection } from '../models/selection';
import { select } from '../models/value';

const createHandler = (editorIO: EditorIO) => () =>
  pipe(
    editorIO.isTyping() ? none : editorIO.getSelectionFromDOM(),
    filter(s1 =>
      pipe(
        editorIO.getValue().selection,
        fold(constTrue, s2 => !eqSelection.equals(s1, s2)),
      ),
    ),
    fold(constVoid, selection => {
      editorIO.modifyValue(select(selection))();
    }),
  );

export const useSelection = (editorRef: EditorRef) => {
  usePlugin(editorRef, {
    start: editorIO => {
      editorIO.onSelectionChange.write(createHandler(editorIO))();
    },
    layoutEffect: editorIO => {
      if (!editorIO.getValue().hasFocus) return;
      // TODO: IORef.
      editorIO.ensureDOMSelectionIsActual();
    },
  });
};
