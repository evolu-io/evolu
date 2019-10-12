import { createContext } from 'react';
import { SetNodeEditorPath } from '../hooks/editor/useNodesEditorPathsMapping';

export const SetNodeEditorPathContext = createContext<SetNodeEditorPath>(
  () => {},
);
