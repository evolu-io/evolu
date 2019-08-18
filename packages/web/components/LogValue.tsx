import React, { memo } from 'react';
import { Immutable } from 'immer';
import { Value } from 'slad';
import { Text } from './Text';

export const LogValue = memo<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: Immutable<Value<any>>;
}>(({ value }) => {
  return (
    <div>
      <Text size={-1}>
        <pre>
          selection: {JSON.stringify(value.selection)}
          <br />
          hasFocus: {JSON.stringify(value.hasFocus)}
        </pre>
      </Text>
    </div>
  );
});
