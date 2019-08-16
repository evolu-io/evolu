import React from 'react';
import { RenderElement } from '../contexts/RenderElementContext';
import { DivElement } from '../models/element';

export const renderDivElement: RenderElement<DivElement> = (
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
