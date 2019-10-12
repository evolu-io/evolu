import { createContext } from 'react';
import { SetNodeEditorPath } from '../hooks/useNodesEditorPathsMapping';

export const SetNodeEditorPathContext = createContext<SetNodeEditorPath>(
  () => {},
);
