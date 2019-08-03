import React, { memo, useCallback } from 'react';

// This is just a placeholder for now.
export type SladValue = string;

export type SladEditorProps = Readonly<{
  value: SladValue;
  onChange: (value: SladValue) => void;
}>;

export const SladEditor = memo<SladEditorProps>(function SladEditor({
  value,
  onChange,
}) {
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.currentTarget.value);
    },
    [onChange],
  );

  // Of course it will be contentEditable. This is just an example for now.
  return <input type="text" value={value} onChange={handleInputChange} />;
});
