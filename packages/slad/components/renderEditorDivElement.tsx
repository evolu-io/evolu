import React from 'react';
import { RenderEditorElement } from '../contexts/RenderEditorElementContext';
import { EditorDivElement } from '../models/element';

export const renderEditorDivElement: RenderEditorElement<EditorDivElement> = (
  element,
  children,
  ref,
) => {
  return (
    <div {...element.props} ref={ref}>
      {children}
    </div>
  );
};
