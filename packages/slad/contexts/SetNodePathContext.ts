import { createContext } from 'react';
import { Path } from '../models/path';

/**
 * Restricted DOM Node. Editor can render only HTMLElement, SVGElement, Text.
 */
export type Node = HTMLElement | SVGElement | Text;

export type SetNodePath = (node: Node, path?: Path) => void;

export const SetNodePathContext = createContext<SetNodePath>(() => {});
