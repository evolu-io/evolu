import React, { memo } from 'react';
import { Immutable } from 'immer';
import { Value } from 'slad';

export const LogValue = memo<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: Immutable<Value<any>>;
}>(({ value }) => {
  return (
    <>
      <pre>selection: {JSON.stringify(value.selection)}</pre>
      <pre>hasFocus: {JSON.stringify(value.hasFocus)}</pre>
    </>
  );
});
