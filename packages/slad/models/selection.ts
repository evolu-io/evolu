import { pathsAreEqual } from './path';
import { SladPath } from '../components/SladEditorSetNodePathContext';

export interface SladSelection {
  readonly anchor: SladPath;
  readonly focus: SladPath;
}

export const selectionIsCollapsed = (selection: SladSelection): boolean => {
  return pathsAreEqual(selection.anchor, selection.focus);
};
