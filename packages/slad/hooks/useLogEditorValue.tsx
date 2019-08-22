import React, {
  useCallback,
  ReactNode,
  useState,
  useMemo,
  Fragment,
} from 'react';
import { EditorValue } from '../models/value';

export function useLogEditorValue(
  value: EditorValue,
): [(value: EditorValue) => void, ReactNode] {
  const [values, setValues] = useState<EditorValue[]>([value]);
  const logValue = useCallback((value: EditorValue) => {
    setValues(prevValues => [...prevValues, value]);
  }, []);

  const logValueElement = useMemo(() => {
    return (
      <pre style={{ height: 48, overflow: 'auto' }}>
        {values
          .map((value, index) => {
            // hasFocus, to render it first
            const { element, hasFocus, ...rest } = value;
            const title = JSON.stringify(element)
              .split('"')
              .join("'");
            return (
              // eslint-disable-next-line react/no-array-index-key
              <Fragment key={index}>
                <span
                  title={title}
                  style={{ opacity: values.length - 1 === index ? 1 : 0.5 }}
                >
                  {index} {JSON.stringify({ hasFocus, ...rest })}
                </span>
                <br />
                <br />
              </Fragment>
            );
          })
          .reverse()}
      </pre>
    );
  }, [values]);

  return [logValue, logValueElement];
}
