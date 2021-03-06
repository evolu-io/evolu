import { useContext, createContext } from 'react';
import { RenderElement } from '../types';

export const RenderElementContext = createContext<RenderElement>(() => null);

export const useRenderElement = () => useContext(RenderElementContext);
