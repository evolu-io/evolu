import React, { ReactNode, RefObject, useCallback } from 'react';
import { EditorIO, EditorElementAttrs } from '../types';

interface EditorElementProps {
  readonly editorIO: EditorIO;
  readonly elementRef: RefObject<HTMLDivElement>;
  readonly children: ReactNode;
  readonly attrs: EditorElementAttrs;
}

export const EditorElement = ({
  editorIO,
  elementRef,
  children,
  attrs,
}: EditorElementProps) => {
  const {
    autoCorrect = 'off',
    spellCheck = false,
    role = 'textbox',
    ...rest
  } = attrs;

  const handleBlur = useCallback(() => {
    editorIO.onBlur.read()();
  }, [editorIO.onBlur]);

  const handleFocus = useCallback(() => {
    editorIO.onFocus.read()();
  }, [editorIO.onFocus]);

  return (
    <div
      autoCorrect={autoCorrect}
      contentEditable
      data-gramm // Disable Grammarly Chrome extension.
      onBlur={handleBlur}
      onFocus={handleFocus}
      ref={elementRef}
      role={role}
      spellCheck={spellCheck}
      suppressContentEditableWarning
      suppressHydrationWarning
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      {...rest}
    >
      {children}
    </div>
  );
};
