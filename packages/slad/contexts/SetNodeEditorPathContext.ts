import { createContext } from 'react';
import { EditorPath } from '../models/path';

/**
 * Restricted DOM Node. Editor can render only HTMLElement, SVGElement, Text.
 */
export type Node = HTMLElement | SVGElement | Text;

export type SetNodeEditorPath = (node: Node, path?: EditorPath) => void;

export const SetNodeEditorPathContext = createContext<SetNodeEditorPath>(
  () => {},
);
