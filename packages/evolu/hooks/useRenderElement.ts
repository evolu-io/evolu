import { useContext, createContext } from 'react';
import { RenderElement } from '../models/element';

export const RenderElementContext = createContext<RenderElement>(() => null);

export const useRenderElement = () => useContext(RenderElementContext);
