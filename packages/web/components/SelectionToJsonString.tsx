import React, { memo } from 'react';
import { SladSelection } from 'slad';
import { Immutable } from 'immer';

export const SelectionToJsonString = memo<{
  value: Immutable<SladSelection> | undefined;
}>(({ value }) => {
  return <pre>selection: {JSON.stringify(value)}</pre>;
});
