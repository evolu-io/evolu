import React, { ReactNode, RefObject } from 'react';
import { useFocus } from '../hooks/useFocus';
import { EditorIO, EditorElementAttrs } from '../types';

type EditorElementProps = {
  editorIO: EditorIO;
  elementRef: RefObject<HTMLDivElement>;
  children: ReactNode;
  attrs: EditorElementAttrs;
};

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

  const { onFocus, onBlur } = useFocus(editorIO);

  return (
    <div
      autoCorrect={autoCorrect}
      spellCheck={spellCheck}
      role={role}
      contentEditable
      data-gramm // Disable Grammarly Chrome extension.
      onBlur={onBlur}
      onFocus={onFocus}
      ref={elementRef}
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
