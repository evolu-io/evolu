import invariant from 'tiny-invariant';
import { Predicate } from 'fp-ts/lib/function';
import { eqNumber } from 'fp-ts/lib/Eq';
import { getEq } from 'fp-ts/lib/Array';

// EditorPathIndex as newtype-ts NonNegative?
// I would like to have EditorPath as readonly number[], but it complicates usage:
// `last(path)` will:
// `Argument of type 'readonly number[]' is not assignable to parameter of type 'number[]'.`
// Casting everywhere is boring.
export type EditorPath = number[];

export type NodesEditorPathsMap = Map<Node, EditorPath>;

/**
 * Key is editorPath.join().
 */
export type EditorPathsNodesMap = Map<string, Node>;

export const eqEditorPath = getEq(eqNumber);

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
