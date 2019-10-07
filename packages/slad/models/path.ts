import invariant from 'tiny-invariant';
import { Predicate } from 'fp-ts/lib/function';

export type EditorPath = readonly number[];

export type NodesEditorPathsMap = Map<Node, EditorPath>;

/**
 * Key is editorPath.join().
 */
export type EditorPathsNodesMap = Map<string, Node>;

export function editorPathsAreEqual(
  path1: EditorPath,
  path2: EditorPath,
): boolean {
  if (path1 === path2) return true;
  const { length } = path1;
  if (length !== path2.length) return false;
  for (let i = 0; i < length; i++) if (path1[i] !== path2[i]) return false;
  return true;
}

export const editorPathIsEmpty: Predicate<EditorPath> = path =>
  path.length === 0;

export function invariantPathIsNotEmpty(path: EditorPath) {
  invariant(!editorPathIsEmpty(path), 'Path can not be empty.');
}

/**
 * Example: `[0, 1, 2]` to `[0, 1]`.
 */
export function invariantParentPath(path: EditorPath): EditorPath {
  invariantPathIsNotEmpty(path);
  return path.slice(0, -1);
}

/**
 * Example: `[0, 1, 2]` to `2`.
 */

export function invariantLastIndex(path: EditorPath): number {
  invariantPathIsNotEmpty(path);
  return path[path.length - 1];
}

/**
 * Example: `[0, 1, 2]` to `[[0, 1], 2]`.
 */
export function invariantParentPathAndLastIndex(
  path: EditorPath,
): [EditorPath, number] {
  return [invariantParentPath(path), invariantLastIndex(path)];
}

export function editorPathsAreForward(
  anchorPath: EditorPath,
  focusPath: EditorPath,
): boolean {
  return !anchorPath.some((value, index) => value > focusPath[index]);
}

export function movePath(offset: number) {
  return (path: EditorPath): EditorPath => {
    const [parentPath, lastIndex] = invariantParentPathAndLastIndex(path);
    return [...parentPath, lastIndex + offset];
  };
}
