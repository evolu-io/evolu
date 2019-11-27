import React, { useState, useCallback } from 'react';
import { fromNullable } from 'fp-ts/lib/Option';
import {
  createValue,
  id,
  jsx,
  Value,
  useLogValue,
  Editor,
  ReactElement,
  Selection,
} from 'evolu';
import { Text } from '../Text';
import { defaultEditorProps } from './_defaultEditorProps';

// Export for testEditorServer.
export const initialValue = createValue<ReactElement>({
  element: {
    id: id(),
    tag: 'div',
    props: {
      className: 'root',
    },
    children: [
      {
        id: id(),
        tag: 'div',
        props: {
          style: { fontSize: '24px' },
        },
        children: ['heading'],
      },
      {
        id: id(),
        tag: 'div',
        props: {
          style: { fontSize: '16px' },
        },
        children: ['paragraph'],
      },
    ],
  },
});

export const initialValueWithTextOnly = createValue({
  element: jsx(<div className="root">a</div>),
});

export const BasicExample = ({
  autoFocus = false,
  initialSelection = null,
  onlyText = false,
}: {
  autoFocus?: boolean;
  initialSelection?: Selection | null;
  onlyText?: boolean;
}) => {
  const [value, setValue] = useState<Value>({
    ...(onlyText ? initialValueWithTextOnly : initialValue),
    hasFocus: autoFocus,
    selection: fromNullable(initialSelection),
  });

  const [logValue, logValueElement] = useLogValue(value);

  const handleEditorChange = useCallback(
    (value: Value) => {
      logValue(value);
      setValue(value);
    },
    [logValue],
  );

  return (
    <>
      <Text size={1}>Basic Example</Text>
      <Editor
        {...defaultEditorProps}
        value={value}
        onChange={handleEditorChange}
      />
      {logValueElement}
    </>
  );
};
