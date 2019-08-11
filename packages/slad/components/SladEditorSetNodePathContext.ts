import { createContext } from 'react';

export type SladPath = readonly number[];

export type SladEditorSetNodePath = (
  node: Element | Text,
  path?: SladPath,
) => void;

export const SladEditorSetNodePathContext = createContext<
  SladEditorSetNodePath
>(() => {});
