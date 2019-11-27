import React, { memo } from 'react';
import { empty } from 'fp-ts/lib/Array';
import { RenderElementContext } from '../hooks/useRenderElement';
import { SetNodePathContext } from '../hooks/useSetDOMNodePathRef';
import { ElementRenderer } from './ElementRenderer';
import { SetDOMNodePath, RenderElement, Element } from '../types';
import { renderReactElement } from '../models/element';

export const EditorChildren = memo(
  ({
    setDOMNodePath,
    renderElement,
    element,
  }: {
    setDOMNodePath: SetDOMNodePath;
    renderElement?: RenderElement;
    element: Element;
  }) => {
    return (
      <SetNodePathContext.Provider value={setDOMNodePath}>
        <RenderElementContext.Provider
          value={renderElement || renderReactElement}
        >
          <ElementRenderer element={element} path={empty} />
        </RenderElementContext.Provider>
      </SetNodePathContext.Provider>
    );
  },
);
