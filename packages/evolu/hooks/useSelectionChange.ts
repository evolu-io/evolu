import { useEffect } from 'react';
import { pipe } from 'fp-ts/lib/pipeable';
import { fold } from 'fp-ts/lib/Option';
import { constVoid } from 'fp-ts/lib/function';
import { EditorIO } from '../types';

export const useSelectionChange = (editorIO: EditorIO) => {
  useEffect(() => {
    const handleSelectionChange = () => {
      editorIO.onSelectionChange.read()();
    };
    return pipe(
      editorIO.getDocument(),
      fold(constVoid, document => {
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
          document.removeEventListener(
            'selectionchange',
            handleSelectionChange,
          );
        };
      }),
    );
  }, [editorIO]);
};
