import React, { useState, useCallback } from 'react';
import * as editor from 'evolu';
import * as o from 'fp-ts/lib/Option';
import { Text } from '../Text';
import { defaultEditorProps } from './_defaultEditorProps';

// Export for testEditorServer.
export const initialValue = editor.createValue<editor.ReactElement>({
  element: {
    id: editor.id(),
    tag: 'div',
    props: {
      className: 'root',
    },
    children: [
      {
        id: editor.id(),
        tag: 'div',
        props: {
          // Uncomment 'width: 1' to check types.
          // width: 1,
          style: { fontSize: '24px' },
        },
        children: ['heading'],
      },
      {
        id: editor.id(),
        tag: 'div',
        props: {
          style: { fontSize: '16px' },
        },
        children: ['paragraph'],
      },
    ],
  },
});

export const initialValueWithTextOnly = editor.createValue({
  element: editor.jsx(<div className="root">a</div>),
});

export const BasicExample = ({
  autoFocus = false,
  initialSelection = null,
  onlyText = false,
}: {
  autoFocus?: boolean;
  initialSelection?: editor.Selection | null;
  onlyText?: boolean;
}) => {
  const [value, setValue] = useState<editor.Value>({
    ...(onlyText ? initialValueWithTextOnly : initialValue),
    hasFocus: autoFocus,
    selection: o.fromNullable(initialSelection),
  });

  const [logValue, logValueElement] = editor.useLogValue(value);

  const handleEditorChange = useCallback(
    (value: editor.Value) => {
      logValue(value);
      setValue(value);
    },
    [logValue],
  );

  return (
    <>
      <Text size={1}>Basic Example</Text>
      <editor.Editor
        {...defaultEditorProps}
        value={value}
        onChange={handleEditorChange}
      />
      {logValueElement}
    </>
  );
};
