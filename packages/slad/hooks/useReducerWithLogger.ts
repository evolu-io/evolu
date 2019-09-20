import { Dispatch, useCallback, useRef, useEffect } from 'react';
import { usePrevious } from './usePrevious';

/**
 * Simple wrapper for React useReducer. We do not wrap the reducer itself,
 * because React can call reducer two times in some situations, and
 * that would be confusing for logger.
 */
export function useReducerWithLogger<S, A extends { type: string }>(
  [state, dispatch]: [S, Dispatch<A>],
  logger: (...args: any[]) => void,
): [S, Dispatch<A>] {
  const dispatchedActionRef = useRef<A | null>(null);
  const dispatchWithLogger = useCallback(
    (action: A) => {
      dispatchedActionRef.current = action;
      dispatch(action);
    },
    [dispatch],
  );
  const previousState = usePrevious(state);
  useEffect(() => {
    const { current: action } = dispatchedActionRef;
    if (action) {
      dispatchedActionRef.current = null;
      if (process.env.NODE_ENV !== 'production') {
        logger(action.type, [previousState, action, state]);
      }
    }
  }, [logger, previousState, state]);

  return [state, dispatchWithLogger];
}
