import React, { useCallback, ReactNode, useState, useMemo, memo } from 'react';
import { Element, recursiveRemoveID } from '../models/element';
import { Value, ValueWithSelection } from '../models/value';

const Item = memo(({ value, index }: { value: Value; index: number }) => {
  const { element, hasFocus, selection } = value as ValueWithSelection;
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

export function useLogValue(value: Value): [(value: Value) => void, ReactNode] {
  const [values, setValues] = useState<Value[]>([value]);
  const logValue = useCallback((value: Value) => {
    setValues(prevValues => [...prevValues, value]);
  }, []);

  const logValueElement = useMemo(() => {
    return (
      <pre>
        {values
          .map((value, index) => {
            // Key index is ok, because the order is stable.
            // eslint-disable-next-line react/no-array-index-key
            return <Item value={value} index={index} key={index} />;
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
  }, [values]);

  return [logValue, logValueElement];
}
