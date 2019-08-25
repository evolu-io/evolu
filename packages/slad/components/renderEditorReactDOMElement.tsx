import React from 'react';
import { RenderEditorElement } from '../contexts/RenderEditorElementContext';
import { EditorReactDOMElement } from '../models/element';

export const renderEditorReactDOMElement: RenderEditorElement<
  EditorReactDOMElement
> = (element, children, ref) => {
  return React.createElement(
    element.tag || 'div',
    { ...element.props, ref },
    children,
    // Or this?
    // ...React.Children.toArray(children),
  );
};
