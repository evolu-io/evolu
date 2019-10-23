/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-env browser */
import React, { useCallback, ReactNode, useState, useMemo, memo } from 'react';
import { toUndefined } from 'fp-ts/lib/Option';
import { mapElementToIDless } from '../models/element';
import { Value } from '../models/value';

const Item = memo(({ value, index }: { value: Value; index: number }) => {
  const { element, hasFocus, selection } = value;
  const indexItem = { hasFocus, selection: toUndefined(selection) };
  // Deliberately do not prettify. Smaller output is more readable in snapshots.
  // No IDs because that would break integration tests.
  const elementTextForSnapshots = JSON.stringify(mapElementToIDless(element))
    .split('"')
    .join("'");
  const [shown, setShow] = useState(false);
  const handleItemMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.preventDefault();
      setShow(!shown);
    },
    [shown],
  );
  return (
    <span onMouseDown={handleItemMouseDown} data-json={elementTextForSnapshots}>
      {index} {JSON.stringify(indexItem)}
      {shown && (
        <div onMouseDown={handleItemMouseDown}>
          {JSON.stringify(mapElementToIDless(element), null, 2)}
        </div>
      )}
      <style jsx>{`
        span {
          color: #888;
          display: block;
          line-height: 24px;
          cursor: pointer;
        }
        div {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 10;
          line-height: 16px;
          background-color: #fff;
          padding: 16px;
        }
      `}</style>
    </span>
  );
});

export const useLogValue = (
  value: Value,
): [(value: Value) => void, ReactNode] => {
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
};
