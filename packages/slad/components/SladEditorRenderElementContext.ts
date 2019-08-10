import { createContext, ReactNode } from 'react';
import { SladEditorSetNodePathRef } from '../hooks/useSladEditorSetNodePathRef';

/**
 * SladElement is the most general base interface from which all interfaces inherit.
 * It only has properties common to all kinds of elements.
 */
export interface SladElement {
  readonly children?: readonly (SladElement | string)[] | null;
}

export type RenderElement = (
  element: SladElement,
  children: ReactNode,
  ref: SladEditorSetNodePathRef,
) => ReactNode;

export const SladEditorRenderElementContext = createContext<RenderElement>(
  () => null,
);
