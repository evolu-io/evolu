import { pathsAreEqual, Path } from './path';

export interface Selection {
  readonly anchor: Path;
  readonly focus: Path;
}

export function selectionIsCollapsed(selection: Selection): boolean {
  return pathsAreEqual(selection.anchor, selection.focus);
}

export function selectionsAreEqual(
  selection1: Selection,
  selection2: Selection,
): boolean {
  if (selection1 === selection2) return true;
  return (
    pathsAreEqual(selection1.anchor, selection2.anchor) &&
    pathsAreEqual(selection1.focus, selection2.focus)
  );
}
