import { createContext } from 'react';
import { RenderEditorElement } from '../models/element';

export const RenderEditorElementContext = createContext<RenderEditorElement>(
  () => null,
);
