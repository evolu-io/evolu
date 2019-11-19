import { constVoid } from 'fp-ts/lib/function';
import { fold } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { useLayoutEffect } from 'react';
import { EditorIO, InputEventIORef } from '../types';
import { warn } from '../warn';

export const useBeforeInput = (editorIO: EditorIO) => {
  useLayoutEffect(() => {
    const handleBeforeInput = (event: Event) => {
      const type = (event as InputEvent).inputType;
      const name = `on${type.charAt(0).toUpperCase()}${type.slice(1)}`;
      // @ts-ignore Yep, stringly typed code. It's ok here.
      const foo = editorIO[name] as InputEventIORef | undefined;
      if (!foo) {
        warn('Unknown InputEvent inputType.');
        return;
      }
      foo.read()(event as InputEvent)();
    };
    return pipe(
      editorIO.getElement(),
      fold(constVoid, element => {
        element.addEventListener('beforeinput', handleBeforeInput);
        return () => {
          element.removeEventListener('beforeinput', handleBeforeInput);
        };
      }),
    );
  }, [editorIO]);
};
