import { useContext, createContext } from 'react';
import { RenderEditorElement } from '../models/element';

export const RenderEditorElementContext = createContext<RenderEditorElement>(
  () => null,
);

export function useRenderEditorElement() {
  return useContext(RenderEditorElementContext);
}
