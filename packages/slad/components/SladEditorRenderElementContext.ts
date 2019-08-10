import { createContext, ReactNode } from 'react';
import { SladEditorSetNodePathRef } from '../hooks/useSladEditorSetNodePathRef';

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
