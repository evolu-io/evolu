/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-env browser */
import { toUndefined } from 'fp-ts/lib/Option';
import React, { memo, ReactNode, useCallback, useMemo, useState } from 'react';
import { elementToIDless } from '../models/element';
import { Value } from '../types';

const Item = memo(
  ({
    value,
    index,
    selectedIndex,
    onSelect,
  }: {
    value: Value;
    index: number;
    selectedIndex: number | null;
    onSelect: (index: number) => void;
  }) => {
    const { element, hasFocus, selection } = value;
    const indexItem = { hasFocus, selection: toUndefined(selection) };
    // Deliberately do not prettify. Smaller output is more readable in snapshots.
    // No IDs because that would break integration tests.
    const elementTextForSnapshots = JSON.stringify(elementToIDless(element))
      .split('"')
      .join("'");
    const shown = index === selectedIndex;
    const handleItemMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
        onSelect(index);
      },
      [onSelect, index],
    );
    const text = `${index} ${JSON.stringify(indexItem)}`.split('"').join("'");
    return (
      <span
        onMouseDown={handleItemMouseDown}
        data-json={elementTextForSnapshots}
      >
        {shown ? <b>{text}</b> : text}
        {shown && (
          <div title="click to close" onMouseDown={handleItemMouseDown}>
            {JSON.stringify(elementToIDless(element), null, 2)}
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
            left: 50%;
            top: 0;
            right: 0;
            bottom: 0;
            z-index: 10;
            line-height: 16px;
            background-color: #fff;
            padding: 16px;
            overflow: auto;
          }
        `}</style>
      </span>
    );
  },
);

export const useLogValue = (
  value: Value,
): [(value: Value) => void, ReactNode] => {
  const [values, setValues] = useState<Value[]>([value]);
  const logValue = useCallback((value: Value) => {
    setValues(prevValues => [...prevValues, value]);
  }, []);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const handleSelect = useCallback(
    (index: number) => {
      setSelectedIndex(index === selectedIndex ? null : index);
    },
    [selectedIndex],
  );

  const logValueElement = useMemo(() => {
    return (
      <pre>
        {values
          .map((value, index) => {
            return (
              <Item
                value={value}
                index={index}
                selectedIndex={selectedIndex}
                onSelect={handleSelect}
                // Key index is ok, because the order is stable.
                // eslint-disable-next-line react/no-array-index-key
                key={index}
              />
            );
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
  }, [handleSelect, selectedIndex, values]);

  return [logValue, logValueElement];
};
