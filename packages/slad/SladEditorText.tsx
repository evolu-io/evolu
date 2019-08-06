import React, { memo } from 'react';

export type SladText = Readonly<{
  type: 'text';
  value: string;
}>;

interface SladEditorTextProps {
  text: SladText;
}

// Here we can use memo because of no generic type.
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087
export const SladEditorText = memo<SladEditorTextProps>(
  function SladEditorText({ text }) {
    return <>{text.value}</>;
  },
);
