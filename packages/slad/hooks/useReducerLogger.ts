import { Reducer } from 'react';

/**
 * Remember React can call reducer two times in some situations.
 */
export function useReducerLogger<S, A extends { type: string }>(
  reducer: Reducer<S, A>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger: (...args: any[]) => void,
): Reducer<S, A> {
  const reducerWithLogger: Reducer<S, A> = (state, action) => {
    const nextState = reducer(state, action);
    if (process.env.NODE_ENV !== 'production') {
      logger(action.type, [state, action, nextState]);
    }
    return nextState;
  };
  return reducerWithLogger;
}
