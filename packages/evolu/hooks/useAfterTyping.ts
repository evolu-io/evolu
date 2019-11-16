/* eslint-env browser */
import { IO } from 'fp-ts/lib/IO';
import { useCallback, useRef } from 'react';
import { EditorIO } from '../types';
import { warn } from '../warn';

export const useAfterTyping: IO<{
  afterTyping: EditorIO['afterTyping'];
  isTyping: EditorIO['isTyping'];
}> = () => {
  const isTypingRef = useRef(false);
  const resolvers = useRef<Array<IO<void>>>([]);
  const afterTyping = useCallback<EditorIO['afterTyping']>(() => {
    isTypingRef.current = true;
    const promise = new Promise<void>(resolve => {
      resolvers.current.push(resolve);
    });
    requestAnimationFrame(() => {
      isTypingRef.current = false;
      const resolversToCall = resolvers.current;
      resolvers.current = [];
      try {
        resolversToCall.forEach(resolver => resolver());
      } catch (error) {
        warn(error.message || 'unknown error in afterTyping');
      }
    });
    return promise;
  }, []);

  const isTyping = useCallback(() => isTypingRef.current, []);

  return { afterTyping, isTyping };
};
