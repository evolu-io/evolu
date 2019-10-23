/* eslint-env browser */
import { useRef, MutableRefObject, useCallback } from 'react';

export type AfterTyping = (callback: () => void) => void;

/**
 * Run the last callback on the requestAnimationFrame to get DOM changes
 * after typing. Everything else it's too soon or too late.
 */
export const useAfterTyping = (): {
  afterTyping: AfterTyping;
  isTypingRef: MutableRefObject<boolean>;
} => {
  const isTypingRef = useRef(false);
  const lastCallback = useRef(() => {});
  const afterTyping = useCallback<AfterTyping>(callback => {
    isTypingRef.current = true;
    lastCallback.current = callback;
    requestAnimationFrame(() => {
      isTypingRef.current = false;
      lastCallback.current();
    });
  }, []);

  return { afterTyping, isTypingRef };
};
