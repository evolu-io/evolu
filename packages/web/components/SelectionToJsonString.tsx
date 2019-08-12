import React, { memo } from 'react';
import { Selection } from 'slad';
import { Immutable } from 'immer';

export const SelectionToJsonString = memo<{
  value: Immutable<Selection> | undefined;
}>(({ value }) => {
  return <pre>selection: {JSON.stringify(value)}</pre>;
});
