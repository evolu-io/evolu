import { pathsAreEqual, Path } from './path';

export interface Selection {
  readonly anchor: Path;
  readonly focus: Path;
}

export const selectionIsCollapsed = (selection: Selection): boolean => {
  return pathsAreEqual(selection.anchor, selection.focus);
};
