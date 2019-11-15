import React, { forwardRef, memo } from 'react';
import { useClient } from '../hooks/useClient';
import { EditorIO, EditorProps } from '../types';
import { EditorClient } from './EditorClient';
import { EditorServer } from './EditorServer';

export const Editor = memo(
  forwardRef<EditorIO, EditorProps>((props, ref) =>
    useClient() ? (
      <EditorClient {...props} ref={ref} />
    ) : (
      <EditorServer
        element={props.value.element}
        renderElement={props.renderElement}
        className={props.className}
        id={props.id}
        style={props.style}
      />
    ),
  ),
);

Editor.displayName = 'Editor';
