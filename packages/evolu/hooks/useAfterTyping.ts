/* eslint-env browser */
import { useRef, MutableRefObject, useCallback } from 'react';
import { IO } from 'fp-ts/lib/IO';
import { EditorIO } from '../types';
import { warn } from '../warn';

export const useAfterTyping: IO<{
  afterTyping: EditorIO['afterTyping'];
  isTypingRef: MutableRefObject<boolean>;
}> = () => {
  const isTypingRef = useRef(false);
  const callbacks = useRef<Array<IO<void>>>([]);
  const afterTyping = useCallback<EditorIO['afterTyping']>(callback => {
    isTypingRef.current = true;
    callbacks.current.push(callback);
    // https://twitter.com/steida/status/1193638146635902979
    requestAnimationFrame(() => {
      isTypingRef.current = false;
      try {
        callbacks.current.forEach(callback => callback());
      } catch (error) {
        warn(error.message || 'unknown error in afterTyping');
      } finally {
        callbacks.current = [];
      }
    });
  }, []);

  return { afterTyping, isTypingRef };
};
