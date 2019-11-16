import { useEffect, useLayoutEffect } from 'react';
import { pipe } from 'fp-ts/lib/pipeable';
import { filter, fold, none } from 'fp-ts/lib/Option';
import { constVoid, constTrue } from 'fp-ts/lib/function';
import { EditorIO } from '../types';
import { eqSelection } from '../models/selection';

export const useSelection = (editorIO: EditorIO) => {
  useEffect(() => {
    const handleSelectionChange = () =>
      pipe(
        editorIO.isTyping() ? none : editorIO.getSelectionFromDOM(),
        filter(s1 =>
          pipe(
            editorIO.getValue().selection,
            fold(constTrue, s2 => !eqSelection.equals(s1, s2)),
          ),
        ),
        fold(constVoid, selection => {
          editorIO.dispatch({ type: 'selectionChange', selection })();
        }),
      );

    return pipe(
      editorIO.getDocument(),
      fold(
        () => constVoid, // onNone defines what onSome has to return.
        doc => {
          doc.addEventListener('selectionchange', handleSelectionChange);
          return () => {
            doc.removeEventListener('selectionchange', handleSelectionChange);
          };
        },
      ),
    );
  }, [editorIO]);

  // useLayoutEffect is a must to keep browser selection in sync with
  // editor selection. With useEffect, fast typing breaks caret position.
  useLayoutEffect(() => {
    if (!editorIO.getValue().hasFocus) return;
    editorIO.ensureDOMSelectionIsActual();
  });
};
