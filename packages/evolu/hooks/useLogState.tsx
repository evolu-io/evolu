import React, { useCallback, ReactNode, useState, useMemo, memo } from 'react';
import { Element, recursiveRemoveID } from '../models/element';
import { State, StateWithSelection } from '../models/state';

const Item = memo(({ state, index }: { state: State; index: number }) => {
  const { element, hasFocus, selection } = state as StateWithSelection;
  const indexItem = { hasFocus, selection };
  // Deliberately do not prettify. Smaller output is more readable in snapshots.
  // No IDs because that would break integration tests.
  const title = JSON.stringify(recursiveRemoveID(element as Element))
    .split('"')
    .join("'");
  return (
    <span title={title}>
      {index} {JSON.stringify(indexItem)}
      <style jsx>{`
        span {
          color: #888;
          display: block;
          line-height: 24px;
        }
      `}</style>
    </span>
  );
});

export function useLogState(state: State): [(state: State) => void, ReactNode] {
  const [states, setStates] = useState<State[]>([state]);
  const logState = useCallback((state: State) => {
    setStates(prevStates => [...prevStates, state]);
  }, []);

  const logStateElement = useMemo(() => {
    return (
      <pre>
        {states
          .map((state, index) => {
            // Key index is ok, because the order is stable.
            // eslint-disable-next-line react/no-array-index-key
            return <Item state={state} index={index} key={index} />;
          })
          .reverse()}
        <style jsx>{`
          pre {
            height: 48px;
            overflow: auto;
          }
          span {
            color: #888;
          }
        `}</style>
      </pre>
    );
  }, [states]);

  return [logState, logStateElement];
}
