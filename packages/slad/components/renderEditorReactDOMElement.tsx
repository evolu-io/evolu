import React from 'react';
import { EditorReactDOMElement, RenderEditorElement } from '../models/element';

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
