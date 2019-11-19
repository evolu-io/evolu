import { useState, Dispatch, SetStateAction } from 'react';
import { pipe } from 'fp-ts/lib/pipeable';
import { sequenceT } from 'fp-ts/lib/Apply';
import { option, fold, some } from 'fp-ts/lib/Option';
import { constFalse, constVoid } from 'fp-ts/lib/function';
import { EditorRef, EditorIO } from '../types';
import { usePlugin } from './usePlugin';
import { setFocus } from '../models/value';

const createFocusHandler = (
  editorIO: EditorIO,
  setTabLostFocus: Dispatch<SetStateAction<boolean>>,
) => () => {
  editorIO.ensureDOMSelectionIsActual();
  setTabLostFocus(false);
  editorIO.modifyValue(setFocus(true))();
};

const createBlurHandler = (
  editorIO: EditorIO,
  setTabLostFocus: Dispatch<SetStateAction<boolean>>,
) => () =>
  pipe(
    sequenceT(option)(editorIO.getDocument(), editorIO.getElement()),
    fold(
      constFalse,
      ([document, element]) => document.activeElement === element,
    ),
    lostFocus => {
      setTabLostFocus(lostFocus);
      editorIO.modifyValue(setFocus(false))();
    },
  );

export const useFocus = (editorRef: EditorRef) => {
  const [tabLostFocus, setTabLostFocus] = useState(false);

  usePlugin(editorRef, {
    start: editorIO => {
      editorIO.onFocus.write(createFocusHandler(editorIO, setTabLostFocus))();
      editorIO.onBlur.write(createBlurHandler(editorIO, setTabLostFocus))();
    },
    layoutEffect: editorIO =>
      pipe(
        sequenceT(option)(
          editorIO.getDocument(),
          editorIO.getElement(),
          some(editorIO.getValue().hasFocus),
        ),
        fold(constVoid, ([document, element, hasFocus]) => {
          const isActive = element === document.activeElement;
          // Element focus and blur can be IORef as well, if needed.
          if (isActive) {
            // For manual test, click to editor then press cmd-tab twice.
            if (!hasFocus && !tabLostFocus) element.blur();
          } else {
            if (hasFocus) element.focus();
          }
        }),
      ),
  });
};
