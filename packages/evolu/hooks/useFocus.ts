import { useState, useEffect, useCallback } from 'react';
import { pipe } from 'fp-ts/lib/pipeable';
import { sequenceT } from 'fp-ts/lib/Apply';
import { option, fold, some } from 'fp-ts/lib/Option';
import { constVoid, constFalse } from 'fp-ts/lib/function';
import { EditorIO } from '../types';
import { usePrevious } from './usePrevious';

export const useFocus = (
  editorIO: EditorIO,
): {
  onFocus: () => void;
  onBlur: () => void;
} => {
  const [tabLostFocus, setTabLostFocus] = useState(false);
  const valueHadFocus = usePrevious(editorIO.getValue().hasFocus);

  // Map editor declarative focus to imperative DOM focus and blur methods.
  useEffect(
    () =>
      pipe(
        sequenceT(option)(
          editorIO.getDocument(),
          editorIO.getElement(),
          some(editorIO.getValue().hasFocus),
        ),
        fold(constVoid, ([document, element, hasFocus]) => {
          const isActive = element === document.activeElement;
          if (!valueHadFocus && hasFocus) {
            if (!isActive) element.focus();
          } else if (valueHadFocus && !hasFocus) {
            // Do not call blur when tab lost focus so editor can be focused back.
            // For manual test, click to editor then press cmd-tab twice.
            // Editor selection must be preserved.
            if (isActive && !tabLostFocus) element.blur();
          }
        }),
      ),
    [editorIO, tabLostFocus, valueHadFocus],
  );

  const onFocus = useCallback(() => {
    editorIO.ensureDOMSelectionIsActual();
    setTabLostFocus(false);
    editorIO.dispatch({ type: 'focus' })();
  }, [editorIO]);

  const onBlur = useCallback(() => {
    const tabLostFocus = pipe(
      sequenceT(option)(editorIO.getDocument(), editorIO.getElement()),
      fold(
        constFalse,
        ([document, element]) => document.activeElement === element,
      ),
    );
    setTabLostFocus(tabLostFocus);
    editorIO.dispatch({ type: 'blur' })();
  }, [editorIO]);

  return { onFocus, onBlur };
};
