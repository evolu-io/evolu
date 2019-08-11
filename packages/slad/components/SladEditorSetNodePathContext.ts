import { createContext } from 'react';

export type SladPath = readonly number[];

/**
 * Restricted DOM Node. Editor can render only HTMLElement, SVGElement, Text.
 */
export type Node = HTMLElement | SVGElement | Text;

export type SladEditorSetNodePath = (node: Node, path?: SladPath) => void;

export const SladEditorSetNodePathContext = createContext<
  SladEditorSetNodePath
>(() => {});
