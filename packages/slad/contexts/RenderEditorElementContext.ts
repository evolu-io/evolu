import { createContext } from 'react';
import { EditorElement, RenderEditorElement } from '../models/element';

// Element, because React context value can't be generic, as far as I know.
export const RenderEditorElementContext = createContext<
  RenderEditorElement<EditorElement>
>(() => null);
